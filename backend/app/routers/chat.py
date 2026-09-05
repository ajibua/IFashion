import json
import os
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Customer, Designer, Order
from app.schemas import schemas
from app.notifications import notify_new_order

router = APIRouter(prefix="/chat", tags=["chat"])


def build_system_prompt(designer: Optional[Designer] = None) -> str:
    brand = designer.brand_name if designer else "IFashion Atelier"
    location = f" located in {designer.location}" if designer and designer.location else ""
    delivery_note = (
        "Available fulfillment methods: In-person walk-in / pickup at our atelier, OR delivery driver / courier dispatch."
    )

    return f"""You are the elite AI bespoke fashion concierge for {brand}{location}.
Your mission is to welcome the client, discuss their bespoke styling needs, and gather and rigorously verify all order specifications.

VERIFICATION CHECKLIST TO COLLECT:
1. Customer Full Name
2. Phone Number (WhatsApp / Mobile)
3. Garment Style (e.g. Royal Agbada, Senator suit, 2-piece Kaftan, Ankara native, bespoke trousers)
4. Fabric & Color Preference (e.g. Navy blue cashmere wool, royal wine velvet, emerald green damask)
5. Occasion & Delivery Deadline (the specific event and the date they need it by)
6. Measurements (chest, waist, shoulder, sleeve, trouser length, neck — if returning customer with saved measurements, warmly confirm them; if new, collect them or note if tailor will measure in-person)
7. Fulfillment Choice:
   - In-person atelier walk-in / pickup
   - Delivery driver / courier dispatch (MUST collect the client's destination street address)

RULES OF INTERACTION:
- Speak with warm, refined, high-fashion elegance.
- Ask only 1 or 2 questions at a time so the conversation feels natural, not like an interrogation.
- {delivery_note}
- IMPORTANT: Before confirming an order, give the customer a complete and clear RECAP of all their order details (Style, Color, Measurements, Deadline, and Fulfillment method/address) and ask them explicitly to confirm.
- Set "order_ready" to true ONLY AFTER the customer has seen the full recap and explicitly confirmed (e.g. "yes", "looks great", "confirm", "proceed").

Respond ONLY with valid JSON in this exact structure, with NO markdown code fences:
{{
  "reply": "<your natural-language reply to the customer>",
  "order_ready": <true only if client just confirmed the complete verified order summary, else false>,
  "extracted": {{
     "name": "...",
     "phone": "...",
     "style": "...",
     "color": "...",
     "occasion": "...",
     "measurements": {{}},
     "deadline": "...",
     "delivery_method": "pickup" or "delivery",
     "delivery_address": "..."
  }}
}}
Only include fields in "extracted" that you actually know.
"""


def call_gemini(system_prompt: str, history: list[dict], known_customer: dict | None) -> dict:
    """
    Calls the Gemini API to power the multi-tenant bespoke concierge.
    Uses google-genai SDK with HTTPX REST fallback.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        from dotenv import load_dotenv, find_dotenv
        dotenv_path = find_dotenv(usecwd=True)
        if dotenv_path:
            load_dotenv(dotenv_path)
        else:
            from pathlib import Path
            env_file = Path(__file__).resolve().parent.parent.parent / ".env"
            if env_file.exists():
                load_dotenv(env_file)
        api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return {
            "reply": "AI ordering concierge is currently initializing. Please configure GEMINI_API_KEY on the backend to begin.",
            "order_ready": False,
            "extracted": None,
        }

    context = system_prompt
    if known_customer:
        context += (
            f"\n\nReturning Client Detected! Saved Profile: {json.dumps(known_customer)}.\n"
            "Greet them warmly by name and confirm if they would like to use their previously saved measurements or update them."
        )

    convo = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history)
    prompt = f"{context}\n\nConversation so far:\n{convo}\n\nRespond with the JSON object only."

    text = None
    last_error = None

    # Strategy 1: google.genai SDK
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if response and response.text:
            text = response.text.strip()
    except Exception as e:
        last_error = e

    # Strategy 2: Direct HTTPX REST API fallback
    if not text:
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            with httpx.Client(timeout=35.0) as http_client:
                resp = http_client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                else:
                    last_error = f"API returned status {resp.status_code}: {resp.text}"
        except Exception as e:
            last_error = e

    if not text:
        return {
            "reply": "I apologize, our concierge momentarily lost connection. Please reply once more to continue.",
            "order_ready": False,
            "extracted": None,
        }

    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"reply": text, "order_ready": False, "extracted": None}


@router.post("/", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    # Find designer if handle or ID provided
    designer = None
    if request.designer_handle:
        clean_handle = request.designer_handle.strip().lower().replace("@", "")
        designer = db.query(Designer).filter(Designer.handle == clean_handle).first()
    elif request.designer_id:
        designer = db.query(Designer).filter(Designer.id == request.designer_id).first()

    # Look up returning customer if phone exists
    known_customer = None
    if request.phone:
        query = db.query(Customer).filter(Customer.phone == request.phone)
        if designer:
            # Check if customer has records with this designer, or generally
            designer_customer = query.filter(Customer.designer_id == designer.id).first()
            customer = designer_customer or query.first()
        else:
            customer = query.first()

        if customer:
            known_customer = {
                "name": customer.name,
                "phone": customer.phone,
                "measurements": customer.measurements,
            }

    system_prompt = build_system_prompt(designer)
    history = [m.model_dump() for m in request.messages]
    result = call_gemini(system_prompt, history, known_customer)

    order_ready = result.get("order_ready", False)
    extracted = result.get("extracted") or {}

    if order_ready and extracted.get("phone") and extracted.get("name"):
        customer_phone = extracted["phone"].strip()
        customer = db.query(Customer).filter(Customer.phone == customer_phone).first()

        if customer:
            if extracted.get("measurements"):
                customer.measurements = extracted["measurements"]
            if designer and not customer.designer_id:
                customer.designer_id = designer.id
        else:
            customer = Customer(
                name=extracted["name"],
                phone=customer_phone,
                measurements=extracted.get("measurements"),
                designer_id=designer.id if designer else None,
            )
            db.add(customer)
        db.commit()
        db.refresh(customer)

        delivery_method = extracted.get("delivery_method", "pickup")
        if "deliver" in str(delivery_method).lower() or "dispatch" in str(delivery_method).lower() or "driver" in str(delivery_method).lower():
            delivery_method = "delivery"
        else:
            delivery_method = "pickup"

        db_order = Order(
            customer_id=customer.id,
            designer_id=designer.id if designer else None,
            style=extracted.get("style"),
            color=extracted.get("color"),
            occasion=extracted.get("occasion"),
            deadline=extracted.get("deadline"),
            delivery_method=delivery_method,
            delivery_address=extracted.get("delivery_address"),
            status="received",
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        # Dispatch automated WhatsApp Cloud Push & Email notification to the specific designer
        notify_new_order(customer.name, customer.phone, extracted, designer=designer)

    return schemas.ChatResponse(
        reply=result.get("reply", ""),
        order_ready=order_ready,
        extracted=result.get("extracted"),
    )

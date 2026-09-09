import json
import os
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Customer, Designer, Order
from app.schemas import schemas
from app.notifications import notify_new_order

router = APIRouter(prefix="/chat", tags=["chat"])


def build_system_prompt(designer: Optional[Designer] = None) -> str:
    brand = designer.brand_name if designer else "IFashion Tailor Shop"
    location = f" located in {designer.location}" if designer and designer.location else ""
    delivery_note = (
        "Available fulfillment methods: In-person walk-in / pickup at our shop, OR delivery driver / courier dispatch."
    )

    return f"""You are the friendly AI fashion assistant for {brand}{location}.
Your job is to welcome the customer warmly, help them order their custom clothes, and note down all their order details clearly.

CHECKLIST TO COLLECT STEP BY STEP:
1. Customer's Name
2. WhatsApp / Phone Number
3. Style of outfit (e.g. Senator wear, Agbada, Kaftan, native shirt & trousers)
4. Preferred Color and Fabric (e.g. Navy blue, white, black cashmere, linen, etc.)
5. Occasion and when they need it (Date or Deadline)
6. Measurements (chest, waist, shoulder, sleeve, trouser length, neck — if they have measurements, take them; if not, let them know the tailor can measure them or guide them)
7. How they want to receive it:
   - Pick up at our shop
   - Delivery to their doorstep (ask for their delivery address)

TONE & RULES OF CONVERSATION:
- Keep your English very simple, clear, respectful, and friendly.
- AVOID big grammar, flowery vocabulary, or overly stiff words (do NOT use words like "atelier", "bespoke", "envisioning", "exquisite", "garment", "styling needs", or "interrogation").
- Sound like a real, polite tailor assistant chatting on WhatsApp: simple, warm, and straight to the point.
  (For example, if they say "hi you there?", reply warmly like: "Hello! Yes, I'm here. What style would you like us to sew for you today?")
- Ask only 1 or 2 short questions at a time so the customer is not overwhelmed.
- {delivery_note}
- IMPORTANT: Before placing the order, clearly summarize the full details to the customer. Put each item on its own new line (e.g.
  Style: ...
  Color: ...
  Occasion: ...
  Deadline: ...
  Delivery: ...)
  Do NOT use double asterisks like **Style:** or raw markdown stars. Just use clean, plain text with line breaks so it looks neat in chat.
- Set "order_ready" to true ONLY AFTER the customer sees the recap and says yes, confirm, or agrees.

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


import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="google.genai")

_genai_client = None


def get_genai_client(api_key: str):
    global _genai_client
    if _genai_client is None:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=api_key)
        except Exception:
            return None
    return _genai_client


async def call_gemini(system_prompt: str, history: list[dict], known_customer: dict | None) -> dict:
    """
    Calls the Gemini API to power the multi-tenant bespoke concierge asynchronously.
    Optimized for high concurrency and sub-2-second latency:
    - system_instruction: passed natively in model config for prompt caching.
    - thinking_budget=0: bypasses deep chain-of-thought delay.
    - response_mime_type="application/json": structured JSON response directly.
    - Async model generation / non-blocking HTTPX client.
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
            f"\n\nReturning Customer Detected! Saved Profile: {json.dumps(known_customer)}.\n"
            "Welcome them back warmly by name in simple words, and ask if they would like to use their saved measurements or change anything."
        )

    convo = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history)
    user_turn = convo if convo.strip() else "Hello"

    text = None
    last_error = None

    # Strategy 1: google.genai SDK async with native system_instruction, thinking_budget=0 & response_mime_type
    client = get_genai_client(api_key)
    if client and hasattr(client, "aio"):
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=context,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                temperature=0.3,
            )
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_turn,
                config=config,
            )
            if response and response.text:
                text = response.text.strip()
        except Exception as e:
            last_error = e

    # Strategy 2: Direct async HTTPX REST API fallback with system_instruction and thinkingBudget: 0
    if not text:
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "system_instruction": {
                    "parts": [{"text": context}]
                },
                "contents": [
                    {"parts": [{"text": user_turn}]}
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "thinkingConfig": {
                        "thinkingBudget": 0
                    },
                    "temperature": 0.3
                }
            }
            async with httpx.AsyncClient(timeout=20.0) as http_client:
                resp = await http_client.post(url, json=payload)
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
async def chat(request: schemas.ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Find designer if handle or ID provided
    designer = None
    if request.designer_handle:
        clean_handle = request.designer_handle.strip().lower().replace("@", "")
        designer = db.query(Designer).filter(Designer.handle == clean_handle).first()
    elif request.designer_id:
        designer = db.query(Designer).filter(Designer.id == request.designer_id).first()

    # Look up returning customer if phone number exists
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
    result = await call_gemini(system_prompt, history, known_customer)

    order_ready = result.get("order_ready", False)
    extracted = result.get("extracted") or {}

    # Resolve customer phone and name robustly from extracted, request, or known profile
    resolved_phone = extracted.get("phone") or request.phone or (known_customer.get("phone") if known_customer else None)
    resolved_name = extracted.get("name") or (known_customer.get("name") if known_customer else "Valued Client")

    if order_ready and resolved_phone:
        customer_phone = str(resolved_phone).strip()
        customer = db.query(Customer).filter(Customer.phone == customer_phone).first()

        if customer:
            if extracted.get("name") and customer.name != extracted["name"]:
                customer.name = extracted["name"].strip()
            if extracted.get("measurements"):
                # Merge new measurements with existing
                merged = dict(customer.measurements or {})
                merged.update(extracted["measurements"])
                customer.measurements = merged
            if designer and not customer.designer_id:
                customer.designer_id = designer.id
        else:
            customer = Customer(
                name=resolved_name.strip(),
                phone=customer_phone,
                measurements=extracted.get("measurements") or {},
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
            style=extracted.get("style") or "Custom Native Wear",
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

        # Ensure measurements from customer record are included in notification payload
        order_notification_payload = dict(extracted)
        if customer.measurements and not order_notification_payload.get("measurements"):
            order_notification_payload["measurements"] = customer.measurements

        # Offload WhatsApp & Email dispatch to background task to keep API response instant
        background_tasks.add_task(
            notify_new_order,
            customer_name=customer.name,
            phone=customer.phone,
            order=order_notification_payload,
            designer_name=designer.brand_name if designer else None,
            designer_phone=designer.phone if designer else None,
            designer_email=designer.email if designer else None,
        )

    return schemas.ChatResponse(
        reply=result.get("reply", ""),
        order_ready=order_ready,
        extracted=result.get("extracted"),
    )

"""
Sends the fashion designer automated push notifications when a new bespoke order arrives.

Channels supported:
  - WhatsApp via Meta WhatsApp Cloud API (Automated Cloud Push)
  - Email via SMTP (e.g. Gmail App Password on Port 587 or 465) with rich luxury HTML formatting

If credentials are not yet configured or fail, notifications are safely logged
to the console and diagnostic feedback is provided so the app never crashes.
"""

import os
import smtplib
import logging
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Any, Tuple

import httpx

logger = logging.getLogger("ifashion.notifications")


def clean_phone_for_whatsapp(phone: str) -> str:
    """Strip spaces, dashes, parentheses, and leading '+' for WhatsApp Graph API (E.164 without plus)."""
    cleaned = re.sub(r"[^\d]", "", phone or "")
    # If starts with 0 and Nigerian 11 digits (e.g. 08012345678), convert to 2348012345678
    if cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = "234" + cleaned[1:]
    return cleaned


def format_order_plain_text(customer_name: str, phone: str, order: dict, designer_name: Optional[str] = None) -> str:
    delivery_method = order.get("delivery_method", "pickup")
    delivery_label = "In-person Atelier Pickup" if delivery_method == "pickup" else "Delivery Driver / Courier Dispatch"

    measurements = order.get("measurements")
    meas_str = ""
    if isinstance(measurements, dict) and measurements:
        meas_str = "\nMeasurements:\n" + "\n".join(f"  - {k.capitalize()}: {v}" for k, v in measurements.items())

    lines = [
        f"* NEW BESPOKE ORDER - {designer_name or 'IFashion Atelier'} *",
        "----------------------------------------",
        f"Customer: {customer_name}",
        f"Phone (WhatsApp): {phone}",
        f"Style: {order.get('style', '-')}",
        f"Color / Fabric: {order.get('color', '-')}",
        f"Occasion: {order.get('occasion', '-')}",
        f"Deadline: {order.get('deadline', '-')}",
        f"Fulfillment: {delivery_label}",
    ]

    if delivery_method == "delivery" and order.get("delivery_address"):
        lines.append(f"Delivery Address: {order.get('delivery_address')}")

    if meas_str:
        lines.append(meas_str)

    if order.get("notes"):
        lines.append(f"Notes: {order['notes']}")

    lines.append("----------------------------------------")
    lines.append("Log in to your IFashion Tailor Dashboard to manage this order.")
    return "\n".join(lines)


def format_order_html(customer_name: str, phone: str, order: dict, designer_name: Optional[str] = None) -> str:
    brand = designer_name or "IFashion Atelier"
    delivery_method = order.get("delivery_method", "pickup")
    delivery_label = "In-person Atelier Pickup" if delivery_method == "pickup" else "Delivery Driver / Courier Dispatch"

    clean_wa = clean_phone_for_whatsapp(phone)
    wa_link = f"https://wa.me/{clean_wa}" if clean_wa else "#"

    measurements = order.get("measurements") or {}
    meas_rows = ""
    if isinstance(measurements, dict) and measurements:
        for k, v in measurements.items():
            meas_rows += f"""
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #EFEAE1; color: #6D635B; font-weight: 500;">{k.capitalize()}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #EFEAE1; color: #1C1410; font-weight: 700; text-align: right;">{v}</td>
            </tr>
            """

    address_row = ""
    if delivery_method == "delivery" and order.get("delivery_address"):
        address_row = f"""
        <tr>
          <td style="padding: 8px 0; color: #6D635B; font-size: 14px;">📍 Delivery Destination</td>
          <td style="padding: 8px 0; color: #1C1410; font-weight: 600; font-size: 14px; text-align: right;">{order.get('delivery_address')}</td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert</title>
    </head>
    <body style="margin: 0; padding: 24px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1410;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #EFEAE1; overflow: hidden; box-shadow: 0 10px 30px rgba(28,20,16,0.06);">
        <!-- Header -->
        <tr>
          <td style="background-color: #1C1410; padding: 28px 32px; text-align: center;">
            <div style="font-size: 20px; color: #C59A6F; margin-bottom: 6px;">✦ IFASHION BESPOKE ✦</div>
            <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">New Order Received</h1>
            <p style="margin: 6px 0 0; color: #A69E96; font-size: 14px;">for {brand}</p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 32px;">
            <!-- Customer Card -->
            <div style="background-color: #FAF7F2; border: 1px solid #EFEAE1; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #B3702A; margin-bottom: 4px;">Client Details</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1C1410;">{customer_name}</div>
                    <div style="font-size: 14px; color: #6D635B; margin-top: 2px;">Phone: <strong>{phone}</strong></div>
                  </td>
                  <td align="right" valign="middle">
                    <a href="{wa_link}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;">
                      Chat on WhatsApp &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Garment Specs -->
            <h3 style="margin: 0 0 12px; font-size: 16px; color: #1C1410; border-bottom: 1px solid #EFEAE1; padding-bottom: 8px;">Order Specifications</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #6D635B; font-size: 14px;">Style Selected</td>
                <td style="padding: 8px 0; color: #1C1410; font-weight: 600; font-size: 14px; text-align: right;">{order.get('style', 'Bespoke Native')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6D635B; font-size: 14px;">Color / Fabric</td>
                <td style="padding: 8px 0; color: #1C1410; font-weight: 600; font-size: 14px; text-align: right;">{order.get('color', 'As Discussed')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6D635B; font-size: 14px;">Occasion</td>
                <td style="padding: 8px 0; color: #1C1410; font-weight: 600; font-size: 14px; text-align: right;">{order.get('occasion', 'Custom Event')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6D635B; font-size: 14px;">Target Deadline</td>
                <td style="padding: 8px 0; color: #B3702A; font-weight: 700; font-size: 14px; text-align: right;">{order.get('deadline', 'Standard Timeline')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6D635B; font-size: 14px;">Fulfillment Method</td>
                <td style="padding: 8px 0; color: #1C1410; font-weight: 600; font-size: 14px; text-align: right;">{delivery_label}</td>
              </tr>
              {address_row}
            </table>

            <!-- Measurements Table (if present) -->
            {f'''
            <h3 style="margin: 0 0 12px; font-size: 16px; color: #1C1410; border-bottom: 1px solid #EFEAE1; padding-bottom: 8px;">Saved Measurements</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #EFEAE1; border-radius: 10px; overflow: hidden;">
              {meas_rows}
            </table>
            ''' if meas_rows else ''}

            <!-- Footer Action -->
            <div style="text-align: center; padding-top: 10px;">
              <a href="http://localhost:5173" style="display: inline-block; background-color: #1C1410; color: #C59A6F; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 700;">
                Open Tailor Dashboard
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer Note -->
        <tr>
          <td style="background-color: #FAF7F2; padding: 18px 32px; text-align: center; font-size: 12px; color: #8F8479; border-top: 1px solid #EFEAE1;">
            Sent automatically by IFashion Atelier Concierge &bull; Your bespoke fashion operating platform
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def send_email_notification(to_email: str, subject: str, plain_body: str, html_body: Optional[str] = None) -> Tuple[bool, str]:
    """
    Sends an email alert with automatic space-stripping for Gmail App Passwords
    and dual support for Port 587 (STARTTLS) and Port 465 (SSL).
    """
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port_str = os.environ.get("SMTP_PORT", "587")
    port = int(port_str) if port_str.isdigit() else 587
    user = os.environ.get("SMTP_USER")
    raw_password = os.environ.get("SMTP_PASSWORD")

    if not all([host, user, raw_password, to_email]):
        return False, "Missing SMTP credentials or recipient email in .env"

    if "your_email" in user.lower() or not raw_password.strip():
        return False, "SMTP credentials contain placeholder values"

    clean_pwd = raw_password.replace(" ", "").strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"IFashion Atelier <{user}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_body, "plain"))
    if html_body:
        msg.attach(MIMEText(html_body, "html"))

    # Attempt 1: Using specified port (usually 587 STARTTLS)
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(user, clean_pwd)
                server.sendmail(user, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.starttls()
                server.login(user, clean_pwd)
                server.sendmail(user, [to_email], msg.as_string())
        logger.info(f"[Email Push] Order alert delivered to {to_email}")
        return True, "Email delivered successfully"
    except smtplib.SMTPAuthenticationError as e:
        err_msg = f"Gmail Authentication Error: Google rejected password. Verify your 16-character App Password at myaccount.google.com/apppasswords. ({e})"
        logger.warning(err_msg)
        return False, err_msg
    except Exception as e1:
        # Fallback: If 587 failed, attempt Port 465 (SSL)
        try:
            with smtplib.SMTP_SSL(host, 465, timeout=12) as server:
                server.login(user, clean_pwd)
                server.sendmail(user, [to_email], msg.as_string())
            logger.info(f"[Email Push (SSL 465 Fallback)] Order alert delivered to {to_email}")
            return True, "Email delivered via Port 465 fallback"
        except Exception as e2:
            err_msg = f"SMTP Delivery failed on both ports: {e1} | {e2}"
            logger.warning(err_msg)
            return False, err_msg


def send_whatsapp_cloud_notification(to_phone: str, body: str) -> Tuple[bool, str]:
    """
    Sends automated WhatsApp push via Meta WhatsApp Cloud API.
    """
    token = os.environ.get("WHATSAPP_CLOUD_API_TOKEN")
    phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")

    if not token or not phone_number_id:
        return False, "WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set in .env"

    clean_phone = clean_phone_for_whatsapp(to_phone)
    if not clean_phone:
        return False, f"Invalid phone number format: {to_phone}"

    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token.strip()}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "text",
        "text": {"preview_url": False, "body": body},
    }

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=15.0)
        data = response.json()
        if response.status_code in (200, 201):
            logger.info(f"[WhatsApp Cloud Push] Order alert delivered to {clean_phone}")
            return True, "WhatsApp message sent successfully"
        else:
            err = data.get("error", {}).get("message", response.text)
            err_code = data.get("error", {}).get("code")
            logger.warning(f"Meta WhatsApp Cloud API error ({err_code}): {err}")
            return False, f"Meta API Error ({err_code}): {err}"
    except Exception as e:
        logger.warning(f"WhatsApp Cloud Push connection error: {e}")
        return False, f"Connection error: {e}"


def notify_new_order(customer_name: str, phone: str, order: dict, designer: Optional[Any] = None) -> dict:
    """
    Main dispatch function called whenever a client confirms an order with the AI concierge.
    Sends WhatsApp push & Email to the specific designer or default atelier.
    """
    designer_name = getattr(designer, "brand_name", None) if designer else None
    target_whatsapp = getattr(designer, "phone", None) if designer else os.environ.get("DESIGNER_PHONE")
    target_email = getattr(designer, "email", None) if designer else os.environ.get("DESIGNER_EMAIL")

    plain_body = format_order_plain_text(customer_name, phone, order, designer_name)
    html_body = format_order_html(customer_name, phone, order, designer_name)

    sent_whatsapp, wa_status = False, "Not configured"
    if target_whatsapp:
        sent_whatsapp, wa_status = send_whatsapp_cloud_notification(target_whatsapp, plain_body)

    sent_email, email_status = False, "Not configured"
    if target_email:
        sent_email, email_status = send_email_notification(
            to_email=target_email,
            subject=f"✦ New Bespoke Order: {order.get('style', 'Native Wear')} from {customer_name}",
            plain_body=plain_body,
            html_body=html_body,
        )

    # Clean direct WhatsApp click-to-chat link for the designer or customer
    clean_wa = clean_phone_for_whatsapp(phone)
    direct_chat_link = f"https://wa.me/{clean_wa}" if clean_wa else None

    # Always log comprehensive diagnostics to the terminal
    print("\n" + "=" * 60)
    print("[IFASHION NOTIFICATION ENGINE] Automated Order Alert")
    print(f"Designer: {designer_name or 'Default Atelier'}")
    print(f"WhatsApp Push Target: {target_whatsapp} -> {'SENT' if sent_whatsapp else f'FAILED ({wa_status})'}")
    print(f"Email Push Target:    {target_email} -> {'SENT' if sent_email else f'FAILED ({email_status})'}")
    if direct_chat_link:
        print(f"Direct Customer WhatsApp Link: {direct_chat_link}")
    print("-" * 60)
    print(plain_body)
    print("=" * 60 + "\n")

    return {
        "whatsapp_sent": sent_whatsapp,
        "whatsapp_status": wa_status,
        "email_sent": sent_email,
        "email_status": email_status,
        "direct_whatsapp_link": direct_chat_link,
    }

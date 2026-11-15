import os
import json
import socket
import ssl
import smtplib
import logging
import asyncio
import urllib.request
import urllib.error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("email_service")


def get_smtp_config() -> Dict[str, Any]:
    """Retrieve dynamic SMTP and HTTP email settings from environment with intelligent defaults."""
    user = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER") or "ritesh.work.1510@gmail.com"
    password = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS") or "sais rdqc kdye fdxo"
    host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    port = int(os.getenv("SMTP_PORT", "587"))
    from_email = os.getenv("SMTP_FROM_EMAIL") or user or "ritesh.work.1510@gmail.com"
    from_name = os.getenv("SMTP_FROM_NAME", "SmartERP Billing")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes") or port == 465

    # Optional HTTP email service API keys (overcome Render free-tier SMTP port blocks)
    resend_api_key = os.getenv("RESEND_API_KEY", "").strip()
    brevo_api_key = os.getenv("BREVO_API_KEY", "").strip()

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_email": from_email,
        "from_name": from_name,
        "use_tls": use_tls,
        "use_ssl": use_ssl,
        "resend_api_key": resend_api_key,
        "brevo_api_key": brevo_api_key
    }


def _build_html_email(to_email: str, reset_link: str, recipient_name: Optional[str] = None) -> str:
    display_name = recipient_name or to_email.split("@")[0].capitalize()
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your SmartERP Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0260de 0%, #0047a5 100%); padding: 32px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #ffffff; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #0260de; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">SV</span>
                  </td>
                  <td style="padding-left: 14px; text-align: left;">
                    <div style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">SmartERP</div>
                    <div style="color: #bfdbfe; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">SiddhiVinayak Enterprise</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                Hello <strong>{display_name}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #475569;">
                We received a request to reset the password for your account (<strong>{to_email}</strong>). Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="{reset_link}" target="_blank" style="display: inline-block; padding: 15px 32px; font-size: 15px; font-weight: 700; color: #ffffff; background-color: #0260de; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px; box-shadow: 0 2px 6px rgba(2, 96, 222, 0.35);">
                      Reset My Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Clickable URL -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #475569;">
                  Direct Password Reset Link:
                </p>
                <p style="margin: 0; word-break: break-all; font-size: 12px; line-height: 18px;">
                  <a href="{reset_link}" target="_blank" style="color: #0260de; font-weight: 600; text-decoration: underline;">{reset_link}</a>
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #eff6ff; border-left: 4px solid #0260de; border-radius: 8px; padding: 14px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #1e40af;">
                  <strong>Security Reminder:</strong> This link is strictly single-use and will expire in <strong>20 minutes</strong>. If you did not make this request, you can safely ignore this email &mdash; your account remains secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; 2026 SmartERP &bull; SiddhiVinayak Enterprise Billing Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _send_via_resend(api_key: str, from_email: str, from_name: str, to_email: str, reset_link: str, recipient_name: Optional[str]) -> bool:
    """Send via Resend HTTP REST API over standard HTTPS port 443 (100% bypasses Render SMTP block)."""
    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        sender = f"{from_name} <onboarding@resend.dev>" if "gmail.com" in from_email.lower() else f"{from_name} <{from_email}>"
        payload = {
            "from": sender,
            "to": [to_email],
            "subject": "Password Reset Request - SmartERP Billing",
            "html": _build_html_email(to_email, reset_link, recipient_name)
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201):
                logger.info(f"✓ Password reset email successfully delivered to {to_email} via Resend HTTP API.")
                return True
    except Exception as exc:
        logger.warning(f"Resend HTTP delivery attempt failed: {exc}")
    return False


def _send_via_brevo(api_key: str, from_email: str, from_name: str, to_email: str, reset_link: str, recipient_name: Optional[str]) -> bool:
    """Send via Brevo HTTP REST API over standard HTTPS port 443 (100% bypasses Render SMTP block)."""
    try:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        payload = {
            "sender": {"name": from_name, "email": from_email},
            "to": [{"email": to_email}],
            "subject": "Password Reset Request - SmartERP Billing",
            "htmlContent": _build_html_email(to_email, reset_link, recipient_name)
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201):
                logger.info(f"✓ Password reset email successfully delivered to {to_email} via Brevo HTTP API.")
                return True
    except Exception as exc:
        logger.warning(f"Brevo HTTP delivery attempt failed: {exc}")
    return False


class IPv4SMTP(smtplib.SMTP):
    """Custom SMTP client that strictly enforces IPv4 connections to avoid Render's unrouted IPv6 [Errno 101]."""
    def _get_socket(self, host, port, timeout):
        # Resolve strictly IPv4 (AF_INET)
        res = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
        err = None
        for af, socktype, proto, _, sa in res:
            try:
                s = socket.socket(af, socktype, proto)
                s.settimeout(timeout)
                s.connect(sa)
                return s
            except OSError as e:
                err = e
                s.close()
        if err:
            raise err
        raise OSError(f"Could not connect to {host}:{port} via IPv4")


class IPv4SMTP_SSL(smtplib.SMTP_SSL):
    """Custom SMTP_SSL client that strictly enforces IPv4 connections."""
    def _get_socket(self, host, port, timeout):
        res = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
        err = None
        for af, socktype, proto, _, sa in res:
            try:
                raw_s = socket.socket(af, socktype, proto)
                raw_s.settimeout(timeout)
                raw_s.connect(sa)
                context = self.context or ssl.create_default_context()
                return context.wrap_socket(raw_s, server_hostname=host)
            except OSError as e:
                err = e
                raw_s.close()
        if err:
            raise err
        raise OSError(f"Could not connect to {host}:{port} via IPv4 SSL")


def _send_smtp_sync(to_email: str, reset_link: str, recipient_name: Optional[str] = None) -> bool:
    """
    Intelligent email transmission worker:
    1. If RESEND_API_KEY is configured, sends via HTTPS port 443 (works everywhere, immune to SMTP port blocks).
    2. If BREVO_API_KEY is configured, sends via HTTPS port 443.
    3. Attempts IPv4 STARTTLS on port 587.
    4. Attempts IPv4 SSL on port 465 fallback.
    5. Fallback logs the secure URL to server logs for manual administrative recovery.
    """
    cfg = get_smtp_config()
    host = cfg["host"]
    port = cfg["port"]
    user = cfg["user"]
    password = cfg["password"]
    from_email = cfg["from_email"]
    from_name = cfg["from_name"]
    use_tls = cfg["use_tls"]
    use_ssl = cfg["use_ssl"]

    # 1. Check HTTP REST APIs first if present (ideal for Render free tier)
    if cfg["resend_api_key"]:
        if _send_via_resend(cfg["resend_api_key"], from_email, from_name, to_email, reset_link, recipient_name):
            return True

    if cfg["brevo_api_key"]:
        if _send_via_brevo(cfg["brevo_api_key"], from_email, from_name, to_email, reset_link, recipient_name):
            return True

    if not host or not user:
        logger.info(
            f"📧 [PASSWORD RESET LINK] (SMTP not configured, direct URL logged):\n"
            f"Recipient: {to_email}\n"
            f"Reset URL: {reset_link}\n"
        )
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset Request - SmartERP Billing"
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email

    plain_text = (
        f"Hello,\n\n"
        f"We received a request to reset your password for SmartERP (SiddhiVinayak Enterprise Billing).\n\n"
        f"Please visit the following link to set your new password:\n{reset_link}\n\n"
        f"This link will expire in 20 minutes and can only be used once.\n\n"
        f"If you did not request this, please ignore this email.\n"
    )
    html_content = _build_html_email(to_email, reset_link, recipient_name)

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    clean_password = password.replace(" ", "").strip() if "@gmail.com" in user.lower() else password

    # Attempt connection options: 1st preference (configured port), 2nd preference (SSL port 465)
    connection_attempts = []
    if use_ssl or port == 465:
        connection_attempts.append(("ssl", host, 465))
        connection_attempts.append(("tls", host, 587))
    else:
        connection_attempts.append(("tls", host, port))
        connection_attempts.append(("ssl", host, 465))

    last_error = None
    for mode, h, p in connection_attempts:
        server = None
        try:
            if mode == "ssl":
                server = IPv4SMTP_SSL(h, p, timeout=10)
            else:
                server = IPv4SMTP(h, p, timeout=10)
                if use_tls:
                    server.starttls()

            if password:
                try:
                    server.login(user, clean_password)
                except smtplib.SMTPAuthenticationError:
                    server.login(user, password)

            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            logger.info(f"✓ Password reset email successfully delivered to {to_email} via SMTP ({h}:{p} {mode.upper()}).")
            return True
        except Exception as exc:
            last_error = exc
            if server:
                try:
                    server.close()
                except Exception:
                    pass

    # If all SMTP direct attempts failed (e.g. Render free tier blocking raw ports 587 and 465)
    logger.error(f"Failed to deliver password reset email via SMTP to {to_email}: {last_error}")
    logger.info(f"📧 [FALLBACK RESET LINK]: {reset_link}")
    return False


async def send_password_reset_email(to_email: str, reset_link: str, recipient_name: Optional[str] = None) -> bool:
    """Asynchronous wrapper to send password reset email without blocking the event loop."""
    return await asyncio.to_thread(_send_smtp_sync, to_email, reset_link, recipient_name)

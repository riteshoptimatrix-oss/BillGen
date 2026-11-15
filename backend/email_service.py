import os
import smtplib
import logging
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("email_service")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL") or SMTP_USER or "noreply@siddhivinayak.com"
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "SiddhiVinayak Enterprise Billing")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes") or SMTP_PORT == 465


def _build_html_email(to_email: str, reset_link: str, recipient_name: Optional[str] = None) -> str:
    display_name = recipient_name or to_email.split("@")[0].capitalize()
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
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
                    <div style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">SiddhiVinayak</div>
                    <div style="color: #bfdbfe; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Enterprise Billing ERP</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                Hello <strong>{display_name}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #475569;">
                We received a request to reset the password for your account associated with <strong>{to_email}</strong>. Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #0260de;">
                    <a href="{reset_link}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Security Notice -->
              <div style="background-color: #f8fafc; border-left: 4px solid #0260de; border-radius: 8px; padding: 14px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b;">
                  <strong>Security Notice:</strong> This reset link is valid for <strong>20 minutes</strong> and can only be used once. If you did not request a password change, you can safely ignore this email &mdash; your account is completely secure.
                </p>
              </div>

              <!-- Fallback URL -->
              <p style="margin: 24px 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                If the button above does not work, copy and paste this link into your web browser:
              </p>
              <p style="margin: 6px 0 0; word-break: break-all; font-size: 12px; line-height: 18px;">
                <a href="{reset_link}" style="color: #0260de; text-decoration: underline;">{reset_link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; 2026 SiddhiVinayak Enterprise. All rights reserved.
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">
                High-Performance 3-Wheeler Commercial Vehicles &bull; Automated Enterprise Billing
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


def _send_smtp_sync(to_email: str, reset_link: str, recipient_name: Optional[str] = None) -> bool:
    """Synchronous worker that connects to SMTP host and transmits the email."""
    if not SMTP_HOST or not SMTP_USER:
        logger.info(
            f"📧 [PASSWORD RESET LINK] (SMTP not configured, logging link for dev/testing)\n"
            f"Recipient: {to_email}\n"
            f"Reset URL: {reset_link}\n"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Password Reset Request - SiddhiVinayak Enterprise Billing"
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        plain_text = (
            f"Hello,\n\n"
            f"We received a request to reset your password for SiddhiVinayak Enterprise Billing.\n\n"
            f"Please visit this link to set a new password:\n{reset_link}\n\n"
            f"This link will expire in 20 minutes and can only be used once.\n\n"
            f"If you did not request this, please ignore this email.\n"
        )
        html_content = _build_html_email(to_email, reset_link, recipient_name)

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            if SMTP_USE_TLS:
                server.starttls()

        if SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)

        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        logger.info(f"✓ Password reset email successfully delivered to {to_email} via SMTP ({SMTP_HOST}).")
        return True
    except Exception as exc:
        logger.error(f"Failed to deliver password reset email via SMTP to {to_email}: {exc}")
        logger.info(f"📧 [FALLBACK RESET LINK]: {reset_link}")
        return False


async def send_password_reset_email(to_email: str, reset_link: str, recipient_name: Optional[str] = None) -> bool:
    """Asynchronous wrapper to send password reset email without blocking the event loop."""
    return await asyncio.to_thread(_send_smtp_sync, to_email, reset_link, recipient_name)

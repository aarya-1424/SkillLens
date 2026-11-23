"""Sending email. Two ways, whichever is set up on the server:

  - Resend (an email service with a simple API): set RESEND_API_KEY and EMAIL_FROM
  - Any normal mail account over SMTP (for example a Gmail address with an
    app password): set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM

If neither is set, nothing is sent: the message is written to the server log
instead (fine for local testing) and `send` returns False so callers can say
honestly that the email did not go.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)


def configured() -> bool:
    return bool(settings.EMAIL_FROM and (settings.RESEND_API_KEY or settings.SMTP_HOST))


def send(to: str, subject: str, text: str, html: str | None = None) -> bool:
    if not configured():
        log.warning("Email not configured; would have sent to a recipient: %s\n%s", subject, text)
        return False
    try:
        if settings.RESEND_API_KEY:
            res = httpx.post("https://api.resend.com/emails", timeout=15,
                             headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                             json={"from": settings.EMAIL_FROM, "to": [to], "subject": subject,
                                   "text": text, **({"html": html} if html else {})})
            if res.status_code >= 300:
                log.error("Resend refused the email (%s)", res.status_code)
                return False
            return True

        msg = EmailMessage()
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(text)
        if html:
            msg.add_alternative(html, subtype="html")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            smtp.starttls(context=ssl.create_default_context())
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
            smtp.send_message(msg)
        return True
    except Exception:  # an email failing must never break the request
        log.exception("Sending email failed")
        return False

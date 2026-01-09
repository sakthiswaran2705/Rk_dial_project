import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

FROM_EMAIL = os.getenv("EMAILADDRESS")          # admin / system mail
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

def send_email(to_email, subject, body):
    if not SENDGRID_API_KEY:
        raise RuntimeError("SENDGRID_API_KEY missing")

    if not FROM_EMAIL:
        raise RuntimeError("EMAILADDRESS missing")

    message = Mail(
        from_email=FROM_EMAIL,   # ADMIN mail
        to_emails=to_email,      # USER mail
        subject=subject,
        html_content=body
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print("✅ Mail accepted by SendGrid:", response.status_code)  # 202 = success
    except Exception as e:
        print("❌ SendGrid mail error:", repr(e))
        raise

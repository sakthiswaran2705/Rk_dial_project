from datetime import datetime, timedelta
from bson import ObjectId
from api.common_urldb import db

# ❌ SMTP imports (keep file structure same, but NOT USED)
import smtplib
from email.mime.text import MIMEText

# ✅ SendGrid imports
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os

from api.mail_settings import EMAILADDRESS, EMAILPASSWORD  # EMAILPASSWORD kept but NOT USED


col_payments = db["payments"]
col_users = db["user"]


FROM_EMAIL = EMAILADDRESS
APP_PASSWORD = EMAILPASSWORD   # kept (not used)

SMTP_SERVER = "smtp.gmail.com"  # kept (not used)
SMTP_PORT = 587                # kept (not used)




# =================================================
# SEND MAIL (SendGrid API – SMTP NOT USED)
# =================================================
def send_mail(to_email: str, subject: str, body: str):
    try:
        SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
        # ---- OLD SMTP CODE (KEPT AS COMMENT) ----
        """
        msg = MIMEText(body, "html")
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(FROM_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        """

        # ---- NEW SENDGRID API CODE ----
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=body
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)

        print("✅ Mail sent via SendGrid to:", to_email)
        print("DEBUG SENDGRID_API_KEY EXISTS =", bool(os.environ.get("SENDGRID_API_KEY")))

    except Exception as e:
        print("❌ Mail error:", e)


# =================================================
# USER NOTIFICATION SETTINGS
# =================================================
def is_payment_email_enabled(user: dict) -> bool:
    settings = user.get("notification_settings")

    # DEFAULT LOGIC
    # If settings not present → email is ON
    if not settings:
        return True

    return settings.get("email", True)


# =================================================
# PAYMENT SUCCESS MAIL
# =================================================
def send_payment_success_mail(user_id, plan_name, amount, expiry_date):
    try:
        uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
    except:
        return

    user = col_users.find_one({"_id": uid})
    if not user or not user.get("email"):
        return

    if not is_payment_email_enabled(user):
        print("🔕 Payment email disabled for:", user.get("email"))
        return

    if isinstance(expiry_date, str):
        expiry_date = datetime.fromisoformat(expiry_date)

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello,</p>

        <p>Your payment was successful 🎉</p>

        <table cellpadding="6">
          <tr><td><b>Plan</b></td><td>{plan_name.upper()}</td></tr>
          <tr><td><b>Amount</b></td><td>₹{amount}</td></tr>
          <tr><td><b>Valid Till</b></td><td>{expiry_date.strftime('%d-%m-%Y')}</td></tr>
        </table>

        <p>
          Thank you for choosing <b>RK-DIAL</b>.<br/>
          Your plan is now active.
        </p>

        <p>Regards,<br/>RK-DIAL Team</p>
      </body>
    </html>
    """

    send_mail(
        user["email"],
        "Payment Successful - RK-DIAL",
        body
    )

    print("✅ Payment success mail sent to:", user["email"])


# =================================================
# EXPIRY MAIL
# =================================================
def send_expiry_mail(to_email, plan_name, expiry_date, when):
    if when == "2days":
        subject = "Your Plan Will Expire in 2 Days"
        line = "will expire in 2 days"
    else:
        subject = "Your Plan Expires Today"
        line = "expires today"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <p>Hello,</p>

        <p>
          Your <b>{plan_name.upper()}</b> plan {line}.<br/>
          Expiry Date: <b>{expiry_date.strftime('%d-%m-%Y')}</b>
        </p>

        <p>Please renew your plan to continue uninterrupted service.</p>

        <p>Regards,<br/>RK-DIAL Team</p>
      </body>
    </html>
    """

    send_mail(to_email, subject, body)


# =================================================
# CRON / EXPIRY CHECK
# =================================================
def check_plan_expiry_and_send_mail():
    now = datetime.utcnow()

    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    start_2days = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
    end_2days = (now + timedelta(days=2)).replace(hour=23, minute=59, second=59, microsecond=999999)

    payments = col_payments.find({"status": "success"})

    for pay in payments:
        user_id = pay.get("user_id")
        if not user_id:
            continue

        try:
            uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except:
            continue

        user = col_users.find_one({"_id": uid})
        if not user or not user.get("email"):
            continue

        email = user["email"]

        if (
            start_2days <= pay["expiry_date"] <= end_2days
            and not pay.get("expiry_mail_2days_sent")
        ):
            send_expiry_mail(
                email,
                pay["plan_name"],
                pay["expiry_date"],
                "2days"
            )

            col_payments.update_one(
                {"_id": pay["_id"]},
                {"$set": {"expiry_mail_2days_sent": True}}
            )

        if (
            start_today <= pay["expiry_date"] <= end_today
            and not pay.get("expiry_mail_today_sent")
        ):
            send_expiry_mail(
                email,
                pay["plan_name"],
                pay["expiry_date"],
                "today"
            )

            col_payments.update_one(
                {"_id": pay["_id"]},
                {"$set": {"expiry_mail_today_sent": True}}
            )



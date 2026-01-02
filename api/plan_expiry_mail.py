from datetime import datetime, timedelta
from bson import ObjectId
from api.common_urldb import db
import smtplib
from email.mime.text import MIMEText

col_payments = db["payments"]
col_users = db["users"]

FROM_EMAIL = "sakthibala2705@gmail.com"
APP_PASSWORD = "udoq gyeh ylpx uzfc"


# ==================================================
# SEND MAIL
# ==================================================
def send_expiry_mail(to_email, plan_name, expiry_date, when):
    if when == "2days":
        subject = "Your Plan Will Expire in 2 Days"
        line = "will expire in 2 days"
    else:
        subject = "Your Plan Expires Today"
        line = "expires today"

    body = f"""
Hello,

Your {plan_name.upper()} plan {line}.
Expiry Date: {expiry_date.strftime('%d-%m-%Y')}

Please renew your plan to continue uninterrupted service.

Thanks,
RK-DIAL Team
"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(FROM_EMAIL, APP_PASSWORD)
    server.send_message(msg)
    server.quit()


# ==================================================
# CHECK & SEND MAILS
# ==================================================
def check_plan_expiry_and_send_mail():
    now = datetime.utcnow()

    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    start_2days = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0)
    end_2days = (now + timedelta(days=2)).replace(hour=23, minute=59, second=59)

    payments = col_payments.find({
        "status": "success",
        "expiry_date": {"$gte": start_today}
    })

    for pay in payments:
        try:
            user = col_users.find_one({"_id": ObjectId(pay["user_id"])})
        except:
            continue

        if not user or not user.get("email"):
            continue

        # ===============================
        # 2 DAYS BEFORE EXPIRY MAIL
        # ===============================
        if (
            start_2days <= pay["expiry_date"] <= end_2days
            and not pay.get("expiry_mail_2days_sent")
        ):
            send_expiry_mail(
                user["email"],
                pay["plan_name"],
                pay["expiry_date"],
                "2days"
            )

            col_payments.update_one(
                {"_id": pay["_id"]},
                {"$set": {"expiry_mail_2days_sent": True}}
            )

            print("2-day reminder sent to:", user["email"])

        # ===============================
        # EXPIRY DAY MAIL
        # ===============================
        if (
            start_today <= pay["expiry_date"] <= end_today
            and not pay.get("expiry_mail_today_sent")
        ):
            send_expiry_mail(
                user["email"],
                pay["plan_name"],
                pay["expiry_date"],
                "today"
            )

            col_payments.update_one(
                {"_id": pay["_id"]},
                {"$set": {"expiry_mail_today_sent": True}}
            )

            print("Expiry day mail sent to:", user["email"])


if __name__ == "__main__":
    check_plan_expiry_and_send_mail()

FROM_EMAIL = "sakthibala2705@gmail.com"
APP_PASSWORD = "udoq gyeh ylpx uzfc"

def send_payment_success_mail(to_email, plan_name, amount, expiry_date):
    body = f"""
Hello,

Your payment was successful 🎉

Plan       : {plan_name.upper()}
Amount     : ₹{amount}
Valid Till : {expiry_date.strftime('%d-%m-%Y')}

Thank you for choosing RK-DIAL.
Your plan is now active.

Regards,
RK-DIAL Team
"""

    msg = MIMEText(body)
    msg["Subject"] = "Payment Successful - RK-DIAL"
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(FROM_EMAIL, APP_PASSWORD)
    server.send_message(msg)
    server.quit()

from fastapi import APIRouter, HTTPException, Form
from datetime import datetime, timedelta
import random
import smtplib
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime, timedelta
from api.common_urldb import db
from api.mail_settings import EMAILADDRESS
from api.shop_owner_details import hash_password

router = APIRouter()
col_user = db["user"]

OTP_EXPIRY_MINUTES = 5

OTP_STORE = {}


def generate_otp():
    return str(random.randint(100000, 999999))


from api.mail_settings import EMAILADDRESS  # admin/system mail
from datetime import datetime, timedelta

def send_otp_email(to_email: str, otp: str):
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

    if not SENDGRID_API_KEY:
        raise RuntimeError("SENDGRID_API_KEY missing")

    subject = "Password Reset OTP – RK Dial"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello,</p>

        <p>Your OTP to reset your password is:</p>

        <h2 style="letter-spacing: 3px;">{otp}</h2>

        <p>
          This OTP is valid for <b>{OTP_EXPIRY_MINUTES} minutes</b>.
        </p>

        <p>
          If you did not request this, please ignore this email.
        </p>

        <p>
          — <b>RK Dial Team</b>
        </p>
      </body>
    </html>
    """

    message = Mail(
        from_email=EMAILADDRESS,   # ADMIN mail (verified in SendGrid)
        to_emails=to_email,        # USER mail
        subject=subject,
        html_content=body
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print("✅ OTP mail accepted by SendGrid:", response.status_code)  # 202
    except Exception as e:
        print("❌ OTP SendGrid error:", repr(e))
        raise



@router.post("/forgot-password/send-otp/")
def send_otp(emailorphone: str = Form(...)):
    identifier = emailorphone.strip().lower()

    user = col_user.find_one({
        "$or": [
            {"email": identifier},
            {"phonenumber": identifier}
        ]
    })

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email linked to account")

    otp = generate_otp()

    OTP_STORE[email] = {
        "otp": otp,
        "expiry": datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES),
        "verified": False
    }

    send_otp_email(email, otp)

    return {
        "status": True,
        "message": "OTP sent to registered email"
    }



@router.post("/forgot-password/verify-otp/")
def verify_otp(
    email: str = Form(...),
    otp: str = Form(...)
):
    email = email.strip().lower()
    record = OTP_STORE.get(email)

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if datetime.utcnow() > record["expiry"]:
        del OTP_STORE[email]
        raise HTTPException(status_code=400, detail="OTP expired")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    record["verified"] = True

    return {
        "status": True,
        "message": "OTP verified successfully"
    }

@router.post("/forgot-password/reset/")
def reset_password(
    email: str = Form(...),
    new_password: str = Form(...)
):
    email = email.strip().lower()
    record = OTP_STORE.get(email)

    if not record or not record["verified"]:
        raise HTTPException(
            status_code=403,
            detail="OTP verification required"
        )

    hashed_password = hash_password(new_password)

    col_user.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )

    del OTP_STORE[email]

    return {
        "status": True,
        "message": "Password reset successful"
    }

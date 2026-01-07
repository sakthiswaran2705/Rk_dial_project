from fastapi import APIRouter, HTTPException, Form
from datetime import datetime, timedelta
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from api.common_urldb import db
from api.mail_settings import EMAILADDRESS, EMAILPASSWORD
from api.shop_owner_details import hash_password

router = APIRouter()
col_user = db["user"]

OTP_EXPIRY_MINUTES = 5

OTP_STORE = {}


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp: str):
    msg = MIMEMultipart()
    msg["From"] = EMAILADDRESS
    msg["To"] = to_email
    msg["Subject"] = "Password Reset OTP"

    body = f"""
Hello,

Your OTP to reset your password is:

{otp}

This OTP is valid for {OTP_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.

— RK Dial Team
"""

    msg.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(EMAILADDRESS, EMAILPASSWORD)
    server.send_message(msg)
    server.quit()



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

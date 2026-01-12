from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from pymongo import MongoClient
from datetime import datetime
import pandas as pd
import hashlib, secrets, string
from io import BytesIO
from api.common_urldb import db
router = APIRouter(
    prefix="/bulk/register",
    tags=["Bulk Register"]
)

col_user = db["user"]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_password(name="User", digits=4):
    return (name.capitalize() if name else "User") + ''.join(
        secrets.choice(string.digits) for _ in range(digits)
    )

def normalize_phone(value):
    if value is None or value == "":
        return None
    try:
        phone = str(int(float(value)))
        return phone if len(phone) >= 10 else None
    except:
        return None


@router.post("/upload")
async def bulk_register_upload(file: UploadFile = File(...)):
    df = pd.read_excel(file.file).fillna("")
    output_rows = []

 
    existing_emails = set()
    existing_phones = set()

    for u in col_user.find({}, {"email": 1, "phonenumber": 1}):
        if u.get("email"):
            existing_emails.add(u["email"].lower())
        if u.get("phonenumber"):
            existing_phones.add(str(u["phonenumber"]))

    for idx, row in df.iterrows():
        firstname = str(row.get("firstname", "")).strip()
        lastname = str(row.get("lastname", "")).strip()
        email = str(row.get("email", "")).strip().lower()

      
        phone_raw = row.get("phonenumber", "") or row.get("phone", "")
        phone = normalize_phone(phone_raw)


        if not email and not phone:
            output_rows.append({
                "row_no": idx + 2,
                "firstname": firstname,
                "lastname": lastname,
                "email": "",
                "phone": "",
                "status": "skipped",
                "reason": "email & phone missing"
            })
            continue

     
        if email and email in existing_emails:
            output_rows.append({
                "row_no": idx + 2,
                "firstname": firstname,
                "lastname": lastname,
                "email": email,
                "phone": phone,
                "status": "skipped",
                "reason": "email already in DB"
            })
            continue

    
        if phone and phone in existing_phones:
            output_rows.append({
                "row_no": idx + 2,
                "firstname": firstname,
                "lastname": lastname,
                "email": email,
                "phone": phone,
                "status": "skipped",
                "reason": "phone already in DB"
            })
            continue


        plain_password = generate_password(firstname)

        col_user.insert_one({
            "firstname": firstname,
            "lastname": lastname,
            "email": email or None,
            "phonenumber": phone,
            "password": hash_password(plain_password),
            "notification_settings": {
                "email": True,
                "push": True,
                "updated_at": datetime.utcnow()
            }
        })

        if email:
            existing_emails.add(email)
        if phone:
            existing_phones.add(phone)

        output_rows.append({
            "row_no": idx + 2,
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "phone": phone,
            "password": plain_password,
            "status": "inserted",
            "reason": "success"
        })

 
    buffer = BytesIO()
    pd.DataFrame(output_rows).to_excel(buffer, index=False)
    buffer.seek(0)

    filename = f"output_result_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename=\"{filename}\"'}
    )

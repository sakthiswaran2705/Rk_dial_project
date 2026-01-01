from fastapi import APIRouter, Depends, Form
from datetime import datetime
from common_urldb import db
from translator import en_to_ta

router = APIRouter()

uravulgal_collection = db["uravugal"]

# ----------------------------------------
# TRANSLATION HELPER
# ----------------------------------------
def translate_text(text: str, lang: str):
    if not text:
        return ""
    if lang == "ta":
        return en_to_ta(text)
    return text

# ----------------------------------------
# ADD URAVULGAL DETAILS
# ----------------------------------------
@router.post("/uravugal/add/", operation_id="addUravugal")
def add_uravulgal(

    lang: str = Form("en"),

    name: str = Form(...),
    pattapaiyar: str = Form(None),
    native_place: str = Form(None),

    father_name: str = Form(None),
    father_pattapaiyar: str = Form(None),
    father_native_place: str = Form(None),

    mother_name: str = Form(None),
    mother_pattapaiyar: str = Form(None),
    mother_native_place: str = Form(None),

    occupation: str = Form(None),
    contact_number: str = Form(None),
    email: str = Form(None),
):
    document = {

        "name": translate_text(name, lang),
        "pattapaiyar": translate_text(pattapaiyar, lang),
        "native_place": translate_text(native_place, lang),

        "father_name": translate_text(father_name, lang),
        "father_pattapaiyar": translate_text(father_pattapaiyar, lang),
        "father_native_place": translate_text(father_native_place, lang),

        "mother_name": translate_text(mother_name, lang),
        "mother_pattapaiyar": translate_text(mother_pattapaiyar, lang),
        "mother_native_place": translate_text(mother_native_place, lang),

        "occupation": translate_text(occupation, lang),
        "contact_number": contact_number,
        "email": email,

        "created_at": datetime.utcnow()
    }

    uravulgal_collection.insert_one(document)

    return {
        "status": "success",
        "message": "Uravugal details saved successfully"
    }

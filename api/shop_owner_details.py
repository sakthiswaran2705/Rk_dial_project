from fastapi import APIRouter, Form, UploadFile, File, Query, HTTPException, Depends, Body, BackgroundTasks
from bson import ObjectId
from datetime import datetime
import hashlib, base64
import os, uuid
from pydantic import BaseModel
from api.common_urldb import db

# Ensure this path matches your project structure
from api.email_sender import send_email

from api.auth_jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_refresh_token,
)
from api.payments import check_shop_limit, check_offer_limit

# --- TRANSLATOR SYSTEM HELPERS ---
from api.translator import ta_to_en, en_to_ta
from api.cache import get_cached, set_cache


router = APIRouter()
col_user = db["user"]
col_shop = db["shop"]
col_city = db["city"]
col_category = db["category"]
col_offers = db["offers"]
col_jobs = db["jobs"]
col_notifications = db["notifications"]




def safe(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, list):
        return [safe(i) for i in obj]
    if isinstance(obj, dict):
        return {k: safe(v) for k, v in obj.items()}
    return obj


# PHONETIC MAP FOR SMALL LETTERS
PHONETIC_MAP = {
    "a": "ஏ", "b": "பி", "c": "சி", "d": "டி",
    "e": "இ", "f": "எப்", "g": "ஜி", "h": "எச்",
    "i": "ஐ", "j": "ஜே", "k": "கே", "l": "எல்",
    "m": "எம்", "n": "என்", "o": "ஓ", "p": "பி",
    "q": "க்யூ", "r": "ஆர்", "s": "எஸ்", "t": "டி",
    "u": "யூ", "v": "வி", "w": "டபிள்யூ",
    "x": "எக்ஸ்", "y": "வை", "z": "ஸெட்"
}

SKIP_KEYS = {
    "_id", "user_id", "shop_id", "city_id", "offer_id",
    "phone_number", "phonenumber", "email", "created_at",
    "uploaded_at", "start_date", "end_date", "photos",
    "pincode", "fee", "percentage"
}


def create_notification(user_id, notif_type: str, title: str, message: str, related_id: str = None):

    try:
        col_notifications.insert_one({
            "user_id": ObjectId(user_id),
            "type": notif_type,
            "title": title,
            "message": message,
            "related_id": str(related_id) if related_id else None,
            "is_read": False,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Notification Error: {e}")


def apply_phonetic_fallback(text: str) -> str:
    if not text: return text
    t_strip = text.strip()
    if len(t_strip) == 1:
        return PHONETIC_MAP.get(t_strip.lower(), text)
    if t_strip.isalpha() and len(t_strip) <= 3:
        return "".join([PHONETIC_MAP.get(char.lower(), char) for char in t_strip])
    return text


def translate_to_en_logic(text: str) -> str:
    if not text or not isinstance(text, str) or text.strip() == "":
        return text
    if text.replace(" ", "").isdigit():
        return text
    cached = get_cached(text)
    if cached: return cached
    try:
        translated = ta_to_en(text)
        if translated:
            set_cache(text, translated)
            return translated
    except:
        pass
    return text


def translate_to_ta_logic(text: str) -> str:
    if not text or not isinstance(text, str) or text.strip() == "":
        return text
    if text.replace(" ", "").isdigit():
        return text
    cached = get_cached(text)
    if cached: return cached
    if len(text) <= 3 and text.isalpha():
        return apply_phonetic_fallback(text)
    try:
        translated = en_to_ta(text)
        if translated and translated.lower() != text.lower():
            set_cache(text, translated)
            return translated
    except:
        pass
    return apply_phonetic_fallback(text)


def translate_response_data(data, lang: str):
    if lang != "ta": return data
    if isinstance(data, list):
        return [translate_response_data(item, lang) for item in data]
    if isinstance(data, dict):
        return {
            k: (v if k in SKIP_KEYS else translate_response_data(v, lang))
            if not isinstance(v, str)
            else (v if k in SKIP_KEYS else translate_to_ta_logic(v))
            for k, v in data.items()
        }
    return data


def hash_password(pwd): return hashlib.sha256(pwd.encode()).hexdigest()


def oid(x): return str(x) if isinstance(x, ObjectId) else x



#        AUTH & PROFILE


@router.post("/register/", operation_id="registerUser")
def register(firstname: str = Form(None), lastname: str = Form(None), email: str = Form(None), phone: str = Form(None),
             password: str = Form(...)):
    if not email and not phone: return {"status": False, "message": "Email or phone number required"}
    email = email.strip().lower() if email else None
    phone = phone.strip() if phone else None
    if email and col_user.find_one({"email": email}, {"_id": 1}): return {"status": False,
                                                                          "message": "Email already exists"}
    if phone and col_user.find_one({"phonenumber": phone}, {"_id": 1}): return {"status": False,
                                                                                "message": "Phone number already exists"}

    user_id = col_user.insert_one({
        "password": hash_password(password), "firstname": firstname, "lastname": lastname,
        "email": email, "phonenumber": phone, "created_at": datetime.utcnow(), "notification_settings": {
            "email": True,
            "push": True
        }
    }).inserted_id
    return {"status": True, "user_id": str(user_id), "message": "Registered successfully"}


@router.post("/login/", operation_id="loginUser")
def login(emailorphone: str = Form(...), password: str = Form(...)):
    identifier = emailorphone.strip().lower()

    user = col_user.find_one({
        "$or": [
            {"email": identifier},
            {"phonenumber": identifier}
        ]
    })

    if not user or hash_password(password) != user["password"]:
        return {
            "status": False,
            "message": "Invalid login credentials"
        }

    u_id = str(user["_id"])

    return {
        "status": True,
        "message": "Login successfully",
        "access_token": create_access_token({"user_id": u_id}),
        "refresh_token": create_refresh_token({"user_id": u_id}),
        "data": {
            "user_id": u_id,
            "firstname": user.get("firstname", ""),
            "lastname": user.get("lastname", ""),
            "profile_image": user.get("profile_image", ""),
            "login_method": "email" if user.get("email") == identifier else "phone",
            "value": identifier
        }
    }


@router.post("/refresh/", operation_id="refreshToken")
def refresh_token_api(data: dict = Body(...)):
    refresh_token = data.get("refresh_token")
    if not refresh_token: raise HTTPException(status_code=401, detail="Refresh token missing")
    user_id = verify_refresh_token(refresh_token)
    return {"status": True, "access_token": create_access_token({"user_id": user_id})}


UPLOAD_DIR = "media/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/profile/upload/image/")
def upload_profile_image(
        file: UploadFile = File(...),
        user_id: str = Depends(verify_token)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    user = col_user.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_image = user.get("profile_image")
    if old_image and os.path.exists(old_image):
        try:
            os.remove(old_image)
        except Exception:
            pass

    ext = file.filename.split(".")[-1].lower()
    filename = f"{user_id}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    col_user.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile_image": path}}
    )

    return {"success": True, "profile_image": path}


#SEARCH APIs

@router.get("/category/search/", operation_id="searchCategory")
def search_category(category: str = Query(""), lang: str = Query("en")):
    search_term = translate_to_en_logic(category) if lang == "ta" else category
    data = list(col_category.find({"name": {"$regex": search_term, "$options": "i"}}))
    results = []
    for item in data:
        item_data = {**item, "_id": oid(item["_id"])}
        if lang == "ta": item_data["name"] = translate_to_ta_logic(item_data.get("name", ""))
        results.append(item_data)
    msg = translate_to_ta_logic("category searched successfully") if lang == "ta" else "category searched successfully"
    return {"status": "success", "message": msg, "data": results}


@router.get("/city/search/", operation_id="searchCity")
def search_city(city_name: str = Query(""), lang: str = Query("en")):
    search_term = translate_to_en_logic(city_name) if lang == "ta" else city_name
    data = list(col_city.find({"city_name": {"$regex": search_term, "$options": "i"}}).limit(20))
    results = []
    for item in data:
        item_data = {**item, "_id": oid(item["_id"])}
        if lang == "ta":
            item_data["city_name"] = translate_to_ta_logic(item_data.get("city_name", ""))
            item_data["district"] = translate_to_ta_logic(item_data.get("district", ""))
            item_data["state"] = translate_to_ta_logic(item_data.get("state", ""))
        results.append(item_data)
    msg = translate_to_ta_logic("city searched successfully") if lang == "ta" else "city searched successfully"
    return {"status": "success", "message": msg, "data": results}



#        SHOP MODULE

MEDIA_BASE = "media/shop"


@router.post("/shop/add/", operation_id="addShop")
def add_shop(
        background_tasks: BackgroundTasks,  # <--- REQUIRED FOR ASYNC EMAIL
        user_id: str = Depends(verify_token),
        shop_name: str = Form(...),
        description: str = Form(...),
        address: str = Form(...),
        phone_number: str = Form(...),
        email: str = Form(...),
        landmark: str = Form(...),
        category_list: str = Form(...),
        city_id: str = Form(...),
        media: list[UploadFile] = File(None),
        main_image: UploadFile = File(None),
        keywords: str = Form(...),
        lang: str = Query("en")
):
    # 1. LIMIT CHECK
    try:
        check_shop_limit(user_id)
    except HTTPException as e:
        msg = e.detail
        return {"status": "error", "message": en_to_ta(msg) if lang == "ta" else msg}

    # 2. TRANSLATION & VALIDATION
    if lang == "ta":
        shop_name = ta_to_en(shop_name)
        description = ta_to_en(description)
        address = ta_to_en(address)
        landmark = ta_to_en(landmark)
        keywords = ta_to_en(keywords)

    try:
        city_oid = ObjectId(city_id)
    except:
        return {"status": "error", "message": "Invalid city ID"}

    if not col_city.find_one({"_id": city_oid}, {"_id": 1}):
        return {"status": "error", "message": "City not found"}

    cat_ids = []
    for raw in category_list.split(","):
        name = raw.strip()
        if not name: continue
        db_name = ta_to_en(name) if lang == "ta" else name
        cat = col_category.find_one({"name": {"$regex": f"^{db_name}$", "$options": "i"}}, {"_id": 1})
        if not cat: return {"status": "error", "message": f"Category '{name}' not found"}
        cat_ids.append(str(cat["_id"]))

    # 3. INSERT SHOP
    inserted = col_shop.insert_one({
        "shop_name": shop_name,
        "description": description,
        "address": address,
        "phone_number": phone_number,
        "email": email,
        "landmark": landmark,
        "category": cat_ids,
        "city_id": str(city_oid),
        "media": [],
        "main_image": None,
        "keywords": [k.strip() for k in keywords.split(",") if k.strip()],
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "status": "pending"
    })
    shop_id = str(inserted.inserted_id)

    # 4. HANDLE IMAGES
    update_data = {}
    if main_image:
        main_dir = os.path.join(MEDIA_BASE, shop_id, "main")
        os.makedirs(main_dir, exist_ok=True)
        ext = main_image.filename.split(".")[-1]
        fname = f"{uuid.uuid4()}.{ext}"
        full_path = os.path.join(main_dir, fname)
        with open(full_path, "wb") as f:
            f.write(main_image.file.read())
        update_data["main_image"] = f"{MEDIA_BASE}/{shop_id}/main/{fname}"

    media_items = []
    if media:
        img_dir = os.path.join(MEDIA_BASE, shop_id, "images")
        os.makedirs(img_dir, exist_ok=True)
        for f in media:
            if not f.content_type.startswith("image"): continue
            ext = f.filename.split(".")[-1]
            fname = f"{uuid.uuid4()}.{ext}"
            full_path = os.path.join(img_dir, fname)
            with open(full_path, "wb") as img:
                img.write(f.file.read())
            media_items.append({"type": "image", "path": f"{MEDIA_BASE}/{shop_id}/images/{fname}"})

    if media_items: update_data["media"] = media_items
    if update_data: col_shop.update_one({"_id": ObjectId(shop_id)}, {"$set": update_data})

    # 5. CREATE NOTIFICATION
    create_notification(
        user_id=user_id,
        notif_type="shop_created",
        title="Shop Created",
        message=f"Your shop '{shop_name}' has been created and is pending approval.",
        related_id=shop_id
    )

    # 6. SEND ADMIN EMAIL (BACKGROUND TASK)
    def send_admin_email_task():
        approve_link = f"http://127.0.0.1:8000/admin/approve?shop_id={shop_id}"
        subject = f"New Shop Approval Request: {shop_name}"

        # HTML BODY WITH APPROVE BUTTON
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50; text-align: center;">New Shop Approval Needed</h2>
                <hr style="border: 0; border-top: 1px solid #eee;">

                <p><strong>Shop Name:</strong> {shop_name}</p>
                <p><strong>Owner Email:</strong> {email}</p>
                <p><strong>Phone:</strong> {phone_number}</p>
                <p><strong>Location:</strong> {address}</p>

                <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
                    <a href="{approve_link}" 
                       style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                       ✅ APPROVE SHOP
                    </a>
                </div>

                <p style="font-size: 12px; color: #888; text-align: center;">
                    If the button doesn't work, copy this link:<br>
                    {approve_link}
                </p>
            </div>
        </body>
        </html>
        """
        try:
            # Change to your Admin Email
            send_email("sakthibala2705@gmail.com", subject, body)
            print("DEBUG: Admin email task finished.")
        except Exception as e:
            print(f"DEBUG: Email sending error: {e}")

    background_tasks.add_task(send_admin_email_task)

    msg = "Shop submitted. Waiting for admin approval."
    return {
        "status": "success",
        "shop_id": shop_id,
        "message": en_to_ta(msg) if lang == "ta" else msg
    }


@router.post("/shop/update/{shop_id}/", operation_id="updateShop")
def update_shop(
        user_id: str = Depends(verify_token),
        shop_id: str = "",
        shop_name: str = Form(None),
        description: str = Form(None),
        address: str = Form(None),
        phone_number: str = Form(None),
        email: str = Form(None),
        landmark: str = Form(None),
        category_list: str = Form(None),
        city_id: str = Form(None),
        keywords: str = Form(None),
        media: list[UploadFile] = File(None),
        main_image: UploadFile = File(None),
        delete_media: str = Form(None),
        lang: str = Query("en")
):
    try:
        soid = ObjectId(shop_id)
    except:
        return {"status": "error", "message": "Invalid shop id"}

    shop = col_shop.find_one({"_id": soid})
    if not shop:
        return {"status": "error", "message": "Shop not found"}

    update = {}
    if shop_name: update["shop_name"] = ta_to_en(shop_name) if lang == "ta" else shop_name
    if description: update["description"] = ta_to_en(description) if lang == "ta" else description
    if address: update["address"] = ta_to_en(address) if lang == "ta" else address
    if phone_number: update["phone_number"] = phone_number
    if email: update["email"] = email
    if landmark: update["landmark"] = ta_to_en(landmark) if lang == "ta" else landmark

    if keywords:
        k = ta_to_en(keywords) if lang == "ta" else keywords
        update["keywords"] = [i.strip() for i in k.split(",") if i.strip()]

    if main_image:
        img_dir = os.path.join(MEDIA_BASE, shop_id, "main")
        os.makedirs(img_dir, exist_ok=True)
        old = shop.get("main_image")
        if old:
            try:
                os.remove(old)
            except:
                pass
        ext = main_image.filename.split(".")[-1]
        fname = f"{uuid.uuid4()}.{ext}"
        full_path = os.path.join(img_dir, fname)
        with open(full_path, "wb") as f:
            f.write(main_image.file.read())
        update["main_image"] = f"{MEDIA_BASE}/{shop_id}/main/{fname}"

    if delete_media:
        delete_paths = [p.strip() for p in delete_media.split(",") if p.strip()]
        remaining = []
        for m in shop.get("media", []):
            if m["path"] in delete_paths:
                try:
                    os.remove(m["path"])
                except:
                    pass
            else:
                remaining.append(m)
        update["media"] = remaining

    if media:
        img_dir = os.path.join(MEDIA_BASE, shop_id, "images")
        vid_dir = os.path.join(MEDIA_BASE, shop_id, "videos")
        os.makedirs(img_dir, exist_ok=True)
        os.makedirs(vid_dir, exist_ok=True)
        current = update.get("media", shop.get("media", []))
        for f in media:
            ext = f.filename.split(".")[-1]
            fname = f"{uuid.uuid4()}.{ext}"
            if f.content_type.startswith("image"):
                full = os.path.join(img_dir, fname)
                dbp = f"{MEDIA_BASE}/{shop_id}/images/{fname}"
                typ = "image"
            elif f.content_type.startswith("video"):
                full = os.path.join(vid_dir, fname)
                dbp = f"{MEDIA_BASE}/{shop_id}/videos/{fname}"
                typ = "video"
            else:
                continue
            with open(full, "wb") as file:
                file.write(f.file.read())
            current.append({"type": typ, "path": dbp})
        update["media"] = current

    if update:
        col_shop.update_one({"_id": soid}, {"$set": update})
        create_notification(user_id, "shop_updated", "Shop Updated", f"Shop '{shop.get('shop_name')}' updated.",
                            shop_id)

    return {"status": "success", "message": "Shop updated successfully"}


@router.delete("/shop/delete/{shop_id}/", operation_id="deleteShop")
def delete_shop(shop_id: str, user_id: str = Depends(verify_token), lang: str = Query("en")):
    try:
        res = col_shop.delete_one({"_id": ObjectId(shop_id)})
        if res.deleted_count == 0: return {"status": "error", "message": "Shop not found"}
        create_notification(user_id, "shop_deleted", "Shop Deleted", "Shop deleted successfully.", None)
        msg = "Shop deleted successfully"
        return {"status": "success", "message": translate_to_ta_logic(msg) if lang == "ta" else msg}
    except:
        return {"status": "error", "message": "Invalid ID"}


# GET MY SHOP (ROBUST & FIXED)
@router.get("/myshop/", operation_id="getMyShop")
def get_my_shop(
        user_id: str = Depends(verify_token),
        lang: str = Query("en")
):
    try:
        # Search for BOTH String and ObjectId to be safe
        user_queries = [{"user_id": user_id}, {"user_id": ObjectId(user_id)}]
    except:
        user_queries = [{"user_id": user_id}]

    shops = list(col_shop.find({"$or": user_queries}))
    final = []

    for s in shops:
        s_clean = safe(s)
        shop_id_str = s_clean["_id"]
        shop_oid = s["_id"]

        categories = []
        cat_list = s.get("category", [])
        if isinstance(cat_list, str): cat_list = cat_list.split(",")
        for cid in cat_list:
            try:
                cid_str = str(cid).strip()
                if len(cid_str) == 24:
                    cat = col_category.find_one({"_id": ObjectId(cid_str)})
                    if cat: categories.append(safe(cat))
            except:
                continue

        city_doc = None
        city_id = s.get("city_id")
        if city_id:
            try:
                c_oid = ObjectId(city_id) if ObjectId.is_valid(str(city_id)) else city_id
                city = col_city.find_one({"_id": c_oid})
                if city: city_doc = safe(city)
            except:
                pass

        offers = []
        offer_query = {"$or": [{"shop_id": shop_id_str}, {"shop_id": shop_oid}]}
        offer_docs = list(col_offers.find(offer_query))
        for doc in offer_docs:
            for o in doc.get("offers", []):
                offers.append(safe(o))

        final.append({
            "shop": {**s_clean, "main_image": s_clean.get("main_image"), "media": s_clean.get("media", [])},
            "categories": categories,
            "city": city_doc,
            "offers": offers
        })

    return {
        "status": "success",
        "message": translate_to_ta_logic("shop get successfully") if lang == "ta" else "shop get successfully",
        "data": translate_response_data(safe(final), lang)
    }


# ==========================================
#        OFFER MODULE
# ==========================================

@router.post("/offer/add/", operation_id="addOffer")
async def add_offer_api(
        background_tasks: BackgroundTasks,  # <--- REQUIRED
        user_id: str = Depends(verify_token),
        target_shop_id: str = Form(...),
        title: str = Form(""),
        fee: str = Form(""),
        start_date: str = Form(""),
        end_date: str = Form(""),
        percentage: str = Form(""),
        description: str = Form(""),
        file: UploadFile = File(...),
        lang: str = Query("en")
):
    try:
        check_offer_limit(user_id)
    except HTTPException as e:
        return {"status": False, "message": translate_to_ta_logic(e.detail) if lang == "ta" else e.detail}

    if lang == "ta":
        title = translate_to_en_logic(title)
        description = translate_to_en_logic(description)

    u_oid = ObjectId(user_id)
    shop_ids = [str(s["_id"]) for s in col_shop.find({"user_id": u_oid}, {"_id": 1})] if target_shop_id == "ALL" else [
        target_shop_id]
    if not shop_ids: return {"status": False, "message": "No shops found"}

    if file.content_type.startswith("image"):
        media_type, folder = "image", "images"
    elif file.content_type.startswith("video"):
        media_type, folder = "video", "videos"
    else:
        return {"status": False, "message": "Invalid file type"}

    offer_id = str(ObjectId())
    file_content = await file.read()

    for shop_id in shop_ids:
        save_dir = os.path.join(MEDIA_BASE, shop_id, "offers", folder)
        os.makedirs(save_dir, exist_ok=True)
        ext = file.filename.split(".")[-1]
        filename = f"{offer_id}.{ext}"
        full_path = os.path.join(save_dir, filename)
        with open(full_path, "wb") as f:
            f.write(file_content)

        offer_obj = {
            "offer_id": offer_id,
            "media_type": media_type,
            "media_path": f"{MEDIA_BASE}/{shop_id}/offers/{folder}/{filename}",
            "filename": filename,
            "title": title, "fee": fee, "start_date": start_date, "end_date": end_date,
            "percentage": percentage, "description": description,
            "uploaded_at": datetime.utcnow(), "status": "pending"
        }

        if col_offers.find_one({"shop_id": shop_id}, {"_id": 1}):
            col_offers.update_one({"shop_id": shop_id}, {"$push": {"offers": offer_obj}})
        else:
            col_offers.insert_one({"shop_id": shop_id, "user_id": user_id, "offers": [offer_obj], "status": "pending",
                                   "created_at": datetime.utcnow()})

    create_notification(user_id, "offer_created", "Offer Created", f"Offer '{title}' added.", offer_id)

    # EMAIL IN BACKGROUND
    background_tasks.add_task(send_email, "sakthibala2705@gmail.com", "New Offer", f"New offer '{title}' added.")

    return {"status": True, "message": translate_to_ta_logic(
        "Offer added successfully") if lang == "ta" else "Offer added successfully"}


@router.post("/offer/update/", operation_id="updateOffer")
async def update_offer_api(
        user_id: str = Depends(verify_token),
        offer_id: str = Form(...),
        shop_id: str = Form(...),
        title: str = Form(""),
        fee: str = Form(""),
        start_date: str = Form(""),
        end_date: str = Form(""),
        percentage: str = Form(""),
        description: str = Form(""),
        file: UploadFile = File(None),
        lang: str = Query("en")
):
    if lang == "ta":
        title = translate_to_en_logic(title)
        description = translate_to_en_logic(description)

    doc = col_offers.find_one({"shop_id": shop_id})
    if not doc: return {"status": False, "message": "Offer not found"}
    offers = doc.get("offers", [])
    target = next((o for o in offers if o["offer_id"] == offer_id), None)
    if not target: return {"status": False, "message": "Offer not found"}

    target.update({"title": title, "fee": fee, "start_date": start_date, "end_date": end_date, "percentage": percentage,
                   "description": description})

    if file:
        old_path = target.get("media_path")
        if old_path and os.path.exists(old_path):
            try:
                os.remove(old_path)
            except:
                pass
        if file.content_type.startswith("image"):
            folder, media_type = "images", "image"
        elif file.content_type.startswith("video"):
            folder, media_type = "videos", "video"
        else:
            return {"status": False, "message": "Invalid file type"}

        ext = file.filename.split(".")[-1]
        filename = f"{offer_id}.{ext}"
        save_dir = os.path.join(MEDIA_BASE, shop_id, "offers", folder)
        os.makedirs(save_dir, exist_ok=True)
        with open(os.path.join(save_dir, filename), "wb") as f:
            f.write(await file.read())

        target.update({
            "media_type": media_type,
            "media_path": f"{MEDIA_BASE}/{shop_id}/offers/{folder}/{filename}",
            "filename": filename,
            "uploaded_at": datetime.utcnow()
        })

    col_offers.update_one({"shop_id": shop_id}, {"$set": {"offers": offers}})
    create_notification(user_id, "offer_updated", "Offer Updated", f"Offer '{title}' updated.", offer_id)

    return {"status": True, "message": translate_to_ta_logic(
        "Offer updated successfully") if lang == "ta" else "Offer updated successfully"}


@router.delete("/delete/offer/", operation_id="deleteOffer")
def delete_offer(user_id: str = Depends(verify_token), offer_id: str = Query(...), lang: str = Query("en")):
    try:
        if col_offers.delete_one({"_id": ObjectId(offer_id)}).deleted_count > 0:
            create_notification(user_id, "offer_deleted", "Offer Deleted", "Offer removed.", None)
            return {"status": "success",
                    "message": translate_to_ta_logic("Offer removed") if lang == "ta" else "Offer removed"}
    except:
        pass

    doc = col_offers.find_one({"offers.offer_id": offer_id}, {"_id": 1})
    if doc:
        col_offers.update_one({"_id": doc["_id"]}, {"$pull": {"offers": {"offer_id": offer_id}}})
        create_notification(user_id, "offer_deleted", "Offer Deleted", "Offer removed.", None)
        return {"status": "success",
                "message": translate_to_ta_logic("Offer removed") if lang == "ta" else "Offer removed"}
    return {"status": "error", "message": "Offer not found"}


# ==========================================
#        JOB MODULE
# ==========================================

@router.post("/job/add/", operation_id="addJob")
def add_job(
        user_id: str = Depends(verify_token),
        job_title: str = Form(...),
        job_description: str = Form(...),
        salary: int = Form(...),
        shop_name: str = Form(...),
        phone_number: str = Form(...),
        email: str = Form(...),
        address: str = Form(...),
        work_start_time: str = Form(...),
        work_end_time: str = Form(...),
        city_id: str = Form(...),
        lang: str = Query("en")
):
    try:
        city_oid = ObjectId(city_id)
        city = col_city.find_one({"_id": city_oid})
        if not city: raise HTTPException(status_code=404, detail="City not found")
        u_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid data")

    if lang == "ta":
        job_title = translate_to_en_logic(job_title)
        job_description = translate_to_en_logic(job_description)
        shop_name = translate_to_en_logic(shop_name)
        address = translate_to_en_logic(address)
        work_start_time = translate_to_en_logic(work_start_time)
        work_end_time = translate_to_en_logic(work_end_time)

    job_insert = col_jobs.insert_one({
        "user_id": u_oid, "job_title": job_title, "job_description": job_description, "salary": salary,
        "shop_name": shop_name, "phone_number": phone_number, "email": email, "address": address,
        "work_start_time": work_start_time, "work_end_time": work_end_time,
        "city_id": city_oid, "city_name": translate_to_en_logic(city.get("city_name")),
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
    })

    create_notification(u_oid, "job_created", "Job Posted", f"Job '{job_title}' posted.", job_insert.inserted_id)
    msg = "Job added successfully"
    return {"status": True, "message": translate_to_ta_logic(msg) if lang == "ta" else msg}


@router.post("/job/update/{job_id}/", operation_id="updateJob")
def update_job(
        job_id: str,
        user_id: str = Depends(verify_token),
        job_title: str = Form(None),
        job_description: str = Form(None),
        salary: int = Form(None),
        shop_name: str = Form(None),
        phone_number: str = Form(None),
        email: str = Form(None),
        address: str = Form(None),
        work_start_time: str = Form(None),
        work_end_time: str = Form(None),
        city_id: str = Form(None),
        lang: str = Query("en")
):
    try:
        j_oid, u_oid = ObjectId(job_id), ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    job = col_jobs.find_one({"_id": j_oid, "user_id": u_oid})
    if not job: raise HTTPException(status_code=404, detail="Job not found")

    update = {}
    if job_title: update["job_title"] = translate_to_en_logic(job_title) if lang == "ta" else job_title
    if job_description: update["job_description"] = translate_to_en_logic(
        job_description) if lang == "ta" else job_description
    if salary is not None: update["salary"] = salary
    if shop_name: update["shop_name"] = translate_to_en_logic(shop_name) if lang == "ta" else shop_name
    if phone_number: update["phone_number"] = phone_number
    if email: update["email"] = email
    if address: update["address"] = translate_to_en_logic(address) if lang == "ta" else address
    if work_start_time: update["work_start_time"] = translate_to_en_logic(
        work_start_time) if lang == "ta" else work_start_time
    if work_end_time: update["work_end_time"] = translate_to_en_logic(work_end_time) if lang == "ta" else work_end_time

    if city_id:
        try:
            c_oid = ObjectId(city_id)
            city = col_city.find_one({"_id": c_oid})
            if city:
                update["city_id"] = c_oid
                update["city_name"] = translate_to_en_logic(city.get("city_name"))
        except:
            pass

    update["updated_at"] = datetime.utcnow()
    col_jobs.update_one({"_id": j_oid}, {"$set": update})
    create_notification(u_oid, "job_updated", "Job Updated", "Job details updated.", job_id)

    return {"status": True, "message": translate_to_ta_logic(
        "Job updated successfully") if lang == "ta" else "Job updated successfully"}


@router.delete("/job/delete/{job_id}/", operation_id="deleteJob")
def delete_job(job_id: str, user_id: str = Depends(verify_token), lang: str = Query("en")):
    try:
        j_oid, u_oid = ObjectId(job_id), ObjectId(user_id)
        if col_jobs.delete_one({"_id": j_oid, "user_id": u_oid}).deleted_count > 0:
            create_notification(u_oid, "job_deleted", "Job Deleted", "Job removed.", None)
            return {"status": True, "message": translate_to_ta_logic(
                "Job deleted successfully") if lang == "ta" else "Job deleted successfully"}
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")


@router.get("/my/jobs/", operation_id="getMyJobs")
def get_my_jobs(user_id: str = Depends(verify_token), lang: str = Query("en")):
    try:
        u_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user id")

    jobs = list(col_jobs.find({"user_id": u_oid}).sort("created_at", -1))
    return {
        "status": True,
        "message": translate_to_ta_logic("Jobs fetched successfully") if lang == "ta" else "Jobs fetched successfully",
        "data": translate_response_data(safe(jobs), lang)
    }


# ==========================================
#        NOTIFICATIONS & PASSWORD
# ==========================================

@router.get("/notifications/", operation_id="getNotifications")
def get_notifications(user_id: str = Depends(verify_token), lang: str = Query("en")):
    try:
        u_oid = ObjectId(user_id)
    except:
        return {"status": False, "message": "Invalid user"}
    notifs = list(col_notifications.find({"user_id": u_oid}).sort("created_at", -1).limit(20))
    return {"status": True, "data": translate_response_data(safe(notifs), lang)}


@router.delete("/notification/delete/{notif_id}/", operation_id="deleteNotification")
def delete_notification(notif_id: str, user_id: str = Depends(verify_token), lang: str = Query("en")):
    try:
        if col_notifications.delete_one({"_id": ObjectId(notif_id), "user_id": ObjectId(user_id)}).deleted_count > 0:
            return {"status": True, "message": "Deleted successfully"}
        return {"status": False, "message": "Notification not found"}
    except:
        return {"status": False, "message": "Invalid ID"}


class ChangePasswordBody(BaseModel):
    old_password: str
    new_password: str


@router.post("/user/change-password/", operation_id="changePassword")
def change_password(data: ChangePasswordBody, user_id: str = Depends(verify_token)):
    try:
        u_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = col_user.find_one({"_id": u_oid})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if hash_password(data.old_password) != user.get("password"):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    col_user.update_one({"_id": u_oid}, {"$set": {"password": hash_password(data.new_password)}})
    return {"status": True, "message": "Password changed successfully"}

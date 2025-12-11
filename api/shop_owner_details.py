from fastapi import APIRouter, Form, UploadFile, File, Query, Depends, Body
from bson import ObjectId
from datetime import datetime
import hashlib, base64

from api.common_db_url import db
from api.email_sender import send_email
from api.auth_jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_refresh_token,
)

router = APIRouter()

col_user = db["user"]
col_shop = db["shop"]
col_city = db["city"]
col_category = db["category"]
col_offers = db["offers"]



# PASSWORD HASH
def hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()


def oid(x):
    return str(x) if isinstance(x, ObjectId) else x


# REGISTER
@router.post("/register/", operation_id="registerUser")
def register(
    firstname: str | None = Form(None),
    lastname: str | None = Form(None),
    email: str | None = Form(None),
    phone: str | None = Form(None),
    password: str = Form(...)
):
    if not email and not phone:
        return {"status": False, "message": "Email or phone number required"}

    if email:
        email = email.strip().lower()
    if phone:
        phone = phone.strip()

    if email and col_user.find_one({"email": email}):
        return {"status": False, "message": "Email already exists"}

    if phone and col_user.find_one({"phonenumber": phone}):
        return {"status": False, "message": "Phone number already exists"}

    hashed_pwd = hash_password(password)

    user_data = {
        "password": hashed_pwd,
        "firstname": firstname,
        "lastname": lastname,
        "created_at": datetime.utcnow()
    }

    if email:
        user_data["email"] = email
    if phone:
        user_data["phonenumber"] = phone

    user_id = col_user.insert_one(user_data).inserted_id

    return {
        "status": True,
        "user_id": str(user_id),
        "message": "Registered successfully"
    }


# LOGIN returns access + refresh token
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
        return {"status": False, "message": "Invalid login credentials"}

    user_id_str = str(user["_id"])

    # Generate tokens
    access_token = create_access_token({"user_id": user_id_str})
    refresh_token = create_refresh_token({"user_id": user_id_str})

    # Fetch user shops (public call)
    result = get_user_shops(user_id_str)
    shops = result.get("data", [])

    return {
        "status": True,
        "message": "Login successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "data": {
            "user_id": user_id_str,
            "email": user.get("email"),
            "phonenumber": user.get("phonenumber"),
            
        }
    }


# REFRESH TOKEN = returns new access token
@router.post("/refresh/", operation_id="refreshToken")
def refresh_token(refresh_token: str = Body(...)):
    user_id = verify_refresh_token(refresh_token)
    new_access_token = create_access_token({"user_id": user_id})
    return {
        "status": True,
        "access_token": new_access_token,
        "token_type": "bearer",
        "access_expires_in": 3600
    }


# CATEGORY SEARCH
@router.get("/category/search/", operation_id="searchCategory")
def search_category(category: str = Query("")):
    data = list(col_category.find(
        {"name": {"$regex": category, "$options": "i"}}
    ))
    return {
        "status": "success",
        "message": "category searched successfully",
        "data": [{**item, "_id": oid(item["_id"])} for item in data]
    }


# CITY SEARCH
@router.get("/city/search/", operation_id="searchCity")
def search_city(city_name: str = Query("")):
    data = list(col_city.find(
        {"city_name": {"$regex": city_name, "$options": "i"}}
    ).limit(20))
    return {
        "status": "success",
        "message": "city searched successfully",
        "data": [{**item, "_id": oid(item["_id"])} for item in data]
    }

# ADD SHOP
@router.post("/shop/add/", operation_id="addShop")
def add_shop(
    user_id: str = Depends(verify_token),
    shop_name: str = Form(...),
    description: str = Form(...),
    address: str = Form(...),
    phone_number: str = Form(...),
    email: str = Form(...),
    landmark: str = Form(...),
    category_list: str = Form(...),
    city_name: str = Form(...),
    district: str = Form(...),
    pincode: str = Form(...),
    state: str = Form(...),
    photos: list[UploadFile] = File(None),
    keywords: str = Form(...)
):
    try:
        u_oid = ObjectId(user_id)
    except:
        return {"status": "error", "message": "Invalid user id"}

    # City create or find
    city_data = {
        "city_name": city_name,
        "district": district,
        "pincode": pincode,
        "state": state
    }
    existing_city = col_city.find_one(city_data)
    city_id = existing_city["_id"] if existing_city else col_city.insert_one(city_data).inserted_id

    # Category IDs
    cat_ids = []
    for name in category_list.split(","):
        cat = col_category.find_one({"name": name.strip()})
        if not cat:
            return {"status": "error", "message": f"Category '{name}' not found"}
        cat_ids.append(str(cat["_id"]))

    # Photos → base64 encoding
    photos_b64 = []
    if photos:
        for f in photos:
            photos_b64.append(base64.b64encode(f.file.read()).decode())

    # Insert shop
    inserted = col_shop.insert_one({
        "shop_name": shop_name,
        "description": description,
        "address": address,
        "phone_number": phone_number,
        "email": email,
        "landmark": landmark,
        "category": cat_ids,
        "city_id": str(city_id),
        "photos": photos_b64,
        "keywords": [k.strip() for k in keywords.split(",")],
        "user_id": u_oid,
        "created_at": datetime.utcnow(),
        "status": "pending"
    })

    pending_id = str(inserted.inserted_id)

    # Admin email notify
    admin_email = "sakthibala2705@gmail.com"
    subject = "New Shop Approval Request"

    approve_link = f"http://127.0.0.1:8000/admin?shop_id={pending_id}"

    body = f"""
    <h2>New Shop Pending Approval</h2>
    <p><b>Shop Name:</b> {shop_name}</p>
    <p><b>Owner Email:</b> {email}</p>
    <p><b>Phone Number:</b> {phone_number}</p>
    <p>
        <a href="{approve_link}" style="padding:10px 18px; background:#28a745; color:white; text-decoration:none; border-radius:6px;">
            APPROVE SHOP
        </a>
    </p>
    """

    try:
        send_email(admin_email, subject, body)
    except:
        pass

    return {"status": "success", "message": "Shop submitted. Waiting for admin approval."}



# UPDATE SHOP
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
    city_name: str = Form(None),
    district: str = Form(None),
    pincode: str = Form(None),
    state: str = Form(None),
    keywords: str = Form(None),
    photos: list[UploadFile] = File(None)
):
    try:
        soid = ObjectId(shop_id)
    except:
        return {"status": "error", "message": "Invalid shop id"}

    update = {}

    if shop_name: update["shop_name"] = shop_name
    if description: update["description"] = description
    if address: update["address"] = address
    if phone_number: update["phone_number"] = phone_number
    if email: update["email"] = email
    if landmark: update["landmark"] = landmark

    # Update category list
    if category_list:
        new_ids = []
        for name in category_list.split(","):
            cat = col_category.find_one({"name": name.strip()})
            if not cat:
                return {"status": "error", "message": f"Category '{name}' not found"}
            new_ids.append(str(cat["_id"]))
        update["category"] = new_ids

    # Update city
    if city_name:
        city_data = {
            "city_name": city_name,
            "district": district,
            "pincode": pincode,
            "state": state
        }
        existing_city = col_city.find_one(city_data)
        city_id = existing_city["_id"] if existing_city else col_city.insert_one(city_data).inserted_id
        update["city_id"] = str(city_id)

    # Update keywords
    if keywords:
        update["keywords"] = [k.strip() for k in keywords.split(",") if k.strip()]

    # Update photos
    if photos:
        old_photos = col_shop.find_one({"_id": soid}).get("photos", [])
        new_photos = [base64.b64encode(f.file.read()).decode() for f in photos]
        update["photos"] = old_photos + new_photos

    col_shop.update_one({"_id": soid}, {"$set": update})
    return {"status": "success", "message": "Shop updated successfully"}

# DELETE SHOP
@router.delete("/shop/delete/{shop_id}/", operation_id="deleteShop")
def delete_shop(shop_id: str, user_id: str = Depends(verify_token)):
    try:
        soid = ObjectId(shop_id)
    except:
        return {"status": "error", "message": "Invalid shop id"}

    res = col_shop.delete_one({"_id": soid})

    if res.deleted_count == 0:
        return {"status": "error", "message": "Shop not found"}

    return {"status": "success", "message": "Shop deleted successfully"}


# MY SHOPS
@router.get("/myshop/", operation_id="getUserShops")
def get_user_shops(user_id: str = Depends(verify_token)):
    try:
        uid = ObjectId(user_id)
    except:
        return {"status": "error", "message": "Invalid user ID"}

    shops = list(col_shop.find({"user_id": uid}))
    final = []

    for s in shops:
        s_clean = {k: oid(v) for k, v in s.items()}

        # Categories
        categories = []
        for cid in s.get("category", []):
            cat = col_category.find_one({"_id": ObjectId(cid)})
            if cat:
                categories.append({k: oid(v) for k, v in cat.items()})

        # City
        city_doc = None
        if s.get("city_id"):
            c = col_city.find_one({"_id": ObjectId(s["city_id"])})
            if c:
                city_doc = {k: oid(v) for k, v in c.items()}

        # Offers
        offers_b64, offer_types, offer_ids = [], [], []
        offer_docs = list(col_offers.find({"shop_id": s_clean["_id"]}))

        for od in offer_docs:
            top = od.get("file_b64") or od.get("file_base64")
            if top:
                offers_b64.append(top)
                offer_types.append(od.get("file_type", "image"))
                offer_ids.append(oid(od["_id"]))

            nested = od.get("offers", [])
            for o in nested:
                fb = o.get("file_base64") or o.get("file_b64")
                if fb:
                    offers_b64.append(fb)
                    offer_types.append(o.get("file_type", "image"))
                    offer_ids.append(o.get("offer_id") or oid(od["_id"]))

        final.append({
            "shop": s_clean,
            "categories": categories,
            "city": city_doc,
            "offers": offers_b64,
            "offer_types": offer_types,
            "offer_ids": offer_ids
        })

    return {"status": "success","message": "shop get successfully", "data": final}
# ADD OFFER
@router.post("/offer/add/", operation_id="addOffer")
async def add_offer_api(
    user_id: str = Depends(verify_token),
    target_shop_id: str = Form(...),
    title: str = Form(""),
    fee: str = Form(""),
    start_date: str = Form(""),
    end_date: str = Form(""),
    percentage: str = Form(""),
    description: str = Form(""),
    file: UploadFile = File(...)
):
    try:
        u_oid = ObjectId(user_id)
    except:
        return {"status": False, "message": "Invalid user ID"}

    # If ALL add offer to every shop
    if target_shop_id == "ALL":
        shops = list(col_shop.find({"user_id": u_oid}))
        if not shops:
            return {"status": False, "message": "No shops found"}
        shop_ids = [str(s["_id"]) for s in shops]
    else:
        shop_ids = [target_shop_id]

    # Read file
    file_bytes = file.file.read()
    if not file_bytes:
        return {"status": False, "message": "Empty file"}

    file_b64 = base64.b64encode(file_bytes).decode()
    ftype = "video" if file.content_type.lower().startswith("video") else "image"

    offer_obj = {
        "offer_id": str(ObjectId()),
        "file_base64": file_b64,
        "file_type": ftype,
        "filename": file.filename,
        "uploaded_at": datetime.utcnow(),
        "status": "pending",
        "title": title,
        "fee": fee,
        "start_date": start_date,
        "end_date": end_date,
        "percentage": percentage,
        "description": description
    }

    # Save offer to DB
    for sid in shop_ids:
        exist = col_offers.find_one({"shop_id": sid})
        if exist:
            col_offers.update_one(
                {"shop_id": sid},
                {"$push": {"offers": offer_obj}}
            )
        else:
            col_offers.insert_one({
                "shop_id": sid,
                "user_id": user_id,
                "offers": [offer_obj],
                "status": "pending",
                "approved_at": None,
                "created_at": datetime.utcnow()
            })

    # Email notify
    try:
        user = col_user.find_one({"_id": u_oid})
        user_email = user.get("email", "Not Provided")
        user_phone = user.get("phonenumber", "Not Provided")

        shop_names = []
        for sid in shop_ids:
            shop_doc = col_shop.find_one({"_id": ObjectId(sid)})
            if shop_doc:
                shop_names.append(shop_doc.get("shop_name", "Unknown Shop"))

        shop_list_str = ", ".join(shop_names)

        admin_email = "sakthibala2705@gmail.com"
        subject = "New Offer Added – Approval Required"

        body = f"""
        <h2>New Offer Submitted</h2>

        <p><b>Submitted By:</b> {user_email} ({user_phone})</p>
        <p><b>Target Shops:</b> {shop_list_str}</p>

        <h3>Offer Details</h3>
        <ul>
            <li><b>Title:</b> {title}</li>
            <li><b>Fee:</b> {fee}</li>
            <li><b>Percentage:</b> {percentage}</li>
            <li><b>Start Date:</b> {start_date}</li>
            <li><b>End Date:</b> {end_date}</li>
            <li><b>Description:</b> {description}</li>
        </ul>

        <p><b>Status:</b> Pending Approval</p>
        """

        send_email(admin_email, subject, body)

    except Exception as e:
        print("MAIL ERROR:", e)

    return {"status": True, "message": "Offer added successfully"}


# UPDATE OFFER
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
    file: UploadFile = File(None)
):
    offer_doc = col_offers.find_one({"shop_id": shop_id})
    if not offer_doc:
        return {"status": False, "message": "No offers found for this shop"}

    offers = offer_doc.get("offers", [])
    target_offer = None

    for o in offers:
        if o["offer_id"] == offer_id:
            target_offer = o
            break

    if not target_offer:
        return {"status": False, "message": "Offer not found"}

    # Update fields
    target_offer["title"] = title
    target_offer["fee"] = fee
    target_offer["start_date"] = start_date
    target_offer["end_date"] = end_date
    target_offer["percentage"] = percentage
    target_offer["description"] = description

    # Update file
    if file:
        file_bytes = file.file.read()
        if not file_bytes:
            return {"status": False, "message": "Empty file"}

        file_b64 = base64.b64encode(file_bytes).decode()
        ftype = "video" if file.content_type.lower().startswith("video") else "image"

        target_offer["file_base64"] = file_b64
        target_offer["file_type"] = ftype
        target_offer["filename"] = file.filename
        target_offer["uploaded_at"] = datetime.utcnow()

    # Save updated array
    col_offers.update_one(
        {"shop_id": shop_id},
        {"$set": {"offers": offers}}
    )

    return {"status": True, "message": "Offer updated successfully"}




# DELETE OFFER
@router.delete("/delete/offer/", operation_id="deleteOffer")
def delete_offer(
    user_id: str = Depends(verify_token),
    offer_id: str = Form(...)
):
    # Try deleting entire document
    try:
        obj_id = ObjectId(offer_id)
        res = col_offers.delete_one({"_id": obj_id})
        if res.deleted_count > 0:
            return {"status": "success", "message": "Offer document removed"}
    except:
        pass

    # Try removing nested offer
    docs = col_offers.find({"offers.offer_id": offer_id})
    for d in docs:
        col_offers.update_one(
            {"_id": d["_id"]},
            {"$pull": {"offers": {"offer_id": offer_id}}}
        )
        return {"status": "success", "message": "Offer removed"}

    return {"status": "error", "message": "Offer not found"}

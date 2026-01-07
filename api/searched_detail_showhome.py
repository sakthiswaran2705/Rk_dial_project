from fastapi import APIRouter, Form, Depends, Query, Request
from bson import ObjectId
from api.common_urldb import db
from datetime import datetime
from api.auth_jwt import verify_token

from api.translator import en_to_ta, ta_to_en
from api.cache import get_cached, set_cache

router = APIRouter()

col_category = db["category"]
col_shop = db["shop"]
col_reviews = db["reviews"]
col_view_logs = db["shop_view_logs"]
col_view_reports = db["shop_view_reports"]



def serialize(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def should_translate(text: str):
    if not text:
        return False
    if len(text) > 200:
        return False
    if text.startswith("media/") or text.startswith("http") or "/" in text:
        return False
    return True


def translate_text(text: str):
    if not should_translate(text):
        return text

    cached = get_cached(text)
    if cached:
        return cached

    ta = en_to_ta(text)
    set_cache(text, ta)
    return ta


def translate_dict(obj):
    if isinstance(obj, dict):
        new = {}
        for k, v in obj.items():
            if k in ("_id", "category_image", "path", "date", "rating", "shop_id"):
                new[k] = v
            else:
                new[k] = translate_dict(v)
        return new

    if isinstance(obj, list):
        return [translate_dict(i) for i in obj]

    if isinstance(obj, str):
        return translate_text(obj)

    return obj


# ==================================================
# CATEGORY LIST
# ==================================================
@router.get("/category/list/", operation_id="getCategoryList")
def get_categories(lang: str = Query("en")):
    data = list(col_category.find())
    data = [serialize(c) for c in data]

    if lang == "ta":
        data = translate_dict(data)

    return {"status": True, "data": data}


# ==================================================
# UNIQUE MONTHLY SHOP VIEW (NO DUPLICATE)
# ==================================================
@router.post("/shop/{shop_id}/view/", operation_id="addUniqueShopView")
def add_unique_shop_view(
    shop_id: str,
    request: Request,
    user_id: str = Depends(verify_token)
):
    try:
        oid = ObjectId(shop_id)
    except:
        return {"status": False, "message": "Invalid shop id"}

    now = datetime.now()
    month = now.month
    year = now.year

    # 🔒 DUPLICATE CHECK (same user + same month)
    exists = col_view_logs.find_one({
        "shop_id": shop_id,
        "user_id": user_id,
        "month": month,
        "year": year
    })

    if exists:
        return {"status": True, "counted": False}

    # ✅ LOG INSERT
    col_view_logs.insert_one({
        "shop_id": shop_id,
        "user_id": user_id,
        "month": month,
        "year": year,
        "created_at": now
    })

    # ✅ INCREMENT SHOP VIEW
    col_shop.update_one(
        {"_id": oid},
        {"$inc": {"views": 1}}
    )

    return {"status": True, "counted": True}


# ==================================================
# SHOP MEDIA + VIEWS
# ==================================================
@router.get("/shop/{shop_id}/media/", operation_id="getShopMedia")
def get_shop_photos(shop_id: str):
    shop = col_shop.find_one({"_id": ObjectId(shop_id)})
    if not shop:
        return {"status": False, "message": "Shop not found"}

    media = shop.get("media", [])

    valid_media = [
        {"type": m.get("type"), "path": m.get("path")}
        for m in media
        if m.get("type") in ("image", "video") and m.get("path")
    ]

    return {
        "status": True,
        "media": valid_media,
        "main_image": shop.get("main_image"),
        "views": shop.get("views", 0)
    }



@router.get("/shop/{shop_id}/reviews/", operation_id="getShopReviews")
def get_reviews(shop_id: str, lang: str = Query("en")):
    reviews = list(
        col_reviews
        .find({"shop_id": shop_id})
        .sort("created_at", -1)   # 👈 RECENT FIRST
    )

    for r in reviews:
        r["_id"] = str(r["_id"])

    if lang == "ta":
        reviews = translate_dict(reviews)

    return {"status": True, "reviews": reviews}


@router.post("/review/add/", operation_id="addReview")
def add_review_api(
    user_id: str = Depends(verify_token),
    shop_id: str = Form(...),
    rating: int = Form(...),
    review: str = Form(...)
):
    user = db.user.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"status": False}

    review_en = ta_to_en(review)

    data = {
        "shop_id": shop_id,
        "rating": int(rating),
        "review": review_en,
        "username": user.get("firstname"),
        "user_id": user_id,
        "date": datetime.now().strftime("%d-%m-%Y")
    }

    res = col_reviews.insert_one(data)
    data["_id"] = str(res.inserted_id)

    return {"status": True, "data": data}


# DELETE REVIEW
@router.delete("/review/delete/", operation_id="deleteReview")
def delete_review(
    user_id: str = Depends(verify_token),
    review_id: str = Form(...)
):
    oid = ObjectId(review_id)
    review = col_reviews.find_one({"_id": oid})

    if not review or review.get("user_id") != user_id:
        return {"status": False}

    col_reviews.delete_one({"_id": oid})
    return {"status": True}

from fastapi import APIRouter, Form, Depends
from bson import ObjectId
from api.common_db_url import db
from datetime import datetime
from api.auth_jwt import verify_token

router = APIRouter()

col_category = db["category"]
col_shop = db["shop"]
col_reviews = db["reviews"]


# Convert ObjectId → String
def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# CATEGORY API
@router.get("/category/list/", operation_id="getCategoryList")
def get_categories():
    try:
        data = list(col_category.find())
        data = [serialize(c) for c in data]
        return {"status": True, "data": data}
    except Exception as e:
        return {"status": False, "error": str(e)}


# SHOP PHOTOS API
@router.get("/shop/{shop_id}/photos/", operation_id="getShopPhotos")
def get_shop_photos(shop_id: str):
    try:
        shop = col_shop.find_one({"_id": ObjectId(shop_id)})
        if not shop:
            return {"status": False, "message": "Shop not found"}

        photos = shop.get("photos", [])
        return {"status": True, "photos": photos}

    except Exception as e:
        return {"status": False, "error": str(e)}


# GET REVIEWS FOR A SHOP
@router.get("/shop/{shop_id}/reviews/", operation_id="getShopReviews")
def get_reviews(shop_id: str):
    try:
        reviews = list(col_reviews.find({"shop_id": shop_id}))
        for r in reviews:
            r["_id"] = str(r["_id"])
        return {"status": True, "reviews": reviews}

    except Exception as e:
        return {"status": False, "error": str(e)}

#ADD REVIEWS
@router.post("/review/add/", operation_id="addReview")
def add_review_api(
    user_id: str = Depends(verify_token),   # JWT token validation
    shop_id: str = Form(...),
    rating: int = Form(...),
    review: str = Form(...)
):

    # VALIDATION
    if not shop_id:
        return {"status": False, "message": "shop_id missing"}

    if rating is None:
        return {"status": False, "message": "rating missing"}

    if not review:
        return {"status": False, "message": "review missing"}

    # Build review object
    data = {
        "shop_id": shop_id,
        "rating": int(rating),
        "review": review,
        "username": user_id,  # username from JWT token
        "date": datetime.now().strftime("%d-%m-%Y")
    }

    try:
        inserted = col_reviews.insert_one(data)
        data["_id"] = str(inserted.inserted_id)

        return {
            "status": True,
            "message": "Review added successfully",
            "data": data
        }

    except Exception as e:
        return {"status": False, "message": f"Error: {str(e)}"}

from fastapi import APIRouter
from bson import ObjectId
from common_urldb import db

router = APIRouter()

col_city = db["city"]
col_shop = db["shop"]
col_offers = db["offers"]


def safe(doc):
    if not doc:
        return None
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


@router.get(
    "/offers/{city}",
    operation_id="getOffersByCity",
    summary="Get offers by city"
)
def get_offers(city: str):

    # Find matching city (case-insensitive)
    city_list = list(col_city.find({
        "city_name": {"$regex": f"^{city}$", "$options": "i"}
    }))

    if not city_list:
        return {"status": False, "slides": [], "message": "City not found"}

    final_city = None

    # Use the first city that has at least 1 shop
    for c in city_list:
        cid = str(c["_id"])
        shop_exist = col_shop.find_one({"city_id": cid})
        if shop_exist:
            final_city = safe(c)
            break

    if not final_city:
        return {"status": True, "slides": [], "message": "No shops in this city"}

    city_id = final_city["_id"]

    shops = list(col_shop.find({"city_id": city_id}))
    if not shops:
        return {"status": True, "slides": [], "message": "No shops in this city"}

    slides = []

    # Loop shops → offers
    for shop in shops:
        shop_id = str(shop["_id"])

        ss_doc = col_offers.find_one({"shop_id": shop_id})
        if not ss_doc:
            continue

        for off in ss_doc.get("offers", []):
            if off.get("status") != "approved":
                continue

            filename = off.get("filename", "").lower()
            file_base64 = off.get("file_base64", "")

            # Auto detect type
            if filename.endswith(".mp4"):
                mime = "video/mp4"
                final_type = "video"
            elif filename.endswith(".jpg") or filename.endswith(".jpeg"):
                mime = "image/jpeg"
                final_type = "image"
            else:
                mime = "image/png"
                final_type = "image"

            slides.append({
                "shop_id": shop_id,
                "shop": safe(shop),
                "city": final_city,
                "offer_id": off.get("offer_id"),
                "filename": filename,
                "type": final_type,
                "url": f"data:{mime};base64,{file_base64}"
            })

    return {
        "status": True,
        "slides": slides[:3],   # limit 3 slides
        "count": len(slides[:3])
    }

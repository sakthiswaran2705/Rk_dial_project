from fastapi import APIRouter
from bson import ObjectId
from common_urldb import db

router = APIRouter()

col_shop = db["shop"]
col_city = db["city"]
col_slideshow = db["offers"]    # same collection name as slideshow


@router.get(
    "/offers/list/{city_name}",
    operation_id="getOffersByCityshops",
    summary="Get all offers by city"
)
def get_all_offers_city(city_name: str):
    city_name = city_name.strip()
    # your logic


    # Find city
    city = col_city.find_one({
        "city_name": {"$regex": f"^{city_name}$", "$options": "i"}
    })

    if not city:
        return {"status": False, "message": "City not found", "offers": []}

    city_id = str(city["_id"])

    # Get shops under city
    shops = list(col_shop.find({"city_id": city_id}))

    all_offers = []

    for shop in shops:
        shop_id = str(shop["_id"])

        ss_doc = col_slideshow.find_one({"shop_id": shop_id})
        if not ss_doc:
            continue

        for off in ss_doc.get("offers", []):
            if off.get("status") != "approved":
                continue

            all_offers.append({
                "offer_id": off.get("offer_id"),
                "title": off.get("title", ""),
                "percentage": off.get("percentage", ""),
                "file_type": off.get("file_type", ""),
                "file_base64": off.get("file_base64", ""),
                "filename": off.get("filename", ""),
                "shop_name": shop.get("shop_name", "")
            })

    return {
        "status": True,
        "city": city_name,
        "offers": all_offers
    }

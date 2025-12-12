from fastapi import APIRouter
from bson import ObjectId
from api.common_db_url import db

router = APIRouter()

col_shop = db["shop"]
col_city = db["city"]
col_offers = db["offers"]   


def safe(doc):
    if not doc:
        return None
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc
@router.get("/offer/details/{offer_id}/",operation_id="getOffersByCityshops",
    summary= "Get offer details")
def get_offer_details(offer_id: str):
    # Search inside all shops' offers
    shops = list(col_shop.find({}))

    for shop in shops:
        shop_id = str(shop["_id"])
        ss_doc = col_offers.find_one({"shop_id": shop_id})
        if not ss_doc:
            continue

        for off in ss_doc.get("offers", []):
            if off.get("offer_id") == offer_id:
                city = col_city.find_one({"_id": ObjectId(shop["city_id"])})

                # main offer
                main_offer = {
                    "offer_id": off.get("offer_id"),
                    "title": off.get("title"),
                    "percentage": off.get("percentage"),
                    "file_type": off.get("file_type"),
                    "file_base64": off.get("file_base64"),
                    "filename": off.get("filename"),
                    "description": off.get("description"),
                    "start_date": off.get("start_date"),
                    "end_date": off.get("end_date"),
                    "fee": off.get("fee"),
                }

                # other offers from same shop
                others = [
                    o for o in ss_doc.get("offers", [])
                    if o.get("offer_id") != offer_id and o.get("status") == "approved"
                ]

                return {
                    "status": True,
                    "main_offer": main_offer,
                    "other_offers": others,
                    "shop": safe(shop),
                    "city": safe(city)
                }

    return {"status": False, "message": "Offer not found"}

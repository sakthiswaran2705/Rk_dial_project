from fastapi import APIRouter, Depends, Body, HTTPException, Request
from datetime import datetime, timedelta
from api.common_urldb import db
from api.auth_jwt import verify_token
from dotenv import load_dotenv


import razorpay
import os
import hmac
import hashlib
from api.plan_expiry_mail import send_payment_success_mail
from api.plan_config import PLAN_CONFIG

load_dotenv(override=True)
# ==================================================
# RAZORPAY CONFIG
# ==================================================
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("Razorpay keys not configured")

client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
)


router = APIRouter()

col_payments = db["payments"]
col_shop = db["shop"]
col_offer = db["offers"]

ALLOWED_STATUS = ["success", "failed", "pending"]

# ==================================================
# INTERNAL: GET ACTIVE PLAN
# ==================================================
def get_active_plan(user_id: str):
    payment = col_payments.find_one(
        {
            "user_id": user_id,
            "subscription_status": "active"
        },
        sort=[("created_at", -1)]
    )


    if not payment:
        return None

    expiry = payment.get("expiry_date")
    if expiry and expiry < datetime.utcnow():
        return None

    return payment



from razorpay.errors import BadRequestError

@router.post("/payment/create-order/")
def create_order(
    user_id: str = Depends(verify_token),
    data: dict = Body(...)
):
    try:
        amount = int(data.get("amount", 0))
        if amount <= 0:
            raise HTTPException(400, "Invalid amount")

        order = client.order.create({
            "amount": amount * 100,     # paise
            "currency": "INR",
            "receipt": f"rcpt_{user_id[:6]}",
            "payment_capture": 1
        })

        return {
            "status": True,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID
        }

    except Exception as e:
        print("❌ Razorpay create order failed:", e)
        raise HTTPException(500, "Razorpay order failed")

@router.post("/payment/verify/")
def verify_payment(
    user_id: str = Depends(verify_token),
    data: dict = Body(...)
):
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    signature = data.get("razorpay_signature")

    if not order_id or not payment_id or not signature:
        raise HTTPException(status_code=400, detail="Missing payment data")

    body = f"{order_id}|{payment_id}"

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != signature:
        raise HTTPException(status_code=400, detail="Signature verification failed")

    return {"status": True}



@router.post("/payment/save/")
def save_payment(
    user_id: str = Depends(verify_token),
    data: dict = Body(...)
):
    status = data.get("status")
    payment_id = data.get("payment_id")
    order_id = data.get("order_id")
    plan = data.get("plan_name")

    if status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Invalid payment status")

    if not payment_id or not order_id:
        raise HTTPException(status_code=400, detail="payment_id & order_id required")

    if plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan")

    expiry_date = datetime.utcnow() + timedelta(
        days=PLAN_CONFIG[plan]["days"]
    )

    col_payments.update_one(
        {"payment_id": payment_id},
        {
            "$set": {
                "user_id": user_id,
                "order_id": order_id,
                "plan_id": data.get("plan_id"),
                "plan_name": plan,
                "amount": int(data.get("amount", 0)),
                "currency": "INR",
                "status": status,
                "message": data.get("message"),
                "expiry_date": expiry_date,


                "payment_success_mail_sent": True,
                "expiry_mail_2days_sent": False,
                "expiry_mail_today_sent": False,

                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    # ===============================
    # SEND PAYMENT SUCCESS MAIL
    # ===============================
    if status == "success":
        user = db["users"].find_one({"_id": user_id})

        if user and user.get("email"):
            send_payment_success_mail(
                user["email"],
                plan,
                int(data.get("amount", 0)),
                expiry_date
            )

    return {
        "status": True,
        "message": "Plan activated",
        "plan": plan,
        "expiry_date": expiry_date
    }



# ==================================================
# 4️⃣ CHECK ORDER STATUS (NET OFF / REFRESH)
# ==================================================
@router.post("/payment/check-order/")
def check_order_payment(
    user_id: str = Depends(verify_token),
    data: dict = Body(...)
):
    order_id = data.get("order_id")

    if not order_id:
        raise HTTPException(status_code=400, detail="order_id required")

    payments = client.order.payments(order_id)

    if not payments["items"]:
        return {
            "status": False,
            "message": "No payment found"
        }

    payment = payments["items"][-1]

    return {
        "status": True,
        "payment_id": payment["id"],
        "payment_status": payment["status"],
        "amount": payment["amount"] // 100
    }


@router.post("/payment/webhook/")
async def razorpay_webhook(request: Request):
    # -------------------------------
    # VERIFY SIGNATURE
    # -------------------------------
    payload = await request.body()
    received_signature = request.headers.get("X-Razorpay-Signature")

    expected_signature = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    if received_signature != expected_signature:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    data = await request.json()
    event = data.get("event")

    # ==================================================
    # 1️⃣ NORMAL PAYMENT (ONE-TIME)
    # ==================================================
    if event == "payment.captured":
        payment = data["payload"]["payment"]["entity"]

        payment_id = payment["id"]
        order_id = payment["order_id"]
        amount = payment["amount"] // 100

        col_payments.update_one(
            {"payment_id": payment_id},
            {
                "$set": {
                    "order_id": order_id,
                    "amount": amount,
                    "currency": "INR",
                    "status": "success",
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

    # ==================================================
    # 2️⃣ AUTOPAY SUBSCRIPTION ACTIVATED
    # ==================================================
    elif event == "subscription.activated":
        sub = data["payload"]["subscription"]["entity"]

        user_id = sub["notes"].get("user_id")
        plan = sub["notes"].get("plan")

        if user_id and plan:
            col_payments.update_one(
                {"subscription_id": sub["id"]},
                {
                    "$set": {
                        "autopay": True,
                        "subscription_id": sub["id"],
                        "subscription_status": "active",
                        "plan_name": plan,
                        "expiry_date": datetime.utcnow() + timedelta(
                            days=PLAN_CONFIG[plan]["days"]
                        ),
                        "updated_at": datetime.utcnow()
                    }
                }
            )


    # ==================================================
    # 3️⃣ AUTOPAY RENEWAL PAYMENT (MONTHLY / YEARLY)
    # ==================================================
    elif event == "invoice.paid":
        invoice = data["payload"]["invoice"]["entity"]

        sub_id = invoice["subscription_id"]

        payment = col_payments.find_one({"subscription_id": sub_id})
        if not payment:
            return {"status": "ok"}

        plan = payment["plan_name"]

        col_payments.update_one(
            {"subscription_id": sub_id},
            {
                "$set": {
                    "status": "success",
                    "expiry_date": datetime.utcnow() + timedelta(
                        days=PLAN_CONFIG[plan]["days"]
                    ),
                    "updated_at": datetime.utcnow()
                }
            }
        )

    # ==================================================
    # 4️⃣ AUTOPAY CANCELLED
    # ==================================================
    elif event == "subscription.cancelled":
        sub = data["payload"]["subscription"]["entity"]

        col_payments.update_one(
            {"subscription_id": sub["id"]},
            {
                "$set": {
                    "autopay": False,
                    "subscription_status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )

    return {"status": "ok"}

# ==================================================
# 6️⃣ MY PLAN (DASHBOARD API)
# ==================================================
@router.get("/my-plan/")
def my_plan(user_id: str = Depends(verify_token)):
    payment = get_active_plan(user_id)

    if not payment:
        return {
            "status": True,
            "subscribed": False
        }

    plan = payment["plan_name"]
    limits = PLAN_CONFIG[plan]

    shop_used = col_shop.count_documents({"user_id": user_id})
    offer_used = col_offer.count_documents({"user_id": user_id})

    return {
        "status": True,
        "subscribed": True,
        "plan": plan,
        "limits": limits,
        "usage": {
            "shops_used": shop_used,
            "offers_used": offer_used,
            "shops_left": max(0, limits["shops"] - shop_used),
            "offers_left": max(0, limits["offers"] - offer_used)
        },
        "expiry_date": payment.get("expiry_date")
    }

def check_shop_limit(user_id: str):
    payment = get_active_plan(user_id)
    if not payment:
        raise HTTPException(403, "Please subscribe to add shops")

    plan = payment["plan_name"]
    limit = PLAN_CONFIG[plan]["shops"]

    if col_shop.count_documents({"user_id": user_id}) >= limit:
        raise HTTPException(
            403,
            f"{plan.capitalize()} plan allows only {limit} shops"
        )


def check_offer_limit(user_id: str):
    payment = get_active_plan(user_id)
    if not payment:
        raise HTTPException(403, "Please subscribe to add offers")

    plan = payment["plan_name"]
    limit = PLAN_CONFIG[plan]["offers"]

    if col_offer.count_documents({"user_id": user_id}) >= limit:
        raise HTTPException(
            403,
            f"{plan.capitalize()} plan allows only {limit} offers"
        )

@router.post("/autopay/create/")
def create_autopay(
    user_id: str = Depends(verify_token),
    data: dict = Body(...)
):
    plan = data.get("plan_name")

    if plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan")

    sub = client.subscription.create({
        "plan_id": PLAN_CONFIG[plan]["autopay"]["razorpay_plan_id"],
        "customer_notify": 1,
        "total_count": 12,
        "notes": {
            "user_id": user_id,
            "plan": plan
        }
    })

    return {
        "status": True,
        "subscription_id": sub["id"]
    }
@router.post("/autopay/change-plan/")
def change_autopay_plan(
    user_id: str = Depends(verify_token),
    data: dict = Body(...)
):
    new_plan = data.get("plan_name")

    if new_plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # ----------------------------------
    # 1️⃣ FIND ACTIVE AUTOPAY
    # ----------------------------------
    active = col_payments.find_one({
        "user_id": user_id,
        "autopay": True,
        "subscription_status": "active"
    })

    # ----------------------------------
    # 2️⃣ CANCEL OLD SUBSCRIPTION
    # ----------------------------------
    if active:
        try:
            client.subscription.cancel(active["subscription_id"])
        except Exception as e:
            print("Razorpay cancel error:", e)

        col_payments.update_one(
            {"_id": active["_id"]},
            {
                "$set": {
                    "autopay": False,
                    "subscription_status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )

    # ----------------------------------
    # 3️⃣ CREATE NEW SUBSCRIPTION (NEW PLAN)
    # ----------------------------------
    sub = client.subscription.create({
        "plan_id": PLAN_CONFIG[new_plan]["autopay"]["razorpay_plan_id"],
        "customer_notify": 1,
        "total_count": 12,
        "notes": {
            "user_id": user_id,
            "plan": new_plan
        }
    })

    # ----------------------------------
    # 4️⃣ SAVE NEW SUBSCRIPTION
    # ----------------------------------
    col_payments.insert_one({
        "user_id": user_id,
        "subscription_id": sub["id"],
        "plan_name": new_plan,
        "autopay": True,
        "subscription_status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    return {
        "status": True,
        "message": f"Plan changed successfully. Next billing will use {new_plan} plan.",
        "subscription_id": sub["id"]
    }


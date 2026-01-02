# ---------------- PLAN CONFIG ----------------
PLAN_CONFIG = {
    "silver": {
        "shops": 2,
        "offers": 2,
        "days": 30,

        "autopay": {
            "period": "monthly",
            "interval": 1,
            "amount": 49900,   # ₹499
            "razorpay_plan_id": "plan_RycV93zdc3A7Ui"
        }
    },

    "gold": {
        "shops": 3,
        "offers": 3,
        "days": 90,

        "autopay": {
            "period": "monthly",
            "interval": 1,
            "amount": 99900,   # ₹999
            "razorpay_plan_id": "plan_RycXkQA42mEXV1"
        }
    },

    "platinum": {
        "shops": 4,
        "offers": 4,
        "days": 180,

        "autopay": {
            "period": "yearly",
            "interval": 1,
            "amount": 399900,
            "razorpay_plan_id": "plan_RycZDttToFDK8j"
        }
    }
}

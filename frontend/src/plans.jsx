import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import plansData from "./plans.json";
const API_BASE = import.meta.env.VITE_BACKEND_URL;
/* ================= UTILS ================= */
// Load Razorpay script dynamically if not present
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ================= LANGUAGE CONFIG ================= */
const LANG = localStorage.getItem("LANG") || "en";

/* ================= TRANSLATION MAP ================= */
const TXT = {
  title: { en: "Choose a Plan", ta: "ஒரு திட்டத்தை தேர்வு செய்யுங்கள்" },
  subtitle: {
    en: "Select the RK Dial plan and boost your business visibility.",
    ta: "RK Dial திட்டத்தை தேர்வு செய்து உங்கள் வணிகத்தை அதிகம் காணப்படச் செய்யுங்கள்.",
  },
  back: { en: "← Back", ta: "← பின்செல்ல" },
  chooseSilver: { en: "Choose Silver", ta: "சில்வர் தேர்வு" },
  choosePlatinum: { en: "Choose Platinum", ta: "பிளாட்டினம் தேர்வு" },
  chooseGold: { en: "Choose Gold", ta: "கோல்ட் தேர்வு" },
  processing: { en: "Processing...", ta: "செயலாக்குகிறது..." }, // Added Processing Text
  includes: { en: "Includes:", ta: "இதில் அடங்கும்:" },
  features: {
    listed: { en: "✔ Listed in Search", ta: "✔ தேடலில் காண்பிக்கப்படும்" },
    basic: { en: "✔ Basic Support", ta: "✔ அடிப்படை ஆதரவு" },
    vis1: { en: "✔ 1x Visibility", ta: "✔ 1 மடங்கு காண்பிப்பு" },
    top: { en: "✔ Top Search Ranking", ta: "✔ முன்னணி தேடல் இடம்" },
    premium: { en: "✔ Premium Support", ta: "✔ பிரீமியம் ஆதரவு" },
    vis3: { en: "✔ 3x Visibility", ta: "✔ 3 மடங்கு காண்பிப்பு" },
    adsUnlimited: { en: "✔ Unlimited Ads Posting", ta: "✔ வரம்பில்லா விளம்பர பதிவு" },
    priority: { en: "✔ Priority Support", ta: "✔ முன்னுரிமை ஆதரவு" },
    vis2: { en: "✔ 2x Visibility", ta: "✔ 2 மடங்கு காண்பிப்பு" },
    ads: { en: "✔ Ads Posting Access", ta: "✔ விளம்பர பதிவு அனுமதி" },
  },
  benefitsTitle: { en: "RK Dial Helps You Grow Your Business", ta: "RK Dial உங்கள் வணிக வளர்ச்சிக்கு உதவுகிறது" },
  benefit1Title: { en: "Increase Daily Visibility", ta: "தினசரி காணப்படும் அளவு அதிகரிப்பு" },
  benefit1Text: { en: "Show your business to new users daily.", ta: "உங்கள் வணிகத்தை தினமும் புதிய பயனர்களுக்கு காட்டுங்கள்." },
  benefit2Title: { en: "Grow Revenue", ta: "வருமானம் அதிகரிக்க" },
  benefit2Text: { en: "Daily reach helps increase customers.", ta: "தினசரி அணுகல் அதிக வாடிக்கையாளர்களை உருவாக்கும்." },
  benefit3Title: { en: "More Customers", ta: "அதிக வாடிக்கையாளர்கள்" },
  benefit3Text: { en: "More visibility → more calls.", ta: "அதிக காண்பிப்பு → அதிக அழைப்புகள்." },
  successTitle: { en: "Payment Successful!", ta: "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!" },
  successMsg: { en: "Your subscription is now active.", ta: "உங்கள் சந்தா இப்போது செயலில் உள்ளது." },
  continueBtn: { en: "Continue to Dashboard", ta: "முகப்புக்குச் செல்" },
  transId: { en: "Transaction ID:", ta: "பரிவர்த்தனை எண்:" }
};

export default function Plan() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Track which plan is currently processing (to show loading spinner on specific button)
  const [processingId, setProcessingId] = useState(null);

  // Load script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // ================= HANDLE PAYMENT =================
  const handlePlanPayment = async (plan) => {
    const token = localStorage.getItem("ACCESS_TOKEN");

    if (!token) {
      alert("Please login to continue payment");
      return;
    }

    setProcessingId(plan.id); // START LOADING

    try {
      // 1. Ensure Script is Loaded
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setProcessingId(null);
        return;
      }

      // 2. Create Order
      const orderRes = await fetch(`${API_BASE}/payment/create-order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: plan.price }),
      });
      
      if (orderRes.status === 401 || orderRes.status === 403) {
        alert(
          LANG === "ta"
            ? "உங்கள் உள்நுழைவு காலாவதியானது. மீண்டும் உள்நுழையவும்."
            : "Session expired. Please login again."
        );
      
        localStorage.removeItem("ACCESS_TOKEN");
        setProcessingId(null);
        navigate("/login");
        return;
      }
      
      const orderData = await orderRes.json();
      
      if (!orderData.status) {
        alert("Order creation failed");
        setProcessingId(null);
        return;
      }


      // 3. Razorpay Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: "INR",
        name: "RK Dial",
        description: plan.name[LANG],
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // 4. Verify Payment
            const verifyRes = await fetch(`${API_BASE}/payment/verify/`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.status) {
              alert("Payment verification failed");
              return;
            }

            // 5. Save Success (Consider moving this logic to backend inside 'verify' to speed this up)
            await fetch(`${API_BASE}/payment/save/`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                order_id: orderData.order_id,
                payment_id: response.razorpay_payment_id,
                plan_id: plan.id,
                plan_name: plan.id,
                amount: plan.price,
                status: "success",
                message: "Payment successful",
              }),
            });

            setPaymentDetails({
              id: response.razorpay_payment_id,
              plan: plan.name[LANG]
            });
            setShowSuccessModal(true);
          } catch (error) {
            console.error(error);
            alert("Error saving payment. Please contact support.");
          } finally {
            setProcessingId(null); // STOP LOADING
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingId(null); // STOP LOADING IF CLOSED
            // alert("Payment cancelled"); // Optional: Removed annoying alert
          },
        },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Server error");
      setProcessingId(null);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("/dashboard");
  };

  return (
    <div style={styles.page}>

      {/* CSS MOVED TO STYLE TAG IN HEAD OR SEPARATE FILE IS BETTER, BUT THIS WORKS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .success-modal { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div className="success-modal" style={styles.modalCard}>
            <div style={styles.iconContainer}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={styles.modalTitle}>{TXT.successTitle[LANG]}</h2>
            <p style={styles.modalText}>{TXT.successMsg[LANG]}</p>
            {paymentDetails && (
              <div style={styles.transactionBox}>
                <span style={{opacity: 0.6, fontSize: "13px"}}>{TXT.transId[LANG]}</span>
                <br />
                <span style={{fontFamily: "monospace", fontSize: "15px", color: "#fff"}}>
                  {paymentDetails.id}
                </span>
              </div>
            )}
            <button style={styles.continueBtn} onClick={handleCloseSuccess}>
              {TXT.continueBtn[LANG]}
            </button>
          </div>
        </div>
      )}

      {/* BACK BUTTON */}
      <div style={headerStyles.header}>
          <button
            style={headerStyles.backBtn}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <h2 style={headerStyles.title}>
            RK Dial Plans
          </h2>

          <div style={{ width: 60 }}></div>
        </div>

      {/* TITLE */}
      <h1 style={styles.title}>{TXT.title[LANG]}</h1>
      <p style={styles.subtitle}>{TXT.subtitle[LANG]}</p>

      {/* PLANS GRID */}
      <div style={styles.planRow}>
        {plansData.plans.map((plan) => {
          // Dynamic Styling Logic
          const isSilver = plan.id === "silver";
          const isPlatinum = plan.id === "platinum";

          let cardStyle = styles.cardGold;
          let badgeStyle = styles.badgeGold;
          let priceStyle = styles.priceGold;
          let buttonStyle = styles.startGold;
          let dividerStyle = styles.dividerGold;

          if (isSilver) {
            cardStyle = styles.cardSilver;
            badgeStyle = styles.badgeSilver;
            priceStyle = styles.priceSilver;
            buttonStyle = styles.startSilver;
            dividerStyle = styles.dividerSilver;
          } else if (isPlatinum) {
            cardStyle = styles.cardPlatinum;
            badgeStyle = styles.badgePlatinum;
            priceStyle = styles.pricePlatinum;
            buttonStyle = styles.startPlatinum;
            dividerStyle = styles.dividerPlatinum;
          }

          const isProcessing = processingId === plan.id;
          const isAnyProcessing = processingId !== null;

          return (
            <div key={plan.id} style={cardStyle}>
              <div style={badgeStyle}>{plan.badge}</div>
              <h2 style={styles.planName}>{plan.name[LANG]}</h2>
              <p style={styles.planType}>{plan.type[LANG]}</p>
              <h1 style={priceStyle}>
                ₹{plan.price}{" "}
                <span style={styles.priceMonth}>{plan.period[LANG]}</span>
              </h1>

              <button
                style={{
                  ...buttonStyle,
                  opacity: isAnyProcessing ? 0.6 : 1,
                  cursor: isAnyProcessing ? "not-allowed" : "pointer"
                }}
                onClick={() => !isAnyProcessing && handlePlanPayment(plan)}
                disabled={isAnyProcessing}
              >
                {isProcessing ? TXT.processing[LANG] : TXT[`choose${plan.badge}`][LANG]}
              </button>

              <div style={dividerStyle}></div>
              <h3 style={styles.includesTitle}>{TXT.includes[LANG]}</h3>
              <p style={{ marginBottom: "15px" }}>{plan.dayPrice}</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {plan.features.map((f) => (
                  <li key={f} style={styles.featureItem}>
                    {TXT.features[f][LANG]}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* BENEFITS SECTION */}
      <h2 style={benefitStyles.heading}>{TXT.benefitsTitle[LANG]}</h2>
      <div style={benefitStyles.container}>
        <div style={benefitStyles.card}>
          <div style={benefitStyles.icon}>👁️</div>
          <h3 style={benefitStyles.title}>{TXT.benefit1Title[LANG]}</h3>
          <p style={benefitStyles.text}>{TXT.benefit1Text[LANG]}</p>
        </div>
        <div style={benefitStyles.card}>
          <div style={benefitStyles.icon}>📈</div>
          <h3 style={benefitStyles.title}>{TXT.benefit2Title[LANG]}</h3>
          <p style={benefitStyles.text}>{TXT.benefit2Text[LANG]}</p>
        </div>
        <div style={benefitStyles.card}>
          <div style={benefitStyles.icon}>📞</div>
          <h3 style={benefitStyles.title}>{TXT.benefit3Title[LANG]}</h3>
          <p style={benefitStyles.text}>{TXT.benefit3Text[LANG]}</p>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
// Styles remain unchanged, just pasted below for context
const headerStyles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "#0f0f0f",
    borderBottom: "1px solid #222",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.5px",
  },
};

const styles = {
  page: {
    background: "#0f0f0f",
    minHeight: "100vh",
    padding: "40px 20px",
    paddingTop: "20px",
    textAlign: "center",
    color: "white",
    fontFamily: "Inter, sans-serif, Noto Sans Tamil",
    position: "relative",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(5px)"
  },
  modalCard: {
    background: "#1e1e1e",
    width: "90%",
    maxWidth: "400px",
    padding: "40px 30px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    border: "1px solid #333"
  },
  iconContainer: {
    marginBottom: "20px",
    display: "inline-block",
    padding: "15px",
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "50%"
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "10px"
  },
  modalText: {
    color: "#aaa",
    marginBottom: "25px",
    fontSize: "15px"
  },
  transactionBox: {
    background: "#111",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "25px",
    textAlign: "center",
    border: "1px dashed #444"
  },
  continueBtn: {
    width: "100%",
    padding: "14px",
    background: "#22c55e",
    color: "#000",
    fontWeight: "bold",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background 0.2s"
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    background: "transparent",
    border: "1px solid #444",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  title: { fontSize: "46px", fontWeight: 700, marginBottom: 10 },
  subtitle: { color: "#c7c7c7", fontSize: "16px", marginBottom: "35px" },
  planRow: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    flexWrap: "wrap",
  },
  planName: { fontSize: "22px", fontWeight: "700", marginTop: "20px", marginBottom: "5px" },
  planType: { fontSize: "14px", opacity: 0.7, marginBottom: "15px" },
  priceMonth: { fontSize: "16px", fontWeight: "400", opacity: 0.8 },
  includesTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "5px" },
  featureItem: { marginBottom: "8px", fontSize: "15px" },
  cardSilver: {
    background: "#d8d8d8",
    width: "320px",
    padding: "30px",
    color: "#000",
    borderRadius: "16px",
    border: "2px solid #bbbbbb",
    position: "relative",
  },
  badgeSilver: {
    background: "#c0c0c0",
    padding: "6px 18px",
    borderRadius: "12px",
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: "700",
  },
  priceSilver: { fontSize: "50px", fontWeight: "900", color: "#555" },
  startSilver: {
    width: "100%",
    padding: "12px",
    background: "#555",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    transition: "0.2s"
  },
  dividerSilver: { height: "1px", background: "#aaa", margin: "20px 0" },
  cardPlatinum: {
    background: "linear-gradient(145deg, #ffffff, #d6d6d6)",
    width: "340px",
    padding: "30px",
    borderRadius: "18px",
    border: "2px solid #e3e3e3",
    boxShadow: "0px 0px 25px rgba(255,255,255,0.3)",
    color: "#000",
    position: "relative",
  },
  badgePlatinum: {
    background: "#fff",
    padding: "6px 18px",
    borderRadius: "12px",
    top: "-12px",
    left: "50%",
    position: "absolute",
    transform: "translateX(-50%)",
    fontWeight: 700,
    border: "1px solid #ccc",
  },
  pricePlatinum: { fontSize: "50px", fontWeight: "900", color: "#5e5e5e" },
  startPlatinum: {
    width: "100%",
    background: "#000",
    padding: "12px",
    color: "#fff",
    borderRadius: "10px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "0.2s"
  },
  dividerPlatinum: { background: "#bbb", height: "1px", margin: "20px 0" },
  cardGold: {
    background: "linear-gradient(180deg, #ffe29f, #ffa751)",
    width: "320px",
    padding: "30px",
    borderRadius: "16px",
    border: "2px solid #ffcb6b",
    color: "#000",
    boxShadow: "0px 0px 20px rgba(255,200,0,0.3)",
    position: "relative",
  },
  badgeGold: {
    background: "#fff",
    padding: "6px 18px",
    borderRadius: "12px",
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: 700,
  },
  priceGold: { fontSize: "50px", fontWeight: "900", color: "#8a5300" },
  startGold: {
    width: "100%",
    padding: "12px",
    background: "#000",
    color: "#fff",
    borderRadius: "10px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "0.2s"
  },
  dividerGold: { background: "#a87b00", height: "1px", margin: "20px 0" },
};

const benefitStyles = {
  heading: { fontSize: "34px", fontWeight: 700, marginTop: "60px", marginBottom: "40px" },
  container: { display: "flex", justifyContent: "center", gap: "60px", flexWrap: "wrap", paddingBottom: "40px" },
  card: { width: "260px", background: "#181818", padding: "20px", borderRadius: "16px", border: "1px solid #333", textAlign: "center" },
  icon: { fontSize: "50px", marginBottom: "15px" },
  title: { fontSize: "20px", fontWeight: 700, marginBottom: "10px" },
  text: { fontSize: "15px", color: "#cfcfcf", lineHeight: "22px" },
};

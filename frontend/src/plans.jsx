import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion
import { Icon } from "@blueprintjs/core"; // Import Icon
import plansData from "./plans.json";
import Navbar from "./Navbar.jsx";

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
    en: "Select the Nalla Angadi plan and boost your business visibility.",
    ta: "நல்ல அங்காடி திட்டத்தைத் தேர்ந்தெடுத்து உங்கள் வணிகத் தெரிவுநிலையை அதிகரிக்கவும்.",
  },
  chooseSilver: { en: "Choose Silver", ta: "சில்வர் தேர்வு" },
  choosePlatinum: { en: "Choose Platinum", ta: "பிளாட்டினம் தேர்வு" },
  chooseGold: { en: "Choose Gold", ta: "கோல்ட் தேர்வு" },
  processing: { en: "Processing...", ta: "செயலாக்குகிறது..." },
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
  benefitsTitle: { en: "Nalla Angadi Helps You Grow Your Business", ta: "நல்ல அங்காடி உங்கள் வணிக வளர்ச்சிக்கு உதவுகிறது" },
  benefit1Title: { en: "Increase Daily Visibility", ta: "தினசரி காணப்படும் அளவு அதிகரிப்பு" },
  benefit1Text: { en: "Show your business to new users daily.", ta: "உங்கள் வணிகத்தை தினமும் புதிய பயனர்களுக்கு காட்டுங்கள்." },
  benefit2Title: { en: "Grow Revenue", ta: "வருமானம் அதிகரிக்க" },
  benefit2Text: { en: "Daily reach helps increase customers.", ta: "தினசரி அணுகல் அதிக வாடிக்கையாளர்களை உருவாக்கும்." },
  benefit3Title: { en: "More Customers", ta: "அதிக வாடிக்கையாளர்கள்" },
  benefit3Text: { en: "More visibility → more calls.", ta: "அதிக காண்பிப்பு → அதிக அழைப்புகள்." },
  successTitle: { en: "Payment Successful!", ta: "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!" },
  successMsg: { en: "Your subscription is now active.", ta: "உங்கள் சந்தா இப்போது செயலில் உள்ளது." },
  continueBtn: { en: "Continue to Dashboard", ta: "முகப்புக்குச் செல்" },
  transId: { en: "Transaction ID:", ta: "பரிவர்த்தனை எண்:" },
  loginReqTitle: { en: "Login Required", ta: "உள்நுழைவு தேவை" },
  loginReqMsg: { en: "Please login to purchase a plan. Click here to login.", ta: "திட்டத்தை வாங்க உள்நுழையவும். உள்நுழைய இங்கே கிளிக் செய்யவும்." }
};

// --- POPUP VARIANTS (Same as Navbar) ---
const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

export default function Plan() {
  const navigate = useNavigate();
  const location = useLocation(); // To track where we are
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Track which plan is currently processing
  const [processingId, setProcessingId] = useState(null);

  // --- POPUP STATE ---
  const [popup, setPopup] = useState(null);

  // Modified showPopup to accept an optional Action callback
  const showPopup = (type, message, title = "", action = null) => {
      setPopup({ type, message, title, action });
      // If there is an action (like login), we give them more time or don't auto-hide immediately
      const duration = action ? 5000 : 3000;
      setTimeout(() => {
          // Only auto-close if it hasn't been replaced by another popup
          setPopup(prev => (prev && prev.message === message ? null : prev));
      }, duration);
  };

  // Load script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // ================= HANDLE PAYMENT =================
  const handlePlanPayment = async (plan) => {
    const token = localStorage.getItem("ACCESS_TOKEN");

    // --- CHECK LOGIN STATUS ---
    if (!token) {
      showPopup(
        "warning",
        TXT.loginReqMsg[LANG],
        TXT.loginReqTitle[LANG],
        () => navigate("/login", { state: { from: location.pathname } }) // Redirect to login, remembering return path
      );
      return;
    }

    setProcessingId(plan.id); // START LOADING

    try {
      // 1. Ensure Script is Loaded
      const res = await loadRazorpayScript();
      if (!res) {
        showPopup("error", "Razorpay SDK failed to load. Are you online?", "Network Error");
        setProcessingId(null);
        return;
      }

      // 2. Create Order
      const orderRes = await fetch("http://127.0.0.1:8000/payment/create-order/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: plan.price }),
      });

      const orderData = await orderRes.json();
      if (!orderData.status) {
        showPopup("error", "Order creation failed", "Error");
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
            const verifyRes = await fetch("http://127.0.0.1:8000/payment/verify/", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.status) {
              showPopup("error", "Payment verification failed", "Failed");
              return;
            }

            // 5. Save Success
            await fetch("http://127.0.0.1:8000/payment/save/", {
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
            showPopup("error", "Error saving payment. Contact support.", "Error");
          } finally {
            setProcessingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingId(null);
          },
        },
        theme: { color: "#3B82F6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      showPopup("error", "Server connection failed", "Server Error");
      setProcessingId(null);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("/dashboard");
  };

  // Helper to handle popup click
  const handlePopupClick = () => {
      if (popup && popup.action) {
          popup.action();
          setPopup(null);
      } else {
          setPopup(null);
      }
  };

  return (
    <div style={styles.page}>

      <div style={styles.navContainer}>
        <Navbar variant="plan" />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .success-modal { animation: fadeIn 0.3s ease-out forwards; }
        
        :root {
            --success: #10b981;
            --error: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --text-dark: #1e293b;
        }

        /* POPUP STYLES */
        .custom-popup-toast {
            position: fixed; top: 20px; right: 20px; z-index: 999999;
            min-width: 320px; max-width: 400px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px); border-radius: 16px; padding: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.8);
            display: flex; align-items: flex-start; gap: 12px;
            cursor: pointer;
        }
        .popup-icon-box {
            width: 40px; height: 40px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .popup-icon-box.success { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .popup-icon-box.error { background: rgba(239, 68, 68, 0.15); color: var(--error); }
        .popup-icon-box.warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
        .popup-icon-box.info { background: rgba(59, 130, 246, 0.15); color: var(--info); }
        .popup-content h5 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px; }
        .popup-content p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.4; font-weight: 500; }
        .popup-close { position: absolute; top: 10px; right: 10px; cursor: pointer; color: #94a3b8; }
        
        @media (max-width: 768px) {
             .custom-popup-toast { top: 10px; left: 10px; right: 10px; min-width: auto; max-width: 100%; }
        }
      `}</style>

      {/* POPUP TOAST COMPONENT */}
      <AnimatePresence>
        {popup && (
            <motion.div
                className="custom-popup-toast"
                variants={popupVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={handlePopupClick} // Click triggers action (login)
            >
                <div className={`popup-icon-box ${popup.type}`}>
                    <Icon icon={popup.type === 'success' ? 'tick-circle' : popup.type === 'error' ? 'error' : 'warning-sign'} iconSize={24} />
                </div>
                <div className="popup-content">
                    {popup.title && <h5>{popup.title}</h5>}
                    <p>{popup.message}</p>
                </div>
                <div className="popup-close" onClick={(e) => { e.stopPropagation(); setPopup(null); }}>
                    <Icon icon="cross" size={16} />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL (Transaction details) */}
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
                <span style={{opacity: 0.6, fontSize: "13px", color: "#666"}}>{TXT.transId[LANG]}</span>
                <br />
                <span style={{fontFamily: "monospace", fontSize: "15px", color: "#333", fontWeight: "600"}}>
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

      {/* HEADER */}
    <div
        style={{
          ...headerStyles.header,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ width: 60 }}></div>

        <h2 style={{ ...headerStyles.title, flex: 1, textAlign: "center" }}>
          Nalla Angadi Plans
        </h2>

        <div style={{ width: 60 }}></div>
      </div>


      {/* MAIN CONTENT CONTAINER */}
      <div style={styles.contentContainer}>
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
            let featuresStyle = styles.featuresGold;

            if (isSilver) {
              cardStyle = styles.cardSilver;
              badgeStyle = styles.badgeSilver;
              priceStyle = styles.priceSilver;
              buttonStyle = styles.startSilver;
              dividerStyle = styles.dividerSilver;
              featuresStyle = styles.featuresSilver;
            } else if (isPlatinum) {
              cardStyle = styles.cardPlatinum;
              badgeStyle = styles.badgePlatinum;
              priceStyle = styles.pricePlatinum;
              buttonStyle = styles.startPlatinum;
              dividerStyle = styles.dividerPlatinum;
              featuresStyle = styles.featuresPlatinum;
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
                <p style={{ marginBottom: "15px", fontWeight: "500", opacity: 0.8 }}>{plan.dayPrice}</p>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{...styles.featureItem, ...featuresStyle}}>
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
    </div>
  );
}

/* ================= STYLES ================= */
const headerStyles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 24px",
    background: "rgba(255, 255, 255, 0.95)", // White with transparency
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e5e7eb", // Light gray border
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827", // Almost black
    letterSpacing: "0.5px",
  },
};

const styles = {
  page: {
    background: "#f9fafb", // Very light gray background
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif, Noto Sans Tamil",
    position: "relative",
    color: "#1f2937",
  },
  navContainer: {
    background: "#fff",
    borderBottom: "1px solid #eee",
  },
  contentContainer: {
    padding: "40px 20px",
    textAlign: "center",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)", // Lighter overlay
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(5px)"
  },
  modalCard: {
    background: "#ffffff", // White modal
    width: "90%",
    maxWidth: "420px",
    padding: "40px 30px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid #f0f0f0"
  },
  iconContainer: {
    marginBottom: "20px",
    display: "inline-flex",
    padding: "16px",
    background: "#ecfdf5", // Light green bg
    borderRadius: "50%"
  },
  modalTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#065f46", // Dark green title
    marginBottom: "10px"
  },
  modalText: {
    color: "#6b7280", // Gray text
    marginBottom: "25px",
    fontSize: "16px",
    lineHeight: "1.5"
  },
  transactionBox: {
    background: "#f3f4f6", // Light gray box
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "25px",
    textAlign: "center",
    border: "1px solid #e5e7eb"
  },
  continueBtn: {
    width: "100%",
    padding: "16px",
    background: "#22c55e",
    color: "#ffffff",
    fontWeight: "700",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.4)",
    transition: "transform 0.2s"
  },

  // Page Typography
  title: {
    fontSize: "42px",
    fontWeight: 800,
    marginBottom: "12px",
    color: "#111827",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "50px",
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.6"
  },
  planRow: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    flexWrap: "wrap",
    alignItems: "stretch" // Make cards same height
  },
  planName: { fontSize: "24px", fontWeight: "800", marginTop: "20px", marginBottom: "5px" },
  planType: { fontSize: "14px", fontWeight: "500", opacity: 0.8, marginBottom: "15px", textTransform: "uppercase", letterSpacing: "1px" },
  priceMonth: { fontSize: "16px", fontWeight: "500", opacity: 0.7 },
  includesTitle: { fontSize: "15px", fontWeight: "700", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 },
  featureItem: { marginBottom: "10px", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },

  // SILVER CARD (Clean Light Gray)
  cardSilver: {
    background: "#ffffff",
    width: "340px",
    padding: "40px 30px",
    color: "#333",
    borderRadius: "24px",
    border: "1px solid #e5e7eb",
    position: "relative",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.2s",
  },
  badgeSilver: {
    background: "#9ca3af", // Gray badge
    color: "#fff",
    padding: "6px 16px",
    borderRadius: "20px",
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  priceSilver: { fontSize: "48px", fontWeight: "800", color: "#374151" },
  startSilver: {
    width: "100%",
    padding: "14px",
    background: "#4b5563",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    transition: "0.2s",
    marginTop: "10px",
    fontSize: "16px"
  },
  dividerSilver: { height: "1px", background: "#f3f4f6", margin: "25px 0" },
  featuresSilver: { color: "#4b5563" },

  // PLATINUM CARD (Premium Dark/Gradient Look)
  cardPlatinum: {
    background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)", // Dark gradient
    width: "360px",
    padding: "45px 30px",
    borderRadius: "24px",
    border: "1px solid #374151",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    color: "#fff",
    position: "relative",
    zIndex: 10,
    transform: "scale(1.05)", // Slightly larger
  },
  badgePlatinum: {
    background: "linear-gradient(90deg, #6366f1, #a855f7)", // Indigo to Purple
    color: "#fff",
    padding: "8px 20px",
    borderRadius: "20px",
    top: "-15px",
    left: "50%",
    position: "absolute",
    transform: "translateX(-50%)",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow: "0 4px 10px rgba(168, 85, 247, 0.4)",
    border: "none"
  },
  pricePlatinum: { fontSize: "52px", fontWeight: "900", color: "#fff" },
  startPlatinum: {
    width: "100%",
    background: "#fff",
    color: "#111827",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
    transition: "0.2s",
    marginTop: "10px",
    fontSize: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  dividerPlatinum: { background: "rgba(255,255,255,0.1)", height: "1px", margin: "25px 0" },
  featuresPlatinum: { color: "#e5e7eb" },

  // GOLD CARD (Warm Gradient)
  cardGold: {
    background: "#fff7ed", // Very light orange/cream
    width: "340px",
    padding: "40px 30px",
    borderRadius: "24px",
    border: "2px solid #fdba74", // Orange border
    color: "#431407",
    boxShadow: "0 10px 15px -3px rgba(251, 146, 60, 0.15)",
    position: "relative",
  },
  badgeGold: {
    background: "#f59e0b", // Amber
    color: "#fff",
    padding: "6px 16px",
    borderRadius: "20px",
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 4px 6px rgba(245, 158, 11, 0.3)"
  },
  priceGold: { fontSize: "48px", fontWeight: "900", color: "#9a3412" }, // Rust color
  startGold: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(to right, #d97706, #b45309)",
    color: "#fff",
    borderRadius: "12px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "0.2s",
    marginTop: "10px",
    fontSize: "16px",
    boxShadow: "0 4px 6px rgba(217, 119, 6, 0.3)"
  },
  dividerGold: { background: "#fed7aa", height: "1px", margin: "25px 0" },
  featuresGold: { color: "#78350f" },
};

const benefitStyles = {
  heading: { fontSize: "32px", fontWeight: 800, marginTop: "80px", marginBottom: "50px", color: "#111827" },
  container: { display: "flex", justifyContent: "center", gap: "30px", flexWrap: "wrap", paddingBottom: "40px" },
  card: {
    width: "280px",
    background: "#ffffff",
    padding: "30px 20px",
    borderRadius: "20px",
    border: "1px solid #f3f4f6",
    textAlign: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    transition: "transform 0.2s hover:shadow-lg"
  },
  icon: { fontSize: "42px", marginBottom: "15px", background: "#f9fafb", width: "80px", height: "80px", lineHeight: "80px", borderRadius: "50%", margin: "0 auto 20px" },
  title: { fontSize: "18px", fontWeight: 700, marginBottom: "10px", color: "#1f2937" },
  text: { fontSize: "15px", color: "#6b7280", lineHeight: "1.6" },
};

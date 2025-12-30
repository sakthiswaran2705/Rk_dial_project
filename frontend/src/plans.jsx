import React from "react";
import plansData from "./plans.json"; // Import the separated JSON

/* ================= LANGUAGE ================= */
const LANG = localStorage.getItem("LANG") || "en";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
/* ================= TRANSLATION MAP ================= */
const TXT = {
  title: {
    en: "Choose a Plan",
    ta: "ஒரு திட்டத்தை தேர்வு செய்யுங்கள்",
  },
  subtitle: {
    en: "Select the RK Dial plan and boost your business visibility.",
    ta: "RK Dial திட்டத்தை தேர்வு செய்து உங்கள் வணிகத்தை அதிகம் காணப்படச் செய்யுங்கள்.",
  },

  back: {
    en: "← Back",
    ta: "← பின்செல்ல",
  },

  chooseSilver: { en: "Choose Silver", ta: "சில்வர் தேர்வு" },
  choosePlatinum: { en: "Choose Platinum", ta: "பிளாட்டினம் தேர்வு" },
  chooseGold: { en: "Choose Gold", ta: "கோல்ட் தேர்வு" },

  includes: { en: "Includes:", ta: "இதில் அடங்கும்:" },

  features: {
    listed: { en: "✔ Listed in Search", ta: "✔ தேடலில் காண்பிக்கப்படும்" },
    basic: { en: "✔ Basic Support", ta: "✔ அடிப்படை ஆதரவு" },
    vis1: { en: "✔ 1x Visibility", ta: "✔ 1 மடங்கு காண்பிப்பு" },

    top: { en: "✔ Top Search Ranking", ta: "✔ முன்னணி தேடல் இடம்" },
    premium: { en: "✔ Premium Support", ta: "✔ பிரீமியம் ஆதரவு" },
    vis3: { en: "✔ 3x Visibility", ta: "✔ 3 மடங்கு காண்பிப்பு" },
    adsUnlimited: {
      en: "✔ Unlimited Ads Posting",
      ta: "✔ வரம்பில்லா விளம்பர பதிவு",
    },

    priority: { en: "✔ Priority Support", ta: "✔ முன்னுரிமை ஆதரவு" },
    vis2: { en: "✔ 2x Visibility", ta: "✔ 2 மடங்கு காண்பிப்பு" },
    ads: { en: "✔ Ads Posting Access", ta: "✔ விளம்பர பதிவு அனுமதி" },
  },

  benefitsTitle: {
    en: "RK Dial Helps You Grow Your Business",
    ta: "RK Dial உங்கள் வணிக வளர்ச்சிக்கு உதவுகிறது",
  },

  benefit1Title: {
    en: "Increase Daily Visibility",
    ta: "தினசரி காணப்படும் அளவு அதிகரிப்பு",
  },
  benefit1Text: {
    en: "Show your business to new users daily.",
    ta: "உங்கள் வணிகத்தை தினமும் புதிய பயனர்களுக்கு காட்டுங்கள்.",
  },

  benefit2Title: {
    en: "Grow Revenue",
    ta: "வருமானம் அதிகரிக்க",
  },
  benefit2Text: {
    en: "Daily reach helps increase customers.",
    ta: "தினசரி அணுகல் அதிக வாடிக்கையாளர்களை உருவாக்கும்.",
  },

  benefit3Title: {
    en: "More Customers",
    ta: "அதிக வாடிக்கையாளர்கள்",
  },
  benefit3Text: {
    en: "More visibility → more calls.",
    ta: "அதிக காண்பிப்பு → அதிக அழைப்புகள்.",
  },
};

export default function Plan() {

  // --- PAYMENT LOGIC ---
  const handlePlanPayment = async (plan) => {
    // PAYMENT SIMULATION (Gateway pending state)
    const paymentResult = {
      payment_id: "pay_" + Date.now(),
      transaction_id: "txn_" + Math.floor(Math.random() * 1000000),
      status: "pending",
      message: "Payment initiated, awaiting confirmation",
    };

    const payload = {
      plan_id: plan.id,
      plan_name: plan.name[LANG],
      amount: plan.price,
      ...paymentResult,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/payment/save/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.payment_status === "pending") {
        alert("Payment pending. Please wait for confirmation.");
      } else if (data.payment_status === "success") {
        alert("Payment successful!");
      } else {
        alert("Payment failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div style={styles.page}>
      {/* SMALL BACK BUTTON */}
      <button style={styles.backBtn} onClick={() => window.history.back()}>
        {TXT.back[LANG]}
      </button>

      {/* TITLE */}
      <h1 style={styles.title}>{TXT.title[LANG]}</h1>
      <p style={styles.subtitle}>{TXT.subtitle[LANG]}</p>

      {/* PLANS SECTION */}
      <div style={styles.planRow}>
        {plansData.plans.map((plan) => {
          // Dynamic Styles Assignment
          const cardStyle =
            plan.id === "silver"
              ? styles.cardSilver
              : plan.id === "platinum"
              ? styles.cardPlatinum
              : styles.cardGold;

          const badgeStyle =
            plan.id === "silver"
              ? styles.badgeSilver
              : plan.id === "platinum"
              ? styles.badgePlatinum
              : styles.badgeGold;

          const priceStyle =
            plan.id === "silver"
              ? styles.priceSilver
              : plan.id === "platinum"
              ? styles.pricePlatinum
              : styles.priceGold;

          const buttonStyle =
            plan.id === "silver"
              ? styles.startSilver
              : plan.id === "platinum"
              ? styles.startPlatinum
              : styles.startGold;

          const dividerStyle =
            plan.id === "silver"
              ? styles.dividerSilver
              : plan.id === "platinum"
              ? styles.dividerPlatinum
              : styles.dividerGold;

          return (
            <div key={plan.id} style={cardStyle}>
              <div style={badgeStyle}>{plan.badge}</div>

              <h2 style={styles.planName}>{plan.name[LANG]}</h2>
              <p style={styles.planType}>{plan.type[LANG]}</p>

              <h1 style={priceStyle}>
                ₹{plan.price}{" "}
                <span style={styles.priceMonth}>{plan.period[LANG]}</span>
              </h1>

              {/* Added onClick Handler here */}
              <button
                style={buttonStyle}
                onClick={() => handlePlanPayment(plan)}
              >
                {TXT[`choose${plan.badge}`][LANG]}
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

const styles = {
  page: {
    background: "#0f0f0f",
    minHeight: "100vh",
    padding: "40px 20px",
    textAlign: "center",
    color: "white",
    fontFamily: "Inter, sans-serif, Noto Sans Tamil",
    position: "relative",
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

  planName: {
    fontSize: "22px",
    fontWeight: "700",
    marginTop: "20px",
    marginBottom: "5px",
  },
  planType: {
    fontSize: "14px",
    opacity: 0.7,
    marginBottom: "15px",
  },
  priceMonth: {
    fontSize: "16px",
    fontWeight: "400",
    opacity: 0.8,
  },
  includesTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  featureItem: {
    marginBottom: "8px",
    fontSize: "15px",
  },

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
  },
  dividerGold: { background: "#a87b00", height: "1px", margin: "20px 0" },
};

const benefitStyles = {
  heading: {
    fontSize: "34px",
    fontWeight: 700,
    marginTop: "60px",
    marginBottom: "40px",
  },
  container: {
    display: "flex",
    justifyContent: "center",
    gap: "60px",
    flexWrap: "wrap",
    paddingBottom: "40px",
  },
  card: {
    width: "260px",
    background: "#181818",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #333",
    textAlign: "center",
  },
  icon: {
    fontSize: "50px",
    marginBottom: "15px",
  },
  title: { fontSize: "20px", fontWeight: 700, marginBottom: "10px" },
  text: { fontSize: "15px", color: "#cfcfcf", lineHeight: "22px" },
};

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const LANG = localStorage.getItem("LANG") || "en";

// ======================================================
//                  UI TRANSLATION MAP
// ======================================================
const TXT = {
  noCity: {
    en: "No City Selected",
    ta: "நகரம் தேர்ந்தெடுக்கப்படவில்லை",
  },
  goHome: {
    en: "Go Home",
    ta: "முகப்புக்கு செல்லவும்",
  },
  loadingOffers: {
    en: "Loading offers for",
    ta: "சலுகைகள் ஏற்றப்படுகிறது",
  },
  back: {
    en: "Back",
    ta: "பின்செல்ல",
  },
  exclusiveOffers: {
    en: "Exclusive Offers in",
    ta: "சிறப்பு சலுகைகள் -",
  },
  noOffers: {
    en: "No offers available",
    ta: "தற்போது சலுகைகள் இல்லை",
  },
  shopOffer: {
    en: "Shop Offer",
    ta: "கடை சலுகை",
  },
};

// ======================================================
//                  STYLES
// ======================================================
const styles = {
  pageContainer: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Noto Sans Tamil, Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "28px",
    color: "#333",
    borderBottom: "2px solid #1976D2",
    paddingBottom: "5px",
  },
  backButton: {
    padding: "10px 16px",
    backgroundColor: "#ffffff",
    color: "#1976D2",
    border: "1px solid #1976D2",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  },
  offersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "25px",
  },
  offerCard: {
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "white",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  offerImage: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  offerTitle: {
    fontWeight: "bold",
    fontSize: "18px",
    color: "#1976D2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  percentage: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: "14px",
  },
  loadingText: {
    textAlign: "center",
    padding: "50px",
    color: "#666",
  },
  noCityContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "80vh",
    gap: "20px",
  },
};

// ======================================================
//                  COMPONENT
// ======================================================
export default function OffersList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCity = searchParams.get("city");
  const city = urlCity || sessionStorage.getItem("CITY_NAME");

  const [displayCity, setDisplayCity] = useState("");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build correct media URL
  const mediaUrl = (path) =>
    path ? `${BACKEND_URL}/${path}` : "";

  // Save city once
  useEffect(() => {
    if (urlCity) {
      sessionStorage.setItem("CITY_NAME", urlCity);
    }
  }, [urlCity]);

  // Fetch offers
  useEffect(() => {
    if (!city) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`${BACKEND_URL}/offers/${encodeURIComponent(city)}/?lang=${LANG}`)
      .then((res) => res.json())
      .then((json) => {
        setOffers(json.slides || []);

        // ✅ city name comes inside slides
        if (
          json.slides &&
          json.slides.length > 0 &&
          json.slides[0].city?.city_name
        ) {
          setDisplayCity(json.slides[0].city.city_name);
        } else {
          setDisplayCity(city);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Offer fetch error:", err);
        setLoading(false);
      });
  }, [city]);

  const goBack = () => navigate("/");

  // ======================================================
  //                  RENDER
  // ======================================================
  if (!city) {
    return (
      <div style={styles.noCityContainer}>
        <h2>📍 {TXT.noCity[LANG]}</h2>
        <button onClick={goBack} style={styles.backButton}>
          {TXT.goHome[LANG]}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <p style={styles.loadingText}>
          🌀 {TXT.loadingOffers[LANG]}{" "}
          <b>{displayCity || city}</b>...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <button onClick={goBack} style={styles.backButton}>
          ← {TXT.back[LANG]}
        </button>

        <h2 style={styles.title}>
          {TXT.exclusiveOffers[LANG]} {displayCity}
        </h2>
      </div>

      {offers.length === 0 ? (
        <p style={styles.loadingText}>{TXT.noOffers[LANG]}</p>
      ) : (
        <div style={styles.offersGrid}>
          {offers.map((off) => (
            <div
              key={off.offer_id}
              style={styles.offerCard}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
              onClick={() =>
                navigate(`/offer/details/${off.offer_id}`, {
                  state: { city },
                })
              }
            >
              {/* MEDIA */}
              {off.type === "video" ? (
                <video
                  src={mediaUrl(off.path)}
                  style={styles.offerImage}
                  muted
                  loop
                  autoPlay
                />
              ) : (
                <img
                  src={mediaUrl(off.path)}
                  alt="Offer"
                  style={styles.offerImage}
                />
              )}

              <p style={styles.offerTitle}>
                {off.shop?.shop_name || TXT.shopOffer[LANG]}
              </p>

              {off.title && (
                <p style={{ fontSize: 14, color: "#555" }}>
                  {off.title}
                </p>
              )}

              {off.percentage && (
                <span style={styles.percentage}>
                  {off.percentage}% OFF
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

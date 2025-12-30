import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LANG = localStorage.getItem("LANG") || "en";

const TXT = {
  goBack: { en: "Go Back", ta: "பின்செல்ல" },
  featuredPromotion: { en: "Featured Promotion", ta: "சிறப்பு சலுகை" },
  from: { en: "from", ta: "இடம்" },
  offerDetails: { en: "Offer Details", ta: "சலுகை விவரங்கள்" },
  discount: { en: "Discount", ta: "தள்ளுபடி" },
  flatFee: { en: "Flat Fee / Cost", ta: "நிலையான கட்டணம்" },
  validFrom: { en: "Valid From", ta: "தொடக்கம்" },
  expiresOn: { en: "Expires On", ta: "முடிவு" },
  description: { en: "Description", ta: "விவரம்" },
  visitShop: { en: "Visit Shop Page", ta: "கடைப் பக்கத்தை பார்க்க" },
  moreOffers: { en: "More Promotions from", ta: "மேலும் சலுகைகள்" },
  noOffers: {
    en: "No other current promotions available from this shop.",
    ta: "இந்த கடையில் தற்போது வேறு சலுகைகள் இல்லை"
  },
  loading: {
    en: "Loading Offer Details...",
    ta: "சலுகை விவரங்கள் ஏற்றப்படுகிறது..."
  },
  error: {
    en: "Error: Offer not found or data failed to load.",
    ta: "பிழை: சலுகை கிடைக்கவில்லை"
  }
};

// ======================================================
//                  STYLES
// ======================================================
const styles = {
  pageContainer: {
    padding: "30px 20px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "Roboto, Arial, sans-serif, Noto Sans Tamil",
    backgroundColor: "#fff",
    minHeight: "100vh",
  },
  backButton: {
    marginBottom: "20px",
    padding: "10px 18px",
    background: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
  },
  contentGrid: {
    display: "flex",
    gap: "30px",
    marginTop: "20px",
  },
  mediaSection: { flex: 2 },
  infoSection: {
    flex: 1,
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
  },
  mediaElement: {
    width: "100%",
    borderRadius: "12px",
  },
  detailItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px dotted #e9ecef",
    fontSize: "15px",
  },
  shopButton: {
    marginTop: "25px",
    width: "100%",
    padding: "12px",
    background: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  otherOffersHeader: {
    marginTop: "50px",
    marginBottom: "20px",
    fontSize: "22px",
  },
  otherOffersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
  },
  otherCard: {
    background: "#fff",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid #ddd",
  },
  otherMedia: {
    width: "100%",
    height: "100px",
    objectFit: "cover",
    borderRadius: "6px",
  },
  otherTitle: {
    marginTop: "8px",
    fontWeight: "600",
    fontSize: "15px",
  },
  otherPercentage: {
    fontSize: "14px",
    color: "#28a745",
    fontWeight: "bold",
  }
};

// ======================================================
//                  COMPONENT
// ======================================================
export default function OfferDetails() {
  const { offer_id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!offer_id) return;

    setLoading(true);
    fetch(`${BACKEND_URL}/offer/details/${offer_id}/`)

      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offer_id]);

  const handleGoToShop = () => {
    if (!data?.shop || !data?.city) return;
    const shopState = { shop: data.shop, city: data.city };
    sessionStorage.setItem("SELECTED_SHOP", JSON.stringify(shopState));
    navigate("/shop", { state: shopState });
  };

  if (loading)
    return <h3 style={{ textAlign: "center" }}>{TXT.loading[LANG]}</h3>;

  if (!data?.status || !data?.main_offer)
    return <h3 style={{ textAlign: "center", color: "red" }}>{TXT.error[LANG]}</h3>;

  const main = data.main_offer;
  const others = data.other_offers || [];

  return (
    <div style={styles.pageContainer}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← {TXT.goBack[LANG]}
      </button>

      <h1>{main.title || TXT.featuredPromotion[LANG]}</h1>
      <p>{TXT.from[LANG]} {data.shop?.shop_name} – {data.city?.city_name}</p>

      <div style={styles.contentGrid}>
        <div style={styles.mediaSection}>
          {main.media_type === "video" ? (
            <video
              src={`${import.meta.env.VITE_BACKEND_URL}/${main.media_path}`}
              controls
              muted
              style={styles.mediaElement}
            />
          ) : (
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}/${main.media_path}`}
              alt="offer"
              style={styles.mediaElement}
            />
          )}

        </div>

        <div style={styles.infoSection}>
          <h4>{TXT.offerDetails[LANG]}</h4>

          <div style={styles.detailItem}>
            <b>{TXT.discount[LANG]}:</b>
            <span>{main.percentage}% OFF</span>
          </div>

          <div style={styles.detailItem}>
            <b>{TXT.flatFee[LANG]}:</b>
            <span>{main.fee ? `₹ ${main.fee}` : "N/A"}</span>
          </div>

          <div style={styles.detailItem}>
            <b>{TXT.validFrom[LANG]}:</b>
            <span>{main.start_date}</span>
          </div>

          <div style={styles.detailItem}>
            <b>{TXT.expiresOn[LANG]}:</b>
            <span>{main.end_date}</span>
          </div>

          <h4>{TXT.description[LANG]}</h4>
          <p>{main.description}</p>

          <button style={styles.shopButton} onClick={handleGoToShop}>
            {TXT.visitShop[LANG]} →
          </button>
        </div>
      </div>

      <h3 style={styles.otherOffersHeader}>
        {TXT.moreOffers[LANG]} {data.shop?.shop_name}
      </h3>

      {others.length === 0 && <p>{TXT.noOffers[LANG]}</p>}

      <div style={styles.otherOffersGrid}>
        {others.map(off => (
          <div
            key={off.offer_id}
            style={styles.otherCard}
            onClick={() => navigate(`/offer/details/${off.offer_id}`)}
          >
            {off.media_type === "video" ? (
              <video
                src={`${import.meta.env.VITE_BACKEND_URL}/${off.media_path}`}
                muted
                controls
                style={styles.otherMedia}
              />
            ) : (
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}/${off.media_path}`}
                style={styles.otherMedia}
                alt="offer"
              />
            )}

            <p style={styles.otherTitle}>{off.title}</p>
            <p style={styles.otherPercentage}>{off.percentage}% OFF</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const LANG = localStorage.getItem("LANG") || "en";
const BACKEND = "http://127.0.0.1:8000";

// ================= TRANSLATION MAP =================
const TXT = {
  loading: { en: "Loading...", ta: "ஏற்றுகிறது..." },
  back: { en: "← Back", ta: "← பின்செல்ல" },
  pageTitle: { en: "Offers for this Shop", ta: "இந்த கடையின் சலுகைகள்" },
  noOffers: {
    en: "No offers available for this shop.",
    ta: "இந்த கடைக்கு தற்போது சலுகைகள் இல்லை."
  },
  offer: { en: "Offer", ta: "சலுகை" },
  percentage: { en: "Percentage", ta: "சதவீதம்" },
  fee: { en: "Fee", ta: "கட்டணம்" },
  valid: { en: "Valid", ta: "செல்லுபடியாகும் காலம்" },
  noDescription: { en: "No description", ta: "விளக்கம் இல்லை" }
};

export default function OfferForShop() {
  const { shop_id } = useParams();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ FETCH OFFERS
  useEffect(() => {
    if (!shop_id) return;

    setLoading(true);

    fetch(`${BACKEND}/offers/shop/${shop_id}/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setOffers(data.offers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shop_id]);

  if (loading)
    return (
      <h3 style={{ padding: 20, fontFamily: "'Noto Sans Tamil', Arial, sans-serif" }}>
        {TXT.loading[LANG]}
      </h3>
    );

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1000,
        margin: "auto",
        fontFamily: "'Noto Sans Tamil', Arial, sans-serif"
      }}
    >
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        {TXT.back[LANG]}
      </button>

      <h2 className="mb-4">{TXT.pageTitle[LANG]}</h2>

      {offers.length === 0 && (
        <p style={{ color: "#777" }}>{TXT.noOffers[LANG]}</p>
      )}

      <div className="row">
        {offers.map((o) => (
          <div
            key={o.offer_id}
            className="col-lg-4 col-md-6 col-12 mb-4"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/offer/details/${o.offer_id}`)}
          >
            <div className="card p-2 shadow-sm">

              {/* ⭐ IMAGE / VIDEO */}
              {o.media_type === "video" ? (
                <video
                  src={`${BACKEND}/${o.media_path}`}
                  controls
                  muted
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 10,
                    objectFit: "cover"
                  }}
                />
              ) : (
                <img
                  src={`${BACKEND}/${o.media_path}`}
                  alt="offer"
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 10,
                    objectFit: "cover"
                  }}
                />
              )}

              {/* ⭐ OFFER DETAILS */}
              <div className="mt-2">
                <h5>{o.title || TXT.offer[LANG]}</h5>

                <p className="mb-1">
                  <b>{TXT.percentage[LANG]}:</b> {o.percentage || "N/A"}%
                </p>

                <p className="mb-1">
                  <b>{TXT.fee[LANG]}:</b> {o.fee || "N/A"}
                </p>

                <p className="mb-1">
                  <b>{TXT.valid[LANG]}:</b>{" "}
                  {o.start_date || "N/A"} → {o.end_date || "N/A"}
                </p>

                <p className="text-muted" style={{ fontSize: 14 }}>
                  {(o.description || TXT.noDescription[LANG]).substring(0, 70)}...
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

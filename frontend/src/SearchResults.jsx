import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";

/* ---------------- MODERN STYLES SYSTEM ---------------- */
const styles = `
  :root {
    --primary: #ff5a5f;
    --bg: #f3f4f6;
    --card-bg: #ffffff;
    --text-main: #1f2937;
    --text-sub: #6b7280;
    --border: #e5e7eb;
    --navbar-height: 20px;
    --btn-call-bg: #ecfdf5;
    --btn-call-text: #059669;
    --btn-chat-bg: #eff6ff;
    --btn-chat-text: #2563eb;
    --btn-map-bg: #fdf2f8;
    --btn-map-text: #db2777;
  }

  body {
    background: var(--bg);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0;
    padding-top: var(--navbar-height);
    color: var(--text-main);
    -webkit-font-smoothing: antialiased;
  }

  /* ---------- STICKY HEADER ---------- */
  .sticky-header {
    position: sticky;
    top: var(--navbar-height);
    z-index: 90;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.05);
    padding: 15px 0;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  }

  .header-inner {
    max-width: 1200px;
    margin: auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-sub {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
  }

  .header-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
    letter-spacing: -0.5px;
  }

  .btn-back {
    background: white;
    border: 1px solid var(--border);
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  .btn-back:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  /* ---------- GRID CONTAINER ---------- */
  .container {
    max-width: 1200px;
    margin: auto;
    padding: 0 20px 40px 20px;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }


  /* ---------- LOADING & EMPTY STATES ---------- */
  .state-container {
    text-align: center;
    padding: 60px 20px;
    grid-column: 1 / -1;
    color: var(--text-sub);
  }

  .loading-pulse {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-top-color: var(--primary);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 15px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ---------- CARD DESIGN ---------- */
  .card {
    background: var(--card-bg);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01);
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
    position: relative;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
  }

  .card-img-wrapper {
    height: 200px;
    background: #e5e7eb;
    position: relative;
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge-category {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    color: white;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    text-transform: capitalize;
  }

  .badge-rating {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: white;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-main);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .card-body {
    padding: 18px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--text-main);
    line-height: 1.3;
  }

  .card-loc {
    font-size: 13px;
    color: var(--text-sub);
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin-bottom: 15px;
    line-height: 1.4;
  }

  /* ---------- ACTION BUTTONS ---------- */
  .actions {
    margin-top: auto;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding-top: 15px;
    border-top: 1px dashed var(--border);
  }

  .action-btn {
    border: none;
    padding: 8px 0;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.2s;
  }

  .btn-call { background: var(--btn-call-bg); color: var(--btn-call-text); }
  .btn-call:hover { background: #d1fae5; }

  .btn-chat { background: var(--btn-chat-bg); color: var(--btn-chat-text); }
  .btn-chat:hover { background: #dbeafe; }

  .btn-map { background: var(--btn-map-bg); color: var(--btn-map-text); }
  .btn-map:hover { background: #fce7f3; }
`;

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const category = searchParams.get("category") || "Shop";
  const city = searchParams.get("city") || "City";
  const lang = localStorage.getItem("LANG") || "en";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = 
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/shop/search/?name=${encodeURIComponent(category)}&place=${encodeURIComponent(city)}&lang=${lang}`
        );
        const json = await res.json();
        const data = json.data || [];
        setResults(data);

        if(data.length > 0) {
            // ⭐ FIXED: Key must match what ShopDetails expects
            sessionStorage.setItem("SEARCH_CONTEXT_SHOPS", JSON.stringify(data));
        }

      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };

    if (category && city) fetchResults();
  }, [category, city, lang]);

  // --- Handlers ---
  const handleCall = (e, num) => {
    e.stopPropagation();
    if (num) window.location.href = `tel:${num}`;
  };

  const handleChat = (e, num) => {
    e.stopPropagation();
    if (num) window.open(`https://wa.me/${num}`, "_blank");
  };

  const handleMap = (e, name, cityLocation) => {
    e.stopPropagation();
    const query = `${name}, ${cityLocation}`;
    // ⭐ FIXED: Correct Google Maps Search URL
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
  };

  const navigateToShop = (item) => {
    const shop = item.shop || item.shop?.shop || item;
    const cityObj = item.city || shop.city || {};
    // Note: We don't need to save SELECTED_SHOP here necessarily because
    // ShopDetails handles it, but passing state is good.
    navigate("/shop", { state: { shop, city: cityObj } });
  };

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      {/* HEADER */}
      <div className="sticky-header">
        <div className="header-inner">
          <div className="header-titles">
              <span className="header-sub">SEARCH RESULTS</span>
              <h1 className="header-title">
                {category.toLowerCase()} <span style={{opacity:0.6}}>in</span> {city.toLowerCase()}
              </h1>
            </div>

          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container">

        {/* Loading State */}
        {loading && (
          <div className="state-container">
            <div className="loading-pulse"></div>
            <p>Finding the best <strong>{category}</strong> for you...</p>
          </div>
        )}

        {/* No Results State */}
        {!loading && results.length === 0 && (
          <div className="state-container">
             <h3>No results found 😕</h3>
             <p>We couldn't find any "{category}" in "{city}".<br/>Try checking the spelling or search for a nearby city.</p>
          </div>
        )}

        {/* Results Grid */}
        <div className="results-grid">
          {!loading &&
            results.map((item, i) => {
              // Data Normalization
              const s = item.shop || item.shop?.shop || item;
              const c = item.city || s.city || {};

              // Image Logic
              let imgUrl = "https://via.placeholder.com/600x400?text=No+Image";
              if (s.main_image) {
                imgUrl = `http://127.0.0.1:8000/${s.main_image}`;
              } else if (s.media && s.media.length > 0 && s.media[0].path) {
                imgUrl = `http://127.0.0.1:8000/${s.media[0].path}`;
              }

              const rating = item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : "New";

              return (
                <div
                  key={i}
                  className="card"
                  onClick={() => navigateToShop(item)}
                >
                  {/* Card Image */}
                  <div className="card-img-wrapper">
                    <img src={imgUrl} alt={s.shop_name} className="card-img" />
                    <div className="badge-category">{category}</div>
                    <div className="badge-rating">⭐ {rating}</div>
                  </div>

                  {/* Card Content */}
                  <div className="card-body">
                    <div className="card-title">{s.shop_name}</div>
                    <div className="card-loc">
                      📍 {s.address || `${c.city_name || city}, ${c.district || ''}`}
                    </div>

                    {/* Action Buttons */}
                    <div className="actions">
                      <button
                        className="action-btn btn-call"
                        title="Call Now"
                        onClick={(e) => handleCall(e, s.mobile || s.phone_number)}
                      >
                        📞 Call
                      </button>
                      <button
                        className="action-btn btn-chat"
                        title="WhatsApp"
                        onClick={(e) => handleChat(e, s.mobile || s.phone_number)}
                      >
                        💬 Chat
                      </button>
                      <button
                        className="action-btn btn-map"
                        title="Get Directions"
                        onClick={(e) => handleMap(e, s.shop_name, c.city_name || city)}
                      >
                        🗺️ Map
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

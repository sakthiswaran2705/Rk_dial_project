import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TXT = {
  backToResults: { en: "Back to Results", ta: "முடிவுகளுக்கு திரும்ப" },
  noShopData: { en: "No Shop Data Found", ta: "கடை விவரங்கள் கிடைக்கவில்லை" },
  about: { en: "About", ta: "எங்களை பற்றி" },
  contactInfo: { en: "Contact Information", ta: "தொடர்பு விவரங்கள்" },
  locationDetails: { en: "Location Details", ta: "இட விவரங்கள்" },
  landmark: { en: "Landmark", ta: "அடையாளம்" },
  address: { en: "Address", ta: "முகவரி" },
  reviews: { en: "Customer Reviews", ta: "வாடிக்கையாளர் மதிப்புரைகள்" },
  addReview: { en: "Add Your Review", ta: "உங்கள் மதிப்பீட்டை சேர்க்கவும்" },
  submitReview: { en: "Submit Review", ta: "மதிப்பீட்டை சமர்ப்பிக்க" },
  loginToReview: { en: "Login to Review", ta: "மதிப்பீடு செய்ய உள்நுழையவும்" },
  noReviews: { en: "Be the first one to leave a review!", ta: "முதல் மதிப்பீட்டை சேருங்கள்!" },
  moreShops: { en: "More Shops Like This", ta: "இதுபோன்ற மேலும் கடைகள்" },
  offers: { en: "View Exclusive Offers", ta: "சிறப்பு சலுகைகளை பார்க்க" },
  reviewPlaceholder: { en: "Share your experience about this place...", ta: "உங்கள் அனுபவத்தை இங்கே பகிரவும்..." },
  loginReviewHint: { en: "Please login to share your experience and add a review.", ta: "உங்கள் அனுபவத்தை பகிர்ந்து மதிப்பீடு செய்ய உள்நுழையவும்." }
};

// ==========================================================
// ⭐ AUTO TOKEN REFRESH FUNCTION
// ==========================================================
async function refreshAccessToken() {
  const refresh = localStorage.getItem("REFRESH_TOKEN");
  if (!refresh) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/refresh/`
, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh })
    });
    const json = await res.json();
    if (json.status === true) {
      localStorage.setItem("ACCESS_TOKEN", json.access_token);
      return json.access_token;
    }
  } catch (e) {
    console.log("Refresh failed:", e);
  }
  return null;
}

// ==========================================================
// ⭐ MAIN SHOP DETAILS COMPONENT
// ==========================================================
function ShopDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const lang = localStorage.getItem("LANG") || "en";
  const t = (key) => TXT[key]?.[lang] || TXT[key]?.en || key;

  // USER INFO
  const loggedInUserId = localStorage.getItem("USER_ID") || "";

  // RESTORE STATE LOGIC
  let restoredState = state;
  if (!restoredState) {
    const savedLogin = sessionStorage.getItem("REDIRECT_AFTER_LOGIN");
    if (savedLogin) {
      restoredState = JSON.parse(savedLogin);
      sessionStorage.removeItem("REDIRECT_AFTER_LOGIN");
    }
  }
  if (!restoredState) {
    const saved = sessionStorage.getItem("SELECTED_SHOP");
    if (saved) restoredState = JSON.parse(saved);
  }

  // NO DATA HANDLER
  if (!restoredState?.shop) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">
            <div className="alert alert-warning d-inline-block p-4">
                <h4>{t("noShopData")}</h4>
                <button className="btn btn-dark mt-3" onClick={() => navigate("/")}>
                    {t("backToResults")}
                </button>
            </div>
        </div>
      </>
    );
  }

  const normalizeShop = (data) => {
    if (!data) return {};
    if (data._id) return data;
    if (data.shop?._id) return data.shop;
    return data;
  };

  const shopDoc = normalizeShop(restoredState.shop);
  const cityDoc = restoredState.city || restoredState.shop?.city || {};
  const shopId = shopDoc?._id;
  const getField = (key) => shopDoc?.[key] ?? "";

  // MEDIA STATE
  const [mediaList, setMediaList] = useState([]);
  const [mainMedia, setMainMedia] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // REVIEWS STATE
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [visibleReviewCount, setVisibleReviewCount] = useState(3);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // RELATED SHOPS STATE
  const [relatedShops, setRelatedShops] = useState([]);

  // HELPER: Recalculate Rating
  const recalculateAvgRating = (currentReviews) => {
    if (currentReviews?.length > 0) {
      const sum = currentReviews.reduce((a, b) => a + b.rating, 0);
      setAvgRating((sum / currentReviews.length).toFixed(1));
    } else {
      setAvgRating(null);
    }
  };

  const loadAllReviews = () => {
      setVisibleReviewCount(reviews.length);
  };

  // 1. LOAD SHOP MEDIA
  useEffect(() => {
    if (!shopId) return;
    
    fetch(`${BACKEND_URL}/shop/${shopId}/media/`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status && json.media) {
          const formattedMedia = json.media.map((item) => ({
            type: item.type,
            url: `${BACKEND_URL}/${item?.path}`
          }));
          setMediaList(formattedMedia);
          if (json.main_image) {
            const mainUrl = json?.main_image
              ? `${BACKEND_URL}/${json.main_image}`
              : "";
             const found = formattedMedia.find(m => m.url === mainUrl);
             setMainMedia(found || { type: 'image', url: mainUrl });
          } else {
             setMainMedia(formattedMedia[0] || null);
          }
        }
      })
      .catch(err => console.error("Media fetch error:", err));
  }, [shopId]);

  // 2. LOAD REVIEWS
  useEffect(() => {
    if (!shopId) return;
    fetch(`${BACKEND_URL}/shop/${shopId}/reviews/`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status) {
          setReviews(json.reviews || []);
          recalculateAvgRating(json.reviews || []);
          setVisibleReviewCount(3);
        }
      });
  }, [shopId]);

  // 3. LOAD RELATED SHOPS (UPDATED LOGIC)
  useEffect(() => {
      if (!shopId) return;

      // First, try to retrieve the search context (results from Search Page)
      let all = JSON.parse(sessionStorage.getItem("SEARCH_CONTEXT_SHOPS"));

      // Fallback: If no search context, look for Home Results
      if (!all || all.length === 0) {
          all = JSON.parse(sessionStorage.getItem("HOME_RESULTS")) || [];
      }

      if (all.length === 0) return;

      // Filter out the current shop from the list
      const filtered = all.filter((item) => {
         const s = item.shop || item.shop?.shop || item;
         return s._id !== shopId;
      });

      setRelatedShops(
        filtered.map((item) => ({
           shop: item.shop || item.shop?.shop || item,
           city: item.city || item.shop?.city || {},
        }))
      );
  }, [shopId]);

  // SUBMIT REVIEW
  const submitReview = async () => {
    if (loggedInUserId === "") {
      sessionStorage.setItem("REDIRECT_AFTER_LOGIN", JSON.stringify({ shop: restoredState.shop, city: restoredState.city }));
      alert("Please login to add review");
      return navigate("/login");
    }
    if (!rating) return alert("Select rating");
    if (!reviewText.trim()) return alert("Enter review");

    let token = localStorage.getItem("ACCESS_TOKEN");
    const formData = new FormData();
    formData.append("shop_id", shopId);
    formData.append("rating", rating);
    formData.append("review", reviewText);

    let res = await fetch(`${BACKEND_URL}/review/add/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        alert("Session expired! Please login again.");
        return navigate("/login");
      }
      token = newToken;
      res = await fetch(`${BACKEND_URL}/review/add/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }

    const json = await res.json();
    if (json.status) {
      const arr = [json.data, ...reviews]; // Add new review to top
      setReviews(arr);
      recalculateAvgRating(arr);
      setVisibleReviewCount(arr.length);
      setReviewText("");
      setRating(0);
    } else {
      alert(json.message);
    }
  };

  // DELETE REVIEW
  const deleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    let token = localStorage.getItem("ACCESS_TOKEN");
    const formData = new FormData();
    formData.append("review_id", reviewId);

    let res = await fetch(`${BACKEND_URL}/review/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        alert("Session expired! Please login again.");
        return navigate("/login");
      }
      token = newToken;
      res = await fetch(`${BACKEND_URL}/review/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }

    const json = await res.json();
    if (json.status) {
      const updatedReviews = reviews.filter((r) => r._id !== reviewId);
      setReviews(updatedReviews);
      recalculateAvgRating(updatedReviews);
      alert("Review deleted successfully!");
    } else {
      alert(json.message || "Failed to delete review.");
    }
  };

  // MEDIA SLIDER CONTROLS
  const nextMedia = () => {
    if (mediaList.length <= 1) return;
    const idx = (currentIndex + 1) % mediaList.length;
    setMainMedia(mediaList[idx]);
    setCurrentIndex(idx);
  };
  const prevMedia = () => {
    if (mediaList.length <= 1) return;
    const idx = (currentIndex - 1 + mediaList.length) % mediaList.length;
    setMainMedia(mediaList[idx]);
    setCurrentIndex(idx);
  };

  // UI RENDER
  return (
    <>
      <style>
        {`
            body { background-color: #f0f2f5; font-family: 'Inter', sans-serif,Noto Sans Tamil; }

            /* --- LAYOUT & CARDS --- */
            .detail-container { max-width: 1200px; margin: 0 auto; padding-bottom: 60px; }

            .content-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                border: 1px solid #eaeaea;
                overflow: hidden;
                margin-bottom: 24px;
            }

            .sticky-info-card {
                position: sticky;
                top: 90px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.08);
                border: 1px solid #eaeaea;
                padding: 24px;
            }

            /* --- HEADER & BACK BTN --- */
            .back-btn {
                background: white;
                border: 1px solid #ddd;
                padding: 8px 16px;
                border-radius: 30px;
                font-weight: 600;
                color: #555;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 20px;
            }
            .back-btn:hover { background: #f8f9fa; transform: translateX(-3px); color: #000; }

            /* --- MEDIA GALLERY --- */
            .main-view-box {
                width: 100%;
                aspect-ratio: 16/9;
                background: #000;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .nav-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.2);
                backdrop-filter: blur(5px);
                color: white;
                width: 40px; height: 40px;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                z-index: 10;
                font-size: 20px;
            }
            .nav-arrow:hover { background: white; color: black; }
            .nav-arrow.left { left: 15px; }
            .nav-arrow.right { right: 15px; }

            .thumb-strip {
                display: flex;
                gap: 10px;
                padding: 15px;
                overflow-x: auto;
                background: #fdfdfd;
                border-top: 1px solid #eee;
            }
            .thumb-item {
                width: 80px; height: 60px;
                border-radius: 8px;
                cursor: pointer;
                overflow: hidden;
                flex-shrink: 0;
                border: 2px solid transparent;
                transition: all 0.2s;
                position: relative;
            }
            .thumb-item.active { border-color: #007bff; transform: scale(1.05); }
            .thumb-item img, .thumb-item video { width: 100%; height: 100%; object-fit: cover; }

            /* --- TYPOGRAPHY --- */
            .shop-title { font-size: 2rem; font-weight: 800; color: #1a1a1a; margin-bottom: 5px; line-height: 1.2; }
            .rating-badge {
                background: #fff4e5; color: #b76e00;
                padding: 4px 10px; border-radius: 6px;
                font-weight: 700; display: inline-flex; align-items: center; gap: 5px;
                font-size: 14px; margin-bottom: 15px;
            }
            .section-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 15px; color: #333; }

            /* --- ACTION BUTTONS --- */
            .offer-btn {
                background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%);
                border: none;
                width: 100%;
                padding: 14px;
                border-radius: 12px;
                font-weight: 700;
                color: #333;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(253, 185, 49, 0.4);
                transition: transform 0.2s;
            }
            .offer-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(253, 185, 49, 0.5); }

            .contact-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px; font-size: 15px; color: #555; }
            .contact-icon { color: #007bff; font-size: 18px; margin-top: 2px; width: 20px; text-align: center; }

            /* --- REVIEWS --- */
            .star-input { font-size: 32px; cursor: pointer; transition: transform 0.1s; color: #ddd; }
            .star-input.active { color: #ffc107; }
            .star-input:hover { transform: scale(1.2); }

            .review-item {
                border-bottom: 1px solid #eee;
                padding: 20px 0;
            }
            .review-item:last-child { border-bottom: none; }
            .user-avatar {
                width: 40px; height: 40px;
                background: #e9ecef; color: #555;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold;
                font-size: 18px;
            }
            .delete-link { color: #dc3545; font-size: 12px; cursor: pointer; text-decoration: underline; margin-left: 10px; }

            /* --- RELATED SHOPS --- */
            .related-card {
                display: flex; gap: 15px;
                padding: 12px;
                border-radius: 12px;
                transition: background 0.2s;
                cursor: pointer;
                border: 1px solid transparent;
            }
            .related-card:hover { background: white; border-color: #eee; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            .related-img { width: 90px; height: 90px; border-radius: 8px; object-fit: cover; background: #eee; }

            @media (max-width: 991px) {
                .sticky-info-card { position: static; margin-top: 20px; }
                .shop-title { font-size: 1.5rem; }
            }
        `}
      </style>
      <Navbar />

      <div className="container detail-container mt-4">

        {/* BACK BUTTON */}
        <button className="back-btn" onClick={() => navigate(-1)}>
            <span>←</span> {t("backToResults")}
        </button>

        <div className="row">
            {/* === LEFT COLUMN: MEDIA & REVIEWS === */}
            <div className="col-lg-8">

                {/* 1. MEDIA GALLERY CARD */}
                <div className="content-card">
                    {mainMedia ? (
                        <>
                            <div className="main-view-box">
                                {mediaList.length > 1 && <div className="nav-arrow left" onClick={prevMedia}>❮</div>}

                                {mainMedia.type === "video" ? (
                                    <video
                                        src={mainMedia.url}
                                        controls autoPlay
                                        style={{width: '100%', height: '100%', objectFit: 'contain'}}
                                    />
                                ) : (
                                    <img
                                        src={mainMedia.url}
                                        alt="Shop Main"
                                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                    />
                                )}

                                {mediaList.length > 1 && <div className="nav-arrow right" onClick={nextMedia}>❯</div>}
                            </div>

                            {/* Thumbnails */}
                            {mediaList.length > 1 && (
                                <div className="thumb-strip">
                                    {mediaList.map((media, i) => (
                                        <div
                                            key={i}
                                            className={`thumb-item ${currentIndex === i ? 'active' : ''}`}
                                            onClick={() => { setMainMedia(media); setCurrentIndex(i); }}
                                        >
                                            {media.type === "video" ? (
                                                <>
                                                    <video src={media.url} muted />
                                                    <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>▶</div>
                                                </>
                                            ) : (
                                                <img src={media.url} alt="thumb" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-5 text-center text-muted">No Images Available</div>
                    )}
                </div>

                {/* 2. REVIEWS SECTION */}
                <div className="content-card p-4">
                    <h3 className="section-title">{t("reviews")} <span className="text-muted" style={{fontWeight:400, fontSize:'0.9em'}}>({reviews.length})</span></h3>

                    {/* Add Review Box */}
                    {loggedInUserId ? (
                        <div className="bg-light p-3 rounded mb-4 border">
                            <h6 className="mb-2 fw-bold text-primary">{t("addReview")}</h6>
                            <div className="mb-3">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <span
                                        key={num}
                                        className={`star-input ${num <= rating ? 'active' : ''}`}
                                        onClick={() => setRating(num)}
                                    >★</span>
                                ))}
                            </div>
                            <textarea
                                className="form-control mb-3"
                                rows="3"
                                placeholder={t("reviewPlaceholder")}
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                            ></textarea>
                            <button className="btn btn-primary px-4 fw-bold" onClick={submitReview}>{t("submitReview")}</button>
                        </div>
                    ) : (
                        <div className="alert alert-info d-flex justify-content-between align-items-center">
                            <span>{t("loginReviewHint")}</span>
                            <button className="btn btn-sm btn-light fw-bold" onClick={() => {
                                sessionStorage.setItem("REDIRECT_AFTER_LOGIN", JSON.stringify({ shop: restoredState.shop, city: restoredState.city }));
                                navigate("/login");
                            }}>{t("loginToReview")}</button>
                        </div>
                    )}

                    {/* Review List */}
                    {reviews.length === 0 ? (
                        <div className="text-center text-muted py-4">{t("noReviews")}</div>
                    ) : (
                        <div className="review-list">
                            {reviews.slice(0, visibleReviewCount).map((r, i) => (
                                <div key={i} className="review-item">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="d-flex gap-3">
                                            <div className="user-avatar">{r.username ? r.username[0].toUpperCase() : 'U'}</div>
                                            <div>
                                                <div className="fw-bold text-dark">{r.username || "User"}</div>
                                                <div className="text-warning" style={{fontSize:14}}>{"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}</div>
                                            </div>
                                        </div>
                                        <div className="text-muted small">
                                            {r.date || "Recent"}
                                            {loggedInUserId === r.user_id && (
                                                <span className="delete-link" onClick={() => deleteReview(r._id)}>Delete</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-2 mb-0 text-secondary">{r.review}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {reviews.length > visibleReviewCount && (
                        <button className="btn btn-outline-secondary w-100 mt-3 fw-bold" onClick={loadAllReviews}>
                            View all {reviews.length} reviews
                        </button>
                    )}
                </div>

            </div>

            {/* === RIGHT COLUMN: INFO & CONTACT === */}
            <div className="col-lg-4">
                <div className="sticky-info-card">

                    {/* Title & Rating */}
                    <h1 className="shop-title">{getField("shop_name")}</h1>
                    <div className="rating-badge">
                        <i className="fa fa-star"></i> {avgRating || "New"}
                        {reviews.length > 0 && <span style={{color:'#666', fontWeight:400, marginLeft:5}}>({reviews.length} reviews)</span>}
                    </div>

                    {/* Location */}
                    <p className="text-muted mb-4">
                        {cityDoc.city_name}, {cityDoc.district}
                    </p>

                    <hr className="my-4" />

                    {/* Contact Details */}
                    <h5 className="section-title mb-3">{t("contactInfo")}</h5>

                    <div className="contact-row">
                        <div className="contact-icon"><i className="fa fa-phone"></i></div>
                        <div>
                            <strong>Phone</strong><br/>
                            <a href={`tel:${getField("phone_number")}`} className="text-decoration-none">{getField("phone_number")}</a>
                        </div>
                    </div>

                    <div className="contact-row">
                        <div className="contact-icon"><i className="fa fa-envelope"></i></div>
                        <div>
                            <strong>Email</strong><br/>
                            {getField("email")}
                        </div>
                    </div>

                    <div className="contact-row">
                        <div className="contact-icon"><i className="fa fa-map-marker"></i></div>
                        <div>
                            <strong>Address</strong><br/>
                            {getField("address")}<br/>
                            <span className="text-muted small">Landmark: {getField("landmark")}</span>
                        </div>
                    </div>

                    {/* Offers Button */}
                    <button className="offer-btn mt-4" onClick={() => {
                        navigate(`/offers/shop/${shopId}/`, {
                            state: { shop: restoredState.shop, city: restoredState.city },
                        });
                    }}>
                       🎉 {t("offers")}
                    </button>

                    <hr className="my-4" />

                    {/* Related Shops */}
                    <h5 className="section-title mb-3" style={{fontSize:'1rem'}}>{t("moreShops")}</h5>
                    <div className="d-flex flex-column gap-2">
                        {relatedShops.length > 0 ? relatedShops.slice(0, 4).map((rs, idx) => (
                            <RelatedCard key={idx} data={rs} navigate={navigate} />
                        )) : (
                            <div className="text-muted small">No related shops found.</div>
                        )}
                    </div>

                </div>
            </div>
        </div>

      </div>
    </>
  );
}

// ==========================================================
// RELATED CARD COMPONENT
// ==========================================================
const RelatedCard = ({ data, navigate }) => {
  const shop = data.shop || {};
  const city = data.city || {};
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    setPhoto(null);
    if (!shop._id) return;
    fetch(`http://127.0.0.1:8000/shop/${shop._id}/media/`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status && json.media) {
          const firstImg = json.media.find(item => item.type === 'image');
          if (firstImg) setPhoto(`http://127.0.0.1:8000/${firstImg.path}`);
        }
      })
      .catch(err => console.log(err));
  }, [shop]);

  return (
    <div
        className="related-card"
        onClick={() => {
            const shopObj = data.shop || data.shop?.shop || data;
            const cityObj = data.city || data.shop?.city || {};
            // Set Selected Shop to this new one
            sessionStorage.setItem("SELECTED_SHOP", JSON.stringify({ shop: shopObj, city: cityObj }));
            window.scrollTo({ top: 0 });
            // Force navigation to same page with new state
            navigate("/shop", { replace: true, state: { shop: shopObj, city: cityObj } });
        }}
    >
        {photo ? (
            <img src={photo} className="related-img" alt={shop.shop_name} />
        ) : (
            <div className="related-img d-flex align-items-center justify-content-center text-muted small">No Img</div>
        )}
        <div>
            <div className="fw-bold text-dark text-truncate" style={{maxWidth: '150px'}}>{shop.shop_name}</div>
            <div className="text-muted small mb-1">{city.city_name}</div>
            <div className="text-warning small">View Details →</div>
        </div>
    </div>
  );
};

export default ShopDetails;

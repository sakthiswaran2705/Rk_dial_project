import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ShopDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();

 
  let restoredState = state;
  if (!restoredState) {
    const saved = localStorage.getItem("REDIRECT_AFTER_LOGIN");
    if (saved) {
      restoredState = JSON.parse(saved);
      localStorage.removeItem("REDIRECT_AFTER_LOGIN");
    }
  }

  if (!restoredState) {
    return (
      <div className="container mt-4">
        <button className="btn btn-secondary mb-3" onClick={() => navigate("/")}>
  Back
</button>

        <h3>No Shop Data Found</h3>
      </div>
    );
  }

  const user = localStorage.getItem("USER_ID");

  const normalizeShop = (data) => {
    if (!data) return {};
    if (data._id) return data;
    if (data.shop?._id) return data.shop;
    if (data.shop?.shop?._id) return data.shop.shop;
    return data;
  };

  const shopDoc = normalizeShop(restoredState.shop);
  const cityDoc = restoredState.city || restoredState.shop?.city || {};

  const getField = (key) => shopDoc?.[key] ?? "";

  const [photos, setPhotos] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [relatedShops, setRelatedShops] = useState([]);

  const shopId =
    shopDoc?._id ||
    shopDoc?.shop_id ||
    shopDoc?.id ||
    restoredState?.shop?._id;

  console.log("USING SHOP ID:", shopId);

  // LOAD PHOTOS
  useEffect(() => {
    if (!shopId) return;

    fetch(`http://127.0.0.1:8000/shop/photos?id=${shopId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status) {
          const converted = json.photos.map((p) =>
            p.startsWith("data:")
              ? p
              : `data:image/png;base64,${p.replace(/\s/g, "")}`
          );
          setPhotos(converted);
          setMainImage(converted[0] || null);
        }
      });
  }, [shopId]);

  // LOAD REVIEWS
  useEffect(() => {
    if (!shopId) return;

    fetch(`http://127.0.0.1:8000/shop/reviews?id=${shopId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status) {
          setReviews(json.reviews || []);
          if (json.reviews?.length > 0) {
            const sum = json.reviews.reduce((a, b) => a + b.rating, 0);
            setAvgRating((sum / json.reviews.length).toFixed(1));
          }
        }
      });
  }, [shopId]);

  const submitReview = async () => {
    if (!user) {
      localStorage.setItem(
        "REDIRECT_AFTER_LOGIN",
        JSON.stringify({
          shop: restoredState.shop,
          city: restoredState.city,
        })
      );
      alert("Please login to add review");
      return navigate("/login");
    }

    if (!rating) return alert("Select rating");
    if (!reviewText.trim()) return alert("Enter review");

    const payload = {
      shop_id: shopId,
      rating,
      review: reviewText,
    };

    const res = await fetch("http://127.0.0.1:8000/shop/review/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.status) {
      const newList = [...reviews, json.data];
      setReviews(newList);
      const sum = newList.reduce((a, b) => a + b.rating, 0);
      setAvgRating((sum / newList.length).toFixed(1));
      setReviewText("");
      setRating(0);
    }
  };

  // IMAGE SLIDER
  const nextImage = () => {
    if (photos.length <= 1) return;
    const idx = (currentIndex + 1) % photos.length;
    setMainImage(photos[idx]);
    setCurrentIndex(idx);
  };

  const prevImage = () => {
    if (photos.length <= 1) return;
    const idx = (currentIndex - 1 + photos.length) % photos.length;
    setMainImage(photos[idx]);
    setCurrentIndex(idx);
  };

  // RELATED SHOPS
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("SELECTED_SHOP"));
    const all = JSON.parse(localStorage.getItem("HOME_RESULTS")) || [];

    if (!selected || !all.length) return;

    const filtered = all.filter((item) => {
      const s = item.shop || item.shop?.shop || item;
      return s._id !== selected.shop._id;
    });

    const normalized = filtered.map((i) => ({
      shop: i.shop || i.shop?.shop || i,
      city: i.city || i.shop?.city || {},
    }));

    setRelatedShops(normalized);
  }, [shopId]);

  return (
    <div className="container mt-4">

      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="card p-3 shadow-sm">

        {/* MAIN IMAGE */}
        <div className="row mb-3">
          <div className="col-lg-8 col-12">
            {mainImage && (
              <div
                style={{
                  width: "100%",
                  height: 420,
                  borderRadius: 10,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {photos.length > 1 && (
                  <div style={arrowLeft} onClick={prevImage}>
                    {"<"}
                  </div>
                )}

                <img
                  src={mainImage}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {photos.length > 1 && (
                  <div style={arrowRight} onClick={nextImage}>
                    {">"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SMALL IMAGES */}
          <div className="col-lg-4 col-12 mt-lg-0 mt-3">
            <div className="d-flex flex-wrap gap-2">
              {photos.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setMainImage(img);
                    setCurrentIndex(i + 1);
                  }}
                  style={{
                    width: "48%",
                    height: 100,
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={img}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <h2>{getField("shop_name")}</h2>

        <h5 style={{ color: "#f7b500" }}>
          {avgRating
            ? "★".repeat(Math.round(avgRating)) +
              "☆".repeat(5 - Math.round(avgRating)) +
              ` (${avgRating})`
            : "No Rating"}
        </h5>

        <p className="text-muted">
          {cityDoc.city_name} {cityDoc.district}
        </p>

        <h5>Description</h5>
        <p>{getField("description")}</p>

        <h5>Email</h5>
        <p>{getField("email")}</p>

        <h5>Landmark</h5>
        <p>{getField("landmark")}</p>

        <h5>Address</h5>
        <p>{getField("address")}</p>

        <h5>Contact</h5>
        <p>📞 {getField("phone_number")}</p>

        {/* REVIEWS */}
        <hr />
        <h4>Reviews</h4>

   
        {!user && (
          <div className="p-3 bg-light border rounded mb-3">
            <p className="mb-2">Please login to add a review.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem(
                  "REDIRECT_AFTER_LOGIN",
                  JSON.stringify({
                    shop: restoredState.shop,
                    city: restoredState.city,
                  })
                );
                navigate("/login");
              }}
            >
              Login
            </button>
          </div>
        )}

  
        {user && (
          <div className="p-3 bg-light border rounded mb-3">
            <h6>Add Review</h6>

            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  onClick={() => setRating(num)}
                  style={{
                    width: 48,
                    height: 48,
                    border: "2px solid #ccc",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 28,
                    background: num <= rating ? "#fff4bf" : "#fff",
                    color: num <= rating ? "#ffb800" : "#999",
                  }}
                >
                  
                </div>
              ))}
            </div>

            <textarea
              className="form-control mb-2"
              placeholder="Write review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button className="btn btn-primary" onClick={submitReview}>
              Submit
            </button>
          </div>
        )}

        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((r, i) => (
            <div key={i} className="p-2 border rounded mb-2">
              <strong style={{ color: "#f7b500" }}>
                {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
              </strong>
              <p className="mb-1">{r.review}</p>
              <small className="text-muted">User</small>
            </div>
          ))
        )}

        {/* RELATED SHOPS */}
        <hr />
        <h4>Related Shops</h4>

        <div className="row">
          {relatedShops.map((rs, idx) => (
            <RelatedCard key={idx} data={rs} navigate={navigate} />
          ))}
        </div>

      </div>
    </div>
  );
}

const RelatedCard = ({ data, navigate }) => {
  const shop = data.shop || {};
  const city = data.city || {};
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    if (!shop._id) return;

    fetch(`http://127.0.0.1:8000/shop/photos?id=${shop._id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status && json.photos.length > 0) {
          const p = json.photos[0];
          setPhoto(
            p.startsWith("data:")
              ? p
              : `data:image/png;base64,${p.replace(/\s/g, "")}`
          );
        }
      });
  }, [shop]);

  return (
    <div className="col-12 mb-3">
      <div
        className="card p-2 d-flex flex-row"
        style={{ cursor: "pointer", gap: 12 }}
        onClick={() => {
          const shopObj = data.shop || data.shop?.shop || data;
          const cityObj = data.city || data.shop?.city || {};

          navigate("/shop", { state: { shop: shopObj, city: cityObj } });

          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }, 100);
        }}
      >
        {photo && (
          <img
            src={photo}
            style={{
              width: 140,
              height: 100,
              borderRadius: 8,
              objectFit: "cover",
            }}
          />
        )}

        <div>
          <h6>{shop.shop_name}</h6>
          <p className="text-muted">
            {city.city_name} {city.district}
          </p>
          <p>{(shop.description || "").substring(0, 120)}...</p>
        </div>
      </div>
    </div>
  );
};

// ARROWS
const arrowLeft = {
  position: "absolute",
  left: 10,
  top: "45%",
  fontSize: 28,
  background: "rgba(0,0,0,0.4)",
  padding: "4px 10px",
  borderRadius: 8,
  color: "white",
  cursor: "pointer",
};

const arrowRight = {
  position: "absolute",
  right: 10,
  top: "45%",
  fontSize: 28,
  background: "rgba(0,0,0,0.4)",
  padding: "4px 10px",
  borderRadius: 8,
  color: "white",
  cursor: "pointer",
};

export default ShopDetails;

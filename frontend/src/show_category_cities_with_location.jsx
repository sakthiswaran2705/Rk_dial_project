
import React, { useState, useEffect, useRef } from "react";
import { Button, InputGroup } from "@blueprintjs/core";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "./flamingtext_com-267266537.png";
import { usePageStore } from "./PageStore.jsx";

const localBanner = "";
const bannerVideo =
  "https://clio-assets.adobe.com/clio-playground/video-cache/video-generation/mp4/Firefly_IN_APP_VIDEO2_16x9_UPDATE_V2_2.mp4";

function Val() {
  const navigate = useNavigate();
  const location = useLocation();

  const { valData, setValData } = usePageStore();

  const uid = localStorage.getItem("USER_ID");

  const resultRef = useRef(null);
  const categoriesRef = useRef(null);

  const [categoryInput, setCategoryInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [categoryList, setCategoryList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [recentSearch, setRecentSearch] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [useVideoBanner] = useState(true);

  const getCurrentCity = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

          const res = await fetch(url);
          const data = await res.json();

          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state_district ||
            data.address.state ||
            "";

          if (!city) return alert("City not found");

          setCityInput(city);
        } catch (e) {
          console.error(e);
          alert("Location error");
        }
      },
      (err) => {
        alert("Enable location & try again");
      }
    );
  };

  // Restore saved state on return
  useEffect(() => {
    if (valData) {
      setCategoryInput(valData.categoryInput || "");
      setCityInput(valData.cityInput || "");
      setResults(valData.results || []);
      setTimeout(() => window.scrollTo(0, valData.scroll || 0), 50);
    }
  }, []);

  // Save global before leaving Val
  const saveGlobalState = () => {
    setValData({
      categoryInput,
      cityInput,
      results,
      scroll: window.scrollY,
    });
  };

  // Load initial
  useEffect(() => {
    loadCategories();
    loadRecent();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/category/get");
      const json = await res.json();
      setCategoryList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecent = () => {
    const r = localStorage.getItem("recentSearch");
    if (r) setRecentSearch(JSON.parse(r));
  };

  const saveRecent = (txt) => {
    let arr = [txt, ...recentSearch.filter((x) => x !== txt)];
    if (arr.length > 8) arr = arr.slice(0, 8);
    setRecentSearch(arr);
    localStorage.setItem("recentSearch", JSON.stringify(arr));
  };

  const loadCategorySuggestion = async (value) => {
    if (!value?.trim()) return setSuggestions([]);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/category/static/?name=${encodeURIComponent(
          value
        )}`
      );
      const json = await res.json();

      let list = [];

      (json.data || []).forEach((item) => {
        if (item.categories) {
          item.categories.forEach((c) => {
            if (c.name?.toLowerCase()?.includes(value.toLowerCase()))
              list.push(c.name);
          });
        }

        if (item.shops) {
          item.shops.forEach((s) => {
            if (s.shop?.shop_name?.toLowerCase()?.includes(value.toLowerCase()))
              list.push(s.shop.shop_name);
          });
        }

        if (item.shop?.shop_name?.toLowerCase()?.includes(value.toLowerCase())) {
          list.push(item.shop.shop_name);
        }
      });

      setSuggestions([...new Set(list)].slice(0, 12));
    } catch (err) {
      console.error(err);
    }
  };

  const loadCitySuggestion = async (value) => {
    if (!value?.trim()) return setCitySuggestions([]);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/search_city?query=${encodeURIComponent(value)}`
      );
      const json = await res.json();
      const list = [...new Set((json.data || []).map((c) => c.city_name))];
      setCitySuggestions(list.slice(0, 8));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryClick = async (cat) => {
    if (!cat?._id) return;

    setCategoryInput(cat.name);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/category/static/?id=${cat._id}`
      );
      const json = await res.json();

      let shops = [];
      (json.data || []).forEach((item) => {
        if (item.shop) shops.push(item);
        if (item.shops) item.shops.forEach((s) => shops.push(s));
      });

      setResults(shops);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err) {
      console.error(err);
    }
  };

  const trimDescription = (text, limit = 120) => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.substring(0, limit) + " ... Read More";
  };

  const searchNow = async () => {
    if (!categoryInput || !cityInput) return alert("Fill both fields");

    saveRecent(categoryInput);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/category/static/?name=${encodeURIComponent(
          categoryInput
        )}&place=${encodeURIComponent(cityInput)}`
      );

      const json = await res.json();
      setResults(json.data || []);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err) {
      console.error(err);
    }
  };

  const renderCategoryIcon = (cat, size = 56) => {
    if (cat?.category_image) {
      const clean = cat.category_image.replace(/\s/g, "");
      return (
        <img
          src={`data:image/png;base64,${clean}`}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            objectFit: "cover",
          }}
          alt="category"
        />
      );
    }

    return (
      <div
        style={{
          width: size,
          height: size,
          background: "#f2f6fb",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#555",
        }}
      >
        {cat.name?.[0]?.toUpperCase()}
      </div>
    );
  };

  const navSaveAndGo = (path, state = null) => {
    saveGlobalState();
    if (state) navigate(path, { state });
    else navigate(path);
  };

  const makeShopState = (item) => {
    const shop = item?.shop || item?.shop?.shop || item || {};
    const city = item?.city || item.city || (item?.shop && item.shop.city) || {};
    return { shop, city };
  };

  return (
    <div>
      {/* NAVBAR */}
      <nav
        className="navbar navbar-light bg-white shadow-sm"
        style={{ position: "sticky", top: 0, zIndex: 200 }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          <img
            src={logo}
            alt="RK Dail Logo"
            onClick={() => navSaveAndGo("/")}
            style={{
              height: 50,
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />

          <div className="d-flex gap-4 align-items-center">
            <span style={{ cursor: "pointer" }} onClick={() => navSaveAndGo("/")}>
              Home
            </span>

            <span
              style={{ cursor: "pointer" }}
              onClick={() =>
                categoriesRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Category
            </span>

            <span
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => navSaveAndGo("/plan")}
            >
              Plan
            </span>

            <span
              style={{ cursor: "pointer" }}
              onClick={() => navSaveAndGo("/contact")}
            >
              Contact
            </span>

            {/* LOGIN / PROFILE */}
            {!uid ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => navSaveAndGo("/login")}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
                  style={{ width: 28, height: 28, borderRadius: "50%" }}
                  alt="login"
                />
                <span style={{ fontSize: 12 }}>Login</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => navSaveAndGo("/dashboard")}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "2px solid #0d6efd",
                    padding: 2,
                  }}
                  alt="profile"
                />
                <span style={{ fontSize: 12 }}>My Profile</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div className="container mt-4">
        {/* SEARCH BAR */}
        <div className="d-flex gap-3 mb-4 align-items-center">
          {/* CATEGORY INPUT */}
          <div style={{ width: 320, position: "relative" }}>
            <InputGroup
              placeholder="Search Category / Shop..."
              value={categoryInput}
              onFocus={() => setShowRecent(true)}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                loadCategorySuggestion(e.target.value);
                setShowRecent(true);
              }}
            />

            {(showRecent || suggestions.length > 0) && (
              <div
                className="border bg-white"
                style={{
                  position: "absolute",
                  width: "100%",
                  zIndex: 999,
                  maxHeight: 260,
                  overflowY: "auto",
                  marginTop: 4,
                  borderRadius: 4,
                }}
              >
                {/* RECENT SEARCH */}
                {showRecent && !categoryInput && recentSearch.length > 0 && (
                  <>
                    <div
                      className="p-2 text-muted"
                      style={{
                        fontSize: 12,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      Recent Searches
                    </div>

                    {recentSearch.map((item, index) => (
                      <div
                        key={index}
                        className="p-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setCategoryInput(item);
                          setShowRecent(false);
                        }}
                      >
                        🔍 {item}
                      </div>
                    ))}

                    <div
                      className="p-2 text-danger"
                      style={{
                        cursor: "pointer",
                        borderTop: "1px solid #eee",
                        fontSize: 13,
                      }}
                      onClick={() => {
                        localStorage.removeItem("recentSearch");
                        setRecentSearch([]);
                      }}
                    >
                      Clear Recent
                    </div>
                  </>
                )}

                {/* CATEGORY SUGGESTIONS */}
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="p-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setCategoryInput(item);
                      setSuggestions([]);
                      setShowRecent(false);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>


          <div style={{ width: 300, position: "relative" }}>
            <InputGroup
              placeholder="City..."
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value);
                loadCitySuggestion(e.target.value);
              }}
              rightElement={
                <Button
                  small
                  minimal
                  icon="locate"
                  onClick={getCurrentCity}
                  title="Use My Current Location"
                />
              }
            />

            {citySuggestions.length > 0 && (
              <div
                className="border bg-white"
                style={{
                  position: "absolute",
                  width: "100%",
                  zIndex: 999,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {citySuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setCityInput(item);
                      setCitySuggestions([]);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button intent="primary" onClick={searchNow}>
            Search
          </Button>
        </div>

        {/* BANNER */}
        <div className="row">
          <div className="col-12 mb-3">
            {useVideoBanner ? (
              <video
                src={bannerVideo}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: 260,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
            ) : (
              <img
                src={localBanner}
                alt="banner"
                style={{
                  width: "100%",
                  height: 260,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
            )}
          </div>
        </div>

        {/* CATEGORY STRIP */}
        <div
          ref={categoriesRef}
          className="mb-4"
          style={{ scrollMarginTop: "120px" }}
        >
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              gap: 14,
              padding: "10px 6px",
              alignItems: "center",
            }}
          >
            {categoryList.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className="text-center bg-white shadow-sm"
                style={{
                  minWidth: 110,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {renderCategoryIcon(cat, 64)}
                <div
                  style={{
                    fontSize: 13,
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 96,
                  }}
                >
                  {cat.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH RESULTS */}
        <div ref={resultRef} className="mt-2">
          {results.length > 0 ? (
            <>
              <h4>Search Results</h4>

              {results.map((item, i) => {
                const s = item.shop || item.shop?.shop || item;
                const c = item.city || item.city || s.city || {};
                let img = "";

                if (item.photo?.data) {
                  img = `data:${item.photo.content_type};base64,${item.photo.data}`;
                } else if (s.photos?.[0]) {
                  img = s.photos[0].startsWith("data:")
                    ? s.photos[0]
                    : `data:image/png;base64,${s.photos[0].replace(/\s/g, "")}`;
                }

                return (
                  <div
                    key={i}
                    className="d-flex gap-3 p-3 mb-3 border rounded shadow-sm align-items-start"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      saveGlobalState();
                      localStorage.setItem(
                        "HOME_RESULTS",
                        JSON.stringify(results)
                      );
                      const shopState = makeShopState(item);
                      localStorage.setItem(
                        "SELECTED_SHOP",
                        JSON.stringify(shopState)
                      );
                      navigate("/shop", { state: shopState });
                    }}
                  >
                    <img
                      src={img || "https://via.placeholder.com/150"}
                      style={{
                        width: 150,
                        height: 110,
                        borderRadius: 10,
                        objectFit: "cover",
                      }}
                      alt="shop"
                    />

                    <div>
                      <h5 style={{ marginBottom: 6 }}>{s.shop_name}</h5>

                      {item.avg_rating !== undefined && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              background: "#0d6efd",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            ⭐ {item.avg_rating}
                          </span>

                          <span style={{ fontSize: 13, color: "#777" }}>
                            ({item.reviews_count} reviews)
                          </span>
                        </div>
                      )}

                      <p className="text-muted" style={{ marginBottom: 6 }}>
                        {c.city_name} {c.district}
                      </p>

                      <p style={{ color: "#555" }}>
                        {trimDescription(s.description)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center text-muted py-4">
              No results to show. Search category or click a category above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Val;

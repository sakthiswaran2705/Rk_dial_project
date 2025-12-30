import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, InputGroup, Spinner } from "@blueprintjs/core";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "./Navbar.jsx";
// 👇 ENSURE THIS IMAGE PATH IS CORRECT
import heroBgImage from "./image_cc786f.jpg";

// ---------------- DEBOUNCE HOOK (Prevents API spamming) ----------------
const useDebounce = (callback, delay) => {
    const timer = useRef(null);
    return useCallback(
        (...args) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => callback(...args), delay);
        },
        [callback, delay]
    );
};

function Val() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || localStorage.getItem("LANG") || "en";

    const categoriesRef = useRef(null);

    // ---------------- STATE VARIABLES ----------------
    const [categoryInput, setCategoryInput] = useState("");
    const [cityInput, setCityInput] = useState(sessionStorage.getItem("CITY_NAME") || "");

    // Data Lists
    const [categoryList, setCategoryList] = useState([]);

    // Search Suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [recentSearch, setRecentSearch] = useState([]);

    // UI Toggles
    const [showRecent, setShowRecent] = useState(false);

    // Slideshow
    const [slides, setSlides] = useState([]);
    const [isSlidesLoading, setIsSlidesLoading] = useState(false);

    // ---------------- 1. INITIAL LOADS ----------------
    useEffect(() => {
        // Load Categories for the grid below
        const loadCategories = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/category/list/?lang=${lang}`);
                const json = await res.json();
                setCategoryList(json.data || []);
            } catch (err) {
                console.error("Category Load Error:", err);
            }
        };

        // Load Recent Searches from LocalStorage
        const loadRecent = () => {
            const r = localStorage.getItem("recentSearch");
            if (r) setRecentSearch(JSON.parse(r));
        };

        loadCategories();
        loadRecent();
    }, [lang]);

    // ---------------- 2. AUTO LOCATION (IP) ----------------
    useEffect(() => {
        if (cityInput || sessionStorage.getItem("CITY_NAME")) return;

        const fetchIPLocation = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                if (data.city) {
                    setCityInput(data.city);
                    sessionStorage.setItem("CITY_NAME", data.city);
                }
            } catch (err) {
                console.error("Auto Location Failed:", err);
            }
        };
        fetchIPLocation();
    }, []);

    // ---------------- 3. MANUAL GPS LOCATION ----------------
    const getCurrentCity = () => {
        if (!navigator.geolocation) return alert(t("geolocation not supported"));
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    const city = data.address.city || data.address.town || data.address.village || "";
                    if (!city) return alert(t("city not found"));
                    setCityInput(city);
                    sessionStorage.setItem("CITY_NAME", city);
                } catch (err) {
                    console.error(err);
                }
            },
            () => alert(t("enable location access"))
        );
    };

    // ---------------- 4. SEARCH SUGGESTION API LOGIC ----------------

    // A. FETCH CATEGORY/SHOP SUGGESTIONS
    const fetchCategorySuggestions = async (value) => {
        if (!value.trim()) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`http://127.0.0.1:8000/shop/search/?name=${encodeURIComponent(value)}&lang=${lang}`);
            const json = await res.json();

            let list = [];
            const data = json.data || [];

            // Extract names from response
            data.forEach((item) => {
                // If it's a shop
                const shopName = item.shop?.shop_name || item.shop_name;
                if (shopName && shopName.toLowerCase().includes(value.toLowerCase())) {
                    list.push(shopName);
                }
                // If it has categories
                if (item.categories) {
                    item.categories.forEach((c) => {
                        if (c.name && c.name.toLowerCase().includes(value.toLowerCase())) {
                            list.push(c.name);
                        }
                    });
                }
            });

            // Remove duplicates and limit to 10
            const uniqueList = [...new Set(list)].slice(0, 10);
            setSuggestions(uniqueList);
        } catch (err) {
            console.error(err);
            setSuggestions([]);
        }
    };

    // B. FETCH CITY SUGGESTIONS
    const fetchCitySuggestions = async (value) => {
        if (value.trim().length < 2) {
            setCitySuggestions([]);
            return;
        }
        try {
            const res = await fetch(`http://127.0.0.1:8000/city/search/?city_name=${encodeURIComponent(value)}&lang=${lang}`);
            const json = await res.json();

            // Extract city names
            const list = (json.data || [])
                .map((c) => c.city_name)
                .filter((name) => name && name.toLowerCase().includes(value.toLowerCase()));

            // Remove duplicates and limit
            setCitySuggestions([...new Set(list)].slice(0, 8));
        } catch (err) {
            console.error(err);
            setCitySuggestions([]);
        }
    };

    // Apply Debounce
    const debouncedCat = useDebounce(fetchCategorySuggestions, 300);
    const debouncedCity = useDebounce(fetchCitySuggestions, 300);

    // ---------------- 5. SEARCH EXECUTION ----------------
    const searchNow = (category = categoryInput, city = cityInput) => {
        if (!category || !city) return alert(t("fill_both_fields"));

        // Save to Recent Search
        let arr = [category, ...recentSearch.filter((x) => x !== category)];
        if (arr.length > 8) arr = arr.slice(0, 8);
        setRecentSearch(arr);
        localStorage.setItem("recentSearch", JSON.stringify(arr));

        sessionStorage.setItem("CITY_NAME", city);

        // Redirect to Results Page
        navigate(`/results?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`);
    };

    const handleCategoryClick = (cat) => {
        if (!cat?.name || !cityInput) return alert(t("select_city_first"));
        setCategoryInput(cat.name);
        searchNow(cat.name, cityInput);
    };

    // ---------------- 6. SLIDESHOW LOGIC ----------------
    useEffect(() => {
        if (!cityInput || cityInput.length < 3) {
            setSlides([]);
            return;
        }
        const controller = new AbortController();
        const fetchSlides = async () => {
            setIsSlidesLoading(true);
            try {
                const res = await fetch(
                    `http://127.0.0.1:8000/offers/${encodeURIComponent(cityInput)}/?lang=${lang}`,
                    { signal: controller.signal }
                );
                const json = await res.json();
                if (json.status) {
                    const formatted = (json.slides || []).map((off) => ({
                        offer_id: off.offer_id,
                        type: off.type,
                        path: off.path,
                        shopName: off.shop?.shop_name || ""
                    }));
                    setSlides(formatted);
                } else {
                    setSlides([]);
                }
            } catch (err) {
                if (err.name !== "AbortError") console.error(err);
            } finally {
                if (!controller.signal.aborted) setIsSlidesLoading(false);
            }
        };
        const timeoutId = setTimeout(() => fetchSlides(), 800);
        return () => { clearTimeout(timeoutId); controller.abort(); };
    }, [cityInput, lang]);

    const Slideshow = () => {
        const [index, setIndex] = useState(0);
        useEffect(() => {
            if (slides.length === 0) return;
            const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
            return () => clearInterval(id);
        }, [slides]);

        if (isSlidesLoading) return <div className="modern-slideshow-container d-flex align-items-center justify-content-center bg-dark"><Spinner intent="primary" size={50} /></div>;
        if (slides.length === 0) return null;

        const current = slides[index];
        const url = `http://127.0.0.1:8000/${current.path}`;

        return (
            <div className="modern-slideshow-container">
                <div className="slide-arrow left" onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}>‹</div>
                <div className="slide-arrow right" onClick={() => setIndex((i) => (i + 1) % slides.length)}>›</div>

                {current.type === "video" ? (
                     <video src={url} autoPlay muted loop className="slide-media" onClick={() => navigate(`/offer/details/${current.offer_id}`)} />
                ) : (
                    <img src={url} alt="Offer" className="slide-media" onClick={() => navigate(`/offer/details/${current.offer_id}`)} />
                )}

                <div className="slide-cta" onClick={() => navigate(`/offer/details/${current.offer_id}`)}>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
                        {current.shopName && <span style={{fontSize:'0.75rem', color:'#666', marginBottom:2}}>{current.shopName}</span>}
                        <div style={{display:'flex', alignItems:'center', gap:5}}> {t("View Offer")} <i className="bp4-icon bp4-icon-arrow-right"></i> </div>
                    </div>
                </div>
                <div className="slide-dots">
                    {slides.map((_, idx) => <span key={idx} className={`dot ${idx === index ? "active" : ""}`} onClick={() => setIndex(idx)}></span>)}
                </div>
            </div>
        );
    };

    // Helper for Category Icons
    const renderCategoryIcon = (cat) => {
        if (cat?.category_image) return <img src={`http://127.0.0.1:8000/${cat.category_image}`} alt={cat.name} className="cat-icon-img" />;
        return <div className="cat-icon-placeholder">{cat.name?.[0]?.toUpperCase()}</div>;
    };

    return (
        <>
            <style>
                {`
                :root {
                    --primary: #00c6ff; --primary-dark: #0072ff;
                    --primary-gradient: linear-gradient(135deg, #00c6ff, #0072ff);
                    --glass-bg: rgba(255, 255, 255, 0.85); --glass-border: 1px solid rgba(255, 255, 255, 0.6);
                    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                    --text-dark: #2d3748; --bg-light: #f7fafc;
                }
                body { background-color: var(--bg-light); font-family: 'Inter', sans-serif; overflow-x: hidden; }
                .hero-wrapper { position: relative; width: 100%; min-height: 480px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 20px 60px; margin-top: -60px; overflow: visible; }
                .hero-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background-image: url('${heroBgImage}'); background-size: cover; background-position: center; z-index: -2; filter: blur(4px); transform: scale(1.1); }
                .hero-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: linear-gradient(to bottom, rgba(0, 198, 255, 0.2), rgba(0, 114, 255, 0.5)); z-index: -1; }
                .hero-content { text-align: center; color: white; margin-bottom: 40px; z-index: 2; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
                .hero-title { font-size: 2.8rem; font-weight: 800; margin-bottom: 10px; }
                .hero-subtitle { font-size: 1.2rem; opacity: 0.95; font-weight: 500; }

                /* SEARCH BOX */
                .search-box-container { display: flex; width: 100%; max-width: 900px; background: var(--glass-bg); backdrop-filter: blur(16px); padding: 8px; border-radius: 50px; box-shadow: var(--glass-shadow); border: var(--glass-border); position: relative; z-index: 50; align-items: center; }
                .search-input-wrapper { flex: 1.5; position: relative; }
                .city-input-wrapper { flex: 1; position: relative; border-left: 1px solid rgba(0,0,0,0.1); padding-left: 15px; margin-left: 5px; }
                .bp4-input-group .bp4-input { background: transparent !important; box-shadow: none !important; border: none !important; height: 55px; font-size: 1.1rem; color: var(--text-dark); }
                .bp4-input-group .bp4-input:focus { outline: none !important; }
                .bp4-icon { color: var(--primary-dark) !important; font-size: 18px !important; }
                .search-btn { background: var(--primary-gradient) !important; border: none !important; border-radius: 40px !important; height: 55px; display: flex; align-items: center; justify-content: center; padding: 0 30px !important; margin-left: 10px; box-shadow: 0 4px 15px rgba(0, 198, 255, 0.4); color: white !important; font-weight: bold; font-size: 16px; }
                .search-btn:hover { transform: scale(1.05); }

                /* SUGGESTIONS DROPDOWN - Fixed Z-Index */
                .suggestions-box {
                    position: absolute; top: 65px; left: 0; width: 100%; background: #ffffff;
                    border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.3);
                    z-index: 99999; /* Very High Z-Index */
                    max-height: 300px; overflow-y: auto; padding: 10px 0; border: 1px solid rgba(0,0,0,0.1);
                }
                .suggestion-item { padding: 12px 20px; cursor: pointer; font-size: 15px; color: var(--text-dark); transition: background 0.2s; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f9f9f9; }
                .suggestion-item:hover { background: #eef8ff; color: var(--primary-dark); }

                /* OTHER STYLES */
                .content-area { background: transparent; min-height: 60vh; position: relative; z-index: 1; padding-top: 40px; }
                .section-header { font-size: 1.5rem; font-weight: 700; color: #2d3748; margin-bottom: 30px; border-left: 5px solid var(--primary); padding-left: 15px; }
                .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 20px; padding: 10px; }
                .cat-card { background: white; border: 1px solid #f0f0f0; box-shadow: 0 4px 8px rgba(0,0,0,0.03); border-radius: 16px; padding: 15px 5px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 120px; transition: all 0.3s; cursor: pointer; position: relative; }
                .cat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0, 198, 255, 0.15); border-color: #b2ebf2; }
                .cat-icon-img { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; background: #f9f9f9; }
                .cat-icon-placeholder { width: 45px; height: 45px; border-radius: 50%; background: var(--primary-gradient); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin-bottom: 12px; }
                .cat-name { font-size: 13px; font-weight: 600; color: var(--text-dark); text-align: center; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; padding: 0 4px; }
                .slideshow-wrapper { max-width: 950px; margin: 0 auto 50px auto; }
                .modern-slideshow-container { width: 100%; height: 350px; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15); border: 5px solid white; background: #000; }
                .slide-media { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; cursor: pointer; }
                .modern-slideshow-container:hover .slide-media { transform: scale(1.02); }
                .slide-cta { position: absolute; bottom: 25px; left: 25px; background: white; color: var(--text-dark); padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: all 0.3s; min-width: 140px; }
                .slide-cta:hover { background: var(--primary-dark); color: white; transform: translateY(-3px); }
                .slide-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.7); color: black; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; z-index: 10; transition: all 0.2s; }
                .slide-arrow:hover { background: white; box-shadow: 0 0 10px rgba(0,0,0,0.3); }
                .slide-arrow.left { left: 20px; }
                .slide-arrow.right { right: 20px; }
                .slide-dots { position: absolute; bottom: 15px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 9; }
                .dot { width: 8px; height: 8px; background: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; }
                .dot.active { background: white; transform: scale(1.2); }

                /* FOOTER POLICY LINKS */
                .footer-nav { margin-top: 15px; display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }
                .footer-link { font-size: 0.9rem; color: #555; text-decoration: none; transition: color 0.3s; font-weight: 500; }
                .footer-link:hover { color: var(--primary-dark); text-decoration: underline; }

                @media (max-width: 768px) {
                    .hero-title { font-size: 2rem; }
                    .hero-wrapper { padding-top: 80px; min-height: auto; padding-bottom: 40px; }
                    .search-box-container { flex-direction: column; border-radius: 24px; background: rgba(255,255,255,0.95); padding: 15px; align-items: stretch; }
                    .search-input-wrapper, .city-input-wrapper { width: 100%; border-left: none; border-bottom: 1px solid rgba(0,0,0,0.1); padding-left: 0; margin-left: 0; margin-bottom: 10px; }
                    .city-input-wrapper { border-bottom: none; margin-bottom: 15px; }
                    .search-btn { width: 100%; border-radius: 30px !important; margin-left: 0; margin-top: 5px; }
                    .modern-slideshow-container { height: 220px; }
                    .category-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
                    .cat-card { min-height: 100px; }
                    .cat-name { font-size: 11px; }
                    .footer-nav { gap: 15px; flex-direction: column; align-items: center; }
                }
                `}
            </style>

            <Navbar />

            {/* BACKGROUND */}
            <div className="hero-bg"></div>
            <div className="hero-overlay"></div>

            {/* HERO CONTENT */}
            <div className="hero-wrapper">
                <div className="hero-content">
                    <h1 className="hero-title">{t("Communication is the key for global business")}</h1>
                    <p className="hero-subtitle">{t("Discover trusted local businesses near you.")}</p>
                </div>

                <div className="search-box-container">
                    {/* 1. CATEGORY SEARCH INPUT */}
                    <div className="search-input-wrapper">
                        <InputGroup
                            placeholder={t("Search by category, service, or business name...")}
                            value={categoryInput}
                            large
                            leftIcon="search"
                            autoComplete="off"
                            onFocus={() => setShowRecent(true)}
                            onChange={(e) => {
                                setCategoryInput(e.target.value);
                                debouncedCat(e.target.value);
                                setShowRecent(true);
                            }}
                        />
                        {/* SUGGESTION DROPDOWN */}
                        {(showRecent || suggestions.length > 0) && (
                            <div className="suggestions-box">
                                {/* Recent Searches */}
                                {showRecent && !categoryInput && recentSearch.length > 0 && (
                                    <>
                                        <div style={{padding:'8px 20px', fontSize:12, color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>
                                            {t("recent searches")}
                                        </div>
                                        {recentSearch.map((item, index) => (
                                            <div key={index} className="suggestion-item"
                                                 onClick={() => {
                                                     setCategoryInput(item);
                                                     setShowRecent(false);
                                                     setSuggestions([]);
                                                 }}>
                                                <i className="bp4-icon bp4-icon-history"></i> {item}
                                            </div>
                                        ))}
                                        <div className="suggestion-item text-danger" style={{justifyContent:'center', fontSize:13, fontWeight: 600}}
                                             onClick={() => { localStorage.removeItem("recentSearch"); setRecentSearch([]); }}>
                                            {t("Clear Recent Searches")}
                                        </div>
                                    </>
                                )}

                                {/* API Suggestions */}
                                {suggestions.map((item, index) => (
                                    <div key={index} className="suggestion-item"
                                         onClick={() => {
                                             setCategoryInput(item);
                                             setSuggestions([]);
                                             setShowRecent(false);
                                         }}>
                                        <i className="bp4-icon bp4-icon-search" style={{color:'var(--primary-dark)'}}></i> {item}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. CITY SEARCH INPUT */}
                    <div className="city-input-wrapper">
                        <InputGroup
                            placeholder={t("City, State")}
                            value={cityInput}
                            large
                            leftIcon="map-marker"
                            autoComplete="off"
                            rightElement={<Button minimal icon="locate" onClick={getCurrentCity} />}
                            onChange={(e) => {
                                setCityInput(e.target.value);
                                sessionStorage.setItem("CITY_NAME", e.target.value);
                                debouncedCity(e.target.value);
                            }}
                        />
                        {/* CITY DROPDOWN */}
                        {citySuggestions.length > 0 && (
                            <div className="suggestions-box">
                                {citySuggestions.map((item, idx) => (
                                    <div key={idx} className="suggestion-item"
                                         onClick={() => {
                                             setCityInput(item);
                                             sessionStorage.setItem("CITY_NAME", item);
                                             setCitySuggestions([]);
                                         }}>
                                        <i className="bp4-icon bp4-icon-map-marker" style={{color:'#28a745'}}></i> {item}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. SEARCH BUTTON */}
                    <Button className="search-btn" onClick={() => searchNow()}>
                        <span className="d-none d-md-inline me-2">{t("Search")}</span>
                        <i className="bp4-icon bp4-icon-search"></i>
                    </Button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="content-area">
                <div className="container">

                    {/* SLIDESHOW */}
                    {(slides.length > 0 || isSlidesLoading) && (
                        <div className="slideshow-wrapper">
                            <h4 className="section-header" style={{color: 'white', borderLeftColor: 'white'}}>
                                {t("Exclusive Offers")} {isSlidesLoading && <Spinner size={15} style={{display:'inline-block', marginLeft:10}}/>}
                            </h4>
                            <Slideshow />
                        </div>
                    )}

                    {/* CATEGORY GRID */}
                    <div className="mb-5" ref={categoriesRef} style={{scrollMarginTop:'100px'}}>
                        <h4 className="section-header" style={{color:'white'}}>{t("Explore Categories")}</h4>
                        <div className="category-grid">
                            {categoryList.map((cat, idx) => (
                                <div key={idx} className="cat-card" onClick={() => handleCategoryClick(cat)}>
                                    {renderCategoryIcon(cat)}
                                    <div className="cat-name">{cat.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="container">
                    <footer className="text-center mt-5 pt-4 pb-4 border-top bg-white">
                        <div style={{fontWeight:600, fontSize:'1.1rem'}}>© {new Date().getFullYear()} Rk dial</div>
                        <div className="text-muted small mt-1">{t("Discover. Connect. Grow.")}</div>

                        {/* NEW POLICY LINKS */}
                        <div className="footer-nav">
                            <a href="/contact" target="_blank" rel="noopener noreferrer" className="footer-link">{t("Contact Us")}</a>
                            <a href="/shipping" target="_blank" rel="noopener noreferrer" className="footer-link">{t("Shipping Policy")}</a>
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="footer-link">{t("Privacy Policy")}</a>
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="footer-link">{t("Terms & Conditions")}</a>
                            <a href="/refund" target="_blank" rel="noopener noreferrer" className="footer-link">{t("Cancellation & Refund Policy")}</a>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}

export default Val;

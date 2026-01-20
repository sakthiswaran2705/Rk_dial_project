import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, InputGroup, Spinner, Icon } from "@blueprintjs/core";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "./Navbar.jsx";
// 👇 ENSURE THIS IMAGE PATH IS CORRECT
import heroBgImage from "./image_cc786f.jpg";

// ---------------- DEBOUNCE HOOK ----------------
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

// ---------------- ANIMATION VARIANTS ----------------
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

// ---------------- SKELETON LOADER COMPONENT ----------------
const SkeletonCard = () => (
    <div className="cat-card skeleton-card">
        <div className="skeleton-circle"></div>
        <div className="skeleton-line"></div>
    </div>
);

function Val() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || localStorage.getItem("LANG") || "en";

    // REF
    const categoriesRef = useRef(null);

    // ---------------- STATE VARIABLES ----------------
    const [categoryInput, setCategoryInput] = useState("");
    const [cityInput, setCityInput] = useState(sessionStorage.getItem("CITY_NAME") || "");

    // Store Coordinates for 25km logic
    const [coords, setCoords] = useState({
        lat: sessionStorage.getItem("LAT") || null,
        lon: sessionStorage.getItem("LON") || null
    });

    const [categoryList, setCategoryList] = useState([]);
    const [isCatLoading, setIsCatLoading] = useState(true);

    const [suggestions, setSuggestions] = useState([]);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [recentSearch, setRecentSearch] = useState([]);
    const [showRecent, setShowRecent] = useState(false);

    const [slides, setSlides] = useState([]);
    const [isSlidesLoading, setIsSlidesLoading] = useState(false);

    const [topRatedShops, setTopRatedShops] = useState([]);
    const [isTopRatedLoading, setIsTopRatedLoading] = useState(false);

    const [popup, setPopup] = useState(null);

    const showPopup = (type, message, title = "") => {
        setPopup({ type, message, title });
        setTimeout(() => setPopup(null), 3000);
    };

    // ---------------- 1. AUTO LOCATION (IP + COORDS) ----------------
    useEffect(() => {
        if (cityInput && coords.lat) return;

        const fetchIPLocation = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();

                if (data.city) {
                    setCityInput(data.city);
                    sessionStorage.setItem("CITY_NAME", data.city);
                }
                if (data.latitude && data.longitude) {
                    const newCoords = { lat: data.latitude, lon: data.longitude };
                    setCoords(newCoords);
                    sessionStorage.setItem("LAT", data.latitude);
                    sessionStorage.setItem("LON", data.longitude);
                }
            } catch (err) {
                console.error("Auto Location Failed:", err);
            }
        };
        fetchIPLocation();
    }, []);

    // ---------------- 2. FETCH DATA (Categories & Shops) ----------------
    useEffect(() => {
        const loadCategories = async () => {
            setIsCatLoading(true);
            try {
                const res = await fetch(`http://127.0.0.1:8000/category/list/?lang=${lang}`);
                const json = await res.json();
                setCategoryList(json.data || []);
            } catch (err) {
                console.error("Cat Error:", err);
            } finally {
                setIsCatLoading(false);
            }
        };

        loadCategories();

        const r = localStorage.getItem("recentSearch");
        if (r) setRecentSearch(JSON.parse(r));
    }, [lang]);

    // ---------------- 3. FETCH TOP RATED (Nearby 25km Logic) ----------------
    useEffect(() => {
        const loadTopRated = async () => {
            setIsTopRatedLoading(true);
            try {
                let url = `http://127.0.0.1:8000/shops/top-rated?lang=${lang}&limit=6`;

                if (cityInput) url += `&city=${encodeURIComponent(cityInput)}`;
                if (coords.lat && coords.lon) {
                    url += `&lat=${coords.lat}&lon=${coords.lon}&radius=25`;
                }

                const res = await fetch(url);
                const json = await res.json();

                if (json.status) {
                    setTopRatedShops(json.data || []);
                } else {
                    setTopRatedShops([]);
                }
            } catch (err) {
                console.error("Top Rated Error:", err);
            } finally {
                setIsTopRatedLoading(false);
            }
        };

        if (cityInput || (coords.lat && coords.lon)) {
            loadTopRated();
        }
    }, [cityInput, coords, lang]);

    // ---------------- 4. MANUAL GPS LOCATION ----------------
    const getCurrentCity = () => {
        if (!navigator.geolocation) return showPopup("error", t("geolocation not supported"), "Error");
        showPopup("info", "Fetching precise location...", "Please wait");

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                setCoords({ lat: latitude, lon: longitude });
                sessionStorage.setItem("LAT", latitude);
                sessionStorage.setItem("LON", longitude);

                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    const city = data.address.city || data.address.town || data.address.village || "";

                    if (city) {
                        setCityInput(city);
                        sessionStorage.setItem("CITY_NAME", city);
                        showPopup("success", `${city} (25km Radius Set)`, "Location Updated");
                    }
                } catch (err) {
                    console.error(err);
                    showPopup("warning", "Location coordinates set, but address failed.", "Partial Success");
                }
            },
            () => showPopup("warning", t("enable location access"), "Permission Denied")
        );
    };

    // ---------------- 5. SEARCH LOGIC (FIXED) ----------------
    const fetchCategorySuggestions = async (value) => {
        if (!value.trim()) { setSuggestions([]); return; }

        let list = [];
        const lowerValue = value.toLowerCase();

        // 1. Search Local Category List first
        if (categoryList.length > 0) {
            categoryList.forEach(cat => {
                if (cat.name.toLowerCase().includes(lowerValue)) {
                    list.push(cat.name);
                }
            });
        }

        // 2. Search Shop Names via API
        try {
            const res = await fetch(`http://127.0.0.1:8000/shop/search/?name=${encodeURIComponent(value)}&lang=${lang}`);
            const json = await res.json();
            const data = json.data || [];

            data.forEach((item) => {
                const shopName = item.shop?.shop_name || item.shop_name;
                if (shopName?.toLowerCase().includes(lowerValue)) list.push(shopName);

                item.categories?.forEach((c) => {
                    if (c.name?.toLowerCase().includes(lowerValue)) list.push(c.name);
                });
            });

            setSuggestions([...new Set(list)].slice(0, 10));

        } catch (err) {
            console.error(err);
            setSuggestions([...new Set(list)].slice(0, 10));
        }
    };

    const fetchCitySuggestions = async (value) => {
        if (value.trim().length < 2) { setCitySuggestions([]); return; }
        try {
            const res = await fetch(`http://127.0.0.1:8000/city/search/?city_name=${encodeURIComponent(value)}&lang=${lang}`);
            const json = await res.json();
            const list = (json.data || []).map((c) => c.city_name).filter((name) => name?.toLowerCase().includes(value.toLowerCase()));
            setCitySuggestions([...new Set(list)].slice(0, 8));
        } catch (err) { console.error(err); setCitySuggestions([]); }
    };

    const debouncedCat = useDebounce(fetchCategorySuggestions, 300);
    const debouncedCity = useDebounce(fetchCitySuggestions, 300);

    const searchNow = (category = categoryInput, city = cityInput) => {
        if (!category || !city) return showPopup("warning", t("Enter search details"), "Missing Information");

        let arr = [category, ...recentSearch.filter((x) => x !== category)];
        if (arr.length > 8) arr = arr.slice(0, 8);
        setRecentSearch(arr);
        localStorage.setItem("recentSearch", JSON.stringify(arr));
        sessionStorage.setItem("CITY_NAME", city);
        navigate(`/results?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`);
    };

    const handleCategoryClick = (cat) => {
        if (!cat?.name) return;
        setCategoryInput(cat.name);

        if(!cityInput) {
            showPopup("warning", t("select_city_first"), "Select City");
        } else {
            searchNow(cat.name, cityInput);
        }
    };

    // ---------------- 6. SLIDESHOW ----------------
    useEffect(() => {
        if (!cityInput || cityInput.length < 3) { setSlides([]); return; }
        const controller = new AbortController();
        const fetchSlides = async () => {
            setIsSlidesLoading(true);
            try {
                const res = await fetch(`http://127.0.0.1:8000/offers/${encodeURIComponent('coimbatore')}/?lang=${lang}`, { signal: controller.signal });
                const json = await res.json();
                if (json.status) {
                    setSlides((json.slides || []).map((off) => ({
                        offer_id: off.offer_id, type: off.type, path: off.path, shopName: off.shop?.shop_name || ""
                    })));
                } else setSlides([]);
            } catch (err) { if (err.name !== "AbortError") console.error(err); }
            finally { if (!controller.signal.aborted) setIsSlidesLoading(false); }
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

    // ---------------- 7. HELPERS ----------------
    const renderCategoryIcon = (cat) => {
        if (cat?.category_image) return <img src={`http://127.0.0.1:8000/${cat.category_image}`} alt={cat.name} className="cat-icon-img" onError={(e) => {e.target.style.display='none';}} />;
        return <div className="cat-icon-placeholder">{cat.name?.[0]?.toUpperCase()}</div>;
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) stars.push(<Icon key={i} icon="star" color="#fbbf24" iconSize={12} />);
            else stars.push(<Icon key={i} icon="star-empty" color="#cbd5e1" iconSize={12} />);
        }
        return <div className="d-flex gap-1">{stars}</div>;
    };

    return (
        <>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');

                :root {
                    --primary: #00c6ff;
                    --primary-dark: #0072ff;
                    --primary-gradient: linear-gradient(135deg, #00c6ff, #0072ff);
                    --glass-bg: rgba(255, 255, 255, 0.75);
                    --text-dark: #1e293b;
                    --bg-light: #f8fafc;
                    --success: #10b981;
                    --error: #ef4444;
                    --warning: #f59e0b;
                    --info: #3b82f6;
                }

                body {
                    background-color: var(--bg-light);
                    font-family: 'Plus Jakarta Sans', sans-serif,'Noto Sans Tamil';
                    overflow-x: hidden;
                }

                /* SKELETON LOADING */
                .skeleton-card {
                    background: #f0f2f5;
                    border: 1px solid #e1e4e8;
                }
                .skeleton-circle {
                    width: 55px; height: 55px; border-radius: 50%;
                    background: #e2e8f0; margin-bottom: 15px;
                    animation: pulse 1.5s infinite;
                }
                .skeleton-line {
                    width: 70%; height: 12px; background: #e2e8f0;
                    border-radius: 4px; animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }

                /* POPUP */
                .custom-popup-toast {
                    position: fixed; top: 20px; right: 20px; z-index: 999999;
                    min-width: 320px; max-width: 400px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px); border-radius: 16px; padding: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.8);
                    display: flex; align-items: flex-start; gap: 12px;
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

                /* HERO */
                .hero-wrapper {
                    position: relative; width: 100%; min-height: 550px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 120px 20px 80px; margin-top: -60px;
                }
                .hero-bg {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
                    background-image: url('${heroBgImage}');
                    background-size: cover; background-position: center;
                    z-index: -2; filter: blur(8px) brightness(0.9); transform: scale(1.05);
                }
                .hero-overlay { background: linear-gradient(to bottom, rgba(0, 198, 255, 0.15), rgba(248, 250, 252, 0.85) 60%, rgba(248, 250, 252, 0.95) 100%); }
                .hero-content { text-align: center; color: white; margin-bottom: 45px; z-index: 2; text-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                .hero-title { font-size: 3.5rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -1px; line-height: 1.1; }
                .hero-subtitle { font-size: 1.25rem; opacity: 0.9; font-weight: 500; }

                /* SEARCH BOX */
                .search-box-container {
                    display: flex; width: 100%; max-width: 950px;
                    background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px);
                    padding: 10px; border-radius: 60px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15); border: 1px solid rgba(255, 255, 255, 0.6);
                    position: relative; z-index: 50; align-items: center; transition: all 0.3s ease;
                }
                .search-box-container:focus-within { background: rgba(255, 255, 255, 0.85); box-shadow: 0 25px 60px rgba(0, 198, 255, 0.2); border-color: #fff; transform: translateY(-2px); }
                .search-input-wrapper { flex: 1.6; position: relative; }
                .city-input-wrapper { flex: 1; position: relative; border-left: 1px solid rgba(0,0,0,0.1); padding-left: 15px; margin-left: 5px; }
                .bp4-input-group .bp4-input { background: transparent !important; box-shadow: none !important; border: none !important; height: 55px; font-size: 1.1rem; color: var(--text-dark); font-weight: 500; }
                .bp4-input-group .bp4-input::placeholder { color: #64748b; opacity: 1; }
                .bp4-input-group .bp4-input:focus { outline: none !important; }
                .bp4-icon { color: var(--primary-dark) !important; font-size: 18px !important; }
                .search-btn {
                    background: var(--primary-gradient) !important; border: none !important; border-radius: 40px !important;
                    height: 55px; display: flex; align-items: center; justify-content: center; padding: 0 35px !important; margin-left: 10px;
                    box-shadow: 0 8px 20px rgba(0, 198, 255, 0.4); color: white !important; font-weight: 700; font-size: 16px; transition: all 0.3s ease;
                }
                .search-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(0, 198, 255, 0.5); }

                /* DROPDOWN */
                .suggestions-box {
                    position: absolute; top: 75px; left: 0; width: 100%; background: #ffffff;
                    border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); z-index: 99999;
                    max-height: 320px; overflow-y: auto; padding: 15px 0; border: 1px solid rgba(0,0,0,0.05);
                }
                .suggestion-item { padding: 14px 24px; cursor: pointer; font-size: 15px; color: var(--text-dark); transition: background 0.2s; display: flex; align-items: center; gap: 12px; font-weight: 500; }
                .suggestion-item:hover { background: #f0f9ff; color: var(--primary-dark); }

                /* CONTENT */
                .content-area { position: relative; z-index: 1; padding-top: 20px; }
                .section-header { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin-bottom: 30px; display: flex; align-items: center; }

                /* FIXED CATEGORY GRID */
                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 20px;
                }
                .cat-card {
                    background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    border-radius: 20px; padding: 15px 10px; display: flex; flex-direction: column; align-items: center;
                    justify-content: center; height: 140px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
                }
                .cat-card:hover { transform: translateY(-8px); box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.1); border-color: var(--primary); }
                .cat-icon-img { width: 55px; height: 55px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; background: #f1f5f9; }
                .cat-icon-placeholder { width: 55px; height: 55px; border-radius: 50%; background: linear-gradient(135deg, #e0f2fe, #bae6fd); color: var(--primary-dark); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; margin-bottom: 12px; }
                .cat-name { font-size: 13px; font-weight: 700; color: #475569; text-align: center; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; padding: 0 5px; font-family: 'Gaev Sans', 'Noto Sans Tamil', sans-serif; }

                /* RESTORED SLIDESHOW STYLES */
                .slideshow-wrapper { max-width: 1000px; margin: 0 auto 60px auto; }
                .modern-slideshow-container { width: 100%; height: 400px; border-radius: 30px; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); background: #0f172a; }
                .slide-media { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; cursor: pointer; }
                .modern-slideshow-container:hover .slide-media { transform: scale(1.05); }
                .slide-cta { position: absolute; bottom: 30px; left: 30px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); color: var(--text-dark); padding: 12px 24px; border-radius: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transition: all 0.3s; min-width: 150px; }
                .slide-cta:hover { background: var(--primary-dark); color: white; transform: translateY(-3px); }
                .slide-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; z-index: 10; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.3); }
                .slide-arrow:hover { background: white; color: black; }
                .slide-arrow.left { left: 20px; }
                .slide-arrow.right { right: 20px; }
                .slide-dots { position: absolute; bottom: 20px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 9; }
                .dot { width: 8px; height: 8px; background: rgba(255,255,255,0.4); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
                .dot.active { background: white; transform: scale(1.5); }

                /* TOP RATED */
                .shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 25px; }
                .shop-card {
                    background: rgba(255,255,255,0.95); border: 1px solid #e2e8f0;
                    border-radius: 20px; overflow: hidden; transition: all 0.3s ease; cursor: pointer; display: flex; flex-direction: column;
                }
                .shop-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); border-color: var(--primary); }
                .shop-img-wrapper { height: 160px; background: #f1f5f9; position: relative; }
                .shop-img { width: 100%; height: 100%; object-fit: cover; }
                .shop-content { padding: 15px; flex-grow: 1; display: flex; flex-direction: column; }
                .shop-category { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--primary-dark); font-weight: 800; margin-bottom: 4px; }
                .shop-name { font-size: 16px; font-weight: 700; color: var(--text-dark); margin-bottom: 8px; }
                .shop-meta { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #f1f5f9; }
                .shop-location { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; }
                .shop-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }

                /* FOOTER */
                footer { border-top: 1px solid #e2e8f0; background: #fff; }
                .footer-nav { margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 30px; }
                .footer-link { font-size: 0.95rem; color: #64748b; text-decoration: none; transition: color 0.3s; font-weight: 500; }
                .footer-link:hover { color: var(--primary-dark); }

                @media (max-width: 768px) {
                    .hero-title { font-size: 2.2rem; }
                    .hero-wrapper { padding-top: 100px; min-height: auto; padding-bottom: 60px; }
                    .search-box-container { flex-direction: column; border-radius: 30px; background: rgba(255,255,255,0.95); padding: 15px; align-items: stretch; }
                    .search-input-wrapper { width: 100%; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 5px; margin-bottom: 5px; }
                    .city-input-wrapper { width: 100%; border-left: none; margin-left: 0; padding-left: 0; margin-bottom: 15px; }
                    .search-btn { width: 100%; border-radius: 20px !important; margin-left: 0; }

                    .category-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
                    .cat-card { height: 110px; padding: 10px 5px; }
                    .cat-icon-img, .cat-icon-placeholder { width: 45px; height: 45px; font-size: 18px; }
                    .cat-name { font-size: 11px; }

                    .custom-popup-toast { top: 10px; left: 10px; right: 10px; min-width: auto; max-width: 100%; }
                }
                `}
            </style>

            <Navbar />

            {/* BACKGROUND */}
            <div className="hero-bg"></div>
            <div className="hero-overlay"></div>

            {/* HERO CONTENT */}
            <div className="hero-wrapper">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="hero-content"
                >
                    <h1 className="hero-title">{t("The Business Directory World")}</h1>
                    <p className="hero-subtitle">{t("Communication is the key for global business")}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="search-box-container"
                >
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
                        <AnimatePresence>
                            {(showRecent || suggestions.length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="suggestions-box"
                                >
                                    {showRecent && !categoryInput && recentSearch.length > 0 && (
                                        <>
                                            <div style={{padding:'10px 24px', fontSize:12, color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                                                {t("recent searches")}
                                            </div>
                                            {recentSearch.map((item, index) => (
                                                <div key={index} className="suggestion-item"
                                                     onClick={() => { setCategoryInput(item); setShowRecent(false); setSuggestions([]); }}>
                                                    <i className="bp4-icon bp4-icon-history"></i> {item}
                                                </div>
                                            ))}
                                            <div className="suggestion-item text-danger" style={{justifyContent:'center', fontSize:13, fontWeight: 700}}
                                                 onClick={() => { localStorage.removeItem("recentSearch"); setRecentSearch([]); }}>
                                                {t("Clear Recent Searches")}
                                            </div>
                                        </>
                                    )}
                                    {suggestions.map((item, index) => (
                                        <div key={index} className="suggestion-item"
                                             onClick={() => { setCategoryInput(item); setSuggestions([]); setShowRecent(false); }}>
                                            <i className="bp4-icon bp4-icon-search" style={{color:'var(--primary-dark)'}}></i> {item}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                        {citySuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="suggestions-box"
                            >
                                {citySuggestions.map((item, idx) => (
                                    <div key={idx} className="suggestion-item"
                                         onClick={() => {
                                             setCityInput(item);
                                             sessionStorage.setItem("CITY_NAME", item);
                                             setCitySuggestions([]);
                                         }}>
                                        <i className="bp4-icon bp4-icon-map-marker" style={{color:'#10b981'}}></i> {item}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* 3. SEARCH BUTTON */}
                    <Button className="search-btn" onClick={() => searchNow()}>
                        <span className="d-none d-md-inline me-2">{t("Search")}</span>
                        <i className="bp4-icon bp4-icon-arrow-right"></i>
                    </Button>
                </motion.div>
            </div>

            {/* CONTENT AREA */}
            <div className="content-area">
                <div className="container">

                    {/* SLIDESHOW */}
                    <AnimatePresence>
                        {(slides.length > 0 || isSlidesLoading) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="slideshow-wrapper"
                            >
                                <h4 className="section-header" style={{color: 'white'}}>
                                    <span style={{color: 'var(--primary-dark)', marginRight: '10px',}}>🔥</span>
                                    {t("Exclusive Offers")}
                                    {isSlidesLoading && <Spinner size={20} style={{display:'inline-block', marginLeft:10}}/>}
                                </h4>
                                <Slideshow />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 1. CATEGORY GRID (FIXED SLOWNESS) */}
                    <div className="mb-5" ref={categoriesRef} style={{scrollMarginTop:'100px'}}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="section-header mb-0">
                                <span style={{color: 'var(--primary-dark)', marginRight: '10px'}}>🚀</span>
                                {t("Explore Categories")}
                            </h4>
                            {/* View All Button */}
                            <Button minimal intent="primary" onClick={() => navigate('/all-categories')} style={{fontWeight:'bold'}}>
                                {t("View All")} <i className="bp4-icon bp4-icon-arrow-right ms-1"></i>
                            </Button>
                        </div>

                        {/* SKELETON LOADER IF LOADING */}
                        {isCatLoading ? (
                             <div className="category-grid">
                                 {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
                             </div>
                        ) : (
                            <motion.div
                                className="category-grid"
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                            >
                                {/* Limit to 16 items on Home Page */}
                                {categoryList.slice(0, 21).map((cat, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="cat-card"
                                        variants={itemVariants}
                                        onClick={() => handleCategoryClick(cat)}
                                    >
                                        {renderCategoryIcon(cat)}
                                        <div className="cat-name">{cat.name}</div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* 2. TOP RATED SHOPS (LOCATION BASED 25KM) */}
                    <div className="mb-5">
                         <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="section-header mb-0" style={{color: '#1e293b'}}>
                                <span style={{color: '#f59e0b', marginRight: '10px'}}>★</span>
                                {t("Top Rated Nearby")}
                            </h4>
                        </div>

                        {isTopRatedLoading ? (
                            <div className="shop-grid">
                                {/* Simple Loading State for Shops */}
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="shop-card" style={{height: 280, background:'#f8fafc'}}>
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner size={30} intent="primary"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : topRatedShops.length > 0 ? (
                            <motion.div
                                className="shop-grid"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                {topRatedShops.map((shop, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="shop-card"
                                        // ✅ FIXED: Navigation uses state like SearchResults.jsx
                                        onClick={() => {
                                            const shopData = {
                                                _id: shop.shop_id, // Ensure ID matches ShopDetails check
                                                shop_name: shop.shop_name,
                                                main_image: shop.image,
                                                // Add other fields if needed for display before full fetch
                                            };
                                            const cityData = {
                                                city_name: shop.city
                                            };
                                            navigate("/shop", { state: { shop: shopData, city: cityData } });
                                        }}
                                        whileHover={{ y: -5 }}
                                    >
                                        <div className="shop-img-wrapper">
                                            {shop.image ? (
                                                <img
                                                    src={`http://127.0.0.1:8000/${shop.image}`}
                                                    alt={shop.shop_name}
                                                    className="shop-img"
                                                    onError={(e) => {
                                                        e.target.style.display='none';
                                                        e.target.parentElement.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 bg-light text-muted"><i class="bp4-icon bp4-icon-shop" style="font-size:40px;color:#cbd5e1"></i></div>`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="d-flex align-items-center justify-content-center h-100 bg-light text-muted">
                                                    <Icon icon="shop" size={40} color="#cbd5e1"/>
                                                </div>
                                            )}
                                        </div>
                                        <div className="shop-content">
                                            <div className="shop-category">{shop.category_name}</div>
                                            <div className="shop-name">{shop.shop_name}</div>
                                            <div className="shop-meta">
                                                <div className="shop-rating">
                                                    {renderStars(Math.round(shop.average_rating || 0))}
                                                    <span className="text-muted ms-1">({shop.review_count || 0})</span>
                                                </div>
                                                <div className="shop-location">
                                                    <Icon icon="map-marker" size={12}/> {shop.city}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-muted text-center p-5 bg-white rounded-3 border">
                                <Icon icon="geolocation" size={30} color="#94a3b8" className="mb-2"/>
                                <div>{t("No top rated shops found within 25km.")}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="text-center mt-5 pt-5 pb-5">
                    <div className="container">
                        <h4 style={{fontWeight:800, color: 'var(--primary-dark)', letterSpacing: '-1px'}}>Nalla Angadi</h4>
                        <div className="text-muted small mt-1 mb-4">{t("Discover. Connect. Grow.")}</div>

                        <div className="footer-nav">
                            <a href="/contact" className="footer-link">{t("Contact Us")}</a>
                            <a href="/shipping" className="footer-link">{t("Shipping Policy")}</a>
                            <a href="/privacy" className="footer-link">{t("Privacy Policy")}</a>
                            <a href="/terms" className="footer-link">{t("Terms & Conditions")}</a>
                            <a href="/refund" className="footer-link">{t("Cancellation & Refund Policy")}</a>
                        </div>
                        <div className="mt-4 text-muted small">
                            © {new Date().getFullYear()} nallaangadi.com  All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>

            {/* POPUP COMPONENT */}
            <AnimatePresence>
                {popup && (
                    <motion.div
                        className="custom-popup-toast"
                        variants={popupVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className={`popup-icon-box ${popup.type}`}>
                            <Icon icon={popup.type === 'success' ? 'tick-circle' : popup.type === 'error' ? 'error' : 'warning-sign'} iconSize={24} />
                        </div>
                        <div className="popup-content">
                            {popup.title && <h5>{popup.title}</h5>}
                            <p>{popup.message}</p>
                        </div>
                        <div className="popup-close" onClick={() => setPopup(null)}>
                            <Icon icon="cross" size={16} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Val;

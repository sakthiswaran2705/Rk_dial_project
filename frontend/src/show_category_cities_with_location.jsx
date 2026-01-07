import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, InputGroup, Spinner } from "@blueprintjs/core";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

import Navbar from "./Navbar.jsx";
// 👇 ENSURE THIS IMAGE PATH IS CORRECT
import heroBgImage from "./image_cc786f.jpg";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

function Val() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || localStorage.getItem("LANG") || "en";
    const categoriesRef = useRef(null);

    // ---------------- STATE VARIABLES ----------------
    const [categoryInput, setCategoryInput] = useState("");
    const [cityInput, setCityInput] = useState(sessionStorage.getItem("CITY_NAME") || "");
    const [categoryList, setCategoryList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [recentSearch, setRecentSearch] = useState([]);
    const [showRecent, setShowRecent] = useState(false);
    const [slides, setSlides] = useState([]);
    const [isSlidesLoading, setIsSlidesLoading] = useState(false);

    // ---------------- 1. INITIAL LOADS ----------------
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetch(
                      `${BACKEND_URL}/category/list/?lang=${lang}`
                    );
                const json = await res.json();
                setCategoryList(json.data || []);
            } catch (err) {
                console.error("Category Load Error:", err);
            }
        };

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

    // ---------------- 4. SEARCH LOGIC ----------------
    const fetchCategorySuggestions = async (value) => {
        if (!value.trim()) { setSuggestions([]); return; }
        try {
            const res = await fetch(
              `${BACKEND_URL}/shop/search/?name=${encodeURIComponent(value)}&lang=${lang}`
            );

            const json = await res.json();
            let list = [];
            const data = json.data || [];
            data.forEach((item) => {
                const shopName = item.shop?.shop_name || item.shop_name;
                if (shopName?.toLowerCase().includes(value.toLowerCase())) list.push(shopName);
                item.categories?.forEach((c) => {
                    if (c.name?.toLowerCase().includes(value.toLowerCase())) list.push(c.name);
                });
            });
            setSuggestions([...new Set(list)].slice(0, 10));
        } catch (err) { console.error(err); setSuggestions([]); }
    };

    const fetchCitySuggestions = async (value) => {
        if (value.trim().length < 2) { setCitySuggestions([]); return; }
        try {
            const res = await fetch(
              `${BACKEND_URL}/city/search/?city_name=${encodeURIComponent(value)}&lang=${lang}`
            );

            const json = await res.json();
            const list = (json.data || []).map((c) => c.city_name).filter((name) => name?.toLowerCase().includes(value.toLowerCase()));
            setCitySuggestions([...new Set(list)].slice(0, 8));
        } catch (err) { console.error(err); setCitySuggestions([]); }
    };

    const debouncedCat = useDebounce(fetchCategorySuggestions, 300);
    const debouncedCity = useDebounce(fetchCitySuggestions, 300);

    const searchNow = (category = categoryInput, city = cityInput) => {
        if (!category || !city) return alert(t("fill_both_fields"));
        let arr = [category, ...recentSearch.filter((x) => x !== category)];
        if (arr.length > 8) arr = arr.slice(0, 8);
        setRecentSearch(arr);
        localStorage.setItem("recentSearch", JSON.stringify(arr));
        sessionStorage.setItem("CITY_NAME", city);
        navigate(`/results?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`);
    };

    const handleCategoryClick = (cat) => {
        if (!cat?.name || !cityInput) return alert(t("select_city_first"));
        setCategoryInput(cat.name);
        searchNow(cat.name, cityInput);
    };

    // ---------------- 5. SLIDESHOW ----------------
    useEffect(() => {
        if (!cityInput || cityInput.length < 3) { setSlides([]); return; }
        const controller = new AbortController();
        const fetchSlides = async () => {
            setIsSlidesLoading(true);
            try {
                const res = await fetch(
                      `${BACKEND_URL}/offers/${encodeURIComponent(cityInput)}/?lang=${lang}`,
                      { signal: controller.signal }
                    );

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
        const url = `${BACKEND_URL}/${current.path}`;


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

    const renderCategoryIcon = (cat) => {
        if (cat?.category_image) return <img
                  src={`${BACKEND_URL}/${cat.category_image}`}
                  alt={cat.name}
                  className="cat-icon-img"
                />
        return <div className="cat-icon-placeholder">{cat.name?.[0]?.toUpperCase()}</div>;
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
                    --glass-border: 1px solid rgba(255, 255, 255, 0.5);
                    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
                    --text-dark: #1e293b;
                    --bg-light: #f8fafc;
                }

                body {
                    background-color: var(--bg-light);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-x: hidden;
                }

                /* --- HERO SECTION --- */
                .hero-wrapper {
                    position: relative;
                    width: 100%;
                    min-height: 550px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 120px 20px 80px;
                    margin-top: -60px; /* Offset Navbar */
                }
                .hero-bg {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
                    background-image: url('${heroBgImage}');
                    background-size: cover; background-position: center;
                    z-index: -2;
                    filter: blur(8px) brightness(0.9);
                    transform: scale(1.05);
                }
                .hero-overlay {
                  background: linear-gradient(
                    to bottom,
                    rgba(0, 198, 255, 0.15),
                    rgba(248, 250, 252, 0.85) 60%,
                    rgba(248, 250, 252, 0.95) 100%
                  );
                }

                .hero-content {
                    text-align: center;
                    color: white;
                    margin-bottom: 45px;
                    z-index: 2;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 12px;
                    letter-spacing: -1px;
                    line-height: 1.1;
                }
                .hero-subtitle {
                    font-size: 1.25rem;
                    opacity: 0.9;
                    font-weight: 500;
                }

                /* --- PREMIUM GLASS SEARCH BOX --- */
                .search-box-container {
                    display: flex;
                    width: 100%;
                    max-width: 950px;
                    background: rgba(255, 255, 255, 0.65);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    padding: 10px;
                    border-radius: 60px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    position: relative;
                    z-index: 50;
                    align-items: center;
                    transition: all 0.3s ease;
                }

                .search-box-container:focus-within {
                    background: rgba(255, 255, 255, 0.85);
                    box-shadow: 0 25px 60px rgba(0, 198, 255, 0.2);
                    border-color: #fff;
                    transform: translateY(-2px);
                }

                .search-input-wrapper { flex: 1.6; position: relative; }
                .city-input-wrapper {
                    flex: 1;
                    position: relative;
                    border-left: 1px solid rgba(0,0,0,0.1);
                    padding-left: 15px;
                    margin-left: 5px;
                }

                .bp4-input-group .bp4-input {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                    height: 55px;
                    font-size: 1.1rem;
                    color: var(--text-dark);
                    font-weight: 500;
                }
                .bp4-input-group .bp4-input::placeholder { color: #64748b; opacity: 1; }
                .bp4-input-group .bp4-input:focus { outline: none !important; }
                .bp4-icon { color: var(--primary-dark) !important; font-size: 18px !important; }

                .search-btn {
                    background: var(--primary-gradient) !important;
                    border: none !important;
                    border-radius: 40px !important;
                    height: 55px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 35px !important;
                    margin-left: 10px;
                    box-shadow: 0 8px 20px rgba(0, 198, 255, 0.4);
                    color: white !important;
                    font-weight: 700;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }
                .search-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 25px rgba(0, 198, 255, 0.5);
                }

                /* --- SUGGESTIONS DROPDOWN --- */
                .suggestions-box {
                    position: absolute; top: 75px; left: 0; width: 100%;
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    z-index: 99999;
                    max-height: 320px;
                    overflow-y: auto;
                    padding: 15px 0;
                    border: 1px solid rgba(0,0,0,0.05);
                    animation: slideDown 0.2s ease-out forwards;
                }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .suggestion-item {
                    padding: 14px 24px;
                    cursor: pointer;
                    font-size: 15px;
                    color: var(--text-dark);
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 500;
                }
                .suggestion-item:hover { background: #f0f9ff; color: var(--primary-dark); }

                /* --- CATEGORY GRID --- */
                .content-area { position: relative; z-index: 1; padding-top: 20px; }
                .section-header {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                }

                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                    gap: 25px;
                    padding: 10px;
                }
                .cat-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    border-radius: 20px;
                    padding: 20px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 130px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }
                .cat-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.1);
                    border-color: var(--primary);
                }
                .cat-icon-img { width: 55px; height: 55px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; background: #f1f5f9; }
                .cat-icon-placeholder {
                    width: 55px; height: 55px; border-radius: 50%;
                    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
                    color: var(--primary-dark);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 22px; font-weight: 800; margin-bottom: 15px;
                }
                .cat-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    text-align: center;
                    line-height: 1.3;
                }

                /* --- SLIDESHOW --- */
                .slideshow-wrapper { max-width: 1000px; margin: 0 auto 60px auto; }
                .modern-slideshow-container {
                    width: 100%; height: 400px;
                    border-radius: 30px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    background: #0f172a;
                }
                .slide-media { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; cursor: pointer; }
                .modern-slideshow-container:hover .slide-media { transform: scale(1.05); }
                .slide-cta {
                    position: absolute; bottom: 30px; left: 30px;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(10px);
                    color: var(--text-dark);
                    padding: 12px 24px;
                    border-radius: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                    min-width: 150px;
                }
                .slide-cta:hover { background: var(--primary-dark); color: white; transform: translateY(-3px); }
                .slide-arrow {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    background: rgba(255,255,255,0.2); backdrop-filter: blur(5px);
                    color: white; width: 50px; height: 50px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 24px; cursor: pointer; z-index: 10; transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.3);
                }
                .slide-arrow:hover { background: white; color: black; }
                .slide-arrow.left { left: 20px; }
                .slide-arrow.right { right: 20px; }
                .slide-dots { position: absolute; bottom: 20px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 9; }
                .dot { width: 8px; height: 8px; background: rgba(255,255,255,0.4); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
                .dot.active { background: white; transform: scale(1.5); }

                /* --- FOOTER --- */
                footer { border-top: 1px solid #e2e8f0; background: #fff; }
                .footer-nav { margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 30px; }
                .footer-link { font-size: 0.95rem; color: #64748b; text-decoration: none; transition: color 0.3s; font-weight: 500; }
                .footer-link:hover { color: var(--primary-dark); }

                /* --- RESPONSIVE --- */
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.2rem; }
                    .hero-wrapper { padding-top: 100px; min-height: auto; padding-bottom: 60px; }

                    .search-box-container {
                        flex-direction: column;
                        border-radius: 30px;
                        background: rgba(255,255,255,0.9);
                        padding: 15px;
                        align-items: stretch;
                    }
                    .search-input-wrapper {
                        width: 100%; border-bottom: 1px solid rgba(0,0,0,0.08);
                        padding-bottom: 5px; margin-bottom: 5px;
                    }
                    .city-input-wrapper {
                        width: 100%; border-left: none; margin-left: 0;
                        padding-left: 0; margin-bottom: 15px;
                    }

                    .search-btn { width: 100%; border-radius: 20px !important; margin-left: 0; }

                    .modern-slideshow-container { height: 200px; border-radius: 20px; }
                    .category-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
                    .cat-card { min-height: 110px; padding: 15px 5px; }
                    .cat-name { font-size: 12px; }
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
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="hero-content"
                >
                    <h1 className="hero-title">{t("Communication is the key for global business")}</h1>
                    <p className="hero-subtitle">{t("Discover trusted local businesses near you.")}</p>
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
                        {/* SUGGESTION DROPDOWN */}
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
                        {/* CITY DROPDOWN */}
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
                                    <span style={{color: 'var(--primary-dark)', marginRight: '10px'}}>🔥</span>
                                    {t("Exclusive Offers")}
                                    {isSlidesLoading && <Spinner size={20} style={{display:'inline-block', marginLeft:10}}/>}
                                </h4>
                                <Slideshow />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CATEGORY GRID */}
                            <div className="mb-5" ref={categoriesRef} style={{scrollMarginTop:'100px'}}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="section-header mb-0">
                                        <span style={{color: 'var(--primary-dark)', marginRight: '10px'}}>🚀</span>
                                        {t("Explore Categories")}
                                    </h4>

                                    {/* VIEW ALL BUTTON - Only shows if more than 12 categories exist */}
                                    {categoryList.length > 12 && (
                                        <Button
                                            minimal
                                            intent="primary"
                                            onClick={() => navigate('/all-categories')}
                                            style={{fontWeight:'bold'}}
                                        >
                                            {t("View All")} <i className="bp4-icon bp4-icon-arrow-right ms-1"></i>
                                        </Button>
                                    )}
                                </div>

                                <motion.div
                                    className="category-grid"
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-100px" }}
                                >
                                    {/* 👇 CHANGE: Only show first 12 items */}
                                    {categoryList.slice(0, 12).map((cat, idx) => (
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
                            </div>
                </div>

                {/* FOOTER */}
                <footer className="text-center mt-5 pt-5 pb-5">
                    <div className="container">
                        <h4 style={{fontWeight:800, color: 'var(--primary-dark)', letterSpacing: '-1px'}}>Rk dial</h4>
                        <div className="text-muted small mt-1 mb-4">{t("Discover. Connect. Grow.")}</div>

                        <div className="footer-nav">
                            <a href="/contact" className="footer-link">{t("Contact Us")}</a>
                            <a href="/shipping" className="footer-link">{t("Shipping Policy")}</a>
                            <a href="/privacy" className="footer-link">{t("Privacy Policy")}</a>
                            <a href="/terms" className="footer-link">{t("Terms & Conditions")}</a>
                            <a href="/refund" className="footer-link">{t("Cancellation & Refund Policy")}</a>
                        </div>
                        <div className="mt-4 text-muted small">
                            © {new Date().getFullYear()} Rk dial. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default Val;

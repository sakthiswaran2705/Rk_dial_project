import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { InputGroup, Button } from "@blueprintjs/core";
import { usePageStore } from "./PageStore.jsx";
import logo from "./flamingtext_com-267266537.png";
import { authenticatedFetch } from "./authFetch.jsx";

// Configuration
const API_BASE = import.meta.env.VITE_BACKEND_URL;
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// --- DEBOUNCE HOOK (Internal for Navbar) ---
const useDebounce = (callback, delay) => {
    const timer = useRef(null);
    return useCallback((...args) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { setValData } = usePageStore();
  const lang = i18n.language || "en";

  // --- User Data ---
  const uid = localStorage.getItem("USER_ID");
  const token = localStorage.getItem("ACCESS_TOKEN");
  const firstName = localStorage.getItem("FIRST_NAME") || "User";
  const lastName = localStorage.getItem("LAST_NAME") || "";
  const fullName = `${firstName} ${lastName}`;

  // --- Navbar State ---
  const [profileImg, setProfileImg] = useState(DEFAULT_AVATAR);
  const [useTextLogo, setUseTextLogo] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // --- SEARCH BAR STATE ---
  const [navCategory, setNavCategory] = useState("");
  const [navCity, setNavCity] = useState("");

  // --- SUGGESTIONS STATE ---
  const [catSuggestions, setCatSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCatSuggest, setShowCatSuggest] = useState(false);
  const [showCitySuggest, setShowCitySuggest] = useState(false);

  // --- SLIDE PANEL STATE ---
  const [showSlide, setShowSlide] = useState(false);
  const [slideFile, setSlideFile] = useState(null);
  const [slidePreview, setSlidePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isHomePage = location.pathname === "/";
  const isJobsPage = location.pathname === "/jobs";
  const isJobDetailsPage = location.pathname.startsWith("/job/");
  const isDashboardPage = location.pathname === "/dashboard";
  const issettingPage = location.pathname === "/settings";
  const ispaymentPage = location.pathname === "/payments";
  const isloginPage = location.pathname === "/login";
  const isjobPage = location.pathname === "/my-jobs";
  const isjobPage = location.pathname === "/my-jobs";
  // ---------------------------------------------
  // 1. SYNC SEARCH INPUTS FROM URL
  // ---------------------------------------------
  useEffect(() => {
    if (!isHomePage) {
      const cat = searchParams.get("category") || "";
      const city = searchParams.get("city") || sessionStorage.getItem("CITY_NAME") || "";
      setNavCategory(cat);
      setNavCity(city);
    }
  }, [location, searchParams, isHomePage]);

  // ---------------------------------------------
  // 2. FETCH NOTIFICATIONS
  // ---------------------------------------------
  const fetchNotifications = async () => {
      if (!uid) return;

      try {
        const res = await authenticatedFetch(`/notifications/?lang=${lang}`);
        const json = await res.json();

        if (json.status) {
          setNotifications(json.data || []);
        }
      } catch (err) {
        console.error("Notification fetch failed:", err);
      }
    };


  useEffect(() => {
    fetchNotifications();
    // Optional: Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [uid, token, lang]);

  const deleteNotification = async (id, e) => {
      e.stopPropagation();

      try {
        const res = await authenticatedFetch(
          `/notification/delete/${id}/?lang=${lang}`,
          { method: "DELETE" }
        );

        const json = await res.json();

        if (json.status) {
          setNotifications(prev => prev.filter(n => n._id !== id));
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    };


  // ---------------------------------------------
  // 3. SEARCH API & SUGGESTION LOGIC
  // ---------------------------------------------
  const fetchCatSuggestions = async (value) => {
      if (!value.trim()) { setCatSuggestions([]); return; }
      try {
          const res = await fetch(`${API_BASE}/shop/search/?name=${encodeURIComponent(value)}&lang=${lang}`);
          const json = await res.json();
          let list = [];
          (json.data || []).forEach((item) => {
              const shopName = item.shop?.shop_name || item.shop_name;
              if (shopName && shopName.toLowerCase().includes(value.toLowerCase())) list.push(shopName);
              if (item.categories) item.categories.forEach((c) => {
                  if (c.name && c.name.toLowerCase().includes(value.toLowerCase())) list.push(c.name);
              });
          });
          setCatSuggestions([...new Set(list)].slice(0, 6));
          setShowCatSuggest(true);
      } catch (err) { console.error(err); }
  };

  const fetchCitySuggestions = async (value) => {
      if (value.trim().length < 2) { setCitySuggestions([]); return; }
      try {
          const res = await fetch(`${API_BASE}/city/search/?city_name=${encodeURIComponent(value)}&lang=${lang}`);
          const json = await res.json();
          const list = (json.data || []).map((c) => c.city_name).filter((name) => name && name.toLowerCase().includes(value.toLowerCase()));
          setCitySuggestions([...new Set(list)].slice(0, 5));
          setShowCitySuggest(true);
      } catch (err) { console.error(err); }
  };

  const debouncedCat = useDebounce(fetchCatSuggestions, 300);
  const debouncedCity = useDebounce(fetchCitySuggestions, 300);

  const handleNavSearch = (cat = navCategory, city = navCity) => {
    if (!cat || !city) return alert(t("fill_both_fields"));
    sessionStorage.setItem("CITY_NAME", city);
    setShowCatSuggest(false);
    setShowCitySuggest(false);
    navigate(`/results?category=${encodeURIComponent(cat)}&city=${encodeURIComponent(city)}`);
  };
  useEffect(() => {
  const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token && uid) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }, []);


  useEffect(() => {
    if (!uid) return;
    const storedPath = localStorage.getItem("PROFILE_IMAGE");
    if (storedPath && storedPath !== "null") {
      const fullUrl = storedPath.startsWith("http") ? storedPath : `${API_BASE}/${storedPath}`;
      setProfileImg(fullUrl);
    }
  }, [uid]);

  useEffect(() => {
      const handleClickOutside = (e) => {
          if (!e.target.closest('.nav-search-container')) {
              setShowCatSuggest(false);
              setShowCitySuggest(false);
          }
          if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
          if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ---------------------------------------------
  // 5. NAV & PANEL LOGIC
  // ---------------------------------------------
  const navGo = (path) => {
    if (path === "/") setValData((prev) => ({ ...prev, categoryInput: "", results: [] }));
    navigate(path);
  };

  const goToCategory = () => {
    if (isHomePage) {
      const el = document.querySelector(".category-grid");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    } else {
      navigate("/", { state: { scrollTo: "categories" } });
    }
  };

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("LANG", lang);
    window.location.reload();
  };

  const triggerFileSelect = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 1024 * 1024) return alert("Max size 1MB");
      setSlideFile(selected);
      setSlidePreview(URL.createObjectURL(selected));
    }
  };
  const saveProfileImage = async () => {
    if (!slideFile) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", slideFile);
      const res = await authenticatedFetch(
          `/profile/upload/image/`,
          {
            method: "POST",
            body: fd,
          }
        );

      const data = await res.json();
      if (res.ok && data.profile_image) {
        localStorage.setItem("PROFILE_IMAGE", data.profile_image);
        setProfileImg(`${API_BASE}/${data.profile_image}`);
        setSlideFile(null); setSlidePreview(null);
        alert("Profile Updated!");
      } else throw new Error("Upload failed");
    } catch (e) { alert("Error uploading image."); } finally { setUploading(false); }
  };
  const closeSlide = () => { setShowSlide(false); setSlideFile(null); setSlidePreview(null); };
  const toggleDropdown = (e) => { e.stopPropagation(); setShowDropdown(!showDropdown); };
  const handleLogout = (e) => { e.stopPropagation(); localStorage.clear(); window.location.href = "/login"; };

  const NavItem = ({ icon, labelKey, onClick, isActive }) => (
    <div onClick={onClick} className={`nav-item-custom ${isActive ? 'active-nav' : ''}`}>
      <div className="nav-icon">{icon}</div>
      <div className="nav-label">{t(labelKey)}</div>
    </div>
  );

  return (
    <>
      <style>
        {`
        /* NAVBAR CONTAINER */
        .app-navbar {
          background: ${isHomePage ? 'transparent' : '#ffffff'};
          box-shadow: ${isHomePage ? 'none' : '0 2px 10px rgba(0,0,0,0.1)'};
          height: 90px;
          padding: 0 20px;
          transition: all 0.3s ease;
        }

        /* LOGO */
        .text-logo {
            font-size: 34px;
            font-weight: 800;
            color: #007bff;
            cursor: pointer;
            text-shadow: ${isHomePage ? '1px 1px 1px rgba(255,255,255,0.5)' : 'none'};
        }

        /* SEARCH BAR */
        .nav-search-container {
            position: relative; display: flex; align-items: center;
            background: #f1f3f5; border-radius: 20px;
            padding: 4px 10px; margin: 0 30px;
            flex: 1; max-width: 550px;
            border: 1px solid #e9ecef; height: 45px;
        }
        .nav-search-input .bp4-input {
            background: transparent !important; box-shadow: none !important; border: none !important;
            font-size: 15px; height: 36px;
        }
        .nav-search-divider { width: 1px; height: 24px; background: #ccc; margin: 0 10px; }

        /* SUGGESTIONS */
        .nav-suggestions-box {
            position: absolute; top: 50px; left: 0; width: 100%;
            background: #ffffff; border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 9999;
            max-height: 250px; overflow-y: auto; border: 1px solid #eee;
        }
        .nav-suggestion-item {
            padding: 10px 15px; cursor: pointer; font-size: 13px; color: #333;
            border-bottom: 1px solid #f9f9f9; display: flex; align-items: center; gap: 10px;
        }
        .nav-suggestion-item:hover { background: #eef8ff; color: #007bff; }

        /* NAV ITEMS */
        .nav-link-container { display: flex; gap: 20px; font-family: "Noto Sans Tamil"; }
        .nav-item-custom { cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 5px 8px; border-radius: 8px; color: #555; font-weight: 500; text-shadow: ${isHomePage ? '0 1px 2px rgba(255,255,255,0.8)' : 'none'}; }
        .nav-item-custom:hover { background-color: rgba(0, 123, 255, 0.1); color: #007bff; }
        .nav-item-custom.active-nav { color: #007bff; border-bottom: 3px solid #007bff; padding-bottom: 2px; }
        .nav-icon { font-size: 18px; margin-bottom: 2px; }
        .nav-label { font-size: 11px; white-space: nowrap; }

        /* UTILS */
        .lang-switcher-btn { padding: 2px 8px; font-size: 11px; font-weight: bold; border-radius: 6px; background: rgba(255,255,255,0.5); }
        .lang-switcher-btn.active-lang { background-color: #007bff !important; color: white !important; }

        .profile-container { position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; text-shadow: ${isHomePage ? '0 1px 2px rgba(255,255,255,0.8)' : 'none'}; }
        .profile-dropdown-menu { position: absolute; top: 135%; right: 0; background: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.12); min-width: 160px; z-index: 1050; animation: fadeIn 0.2s ease-in-out; font-family: "Noto Sans Tamil"; }
        .dropdown-item-custom { padding: 12px 16px; font-size: 13px; color: #333; border-bottom: 1px solid #f0f0f0; transition: background 0.2s; cursor: pointer; text-align: left; }
        .dropdown-item-custom:hover { background-color: #f8f9fa; color: #007bff; }

        /* NOTIFICATIONS */
        .notif-container { position: relative; cursor: pointer; margin-right: 15px; }
        .notif-bell { font-size: 20px; color: #555; text-shadow: ${isHomePage ? '0 1px 2px rgba(255,255,255,0.8)' : 'none'}; }
        .notif-badge { position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; font-size: 10px; font-weight: bold; border-radius: 50%; min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
        .notif-dropdown { position: absolute; top: 150%; right: -60px; width: 300px; background: white; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 1100; border: 1px solid #eee; overflow: hidden; animation: fadeIn 0.2s; }
        .notif-header { padding: 10px 15px; font-weight: bold; border-bottom: 1px solid #eee; background: #f8f9fa; color: #333; }
        .notif-list { max-height: 300px; overflow-y: auto; }
        .notif-item { padding: 12px 15px; border-bottom: 1px solid #f1f1f1; display: flex; justify-content: space-between; align-items: start; transition: background 0.2s; }
        .notif-item:hover { background: #fdfdfd; }
        .notif-content h6 { margin: 0 0 4px; font-size: 13px; color: #007bff; font-weight: 600; }
        .notif-content p { margin: 0; font-size: 12px; color: #555; line-height: 1.4; }
        .notif-delete { background: none; border: none; color: #999; font-size: 16px; cursor: pointer; padding: 0 5px; line-height: 1; }
        .notif-delete:hover { color: #dc3545; }
        .notif-empty { padding: 20px; text-align: center; color: #999; font-size: 13px; }

        .slide-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1040; backdrop-filter: blur(2px); }
        .profile-slide-panel { position: fixed; top: 0; right: 0; width: 320px; height: 100vh; background: white; z-index: 1050; box-shadow: -5px 0 25px rgba(0,0,0,0.2); padding: 20px; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; }
        .profile-slide-panel.open { transform: translateX(0); }
        .slide-avatar-wrapper { position: relative; width: 120px; height: 120px; margin: 20px auto; }
        .slide-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
        .cam-btn { position: absolute; bottom: 0; right: 0; background: #007bff; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer; }
        .btn-slide-save { background: #28a745; color: white; width: 100%; padding: 10px; border: none; border-radius: 6px; margin-top: 15px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      {/* ================= NAVBAR CONTENT ================= */}
      <nav className="navbar navbar-expand app-navbar sticky-top">
        <div className="container-fluid d-flex justify-content-between align-items-center h-100">

          {/* 1. LOGO */}
          <div onClick={() => navGo("/")} className="d-flex align-items-center">
            {useTextLogo ? (
                <div className="text-logo">RK <span style={{color: isHomePage ? '#007bff' : '#333'}}>Dial</span></div>
            ) : (
                <img
                    src={logo}
                    alt="Logo"
                    onError={() => setUseTextLogo(true)}
                    style={{ height: 85, cursor: "pointer" }}
                />
            )}
          </div>

          {/* 2. SEARCH BAR */}
          {!isHomePage && !isJobsPage && !isJobDetailsPage && !isDashboardPage && !isjobPage && !issettingPage && !ispaymentPage && !isloginPage && (
              <div className="nav-search-container d-none d-md-flex">
                  <div style={{flex: 1.5, position: 'relative'}}>
                      <InputGroup
                          className="nav-search-input"
                          placeholder={t("Category...")}
                          value={navCategory}
                          onChange={(e) => {
                              setNavCategory(e.target.value);
                              debouncedCat(e.target.value);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleNavSearch()}
                          leftIcon="search"
                      />
                      {showCatSuggest && catSuggestions.length > 0 && (
                          <div className="nav-suggestions-box">
                              {catSuggestions.map((item, idx) => (
                                  <div key={idx} className="nav-suggestion-item"
                                      onClick={() => { setNavCategory(item); setShowCatSuggest(false); }}>
                                      <i className="bp4-icon bp4-icon-search" style={{color:'#ccc'}}></i> {item}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="nav-search-divider"></div>

                  <div style={{flex: 1, position: 'relative'}}>
                      <InputGroup
                          className="nav-search-input"
                          placeholder={t("City")}
                          value={navCity}
                          onChange={(e) => {
                              setNavCity(e.target.value);
                              debouncedCity(e.target.value);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleNavSearch()}
                          leftIcon="map-marker"
                      />
                      {showCitySuggest && citySuggestions.length > 0 && (
                          <div className="nav-suggestions-box">
                              {citySuggestions.map((item, idx) => (
                                  <div key={idx} className="nav-suggestion-item"
                                      onClick={() => { setNavCity(item); setShowCitySuggest(false); }}>
                                      <i className="bp4-icon bp4-icon-map-marker" style={{color:'#28a745'}}></i> {item}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <Button icon="arrow-right" minimal onClick={() => handleNavSearch()} />
              </div>
          )}

          {/* 3. LINKS */}
          <div className={`nav-link-container ${!isHomePage ? 'd-none d-lg-flex' : 'd-none d-md-flex'}`}>
            <NavItem icon="🏠" labelKey="Home" onClick={() => navGo("/")} isActive={location.pathname === "/"} />
            <NavItem icon="🏷️" labelKey="Category" onClick={goToCategory} isActive={false} />
            <NavItem icon="🎁" labelKey="Offers" onClick={() => navigate('/offers')} isActive={location.pathname.startsWith("/offers")} />
            <NavItem icon="💼" labelKey="Jobs" onClick={() => navGo("/jobs")} isActive={location.pathname === "/jobs"} />
            <NavItem icon="💰" labelKey="Plan" onClick={() => navGo("/plan")} isActive={location.pathname === "/plan"} />
          </div>

          {/* 4. UTILS */}
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex gap-1 border rounded p-1" style={{borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.4)'}}>
              <button className={`btn btn-sm lang-switcher-btn ${i18n.language === "en" ? "active-lang" : ""}`} onClick={() => changeLang("en")}>EN</button>
              <button className={`btn btn-sm lang-switcher-btn ${i18n.language === "ta" ? "active-lang" : ""}`} onClick={() => changeLang("ta")}>TA</button>
            </div>

            {/* NOTIFICATIONS */}
            {uid && (
              <div className="notif-container" ref={notifRef} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <div className="notif-bell">🔔</div>
                {notifications.length > 0 && <div className="notif-badge">{notifications.length}</div>}

                {showNotifDropdown && (
                  <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="notif-header">Notifications</div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No new notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif._id} className="notif-item">
                            <div className="notif-content">
                              <h6>{notif.title}</h6>
                              <p>{notif.message}</p>

                            </div>
                            <button className="notif-delete" onClick={(e) => deleteNotification(notif._id, e)}>×</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!uid ? (
              <div onClick={() => navGo("/login")} style={{ textAlign: "center", cursor: "pointer", textShadow: isHomePage ? '0 1px 2px rgba(255,255,255,0.8)' : 'none' }}>
                <img src="https://cdn-icons-png.flaticon.com/512/1144/1144760.png" width={24} alt="login" style={{marginBottom: 2}}/>
                <div style={{ fontSize: 11, color: isHomePage ? '#333' : '#333', fontWeight:'bold' }}>{t("login")}</div>
              </div>
            ) : (
              <div className="profile-container" ref={dropdownRef} onClick={toggleDropdown}>
                <img src={profileImg} onError={(e) => e.target.src = DEFAULT_AVATAR} width={35} height={35} alt="profile" style={{ borderRadius: '50%', border: '2px solid #007bff', marginBottom: 2, objectFit: 'cover', backgroundColor: '#fff' }} />
                <div style={{ fontSize: 10, color: '#007bff', fontWeight: 'bold' }}>{firstName}</div>
                {showDropdown && (
                  <div className="profile-dropdown-menu">
                    <div className="dropdown-item-custom" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setShowSlide(true); }}>{t("Profile")}</div>
                    <div className="dropdown-item-custom" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); navGo("/dashboard"); }}>{t("Dashboard")}</div>
                    <div className="dropdown-item-custom"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(false);
                                    navGo("/settings");
                                  }}>
                                  {t("Settings")}
                                </div>

                    <div className="dropdown-item-custom" onClick={handleLogout} style={{color:'#dc3545', fontWeight:'bold'}}>{t("Logout")}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ================= SLIDE OUT PROFILE PANEL ================= */}
      {showSlide && <div className="slide-overlay" onClick={closeSlide}></div>}
      <div className={`profile-slide-panel ${showSlide ? "open" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0 fw-bold">My Profile</h5>
            <button onClick={closeSlide} style={{background:'none', border:'none', fontSize:24}}>&times;</button>
        </div>
        <div className="slide-avatar-wrapper">
            <img src={slidePreview || profileImg} alt="Profile" className="slide-img" onError={(e) => e.target.src = DEFAULT_AVATAR} />
            <div className="cam-btn" onClick={triggerFileSelect}>📷</div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display:'none'}} />
        </div>
        <div className="text-center mb-3">
            <h5 className="fw-bold">{fullName}</h5>
            <p className="text-muted small">ID: {uid}</p>
        </div>
        {slideFile && <button className="btn-slide-save" onClick={saveProfileImage} disabled={uploading}>{uploading ? "Uploading..." : "✓ Save Changes"}</button>}
        <hr />
        <button className="btn btn-outline-secondary w-100" onClick={() => { closeSlide(); navGo("/dashboard"); }}>Go to Shop Dashboard</button>
      </div>
    </>
  );
}

export default Navbar;

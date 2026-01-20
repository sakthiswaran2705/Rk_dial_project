import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@blueprintjs/core";
import { motion, AnimatePresence } from "framer-motion";
import { usePageStore } from "./PageStore.jsx";
import logo from "./flamingtext_com-267266537.png";
import { authenticatedFetch } from "./authFetch.jsx";

// Configuration
const API_BASE = "http://127.0.0.1:8000";
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// --- POPUP VARIANTS ---
const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { setValData } = usePageStore();
  const lang = i18n.language || "en";

  // --- User Data ---
  const uid = localStorage.getItem("USER_ID");
  const firstName = localStorage.getItem("FIRST_NAME") || "User";
  const lastName = localStorage.getItem("LAST_NAME") || "";
  const fullName = `${firstName} ${lastName}`;

  // --- Navbar State ---
  const [profileImg, setProfileImg] = useState(DEFAULT_AVATAR);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // --- SCROLL STATE ---
  const [isScrolled, setIsScrolled] = useState(false);

  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // --- SLIDE PANEL STATE ---
  const [showSlide, setShowSlide] = useState(false);
  const [slideFile, setSlideFile] = useState(null);
  const [slidePreview, setSlidePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- POPUP STATE ---
  const [popup, setPopup] = useState(null);

  const showPopup = (type, message, title = "") => {
      setPopup({ type, message, title });
      setTimeout(() => setPopup(null), 3000);
  };

  const isHomePage = location.pathname === "/";

  // ---------------------------------------------
  // 1. HELPER: ICON & COLOR CONFIGURATION
  // ---------------------------------------------
  const getNotificationConfig = (title, message) => {
    const text = (title + " " + message).toLowerCase();
    if (text.includes("failed") || text.includes("error")) return { icon: "❌", color: "#dc3545", bg: "#ffe6e6" };
    if (text.includes("payment") || text.includes("success")) return { icon: "💳", color: "#28a745", bg: "#e6fffa" };
    if (text.includes("shop") || text.includes("added")) return { icon: "🏪", color: "#0d6efd", bg: "#e6f2ff" };
    if (text.includes("offer") || text.includes("gift")) return { icon: "🎉", color: "#6f42c1", bg: "#f3e6ff" };
    if (text.includes("job") || text.includes("resume")) return { icon: "💼", color: "#fd7e14", bg: "#fff0e6" };
    if (text.includes("expire") || text.includes("days left")) return { icon: "⚠️", color: "#ffc107", bg: "#fff9db" };
    return { icon: "🔔", color: "#6c757d", bg: "#f8f9fa" };
  };

  const handleNotifClick = (notif) => {
    const shopId = notif.shop_id || notif.shop?._id || notif.data?.shop_id;
    if (shopId) {
      navigate(`/dashboard/shop/${shopId}`);
      setShowNotifDropdown(false);
    }
  };

  // ---------------------------------------------
  // 2. NOTIFICATION & SCROLL LOGIC
  // ---------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [uid, lang]);

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await authenticatedFetch(`/notification/delete/${id}/?lang=${lang}`, { method: "DELETE" });
      const json = await res.json();
      if (json.status) setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error("Delete failed:", err); }
  };

  // ---------------------------------------------
  // 3. GENERAL EFFECTS & HANDLERS
  // ---------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token && uid) {
      localStorage.clear();
      window.location.href = "/login";
    }
  }, [uid]);

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
          if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
          if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
      if (selected.size > 1024 * 1024) return showPopup("warning", "File size must be under 1MB", "File Too Large");
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
      const res = await authenticatedFetch(`/profile/upload/image/`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.profile_image) {
        localStorage.setItem("PROFILE_IMAGE", data.profile_image);
        setProfileImg(`${API_BASE}/${data.profile_image}`);
        setSlideFile(null); setSlidePreview(null);
        showPopup("success", "Profile image updated successfully!", "Updated");
      } else throw new Error("Upload failed");
    } catch (e) {
        showPopup("error", "Failed to update profile image.", "Error");
    } finally {
        setUploading(false);
    }
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
        :root {
            --success: #10b981;
            --error: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --text-dark: #1e293b;
        }

        /* --- POPUP STYLES --- */
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

        @media (max-width: 768px) {
             .custom-popup-toast { top: 10px; left: 10px; right: 10px; min-width: auto; max-width: 100%; }
        }

        /* --- MAIN NAVBAR --- */
        .app-navbar {
          background: ${ (!isHomePage || isScrolled) ? '#ffffff' : 'transparent' };
          box-shadow: ${ (!isHomePage || isScrolled) ? '0 2px 10px rgba(0,0,0,0.05)' : 'none' };
          height: 80px;
          padding: 0 40px; 
          transition: background 0.3s ease, box-shadow 0.3s ease;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        /* --- LOGO --- */
        .logo-section {
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .logo-section:hover { transform: scale(1.03); }
        .logo-img { height: 60px; width: auto; object-fit: contain; }
        .text-logo { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: #1e3a8a; white-space: nowrap; }

        /* --- NOTIFICATIONS --- */
        .notif-container { position: relative; cursor: pointer; margin-right: 15px; font-size: 20px; }
        .notif-badge { position: absolute; top: -5px; right: -5px; background: red; color: white; font-size: 9px; font-weight: bold; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
        .notif-dropdown { position: absolute; top: 140%; right: -10px; width: 340px; background: white; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.15); z-index: 1100; border: 1px solid #f0f0f0; overflow: hidden; }
        .notif-header { padding: 12px 18px; font-weight: 700; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; background: #fff; font-size: 14px; color: #333; }
        .notif-list { max-height: 350px; overflow-y: auto; }
        .notif-item { padding: 14px 18px; border-bottom: 1px solid #f5f5f5; display: flex; align-items: flex-start; gap: 14px; cursor: pointer; transition: 0.2s; position: relative; }
        .notif-item:hover { background: #f9fbff; }
        .notif-icon-box { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .notif-content { flex: 1; }
        .notif-content h6 { margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #222; }
        .notif-content p { margin: 0; font-size: 12px; color: #666; line-height: 1.4; }
        .notif-delete { background: transparent; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1; color: #aaa; cursor: pointer; transition: all 0.2s ease; margin-left: auto; }
        .notif-delete:hover { background-color: #ffe5e5; color: #dc3545; }
        .notif-empty { padding: 30px; text-align: center; color: #999; font-size: 13px; }

        /* --- NAV ITEMS --- */
        .nav-link-container { display: flex; gap: 25px; align-items: center; Font-Family:sans-serif, Noto Sans Tamil;}
        .nav-item-custom { cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5px; color: #555; transition: all 0.2s; }
        .nav-item-custom:hover { color: #000; transform: translateY(-2px); }
        .nav-item-custom.active-nav { color: #eab308; }
        .nav-icon { font-size: 18px; margin-bottom: 2px; }
        .nav-label { font-size: 10px; font-weight: 700; text-transform: uppercase; }

        /* --- UTILS --- */
        .lang-switcher-btn { padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: #f1f3f5; color: #555; border: none; cursor: pointer; }
        .lang-switcher-btn.active-lang { background-color: #0d6efd !important; color: white !important; }
        .profile-container { position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center; }
        .profile-dropdown-menu { position: absolute; top: 130%; right: 0; background: white; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); min-width: 170px; z-index: 1050; padding: 8px 0; }
        .dropdown-item-custom { padding: 10px 16px; font-size: 13px; font-weight:500; color: #333; cursor: pointer; transition: 0.2s; }
        .dropdown-item-custom:hover { background-color: #f0f7ff; color: #0d6efd; }
        
        .slide-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1040; backdrop-filter: blur(2px); }
        .profile-slide-panel { position: fixed; top: 0; right: 0; width: 340px; height: 100vh; background: white; z-index: 1050; box-shadow: -5px 0 30px rgba(0,0,0,0.15); padding: 25px; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; }
        .profile-slide-panel.open { transform: translateX(0); }
        .slide-avatar-wrapper { position: relative; width: 120px; height: 120px; margin: 20px auto; }
        .slide-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .cam-btn { position: absolute; bottom: 0; right: 0; background: #0d6efd; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer; }
        .btn-slide-save { background: #28a745; color: white; width: 100%; padding: 10px; border: none; border-radius: 6px; margin-top: 15px; font-weight: 600; }
        
          /* === EXACT LOGIN STYLE === */
        .login-like-img {
          width: 80px;
          height: 95px;
          background-color: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        
        .login-icon-outline {
          width: 26px;
          height: 26px;
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .login-text {
          font-size: 12px;
          font-weight: 600;
          color: #000;
        }

       `}
      </style>

      {/* ================= NAVBAR CONTENT ================= */}
      <nav className={`navbar navbar-expand app-navbar`}>
        <div className="container-fluid d-flex justify-content-between align-items-center h-100">

          {/* 1. LOGO */}
          <div onClick={() => navGo("/")} className="logo-section">
            <img src={logo} alt="Logo" className="logo-img" />
            <span className="text-logo">{t("Nalla Angadi | Royal Kavery")}</span>
          </div>

          {/* 2. NAVIGATION LINKS */}
          <div className={`nav-link-container ${!isHomePage ? 'd-none d-lg-flex' : 'd-none d-md-flex'}`}>
            <NavItem icon="🏠" labelKey="Home" onClick={() => navGo("/")} isActive={location.pathname === "/"} />
            <NavItem icon="🏷️" labelKey="Category" onClick={goToCategory} isActive={false} />
            <NavItem icon="🎁" labelKey="Offers" onClick={() => navigate('/offers')} isActive={location.pathname.startsWith("/offers")} />
            <NavItem icon="💼" labelKey="Jobs" onClick={() => navGo("/jobs")} isActive={location.pathname === "/jobs"} />
            <NavItem icon="💰" labelKey="Plan" onClick={() => navGo("/plan")} isActive={location.pathname === "/plan"} />
          </div>

          {/* 3. UTILITIES */}
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex gap-1 border rounded p-1" style={{borderColor: '#ddd', background: '#f8f9fa'}}>
              <button className={`lang-switcher-btn ${i18n.language === "en" ? "active-lang" : ""}`} onClick={() => changeLang("en")}>EN</button>
              <button className={`lang-switcher-btn ${i18n.language === "ta" ? "active-lang" : ""}`} onClick={() => changeLang("ta")}>TA</button>
            </div>

            {uid && (
              <div className="notif-container" ref={notifRef} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <span>🔔</span>
                {notifications.length > 0 && <div className="notif-badge">{notifications.length}</div>}
                {showNotifDropdown && (
                  <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="notif-header">
                        <span>Notifications</span>
                        <span style={{color:'#007bff', cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); setNotifications([]); }}>Clear All</span>
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? <div className="notif-empty">No new notifications</div> : notifications.map((notif) => {
                          const config = getNotificationConfig(notif.title, notif.message);
                          return (
                            <div key={notif._id} className="notif-item" onClick={() => handleNotifClick(notif)}>
                              <div className="notif-icon-box" style={{ backgroundColor: config.bg, color: config.color }}>{config.icon}</div>
                              <div className="notif-content">
                                <h6>{notif.title}</h6>
                                <p>{notif.message}</p>
                              </div>
                              <button className="notif-delete" onClick={(e) => deleteNotification(notif._id, e)}>&times;</button>
                            </div>
                          );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!uid ? (
              <div onClick={() => navGo("/login")} className="nav-item-custom login-like-img">
              <div className="login-icon-outline">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path>
                </svg>
              </div>
              <div className="login-text">Login</div>
            </div>


            ) : (
              <div className="profile-container" ref={dropdownRef} onClick={toggleDropdown}>
                <img src={profileImg} onError={(e) => e.target.src = DEFAULT_AVATAR} width={35} height={35} alt="profile" style={{ borderRadius: '50%', border: '2px solid #007bff', objectFit: 'cover' }} />
                <div style={{ fontSize: 10, color: '#272732', fontWeight: 'bold', marginTop: 2 }}>{firstName}</div>
                {showDropdown && (
                  <div className="profile-dropdown-menu">
                    <div className="dropdown-item-custom" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setShowSlide(true); }}>{t("Profile")}</div>
                    <div className="dropdown-item-custom" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); navGo("/dashboard"); }}>{t("Dashboard")}</div>
                    <div className="dropdown-item-custom" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); navGo("/settings"); }}>{t("Settings")}</div>
                    <div className="dropdown-item-custom" onClick={handleLogout} style={{color:'#dc3545', borderTop:'1px solid #f0f0f0'}}>{t("Logout")}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SLIDE OUT */}
      {showSlide && <div className="slide-overlay" onClick={closeSlide}></div>}
      <div className={`profile-slide-panel ${showSlide ? "open" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0 fw-bold">My Profile</h5>
            <button onClick={closeSlide} style={{background:'none', border:'none', fontSize:24, color:'#777'}}>&times;</button>
        </div>
        <div className="slide-avatar-wrapper">
            <img src={slidePreview || profileImg} alt="Profile" className="slide-img" onError={(e) => e.target.src = DEFAULT_AVATAR} />
            <div className="cam-btn" onClick={triggerFileSelect}>📷</div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display:'none'}} />
        </div>
        <div className="text-center mb-4">
            <h5 className="fw-bold">{fullName}</h5>
            <p className="text-muted small">ID: {uid}</p>
        </div>
        {slideFile && <button className="btn-slide-save" onClick={saveProfileImage} disabled={uploading}>{uploading ? "Uploading..." : "Save Changes"}</button>}
        <div style={{marginTop:'auto'}}>
            <button className="btn btn-outline-primary w-100 py-2 fw-bold" onClick={() => { closeSlide(); navGo("/dashboard"); }}>Go to Dashboard</button>
        </div>
      </div>

      {/* POPUP TOAST COMPONENT */}
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

export default Navbar;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [lang, setLang] = useState(
    () => localStorage.getItem("JOB_LANG") || "en"
    );

  // Two separate states for inputs
  const [cityInput, setCityInput] = useState("");
  const [searchInput, setSearchInput] = useState("");


  // ==========================================
  // AUTO SEARCH LOGIC (DEBOUNCE)
  // City அல்லது Search மாறினால் தானாகவே Fetch ஆகும்
  // ==========================================
  useEffect(() => {
    // User type பண்ண ஆரம்பிக்கும் போது loading காட்டுவோம்
    if(cityInput || searchInput) setLoading(true);

    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 800); // 800ms தாமதம் (Type பண்ணி முடித்ததும் தேடும்)

    return () => clearTimeout(delayDebounceFn);
  }, [cityInput, searchInput, lang]);

  // Initial Load
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // cityInput இருந்தால் அதை city_name ஆக அனுப்புகிறோம்
      if (cityInput) params.append("city_name", cityInput);
      if (searchInput) params.append("job_title", searchInput);
      params.append("lang", lang);

      const res = await fetch(`${API_BASE}/jobs/?${params.toString()}`);
      const data = await res.json();

      if (data.status) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleLanguage = () => {
      setLang(prev => {
        const newLang = prev === "en" ? "ta" : "en";
        localStorage.setItem("JOB_LANG", newLang);
        return newLang;
      });
      setCityInput("");
      setSearchInput("");
    };




  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.navBar}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h2 style={styles.navTitle}>
                {lang === "en" ? "Find Jobs" : "வேலை தேடல்"}
            </h2>
        </div>
        <button onClick={toggleLanguage} style={styles.langBtn}>
            {lang === "en" ? "தமிழ்" : "English"}
        </button>
      </div>

      <div style={styles.container}>

        {/* FILTERS SECTION (CITY + SEARCH) */}
        <div style={styles.filterContainer}>

          {/* 1. CITY INPUT */}
          <div style={styles.inputWrapper}>
             <span style={styles.iconLabel}>📍</span>
             <input
              style={styles.input}
              placeholder={lang === "en" ? "Enter City " : "ஊர் பெயர்"}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
          </div>

          {/* 2. JOB SEARCH INPUT */}
          <div style={styles.inputWrapper}>
             <span style={styles.iconLabel}>🔍</span>
             <input
              style={styles.input}
              placeholder={lang === "en" ? "Job Title " : "வேலை "}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

        </div>

        {/* RESULTS HEADER */}
        <div style={styles.resultsInfo}>
            {loading ? (
                <span style={{color: '#0d6efd'}}>
                    {lang === "en" ? "Searching..." : "தேடிக்கொண்டிருக்கிறது..."}
                </span>
            ) : (
                <span>
                    Found {jobs.length} jobs
                    {cityInput && <span> in <b>{cityInput}</b></span>}
                </span>
            )}
        </div>

        {/* JOB LIST */}
        {loading && jobs.length === 0 ? (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={styles.centerBox}>
            <p style={styles.empty}>
                {lang === "en" ? "No jobs found matching your search." : "உங்கள் தேடலுக்கு ஏற்ற வேலைகள் இல்லை."}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {jobs.map((job) => (
              <div
                key={job._id}
                style={styles.card}
                onClick={() => navigate(`/job/${job._id}?lang=${lang}`)}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.jobTitle}>{job.job_title}</h3>
                    <p style={styles.company}>{job.shop_name}</p>
                  </div>
                  <span style={styles.salaryBadge}>₹{job.salary}</span>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.cardFooter}>
                  <div style={styles.metaItem}>
                    <span>🕒 {job.work_start_time} - {job.work_end_time}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span>📍 {job.city_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: { background: "#f0f2f5", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif,Noto Sans Tamil", paddingBottom: "40px" },
  navBar: { position: "sticky", top: 0, zIndex: 100, background: "#fff", padding: "15px 20px", display: "flex", justifyContent: "space-between", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  backBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: "16px",fontFamily: " sans-serif,Noto Sans Tamil" },
    navTitle: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      margin: 0,
      fontSize: "18px",
      fontWeight: "700",
      color: "#333",
    }  ,
  langBtn: { background: "#0d6efd", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },

  container: { padding: "20px", maxWidth: "600px", margin: "0 auto" },

  // New Filter Styles
  filterContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
    background: "#fff",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  iconLabel: {
    paddingLeft: "12px",
    fontSize: "18px",
  },
  input: {
    width: "100%",
    padding: "12px 10px",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "15px",
  },
  resultsInfo: {
    marginBottom: "15px",
    fontSize: "14px",
    color: "#666",
    textAlign: "right"
  },

  // Job Cards
  grid: { display: "flex", flexDirection: "column", gap: "15px" },
  card: { background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", cursor: "pointer", transition: "0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  jobTitle: { margin: "0 0 5px 0", fontSize: "16px", fontWeight: "700", color: "#222" },
  company: { margin: 0, fontSize: "13px", color: "#666" },
  salaryBadge: { background: "#e6f4ea", color: "#1e7e34", padding: "4px 8px", borderRadius: "4px", fontSize: "13px", fontWeight: "600", height: "fit-content" },
  divider: { height: "1px", background: "#eee", margin: "10px 0" },
  cardFooter: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555" },
  metaItem: { display: "flex", alignItems: "center", gap: "5px" },

  centerBox: { textAlign: "center", padding: "40px 0", color: "#999" },
  spinner: { margin: "0 auto", width: "24px", height: "24px", border: "3px solid #eee", borderTop: "3px solid #0d6efd", borderRadius: "50%", animation: "spin 1s linear infinite" },
  empty: { fontSize: "15px" },
};

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
const API_BASE = "http://127.0.0.1:8000";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const getLang = () => localStorage.getItem("LANG") || "en";
  const [lang, setLang] = useState(getLang());

  useEffect(() => {
      const handler = () => setLang(getLang());
      window.addEventListener("LANG_CHANGE", handler);
      return () => window.removeEventListener("LANG_CHANGE", handler);
    }, []);

  useEffect(() => {
      fetch(`${API_BASE}/job/${id}/?lang=${lang}`)
        .then(res => res.json())
        .then(data => {
          if (data.status) setJob(data.job);
        });
    }, [id, lang]);


  if (!job) return (
    <div style={styles.loadingPage}>
      <div style={styles.spinner}></div>
      <p>Loading details...</p>
    </div>
  );

  return (
    <div style={styles.page}>
        <Navbar />

      {/* NAVBAR */}
      <div style={styles.navBar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 style={styles.navTitle}>{lang === "en" ? "Job Details." : "வேலை விவரங்கள்."}
</h2>
        <div style={{ width: 40 }}></div> {/* Spacer */}
      </div>

      <div style={styles.container}>
        {/* MAIN HEADER CARD */}
        <div style={styles.headerCard}>
            <div style={styles.titleRow}>
                <h1 style={styles.jobTitle}>{job.job_title}</h1>
                <span style={styles.salaryBadge}>₹{job.salary}</span>
            </div>
            <p style={styles.companyName}>{job.shop_name}</p>

            <div style={styles.tagRow}>
                 {/* City Tag */}
                <div style={styles.tag}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>{job.city_name}</span>
                </div>
                 {/* Time Tag */}
                <div style={styles.tag}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>{job.work_start_time} - {job.work_end_time}</span>
                </div>
            </div>
        </div>

        {/* DESCRIPTION SECTION */}
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{lang === "en" ? "Job Description" : "வேலை விவரம்"}</h3>
            <div style={styles.card}>
                <p style={styles.descriptionText}>{job.job_description}</p>
            </div>
        </div>

        {/* LOCATION & CONTACT SECTION */}
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{lang === "en" ? "Location & Contact" : "இருப்பிடம் & தொடர்பு"}</h3>
            <div style={styles.card}>
                {/* Address Row */}
                <div style={styles.infoRow}>
                    <div style={styles.iconBox}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div>
                        <span style={styles.label}>{lang === "en" ? "Address" : "முகவரி"}</span>
                        <p style={styles.infoText}>{job.address}</p>
                    </div>
                </div>

                <div style={styles.divider}></div>

                {/* Contact Row (Phone) */}
                <div style={styles.infoRow}>
                     <div style={styles.iconBox}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <div>
                        <span style={styles.label}>{lang === "en" ? "Phone" : "தொலைபேசிி"}</span>
                        <p style={styles.infoText}>{job.phone_number}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* ACTION BUTTONS (Sticky Bottom or Just Bottom) */}
        <div style={styles.actionFooter}>
            <a href={`tel:${job.phone_number}`} style={styles.callBtn}>
                {lang === "en" ? "Call Now" : "தொடர்புக்கு "}
            </a>
            {job.email && (
                <a href={`mailto:${job.email}`} style={styles.emailBtn}>
                    Email
                </a>
            )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#f8f9fa",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif,Noto Sans Tamil",
    paddingBottom: "80px", // Space for footer
  },
  loadingPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#666",
  },
  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #ddd",
    borderTop: "3px solid #0d6efd",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "10px",
  },

  // Navigation
  navBar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#ffffff",
    padding: "15px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  backBtn: {
    background: "#f1f3f5",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#333",
  },
  navTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    margin: 0,
  },

  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },

  // Header Card
  headerCard: {
    marginBottom: "25px",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  jobTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#212529",
    fontWeight: "700",
    lineHeight: "1.2",
    flex: 1,
    paddingRight: "10px",
  },
  salaryBadge: {
    background: "#d1e7dd",
    color: "#0f5132",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  companyName: {
    fontSize: "16px",
    color: "#6c757d",
    margin: "0 0 15px 0",
  },
  tagRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff",
    border: "1px solid #e9ecef",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#495057",
  },

  // Sections
  section: {
    marginBottom: "25px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#212529",
    marginBottom: "10px",
    paddingLeft: "4px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    border: "1px solid #f1f1f1",
  },
  descriptionText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#444",
    margin: 0,
    whiteSpace: "pre-line", // Preserves line breaks from DB
  },

  // Contact Info
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  iconBox: {
    width: "40px",
    height: "40px",
    background: "#e7f1ff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginBottom: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoText: {
    margin: 0,
    fontSize: "15px",
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: "1px",
    background: "#f1f1f1",
    margin: "15px 0",
  },

  // Footer Actions
  actionFooter: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  callBtn: {
    flex: 1,
    background: "#0d6efd",
    color: "#fff",
    textAlign: "center",
    padding: "14px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "16px",
    boxShadow: "0 4px 10px rgba(13, 110, 253, 0.3)",
    transition: "0.2s",
  },
  emailBtn: {
    flex: 1,
    background: "#fff",
    border: "2px solid #0d6efd",
    color: "#0d6efd",
    textAlign: "center",
    padding: "14px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "16px",
  },
};

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cityName, setCityName] = useState("thanjavur");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/jobs/?city_name=${cityName}&job_title=${search}`
      );
      const data = await res.json();
      if (data.status) {
        setJobs(data.jobs);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* HEADER WITH BACK BUTTON */}
      <div style={styles.navBar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          {/* SVG Back Arrow */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h2 style={styles.navTitle}>Find Jobs</h2>
        <div style={{ width: 24 }}></div> {/* Spacer to center title */}
      </div>

      <div style={styles.container}>
        {/* SEARCH SECTION */}
        <div style={styles.header}>
          <h3 style={styles.subTitle}>Jobs in <span style={styles.highlight}>{cityName}</span></h3>
          <div style={styles.inputWrapper}>
             {/* Search Icon SVG */}
            <svg style={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              style={styles.input}
              placeholder="Search (e.g. Developer, Driver...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={fetchJobs}
            />
          </div>
        </div>

        {/* JOB LIST */}
        {loading ? (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
            <p>Loading opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div style={styles.centerBox}>
            <p style={styles.empty}>No jobs found matching "{search}"</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {jobs.map((job) => (
              <div
                key={job._id}
                style={styles.card}
                onClick={() => navigate(`/job/${job._id}`)}
                className="job-card" // For hover effects if you add CSS file later
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.jobTitle}>{job.job_title}</h3>
                    <p style={styles.company}>{job.shop_name}</p>
                  </div>
                  <span style={styles.salaryBadge}>₹{job.salary}</span>
                </div>

                <div style={styles.divider}></div>

                <p style={styles.desc}>{job.job_description ? job.job_description.substring(0, 80) + "..." : "No description"}</p>

                <div style={styles.cardFooter}>
                  <div style={styles.metaItem}>
                    {/* Clock Icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span style={{marginLeft: 4}}>{job.work_start_time} - {job.work_end_time}</span>
                  </div>
                  <div style={styles.metaItem}>
                     {/* Map Pin Icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span style={{marginLeft: 4}}>{job.city_name}</span>
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

/* ================= IMPROVED STYLES ================= */

const styles = {
  page: {
    background: "#f8f9fa",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    paddingBottom: "40px",
  },
  // Sticky Top Bar
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
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    color: "#333",
    transition: "background 0.2s",
  },
  navTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
  },
  container: {
    padding: "20px",
    maxWidth: "600px", // Limits width on desktop for better look
    margin: "0 auto",
  },
  header: {
    marginBottom: "25px",
  },
  subTitle: {
    margin: "0 0 15px 0",
    color: "#444",
    fontSize: "22px",
    fontWeight: "700",
  },
  highlight: {
    color: "#0d6efd",
    textTransform: "capitalize",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "15px",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 45px", // Left padding for icon
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    outline: "none",
    fontSize: "15px",
    background: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
    transition: "border 0.2s",
  },

  // Card Styles
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    cursor: "pointer",
    border: "1px solid #f0f0f0",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  jobTitle: {
    margin: "0 0 4px 0",
    fontSize: "17px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  company: {
    margin: 0,
    fontSize: "14px",
    color: "#7f8c8d",
    fontWeight: "500",
  },
  salaryBadge: {
    background: "#e6f4ea", // Light green background
    color: "#1e7e34",     // Dark green text
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  divider: {
    height: "1px",
    background: "#f1f1f1",
    margin: "10px 0",
  },
  desc: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.5",
    marginBottom: "15px",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "12px",
    color: "#888",
    background: "#f8f9fa",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  // Loading & Empty States
  centerBox: {
    textAlign: "center",
    padding: "40px 0",
    color: "#888",
  },
  spinner: {
    margin: "0 auto 10px",
    width: "24px",
    height: "24px",
    border: "3px solid #eee",
    borderTop: "3px solid #0d6efd",
    borderRadius: "50%",
    animation: "spin 1s linear infinite", // Note: animation keyframes usually need global CSS
  },
  empty: {
    fontSize: "16px",
    color: "#999",
  },
};

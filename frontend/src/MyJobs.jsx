import React, { useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "./authFetch";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

// --- CONFIG ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// --- TRANSLATIONS ---
const TXT = {
  myJobs: { en: "My Jobs", ta: "எனது வேலைகள்" },
  addJob: { en: "+ Post New Job", ta: "+ புதிய வேலையைப் பதிவு செய்" },
  noJobs: { en: "No jobs posted yet.", ta: "இதுவரை எந்த வேலையும் பதிவு செய்யப்படவில்லை." },

  // Field Labels
  jobTitle: { en: "Job Title", ta: "வேலை தலைப்பு" },
  companyName: { en: "Shop / Company Name", ta: "கடை / நிறுவனத்தின் பெயர்" },
  salary: { en: "Salary (₹)", ta: "சம்பளம் (₹)" },
  phone: { en: "Phone Number", ta: "தொலைபேசி எண்" },
  email: { en: "Email ID", ta: "மின்னஞ்சல் முகவரி" },
  address: { en: "Address", ta: "முகவரி" },

  // New Time Labels
  workTime: { en: "Work Timing", ta: "வேலை நேரம்" },
  startTime: { en: "Start Time (e.g., 9:00 AM)", ta: "தொடக்க நேரம் (காலை 9:00)" },
  endTime: { en: "End Time (e.g., 6:00 PM)", ta: "முடிவு நேரம் (மாலை 6:00)" },

  description: { en: "Job Description", ta: "வேலை விளக்கம்" },
  city: { en: "City", ta: "நகரம்" },
  cityPlaceholder: { en: "Search City...", ta: "நகரத்தைத் தேடு..." },

  edit: { en: "Edit", ta: "திருத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  save: { en: "Save Job", ta: "சேமி" },
  saving: { en: "Saving...", ta: "சேமிக்கிறது..." },
  cancel: { en: "Cancel", ta: "ரத்து செய்" },
  confirmDelete: { en: "Delete this job?", ta: "இந்த வேலையை நீக்கவா?" },
  updateJob: { en: "Update Job", ta: "வேலையைப் புதுப்பி" },
  createJob: { en: "Create Job", ta: "வேலையை உருவாக்கு" },
  back: { en: "Back", ta: "பின்செல்ல" },
  selectCityErr: { en: "Please select a city from the list.", ta: "பட்டியலிலிருந்து ஒரு நகரத்தைத் தேர்ந்தெடுக்கவும்." },
  fillAll: { en: "Please fill all fields.", ta: "எல்லா விவரங்களையும் நிரப்பவும்." }
};

export default function MyJobs() {
  const navigate = useNavigate();

  // --- STATE ---
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lang, setLang] = useState(localStorage.getItem("LANG") || "en");

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    job_title: "",
    job_description: "",
    salary: "",
    shop_name: "",
    phone_number: "",
    email: "",
    address: "",
    work_start_time: "", // New
    work_end_time: "",   // New
    city_id: "",
    city_name: ""
  });

  // City Search State
  const [citySug, setCitySug] = useState([]);
  const [citySelected, setCitySelected] = useState(false);
  const typingRef = useRef(null);

  // --- LIFECYCLE ---
  useEffect(() => {
    const handleLang = () => setLang(localStorage.getItem("LANG") || "en");
    window.addEventListener("languageChange", handleLang);
    return () => window.removeEventListener("languageChange", handleLang);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [lang]);

  // --- API ACTIONS ---

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/my/jobs/?lang=${lang}`);
      const json = await res.json();
      if (json.status === true) {
        setJobs(json.data || []);
      } else {
        console.warn(json.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCity = async (text) => {
    if (!text?.trim()) return setCitySug([]);
    try {
      const res = await fetch(`${BACKEND_URL}/city/search?city_name=${encodeURIComponent(text)}&lang=${lang}`);
      const json = await res.json();
      if (json?.status === "success") setCitySug(json.data || []);
    } catch (e) {}
  };

  const deleteJob = async (id) => {
    if (!window.confirm(TXT.confirmDelete[lang])) return;
    try {
      const res = await authenticatedFetch(`/job/delete/${id}/?lang=${lang}`, { method: "DELETE" });
      const json = await res.json();
      if (json.status === true) {
        loadJobs();
      } else {
        alert(json.message);
      }
    } catch (e) {
      alert("Server Error");
    }
  };

  const submitForm = async () => {
    // 1. Validation
    if (
      !form.job_title || !form.salary || !form.shop_name ||
      !form.phone_number || !form.email || !form.address ||
      !form.job_description || !form.work_start_time || !form.work_end_time
    ) {
      return showError(TXT.fillAll[lang]);
    }
    if (!form.city_id) {
      return showError(TXT.selectCityErr[lang]);
    }

    setSaving(true);

    // 2. Prepare FormData
    const fd = new FormData();
    fd.append("job_title", form.job_title);
    fd.append("job_description", form.job_description);
    fd.append("salary", form.salary);
    fd.append("shop_name", form.shop_name);
    fd.append("phone_number", form.phone_number);
    fd.append("email", form.email);
    fd.append("address", form.address);
    // New Fields
    fd.append("work_start_time", form.work_start_time);
    fd.append("work_end_time", form.work_end_time);

    fd.append("city_id", form.city_id);

    const url = editingJobId
      ? `/job/update/${editingJobId}/?lang=${lang}`
      : `/job/add/?lang=${lang}`;

    // 3. Send Request
    try {
      const res = await authenticatedFetch(url, { method: "POST", body: fd });
      const json = await res.json();

      if (json.status === true) {
        setShowModal(false);
        loadJobs();
      } else {
        showError(json.message);
      }
    } catch (e) {
      showError("Server Error");
    } finally {
      setSaving(false);
    }
  };

  // --- HANDLERS ---

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onCityTyping = (value) => {
    handleInputChange("city_name", value);
    handleInputChange("city_id", "");
    setCitySelected(false);

    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCity(value), 300);
  };

  const selectCity = (city) => {
    handleInputChange("city_id", city._id);
    handleInputChange("city_name", city.city_name);
    setCitySelected(true);
    setCitySug([]);
  };

  const openAddModal = () => {
    setEditingJobId(null);
    setCitySelected(false);
    setForm({
      job_title: "", job_description: "", salary: "",
      shop_name: "", phone_number: "", email: "", address: "",
      work_start_time: "", work_end_time: "",
      city_id: "", city_name: ""
    });
    setShowModal(true);
  };

  const openEditModal = (job) => {
    setEditingJobId(job._id);
    setCitySelected(true);
    setForm({
      job_title: job.job_title,
      job_description: job.job_description,
      salary: job.salary,
      shop_name: job.shop_name,
      phone_number: job.phone_number || "",
      email: job.email || "",
      address: job.address || "",
      work_start_time: job.work_start_time || "",
      work_end_time: job.work_end_time || "",
      city_id: job.city_id,
      city_name: job.city_name
    });
    setShowModal(true);
  };

  // --- STYLES ---
  const colors = {
    primary: "#2563EB",
    bg: "#F3F4F6",
    card: "#FFFFFF",
    text: "#1F2937",
    subtext: "#6B7280",
    border: "#E5E7EB",
    danger: "#DC2626",
    success: "#16A34A",
  };

  const s = {
    page: { backgroundColor: colors.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
    container: { maxWidth: "1200px", margin: "0 auto", padding: "20px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", background: colors.card, padding: "1rem 1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    title: { margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#111827" },
    btnGroup: { display: "flex", gap: "12px" },
    btn: (color = colors.primary) => ({
      padding: "0.6rem 1.2rem", backgroundColor: color, color: "white", border: "none", borderRadius: "8px",
      cursor: "pointer", fontWeight: "500", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px"
    }),
    cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
    jobCard: { backgroundColor: colors.card, borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid " + colors.border, display: "flex", flexDirection: "column", justifyContent: "space-between" },
    jobTitle: { fontSize: "1.25rem", fontWeight: "bold", color: colors.primary, marginBottom: "5px" },
    company: { fontSize: "1rem", fontWeight: "600", color: colors.text, marginBottom: "12px" },
    detailRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: colors.subtext, marginBottom: "6px" },
    desc: { fontSize: "0.95rem", color: "#4B5563", margin: "15px 0", lineHeight: "1.5", whiteSpace: "pre-wrap", borderTop: "1px dashed #eee", paddingTop: "10px" },
    actionRow: { marginTop: "15px", paddingTop: "15px", borderTop: "1px solid " + colors.border, display: "flex", justifyContent: "flex-end", gap: "10px" },

    // Modal
    overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
    modal: { backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", position: "relative", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
    closeBtn: { position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: colors.subtext },
    input: { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid " + colors.border, marginBottom: "1rem", fontSize: "0.95rem", boxSizing: "border-box", fontFamily: "inherit" },
    label: { display: "block", fontWeight: "600", marginBottom: "6px", color: colors.text, fontSize: "0.9rem" },
    sugBox: { position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ddd", zIndex: 10, maxHeight: "150px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: "8px" },
    sugItem: { padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.9rem" }
  };

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.container}>
        {/* HEADER */}
        <div style={s.header}>
          <h2 style={s.title}>{TXT.myJobs[lang]}</h2>
          <div style={s.btnGroup}>
            <button style={s.btn(colors.success)} onClick={openAddModal}>
              {TXT.addJob[lang]}
            </button>
            <button style={{...s.btn("white"), color: colors.text, border: "1px solid #ddd"}} onClick={() => navigate(-1)}>
              ← {TXT.back[lang]}
            </button>
          </div>
        </div>

        {errorMsg && <div style={{backgroundColor: "#FEE2E2", color: "#991B1B", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #FCA5A5"}}>{errorMsg}</div>}

        {loading && <div style={{textAlign: "center", padding: "2rem", color: colors.subtext}}>Loading jobs...</div>}

        {!loading && jobs.length === 0 ? (
          <div style={{textAlign: "center", padding: "4rem", color: colors.subtext, background: "white", borderRadius: "12px", border: "1px dashed #ddd"}}>
            {TXT.noJobs[lang]}
          </div>
        ) : (
          <div style={s.cardGrid}>
            {jobs.map((job) => (
              <div key={job._id} style={s.jobCard}>
                <div>
                  <div style={s.jobTitle}>{job.job_title}</div>
                  <div style={s.company}>{job.shop_name}</div>

                  <div style={s.detailRow}><span>📍</span> {job.address}, {job.city_name}</div>
                  <div style={s.detailRow}><span>📞</span> {job.phone_number}</div>
                  <div style={s.detailRow}><span>✉️</span> {job.email}</div>
                  <div style={s.detailRow}><span>💰</span> ₹{job.salary}</div>

                  {/* Work Time Display */}
                  <div style={s.detailRow}>
                    <span>🕒</span> {job.work_start_time} - {job.work_end_time}
                  </div>

                  <div style={s.detailRow}><span>📅</span> {new Date(job.created_at).toLocaleDateString()}</div>

                  <p style={s.desc}>{job.job_description}</p>
                </div>

                <div style={s.actionRow}>
                   <button style={{...s.btn(colors.primary), padding: "6px 12px", fontSize: "0.85rem"}} onClick={() => openEditModal(job)}>
                     {TXT.edit[lang]}
                   </button>
                   <button style={{...s.btn(colors.danger), padding: "6px 12px", fontSize: "0.85rem"}} onClick={() => deleteJob(job._id)}>
                     {TXT.delete[lang]}
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
             <button style={s.closeBtn} onClick={() => setShowModal(false)}>×</button>
             <h3 style={{marginTop: 0, marginBottom: "1.5rem", color: colors.primary}}>
               {editingJobId ? TXT.updateJob[lang] : TXT.createJob[lang]}
             </h3>

             {/* Job Title */}
             <div>
               <label style={s.label}>{TXT.jobTitle[lang]}</label>
               <input style={s.input} value={form.job_title} onChange={e => handleInputChange("job_title", e.target.value)} />
             </div>

             {/* Shop Name */}
             <div>
               <label style={s.label}>{TXT.companyName[lang]}</label>
               <input style={s.input} value={form.shop_name} onChange={e => handleInputChange("shop_name", e.target.value)} />
             </div>

             {/* Phone & Email (Grid) */}
             <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                <div>
                  <label style={s.label}>{TXT.phone[lang]}</label>
                  <input style={s.input} value={form.phone_number} onChange={e => handleInputChange("phone_number", e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>{TXT.email[lang]}</label>
                  <input style={s.input} value={form.email} onChange={e => handleInputChange("email", e.target.value)} />
                </div>
             </div>

             {/* Address */}
             <div>
               <label style={s.label}>{TXT.address[lang]}</label>
               <input style={s.input} value={form.address} onChange={e => handleInputChange("address", e.target.value)} />
             </div>

             {/* Work Timings (Grid) */}
             <label style={{...s.label, color: colors.primary, marginTop: "0.5rem"}}>{TXT.workTime[lang]}</label>
             <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.5rem"}}>
                <div>
                  <label style={{...s.label, fontSize: "0.8rem", color: colors.subtext}}>{TXT.startTime[lang]}</label>
                  <input
                    style={s.input}
                    value={form.work_start_time}
                    placeholder="9:00 AM"
                    onChange={e => handleInputChange("work_start_time", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{...s.label, fontSize: "0.8rem", color: colors.subtext}}>{TXT.endTime[lang]}</label>
                  <input
                    style={s.input}
                    value={form.work_end_time}
                    placeholder="6:00 PM"
                    onChange={e => handleInputChange("work_end_time", e.target.value)}
                  />
                </div>
             </div>

             {/* Salary */}
             <div>
               <label style={s.label}>{TXT.salary[lang]}</label>
               <input type="number" style={s.input} value={form.salary} onChange={e => handleInputChange("salary", e.target.value)} />
             </div>

             {/* City Search */}
             <div style={{position: "relative"}}>
               <label style={s.label}>{TXT.city[lang]}</label>
               <input
                  style={{
                    ...s.input,
                    borderColor: (!form.city_id && form.city_name) ? "red" : colors.border
                  }}
                  placeholder={TXT.cityPlaceholder[lang]}
                  value={form.city_name}
                  onChange={e => onCityTyping(e.target.value)}
               />

               {citySug.length > 0 && (
                 <div style={s.sugBox}>
                   {citySug.map(c => (
                     <div key={c._id} style={s.sugItem} onClick={() => selectCity(c)}>
                       <strong>{c.city_name}</strong> - {c.pincode}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Description */}
             <div>
               <label style={s.label}>{TXT.description[lang]}</label>
               <textarea style={{...s.input, height: "100px", resize: "vertical"}} value={form.job_description} onChange={e => handleInputChange("job_description", e.target.value)} />
             </div>

             {/* Buttons */}
             <div style={{display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem"}}>
               <button style={s.btn(colors.subtext)} onClick={() => setShowModal(false)}>
                 {TXT.cancel[lang]}
               </button>
               <button style={{...s.btn(colors.success), opacity: saving ? 0.7 : 1}} onClick={submitForm} disabled={saving}>
                 {saving ? TXT.saving[lang] : TXT.save[lang]}
               </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
}

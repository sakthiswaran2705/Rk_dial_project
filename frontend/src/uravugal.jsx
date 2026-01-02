import React, { useState, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  User, MapPin, Briefcase, Phone, Mail,
  Heart, Languages, CheckCircle2, ArrowRight, X, Building2
} from 'lucide-react';


import occupationData from './occupation.json';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const UravugalForm = () => {
  // ------------------------------------
  // STATE
  // ------------------------------------
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Occupation Data State
  const [occupationOptions] = useState(
    occupationData.occupations || (Array.isArray(occupationData) ? occupationData : [])
  );

  const [occupationSearch, setOccupationSearch] = useState('');
  const [showOccDropdown, setShowOccDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const initialFormState = {
    name: '', pattapaiyar: '', native_place: '',
    father_name: '', father_pattapaiyar: '', father_native_place: '',
    mother_name: '', mother_pattapaiyar: '', mother_native_place: '',
    occupation: [],
    business_running: 'no',
    business_name: '',
    contact_number: '', email: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // ------------------------------------
  // TRANSLATIONS
  // ------------------------------------
  const translations = {
    en: {
      title: "Uravugal Form",
      subtitle: "Enter family details below",
      langBtn: "Tamil Mode",
      personalInfo: "Personal Information",
      fatherDetails: "Father's Details",
      motherDetails: "Mother's Details",
      contactWork: "Contact & Work",
      name: "Full Name",
      pattapaiyar: "Pattapaiyar",
      native: "Native Place",
      occupation: "Occupation (Select or Type New)",
      searchOcc: "Type occupation...",
      businessQuestion: "Are you running a business?",
      businessName: "Business Name",
      mobile: "Mobile Number",
      email: "Email ID",
      submit: "SUBMIT DETAILS",
      loading: "Loading...",
      serverError: "Server Error.",
      successTitle: "Thank You!",
      successMsg: "Details registered successfully.",
      addAnother: "Add Another"
    },
    ta: {
      title: "உறவுகள் படிவம்",
      subtitle: "குடும்ப விவரங்களை உள்ளிடவும்",
      langBtn: "English Mode",
      personalInfo: "தனிப்பட்ட விவரங்கள்",
      fatherDetails: "தந்தையின் விவரங்கள்",
      motherDetails: "தாயின் விவரங்கள்",
      contactWork: "தொடர்பு மற்றும் பணி",
      name: "முழு பெயர்",
      pattapaiyar: "பட்டப்பெயர்",
      native: "சொந்த ஊர்",
      occupation: "தொழில் (தேர்வு செய்யலாம் அல்லது தட்டச்சு செய்யலாம்)",
      searchOcc: "தொழிலை தட்டச்சு செய்யவும்...",
      businessQuestion: "நீங்கள் தொழில் செய்கிறீர்களா?",
      businessName: "நிறுவனத்தின் பெயர்",
      mobile: "கைபேசி எண்",
      email: "மின்னஞ்சல் முகவரி",
      submit: "சமர்ப்பிக்கவும்",
      loading: "காத்திருக்கவும்...",
      serverError: "பிழை ஏற்பட்டது.",
      successTitle: "நன்றி!",
      successMsg: "வெற்றிகரமாக பதிவு செய்யப்பட்டது.",
      addAnother: "மேலும் சேர்க்க"
    }
  };

  const curT = translations[lang];

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessCheck = (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      business_running: isChecked ? 'yes' : 'no',
      business_name: isChecked ? prev.business_name : ''
    }));
  };



  const addOccupation = (val) => {
    const trimmedVal = val.trim();
    if (trimmedVal && !formData.occupation.includes(trimmedVal)) {
      setFormData(prev => ({
        ...prev,
        occupation: [...prev.occupation, trimmedVal]
      }));
    }
    setOccupationSearch(''); // Clear input for next entry
    setShowOccDropdown(false);
  };

  // 2. Remove Occupation (Clicking 'X')
  const removeOccupation = (occToRemove) => {
    setFormData(prev => ({
      ...prev,
      occupation: prev.occupation.filter(occ => occ !== occToRemove)
    }));
  };

  // 3. Handle Enter Key (Add whatever is typed)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (occupationSearch.trim()) {
         addOccupation(occupationSearch);
      }
    }
  };

  // 4. Filter Suggestions
  const filteredOccupations = occupationOptions.filter(occ =>
    occ.toLowerCase().includes(occupationSearch.toLowerCase()) &&
    !formData.occupation.includes(occ)
  );

  const handleInputBlur = () => {
    // Delay hiding to allow click event
    setTimeout(() => setShowOccDropdown(false), 200);
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

   
    let finalOccupations = [...formData.occupation];
    if (occupationSearch.trim() && !finalOccupations.includes(occupationSearch.trim())) {
        finalOccupations.push(occupationSearch.trim());
    }

    // Validation
    const validationRules = [
        { field: 'name', label: curT.name },
        { field: 'pattapaiyar', label: curT.pattapaiyar },
        { field: 'native_place', label: curT.native },
        { field: 'father_name', label: `${curT.name} (Father)` },
        { field: 'father_pattapaiyar', label: `${curT.pattapaiyar} (Father)` },
        { field: 'father_native_place', label: `${curT.native} (Father)` },
        { field: 'mother_name', label: `${curT.name} (Mother)` },
        { field: 'mother_pattapaiyar', label: `${curT.pattapaiyar} (Mother)` },
        { field: 'mother_native_place', label: `${curT.native} (Mother)` },
        { field: 'contact_number', label: curT.mobile },
        { field: 'email', label: curT.email },
    ];

    let missingFields = [];

    validationRules.forEach(({ field, label }) => {
        if (!formData[field] || formData[field].toString().trim() === "") {
            missingFields.push(label);
        }
    });

    if (finalOccupations.length === 0) {
        missingFields.push("Occupation");
    }

    if (formData.business_running === 'yes' && !formData.business_name.trim()) {
        missingFields.push(curT.businessName);
    }

    if (missingFields.length > 0) {
        const errorMsg = lang === 'en'
            ? `Missing: ${missingFields.join(', ')}`
            : `விடுபட்டவை: ${missingFields.join(', ')}`;
        setError(errorMsg);
        window.scrollTo(0, 0);
        return;
    }

    setLoading(true);

    // Update state visuals
    setFormData(prev => ({ ...prev, occupation: finalOccupations }));
    setOccupationSearch('');

    try {
      const payload = {
          ...formData,
          occupation: finalOccupations,
          lang: lang
      };

      
      const response = await axios.post(
        `${BACKEND_URL}/uravugal/add/`,
        payload);

      if (response.status === 200 || response.data.status === 'success') {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setError(curT.serverError);
    } finally {
      setLoading(false);
    }
  };


  if (isSuccess) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="card shadow-lg border-0 rounded-4 text-center p-5" style={{maxWidth: '500px'}}>
          <div className="mb-4 text-success"><CheckCircle2 size={80} /></div>
          <h2 className="fw-bold text-dark">{curT.successTitle}</h2>
          <p className="text-muted mb-4">{curT.successMsg}</p>
          <button className="btn btn-dark btn-lg rounded-pill px-5" onClick={() => { setIsSuccess(false); setFormData(initialFormState); }}>
            {curT.addAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center py-5"
         style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            <div className="card border-0 shadow-lg rounded-4 overflow-visible">

              <div className="card-header bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h3 className="fw-bold text-primary mb-1"><User className="me-2 mb-1" size={28}/>{curT.title}</h3>
                  <p className="text-muted small mb-0 ms-1">{curT.subtitle}</p>
                </div>
                <button type="button" className="btn btn-sm fw-bold rounded-pill px-4 btn-primary" onClick={() => setLang(prev => prev === 'en' ? 'ta' : 'en')}>
                  <Languages size={16} className="me-2"/>{curT.langBtn}
                </button>
              </div>

              <div className="card-body p-4 p-md-5">
                {error && (
                    <div className="alert alert-danger rounded-3 d-flex align-items-center mb-4">
                        <span className="me-2">⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                  {/* 1. PERSONAL DETAILS */}
                  <h6 className="text-uppercase text-secondary fw-bold mb-3 border-bottom pb-2">{curT.personalInfo}</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <BootstrapInput label={curT.name} name="name" value={formData.name} onChange={handleChange} required icon={<User size={18}/>} />
                    </div>
                    <div className="col-md-6">
                      <BootstrapInput label={curT.pattapaiyar} name="pattapaiyar" value={formData.pattapaiyar} onChange={handleChange} required icon={<Heart size={18}/>} />
                    </div>
                    <div className="col-md-6">
                      <BootstrapInput label={curT.native} name="native_place" value={formData.native_place} onChange={handleChange} required icon={<MapPin size={18}/>} />
                    </div>
                  </div>

                  {/* 2. FATHER DETAILS */}
                  <h6 className="text-uppercase text-secondary fw-bold mb-3 border-bottom pb-2">{curT.fatherDetails}</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <BootstrapInput label={`${curT.name} (Father)`} name="father_name" value={formData.father_name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                      <BootstrapInput label={curT.pattapaiyar} name="father_pattapaiyar" value={formData.father_pattapaiyar} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                      <BootstrapInput label={curT.native} name="father_native_place" value={formData.father_native_place} onChange={handleChange} required />
                    </div>
                  </div>

                  {/* 3. MOTHER DETAILS */}
                  <h6 className="text-uppercase text-secondary fw-bold mb-3 border-bottom pb-2">{curT.motherDetails}</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <BootstrapInput label={`${curT.name} (Mother)`} name="mother_name" value={formData.mother_name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                      <BootstrapInput label={curT.pattapaiyar} name="mother_pattapaiyar" value={formData.mother_pattapaiyar} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                      <BootstrapInput label={curT.native} name="mother_native_place" value={formData.mother_native_place} onChange={handleChange} required />
                    </div>
                  </div>

                  {/* 4. CONTACT & WORK */}
                  <h6 className="text-uppercase text-secondary fw-bold mb-3 border-bottom pb-2">{curT.contactWork}</h6>
                  <div className="row g-3 mb-4">

                    {/* OCCUPATION DROPDOWN (Supports Multiple + Custom) */}
                    <div className="col-12 mb-2" ref={wrapperRef}>
                      <label className="form-label text-muted small fw-bold">{curT.occupation} <span className="text-danger">*</span></label>
                      <div className={`border rounded p-2 bg-white d-flex flex-wrap gap-2 ${error.includes('Occupation') ? 'border-danger' : ''}`} style={{minHeight: '58px'}}>

                        {/* Chips for Selected Items */}
                        {formData.occupation.map((occ, idx) => (
                          <span key={idx} className="badge bg-primary d-flex align-items-center py-2 px-3 rounded-pill">
                            {occ}
                            <X size={14} className="ms-2 cursor-pointer" style={{cursor:'pointer'}} onClick={() => removeOccupation(occ)} />
                          </span>
                        ))}

                        <div className="flex-grow-1 position-relative">
                          <input
                            type="text"
                            className="form-control border-0 shadow-none p-1"
                            placeholder={formData.occupation.length === 0 ? curT.searchOcc : ""}
                            value={occupationSearch}
                            onChange={(e) => {
                                setOccupationSearch(e.target.value);
                                setShowOccDropdown(true); // Show dropdown when typing
                            }}
                            onFocus={() => setShowOccDropdown(true)}
                            onBlur={handleInputBlur}
                            onKeyDown={handleKeyDown}
                          />

                          {/* Dropdown Suggestions */}
                          {showOccDropdown && occupationSearch && filteredOccupations.length > 0 && (
                            <ul className="list-group position-absolute w-100 shadow mt-1 overflow-auto"
                                style={{maxHeight: '250px', zIndex: 9999, top: '100%', left: 0}}>
                                {filteredOccupations.map((occ, i) => (
                                  <li
                                    key={i}
                                    className="list-group-item list-group-item-action cursor-pointer"
                                    style={{cursor:'pointer'}}
                                    // Use onMouseDown for immediate selection
                                    onMouseDown={(e) => { e.preventDefault(); addOccupation(occ); }}
                                  >
                                    {occ}
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                        <Briefcase size={18} className="text-secondary align-self-center me-2"/>
                      </div>
                      <small className="text-muted ps-1" style={{fontSize: '0.8em'}}>
                        {lang === 'en' ? "Type and press Enter to add multiple." : "டைப் செய்து Enter அழுத்தவும் (பலவற்றை சேர்க்கலாம்)."}
                      </small>
                    </div>

                    {/* BUSINESS CHECKBOX */}
                    <div className="col-12 mt-3">
                       <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="businessCheck"
                            checked={formData.business_running === 'yes'}
                            onChange={handleBusinessCheck}
                            style={{width: '1.3em', height: '1.3em', cursor:'pointer'}}
                          />
                          <label className="form-check-label fw-bold ms-2 pt-1" htmlFor="businessCheck" style={{cursor:'pointer'}}>
                            {curT.businessQuestion}
                          </label>
                       </div>
                    </div>

                    {/* Conditional Business Name Field */}
                    {formData.business_running === 'yes' && (
                       <div className="col-12 mt-3 fade-in">
                          <BootstrapInput
                            label={curT.businessName}
                            name="business_name"
                            value={formData.business_name}
                            onChange={handleChange}
                            required
                            icon={<Building2 size={18}/>}
                          />
                       </div>
                    )}

                    <div className="col-md-6 mt-3">
                      <BootstrapInput label={curT.mobile} name="contact_number" value={formData.contact_number} onChange={handleChange} required type="tel" icon={<Phone size={18}/>} />
                    </div>
                    <div className="col-md-6 mt-3">
                      <BootstrapInput label={curT.email} name="email" value={formData.email} onChange={handleChange} required type="email" icon={<Mail size={18}/>} />
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-5">
                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-sm" style={{ background: 'linear-gradient(45deg, #4b6cb7, #182848)', border: 'none' }}>
                      {loading ? <span>{curT.loading}</span> : <span className="d-flex align-items-center justify-content-center">{curT.submit} <ArrowRight className="ms-2" size={20}/></span>}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Input Component
const BootstrapInput = ({ label, name, value, onChange, icon, type = "text", required }) => {
  return (
    <div className="input-group" style={{ height: '58px' }}>
      {icon && <span className="input-group-text bg-light border-end-0 text-secondary">{icon}</span>}
      <div className="form-floating flex-grow-1">
        <input type={type} className={`form-control ${icon ? 'border-start-0' : ''}`} id={name} name={name} value={value} onChange={onChange} placeholder={label} required={required} style={{ boxShadow: 'none' }} />
        <label htmlFor={name} className="text-muted">{label} {required && '*'}</label>
      </div>
    </div>
  );
};

export default UravugalForm;

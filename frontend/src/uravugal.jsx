import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  User, MapPin, Briefcase, Phone, Mail,
  Heart, Languages, CheckCircle2, ArrowRight
} from 'lucide-react';

const UravugalForm = () => {
  // ------------------------------------
  // STATE
  // ------------------------------------
  const [lang, setLang] = useState('en'); // Language state
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const initialFormState = {
    name: '', pattapaiyar: '', native_place: '',
    father_name: '', father_pattapaiyar: '', father_native_place: '',
    mother_name: '', mother_pattapaiyar: '', mother_native_place: '',
    occupation: '', contact_number: '', email: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // ------------------------------------
  // TRANSLATIONS
  // ------------------------------------
  const translations = {
    en: {
      title: "Uravugal Form",
      subtitle: "Enter family details below (All fields mandatory)",
      langBtn: "Tamil Mode",
      personalInfo: "Personal Information",
      fatherDetails: "Father's Details",
      motherDetails: "Mother's Details",
      contactWork: "Contact & Work",
      name: "Full Name",
      pattapaiyar: "Pattapaiyar (Nickname)",
      native: "Native Place",
      occupation: "Occupation",
      mobile: "Mobile Number",
      email: "Email ID",
      submit: "SUBMIT DETAILS",
      loading: "Loading...",
      error: "Please fill in all details before submitting.",
      serverError: "Failed to connect to server. Check if Django is running.",
      successTitle: "Thank You!",
      successMsg: "Details have been successfully registered.",
      addAnother: "Add Another"
    },
    ta: {
      title: "உறவுகள் படிவம்",
      subtitle: "குடும்ப விவரங்களை கீழே உள்ளிடவும் (அனைத்தும் கட்டாயம்)",
      langBtn: "English Mode",
      personalInfo: "தனிப்பட்ட விவரங்கள்",
      fatherDetails: "தந்தையின் விவரங்கள்",
      motherDetails: "தாயின் விவரங்கள்",
      contactWork: "தொடர்பு மற்றும் பணி",
      name: "முழு பெயர்",
      pattapaiyar: "பட்டப்பெயர்",
      native: "சொந்த ஊர்",
      occupation: "தொழில்",
      mobile: "கைபேசி எண்",
      email: "மின்னஞ்சல் முகவரி",
      submit: "சமர்ப்பிக்கவும்",
      loading: "காத்திருக்கவும்...",
      error: "தயவுசெய்து அனைத்து விவரங்களையும் பூர்த்தி செய்யவும்.",
      serverError: "சர்வருடன் இணைக்க முடியவில்லை. Django இயங்குகிறதா என பார்க்கவும்.",
      successTitle: "நன்றி!",
      successMsg: "விவரங்கள் வெற்றிகரமாக பதிவு செய்யப்பட்டன.",
      addAnother: "மேலும் சேர்க்க"
    }
  };

  const curT = translations[lang];

  // ------------------------------------
  // HANDLERS
  // ------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    const data = new FormData();
    data.append('lang', lang);
  
    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key] || "")
    );
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/uravugal/add/`,
        data
      );
  
      if (response.data.status === 'success') {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // ------------------------------------
  // SUCCESS SCREEN
  // ------------------------------------
  if (isSuccess) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="card shadow-lg border-0 rounded-4 text-center p-5" style={{maxWidth: '500px'}}>
          <div className="mb-4 text-success">
            <CheckCircle2 size={80} />
          </div>
          <h2 className="fw-bold text-dark">{curT.successTitle}</h2>
          <p className="text-muted mb-4">{curT.successMsg}</p>
          <button
            className="btn btn-dark btn-lg rounded-pill px-5"
            onClick={() => { setIsSuccess(false); setFormData(initialFormState); }}
          >
            {curT.addAnother}
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // FORM SCREEN
  // ------------------------------------
  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center py-5"
         style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">

            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">

              {/* Header */}
              <div className="card-header bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h3 className="fw-bold text-primary mb-1">
                    <User className="me-2 mb-1" size={28}/>
                    {curT.title}
                  </h3>
                  <p className="text-muted small mb-0 ms-1">{curT.subtitle}</p>
                </div>

                <button
                  type="button"
                  className="btn btn-sm fw-bold rounded-pill px-4 btn-primary"
                  onClick={() => setLang(prev => prev === 'en' ? 'ta' : 'en')}
                >
                  <Languages size={16} className="me-2"/>
                  {curT.langBtn}
                </button>
              </div>

              <div className="card-body p-4 p-md-5">

                {error && (
                  <div className="alert alert-danger rounded-3 d-flex align-items-center mb-4" role="alert">
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

                  {/* 4. CONTACT */}
                  <h6 className="text-uppercase text-secondary fw-bold mb-3 border-bottom pb-2">{curT.contactWork}</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <BootstrapInput label={curT.occupation} name="occupation" value={formData.occupation} onChange={handleChange} required icon={<Briefcase size={18}/>} />
                    </div>
                    <div className="col-md-4">
                      <BootstrapInput label={curT.mobile} name="contact_number" value={formData.contact_number} onChange={handleChange} required type="tel" icon={<Phone size={18}/>} />
                    </div>
                    <div className="col-md-4">
                      <BootstrapInput label={curT.email} name="email" value={formData.email} onChange={handleChange} required type="email" icon={<Mail size={18}/>} />
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-5">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-sm"
                      style={{ background: 'linear-gradient(45deg, #4b6cb7, #182848)', border: 'none' }}
                    >
                      {loading ? (
                        <span>{curT.loading}</span>
                      ) : (
                        <span className="d-flex align-items-center justify-content-center">
                          {curT.submit} <ArrowRight className="ms-2" size={20}/>
                        </span>
                      )}
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

// Reusable Input
const BootstrapInput = ({ label, name, value, onChange, icon, type = "text", required }) => {
  return (
    <div className="input-group" style={{ height: '58px' }}>
      {icon && (
        <span className="input-group-text bg-light border-end-0 text-secondary">
          {icon}
        </span>
      )}
      <div className="form-floating flex-grow-1">
        <input
          type={type}
          className={`form-control ${icon ? 'border-start-0' : ''}`}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
          required={required}
          style={{ boxShadow: 'none' }}
        />
        <label htmlFor={name} className="text-muted">{label} {required && '*'}</label>
      </div>
    </div>
  );
};

export default UravugalForm;

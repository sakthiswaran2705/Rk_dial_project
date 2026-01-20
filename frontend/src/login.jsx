import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import { motion, AnimatePresence } from "framer-motion"; // Added Animation
import { Icon } from "@blueprintjs/core"; // Added Icon
import Navbar from "./Navbar.jsx";

const BACKEND_URL = "http://127.0.0.1:8000";

// --- POPUP VARIANTS ---
const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

// ----------------- Icons (Input Field Eyes) -----------------
const Eye = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClose = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <path d="M17.94 17.94A10 10 0 0 1 12 20c-5.5 0-10-4-10-8a8 8 0 0 1 1.5-4.3M6.18 6.18A10 10 0 0 1 12 4c5.5 0 10 4 10 8a8 8 0 0 1-1.5 4.3" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

// ======================================================
//                  MAIN AUTH COMPONENT
// ======================================================
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation(); // To track previous page

  // --- Auth Modes ---
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  // --- Login States ---
  const [loginType, setLoginType] = useState("email");
  const [loginValue, setLoginValue] = useState("");

  // --- Register States ---
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Forgot Password States ---
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotValue, setForgotValue] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  // --- UI States ---
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- POPUP STATE ---
  const [popup, setPopup] = useState(null);

  const showPopup = (type, message, title = "") => {
      setPopup({ type, message, title });
      setTimeout(() => setPopup(null), 3000);
  };

  // --- Validators ---
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^\d{10,}$/.test(v);
  const validatePassword = (v) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/.test(v);

  // ================= HANDLERS =================

  // 1. LOGIN HANDLER
  const handleLogin = async () => {
    if (loading) return;
    if (!loginValue.trim() || !password.trim()) return showPopup("warning", "Please enter all login details.", "Missing Fields");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("emailorphone", loginValue);
      fd.append("password", password);

      const res = await fetch(`${BACKEND_URL}/login/`, { method: "POST", body: fd });
      const data = await res.json();

      if (data?.status === true) {
        localStorage.setItem("USER_ID", data.data.user_id);
        localStorage.setItem("ACCESS_TOKEN", data.access_token);
        localStorage.setItem("REFRESH_TOKEN", data.refresh_token);
        localStorage.setItem("FIRST_NAME", data.data.firstname);
        localStorage.setItem("LAST_NAME", data.data.lastname);
        localStorage.setItem("PROFILE_IMAGE", data.data.profile_image);

        showPopup("success", "Login Successful!", "Welcome Back");

        // --- REDIRECT LOGIC ---
        // If 'from' state exists (e.g., from Plan page), go there. Else Dashboard.
        const redirectPath = location.state?.from || "/dashboard";

        setTimeout(() => {
            navigate(redirectPath, { replace: true });
        }, 1500); // Slight delay to show popup

      } else {
        showPopup("error", data.message || "Login failed.", "Error");
      }
    } catch {
      showPopup("error", "A server connection error occurred.", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTER HANDLER
  const handleRegister = async () => {
    if (loading) return;

    // Basic Checks
    if (!firstname.trim() || !lastname.trim()) return showPopup("warning", "Please enter your full name.", "Validation");

    const hasEmail = regEmail.trim().length > 0;
    const hasPhone = regPhone.trim().length > 0;

    if (!hasEmail && !hasPhone) return showPopup("warning", "Please enter either an Email OR a Phone number.", "Validation");
    if (hasEmail && !validateEmail(regEmail)) return showPopup("warning", "Invalid email format.", "Validation");
    if (hasPhone && !validatePhone(regPhone)) return showPopup("warning", "Phone number must be at least 10 digits.", "Validation");

    if (!validatePassword(password)) return showPopup("warning", "Password must be 6+ chars, 1 Uppercase, 1 Lowercase & 1 Digit.", "Weak Password");
    if (password !== confirmPassword) return showPopup("warning", "Passwords do not match.", "Validation");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("firstname", firstname);
      fd.append("lastname", lastname);
      fd.append("password", password);

      if (hasEmail) fd.append("email", regEmail.trim());
      if (hasPhone) fd.append("phone", regPhone.trim());

      const res = await fetch(`${BACKEND_URL}/register/`, { method: "POST", body: fd });
      const data = await res.json();

      if (data?.status === true) {
        showPopup("success", "Registration successful! Please log in now.", "Account Created");
        setIsLogin(true);
        // Reset Register States
        setPassword("");
        setConfirmPassword("");
        setRegEmail("");
        setRegPhone("");
        setFirstname("");
        setLastname("");
      } else {
        showPopup("error", data.message || "Registration failed.", "Error");
      }
    } catch {
        showPopup("error", "A server connection error occurred.", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  // 3. FORGOT PASSWORD HANDLERS
  const handleSendOtp = async () => {
    if (!forgotValue.trim()) return showPopup("warning", "Please enter your email or phone.", "Validation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("emailorphone", forgotValue);
      const res = await fetch(`${BACKEND_URL}/forgot-password/send-otp/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        showPopup("success", "OTP sent! Check your inbox/messages.", "Sent");
        setForgotStep(2);
      } else {
        showPopup("error", data.message || "Failed to send OTP.", "Error");
      }
    } catch {
        showPopup("error", "Server error sending OTP.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return showPopup("warning", "Please enter a valid OTP.", "Validation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", forgotValue);
      fd.append("otp", otp);
      const res = await fetch(`${BACKEND_URL}/forgot-password/verify-otp/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        showPopup("success", "OTP Verified. Set new password.", "Verified");
        setForgotStep(3);
      } else {
        showPopup("error", data.message || "Invalid OTP.", "Error");
      }
    } catch {
        showPopup("error", "Server error verifying OTP.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword(newPass)) return showPopup("warning", "Password requirements not met.", "Validation");
    if (newPass !== confirmNewPass) return showPopup("warning", "Passwords do not match.", "Validation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", forgotValue);
      fd.append("new_password", newPass);
      const res = await fetch(`${BACKEND_URL}/forgot-password/reset/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        showPopup("success", "Password reset successful. Please login.", "Success");
        setTimeout(() => {
            setIsForgot(false);
            setForgotStep(1);
            setForgotValue("");
            setOtp("");
            setNewPass("");
            setConfirmNewPass("");
        }, 2000);
      } else {
        showPopup("error", data.message || "Failed to reset password.", "Error");
      }
    } catch {
        showPopup("error", "Server error resetting password.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForgot = () => {
    setIsForgot(false);
    setForgotStep(1);
    setForgotValue("");
    setOtp("");
    setNewPass("");
  };

  /* ================= UI RENDERING ================= */

  const buttonText = isLogin ? "Log In" : "Register";
  const accentColor = isLogin ? styles.primaryBlue : styles.primaryGreen;
  const toggleText = isLogin ? "Need an account? Register Now" : "Already have an account? Log In";

  return (
    <div style={styles.mainWrapper}>

        {/* CSS for Popup */}
        <style>
        {`
            :root {
                --success: #10b981;
                --error: #ef4444;
                --warning: #f59e0b;
                --info: #3b82f6;
                --text-dark: #1e293b;
            }

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
        `}
        </style>

      <Navbar />
      <div style={styles.authContainer}>
        <div style={styles.card}>

            {/* 1. FORGOT PASSWORD VIEW */}
            {isForgot ? (
                <>
                     <h2 style={{ ...styles.heading, color: styles.primaryBlue }}>Reset Password</h2>
                     {forgotStep === 1 && (
                        <>
                            <p style={styles.stepText}>Step 1: Enter your registered Email or Phone</p>
                            <input
                                style={styles.input}
                                placeholder="Email or Phone Number"
                                value={forgotValue}
                                onChange={(e) => setForgotValue(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                style={{ ...styles.submitButton, backgroundColor: styles.primaryBlue }}
                                onClick={handleSendOtp}
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </>
                    )}
                    {forgotStep === 2 && (
                        <>
                            <p style={styles.stepText}>Step 2: Enter OTP sent to {forgotValue}</p>
                            <input
                                style={styles.input}
                                placeholder="OTP"
                                value={otp}
                                maxLength={6}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                disabled={loading}
                            />
                            <button
                                style={{ ...styles.submitButton, backgroundColor: styles.primaryBlue }}
                                onClick={handleVerifyOtp}
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>
                        </>
                    )}
                    {forgotStep === 3 && (
                        <>
                            <p style={styles.stepText}>Step 3: New Password</p>
                            <div style={styles.passBox}>
                                <input
                                    style={styles.passInput}
                                    type={showNewPass ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    disabled={loading}
                                />
                                <span onClick={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>{showNewPass ? EyeClose : Eye}</span>
                            </div>
                            <div style={styles.passBox}>
                                <input
                                    style={styles.passInput}
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={confirmNewPass}
                                    onChange={(e) => setConfirmNewPass(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <button
                                style={{ ...styles.submitButton, backgroundColor: styles.primaryBlue }}
                                onClick={handleResetPassword}
                                disabled={loading}
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </>
                    )}
                    <p style={{ ...styles.link, color: styles.primaryBlue }} onClick={handleCancelForgot}>
                        Back to Login
                    </p>
                </>
            ) : (
                /* 2. MAIN LOGIN / REGISTER VIEW */
                <>
                    <h2 style={{ ...styles.heading, color: accentColor }}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>

                    {/* REGISTER: First & Last Name */}
                    {!isLogin && (
                    <div style={styles.nameGroup}>
                        <input
                        style={styles.halfInput}
                        placeholder="First Name"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        disabled={loading}
                        />
                        <input
                        style={styles.halfInput}
                        placeholder="Last Name"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        disabled={loading}
                        />
                    </div>
                    )}

                    {/* LOGIN: Toggle + Single Input */}
                    {isLogin && (
                        <>
                            <div style={styles.inputContainer}>
                                <select
                                    style={{...styles.input, backgroundColor: '#f9fafb'}}
                                    value={loginType}
                                    onChange={(e) => setLoginType(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="email">Login via Email</option>
                                    <option value="phone">Login via Phone</option>
                                </select>
                            </div>

                            <input
                                style={styles.input}
                                type={loginType === 'phone' ? 'tel' : 'text'}
                                placeholder={loginType === 'email' ? "Enter your Email" : "Enter your Phone Number"}
                                value={loginValue}
                                onChange={(e) => setLoginValue(e.target.value)}
                                disabled={loading}
                            />
                        </>
                    )}

                    {/* REGISTER: Two Separate Inputs */}
                    {!isLogin && (
                        <>
                            <input
                                style={styles.input}
                                type="email"
                                placeholder="Email Address (Optional if Phone provided)"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                disabled={loading}
                            />

                            <input
                                style={styles.input}
                                type="tel"
                                placeholder="Phone Number (Optional if Email provided)"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                disabled={loading}
                            />
                        </>
                    )}

                    {/* Password */}
                    <div style={styles.passBox}>
                    <input
                        style={styles.passInput}
                        type={showPass ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <span onClick={() => setShowPass(!showPass)} style={styles.eyeIcon}>
                        {showPass ? EyeClose : Eye}
                    </span>
                    </div>

                    {/* Forgot Link */}
                    {isLogin && (
                        <div style={styles.forgotContainer}>
                            <span
                                style={styles.forgotLink}
                                onClick={() => {
                                    setPopup(null);
                                    setIsForgot(true);
                                    setForgotStep(1);
                                    setForgotValue("");
                                }}
                            >
                                Forgot Password?
                            </span>
                        </div>
                    )}

                    {/* Confirm Password */}
                    {!isLogin && (
                    <div style={styles.passBox}>
                        <input
                        style={styles.passInput}
                        type={showConfirmPass ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        />
                        <span
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        style={styles.eyeIcon}
                        >
                        {showConfirmPass ? EyeClose : Eye}
                        </span>
                    </div>
                    )}

                    {/* Submit Button */}
                    <button
                    style={{ ...styles.submitButton, backgroundColor: accentColor }}
                    onClick={isLogin ? handleLogin : handleRegister}
                    disabled={loading}
                    >
                    {loading ? "Processing..." : buttonText}
                    </button>

                    {/* Footer Link */}
                    <p style={{ ...styles.link, color: accentColor }} onClick={() => {
                        setIsLogin(!isLogin);
                        setPopup(null);
                        setPassword("");
                        setConfirmPassword("");
                        setLoginValue("");
                    }}>
                    {toggleText}
                    </p>
                </>
            )}
        </div>
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
    </div>
  );
}

// ================= STYLES =================
const styles = {
  primaryBlue: "#1976D2",
  primaryGreen: "#2E7D32",

  mainWrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "100vh",
  },
  authContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 64px)",
    background: "linear-gradient(135deg, #eef2f7, #f9fbfd)",
    fontFamily: "Roboto, Arial, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "36px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
    border: "1px solid #e6e9ef",
    boxSizing: "border-box",
  },
  heading: {
    textAlign: "center",
    marginBottom: "28px",
    fontWeight: 700,
    fontSize: "26px",
    letterSpacing: "0.5px",
    marginTop: 0,
  },
  nameGroup: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  halfInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
  },
  passBox: {
    position: "relative",
    marginBottom: "16px",
  },
  passInput: {
    width: "100%",
    padding: "14px 46px 14px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
  },
  eyeIcon: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    opacity: 0.6,
  },
  forgotContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "18px",
    marginTop: "-8px",
  },
  forgotLink: {
    fontSize: "13px",
    color: "#1976D2",
    cursor: "pointer",
    fontWeight: 600,
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    fontSize: "16px",
    fontWeight: 700,
    color: "#ffffff",
    cursor: "pointer",
    transition: "0.2s ease-in-out",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  link: {
    textAlign: "center",
    marginTop: "20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    marginBottom: 0,
  },
  stepText: {
    marginBottom: "12px",
    fontSize: "14px",
    color: "#555",
    textAlign: "left",
  },
};

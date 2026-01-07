import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://127.0.0.1:8000";

// ----------------- Icons -----------------
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

  // --- Auth Modes ---
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  // --- Login/Register States ---
  const [loginType, setLoginType] = useState("email");
  const [loginValue, setLoginValue] = useState("");
  const [registerType, setRegisterType] = useState("email");
  const [registerValue, setRegisterValue] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Validators ---
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePassword = (v) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/.test(v);

  // ================= HANDLERS (Login/Register/Forgot) =================
  // (Kept exactly the same as your original logic, focusing only on design updates below)

  const handleLogin = async () => {
    if (loading) return;
    setMessage("");
    if (!loginValue.trim() || !password.trim()) return setMessage("Please enter all login details.");
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
        await new Promise((r) => setTimeout(r, 100));
        navigate("/dashboard", { replace: true });
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch {
      setMessage("A server connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (loading) return;
    setMessage("");
    if (!firstname || !lastname) return setMessage("Please enter your full name.");
    if (!registerValue.trim()) return setMessage(`Please enter your ${registerType}.`);
    if (registerType === "email" && !validateEmail(registerValue)) return setMessage("Invalid email format.");
    if (!validatePassword(password)) return setMessage("Password must include uppercase, lowercase & digit.");
    if (password !== confirmPassword) return setMessage("Passwords do not match.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("firstname", firstname);
      fd.append("lastname", lastname);
      fd.append(registerType === "email" ? "email" : "phone", registerValue);
      fd.append("password", password);
      const res = await fetch(`${BACKEND_URL}/register/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true) {
        setMessage("✅ Registration successful! Please log in now.");
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
        setRegisterValue("");
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch {
      setMessage("A server connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!forgotValue.trim()) return setMessage("Please enter your email or phone.");
    setLoading(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("emailorphone", forgotValue);
      const res = await fetch(`${BACKEND_URL}/forgot-password/send-otp/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        setMessage("✅ OTP sent! Please check your inbox/messages.");
        setForgotStep(2);
      } else {
        setMessage(data.message || "Failed to send OTP.");
      }
    } catch {
      setMessage("Server error sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return setMessage("Please enter a valid OTP.");
    setLoading(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("email", forgotValue);
      fd.append("otp", otp);
      const res = await fetch(`${BACKEND_URL}/forgot-password/verify-otp/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        setMessage("✅ OTP Verified. Please set a new password.");
        setForgotStep(3);
      } else {
        setMessage(data.message || "Invalid OTP.");
      }
    } catch {
      setMessage("Server error verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword(newPass)) return setMessage("Password must be 6+ chars, 1 Upper, 1 Lower, 1 Digit.");
    if (newPass !== confirmNewPass) return setMessage("Passwords do not match.");
    setLoading(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("email", forgotValue);
      fd.append("new_password", newPass);
      const res = await fetch(`${BACKEND_URL}/forgot-password/reset/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        setMessage("✅ Password reset successful. Please login.");
        setTimeout(() => {
            setIsForgot(false);
            setForgotStep(1);
            setForgotValue("");
            setOtp("");
            setNewPass("");
            setConfirmNewPass("");
            setMessage("");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to reset password.");
      }
    } catch {
      setMessage("Server error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForgot = () => {
    setIsForgot(false);
    setForgotStep(1);
    setMessage("");
    setForgotValue("");
    setOtp("");
    setNewPass("");
  };

  /* ================= UI RENDERING ================= */

  // 1. FORGOT PASSWORD FLOW
  if (isForgot) {
    return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ ...styles.heading, color: styles.primaryBlue }}>
              Reset Password
            </h2>

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
                    <p style={styles.stepText}>Step 2: Enter the 6-digit OTP sent to {forgotValue}</p>
                    <input
                        style={styles.input}
                        placeholder="Enter 6-digit OTP"
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
                    <p style={styles.stepText}>Step 3: Create a new password</p>
                    <div style={styles.passBox}>
                        <input
                            style={styles.passInput}
                            type={showNewPass ? "text" : "password"}
                            placeholder="New Password"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            disabled={loading}
                        />
                        <span onClick={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>
                            {showNewPass ? EyeClose : Eye}
                        </span>
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
            {message && <p style={{...styles.msg, color: message.startsWith("✅") ? styles.successColor : styles.errorColor}}>{message}</p>}
          </div>
        </div>
    );
  }

  // 2. MAIN LOGIN / REGISTER
  const currentType = isLogin ? loginType : registerType;
  const currentPlaceholder = currentType === "email" ? "Enter your Email" : "Enter your Phone Number";
  const buttonText = isLogin ? "Log In" : "Register";
  const accentColor = isLogin ? styles.primaryBlue : styles.primaryGreen;
  const toggleText = isLogin ? "Need an account? Register Now" : "Already have an account? Log In";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ ...styles.heading, color: accentColor }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        {/* First & Last Name (Unified Style) */}
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

        {/* Toggle Login Type Dropdown */}
        <div style={styles.inputContainer}>
            <select
                style={{...styles.input, backgroundColor: '#f9fafb'}}
                value={currentType}
                onChange={(e) =>
                    isLogin
                    ? setLoginType(e.target.value)
                    : setRegisterType(e.target.value)
                }
                disabled={loading}
            >
                <option value="email">Login via Email</option>
                <option value="phone">Login via Phone</option>
            </select>
        </div>

        {/* Main Input (Email/Phone) */}
        <input
          style={styles.input}
          type={currentType === 'phone' ? 'tel' : 'text'}
          placeholder={currentPlaceholder}
          value={isLogin ? loginValue : registerValue}
          onChange={(e) =>
            isLogin
              ? setLoginValue(e.target.value)
              : setRegisterValue(e.target.value)
          }
          disabled={loading}
        />

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
                        setMessage("");
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
        <p style={{ ...styles.link, color: accentColor }} onClick={() => { setIsLogin(!isLogin); setMessage(""); setPassword(""); setConfirmPassword(""); }}>
          {toggleText}
        </p>

        {message && <p style={{...styles.msg, color: message.startsWith("✅") ? styles.successColor : styles.errorColor}}>{message}</p>}
      </div>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  primaryBlue: "#1976D2",
  primaryGreen: "#2E7D32",
  errorColor: "#D32F2F",
  successColor: "#2E7D32",

  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #eef2f7, #f9fbfd)",
    fontFamily: "Roboto, Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "36px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
    border: "1px solid #e6e9ef",
  },
  heading: {
    textAlign: "center",
    marginBottom: "28px",
    fontWeight: 700,
    fontSize: "26px",
    letterSpacing: "0.5px",
  },

  /* --- INPUT STYLES --- */

  // Container for side-by-side inputs
  nameGroup: {
    display: "flex",
    gap: "12px", // Space between First and Last name
    marginBottom: "16px",
  },

  // FIXED: Removed hardcoded height/padding to match regular inputs
  halfInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
    width: "100%", // Ensures it fills the flex space
  },

  // Standard full-width input
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

  /* --- PASSWORD INPUT --- */
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

  /* --- EXTRAS --- */
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
  },
  msg: {
    textAlign: "center",
    marginTop: "18px",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
  },
  stepText: {
    marginBottom: "12px",
    fontSize: "14px",
    color: "#555",
    textAlign: "left",
  },
};

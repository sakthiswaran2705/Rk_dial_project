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

  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState("email");
  const [loginValue, setLoginValue] = useState("");

  const [registerType, setRegisterType] = useState("email");
  const [registerValue, setRegisterValue] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePassword = (v) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/.test(v);

  // ================= LOGIN HANDLER =================
  const handleLogin = async () => {
    if (loading) return;
    setMessage("");

    if (!loginValue.trim() || !password.trim()) {
      setMessage("Please enter all login details.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("emailorphone", loginValue);
      fd.append("password", password);

      const res = await fetch(`${BACKEND_URL}/login/`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (data?.status === true) {
        // ✅ SAVE TOKENS
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

  // ================= REGISTER HANDLER =================
  const handleRegister = async () => {
    if (loading) return;
    setMessage("");

    if (!firstname || !lastname)
      return setMessage("Please enter your full name.");

    if (!registerValue.trim())
      return setMessage(`Please enter your ${registerType}.`);

    if (registerType === "email" && !validateEmail(registerValue))
      return setMessage("Invalid email format.");

    if (!validatePassword(password))
      return setMessage("Password must include uppercase, lowercase & digit.");

    if (password !== confirmPassword)
      return setMessage("Passwords do not match.");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("firstname", firstname);
      fd.append("lastname", lastname);
      fd.append(registerType === "email" ? "email" : "phone", registerValue);
      fd.append("password", password);

      const res = await fetch(`${BACKEND_URL}/register/`, {
        method: "POST",
        body: fd,
      });

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

  /* ================= UI RENDERING ================= */
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

        {/* Toggle Login Type (Email/Phone) */}
        <div style={styles.inputGroup}>
            <select
                style={{...styles.input, marginBottom: 0, padding: 13, backgroundColor: '#f9f9f9'}}
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

        {/* Login/Register Value Input */}
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

        {/* Password Input */}
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

        {/* Confirm Password Input (Register only) */}
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

        {/* Toggle Link */}
        <p style={{ ...styles.link, color: accentColor }} onClick={() => { setIsLogin(!isLogin); setMessage(""); setPassword(""); setConfirmPassword(""); }}>
          {toggleText}
        </p>

        {/* Message Display */}
        {message && <p style={{...styles.msg, color: message.startsWith("✅") ? styles.successColor : styles.errorColor}}>{message}</p>}
      </div>
    </div>
  );
}

// ================= STYLES (Refined) =================
const styles = {
  /* ===== COLORS ===== */
  primaryBlue: "#1976D2",
  primaryGreen: "#2E7D32",
  errorColor: "#D32F2F",
  successColor: "#2E7D32",

  /* ===== PAGE ===== */
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #eef2f7, #f9fbfd)",
    fontFamily: "Roboto, Arial, sans-serif",
  },

  /* ===== CARD ===== */
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "34px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
    border: "1px solid #e6e9ef",
  },

  /* ===== HEADING ===== */
  heading: {
    textAlign: "center",
    marginBottom: "26px",
    fontWeight: 600,
    fontSize: "24px",
    letterSpacing: "0.3px",
  },

  /* ===== NAME ROW ===== */
  nameGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "14px",
  },

  halfInput: {
      flex: 1,

      height: "32px",
      minHeight: "32px",
      maxHeight: "32px",

      padding: "0 8px",
      fontSize: "13px",
      lineHeight: "32px",

      borderRadius: "6px",
      border: "1px solid #cfd8dc",
      background: "#fff",

      boxSizing: "border-box",

      WebkitAppearance: "none",
      appearance: "none",
    },




  /* ===== INPUTS ===== */
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

  /* ===== PASSWORD ===== */
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
    opacity: 0.7,
  },

  /* ===== BUTTON ===== */
  submitButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    fontSize: "16px",
    fontWeight: 600,
    color: "#ffffff",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
  },

  /* ===== LINK ===== */
  link: {
    textAlign: "center",
    marginTop: "18px",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: "14px",
  },

  /* ===== MESSAGE ===== */
  msg: {
    textAlign: "center",
    marginTop: "18px",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
  },
};

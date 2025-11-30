import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Eye = (
  <svg width="22" height="22" fill="none" stroke="#333" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClose = (
  <svg width="22" height="22" fill="none" stroke="#333" strokeWidth="2">
    <path d="M17.9 17.9A10 10 0 0112 20C6.5 20 2 16 2 12a8 8 0 011.5-4.3" />
    <path d="M6.1 6.1A10 10 0 0112 4c5.5 0 10 4 10 8a8 8 0 01-1.5 4.3" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [message, setMessage] = useState("");

  const backend = "http://127.0.0.1:8000";

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePassword = (v) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{1,}$/.test(v);

  const handleLogin = async () => {
    setMessage("");

    if (!validateEmail(email)) return setMessage("Invalid email");

    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);

    try {
      const res = await fetch(`${backend}/login/`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (data.status === "success") {
        // save login ID
        localStorage.setItem("USER_ID", data.user_id);

        // check redirect
        const redirectData = localStorage.getItem("REDIRECT_AFTER_LOGIN");

        if (redirectData) {
          const parsed = JSON.parse(redirectData);
          localStorage.removeItem("REDIRECT_AFTER_LOGIN");

          // back to same shop page
          return navigate("/shop", {
                state: {
                shop: parsed.shop,
                city: parsed.city
                },
                replace: true
             });

        }

        // normal login → home
        return navigate("/");
      } else {
        setMessage("Invalid email or password");
      }
    } catch {
      setMessage("Server error");
    }
  };

  // -----------------------------------
  // REGISTER FUNCTION
  // -----------------------------------
  const handleRegister = async () => {
    setMessage("");

    if (!validateEmail(email)) return setMessage("Invalid email");
    if (!validatePassword(password))
      return setMessage("Password must have A-Z, a-z, 0-9");
    if (password !== confirmPassword)
      return setMessage("Passwords do not match");

    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);

    try {
      const res = await fetch(`${backend}/register/`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      setMessage(data.message);

      // ✔ switch to login page on success
      if (data.status === "success") {
        setIsLogin(true);
      }
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {isLogin ? (
          <>
            <h2 style={{ textAlign: "center" }}>Login</h2>

            <label>Email</label>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <div style={styles.passBox}>
              <input
                style={styles.passInput}
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                style={styles.eyeIcon}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? EyeClose : Eye}
              </span>
            </div>

            <button style={styles.btnBlue} onClick={handleLogin}>
              Login
            </button>

            <p style={styles.link} onClick={() => setIsLogin(false)}>
              Don’t have an account? Register
            </p>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: "center" }}>Register</h2>

            <label>Email</label>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <div style={styles.passBox}>
              <input
                style={styles.passInput}
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                style={styles.eyeIcon}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? EyeClose : Eye}
              </span>
            </div>

            <label>Confirm Password</label>
            <div style={styles.passBox}>
              <input
                style={styles.passInput}
                type={showConfirmPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                style={styles.eyeIcon}
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? EyeClose : Eye}
              </span>
            </div>

            <button style={styles.btnGreen} onClick={handleRegister}>
              Register
            </button>

            <p style={styles.link} onClick={() => setIsLogin(true)}>
              Already have an account? Login
            </p>
          </>
        )}

        {message && <p style={styles.msg}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  card: {
    width: "350px",
    padding: "25px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    border: "1px solid #aaa",
    borderRadius: "8px",
  },
  passBox: {
    position: "relative",
    marginBottom: "10px",
  },
  passInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #aaa",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  btnBlue: {
    width: "100%",
    padding: "12px",
    background: "blue",
    color: "#fff",
    borderRadius: "8px",
    marginTop: "10px",
    border: "none",
  },
  btnGreen: {
    width: "100%",
    padding: "12px",
    background: "green",
    color: "#fff",
    borderRadius: "8px",
    marginTop: "10px",
    border: "none",
  },
  link: {
    textAlign: "center",
    color: "blue",
    cursor: "pointer",
    marginTop: "10px",
  },
  msg: {
    marginTop: "10px",
    textAlign: "center",
    color: "red",
  },
};

export default Auth;

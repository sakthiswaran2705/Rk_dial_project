import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const API_BASE = "http://127.0.0.1:8000";

// 🔧 CONFIGURATION: Change this to match your database's highest plan name
const HIGHEST_PLAN = "premium";

// --- Icons ---
const Icons = {
  CreditCard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

function Payments() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("ACCESS_TOKEN");

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);

  // ================= FETCH PLAN =================
  const fetchPlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/my-plan/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status && data.subscribed) {
        setPlanData(data);
      } else {
        setPlanData(null);
      }
    } catch (err) {
      alert(t("Failed to load plan details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // ================= AUTOPAY =================
  const enableAutoPay = async () => {
    if (!token) return alert(t("Please login first"));

    try {
      const res = await fetch(`${API_BASE}/autopay/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_name: planData.plan }),
      });

      const data = await res.json();
      if (!data.subscription_id) return alert(t("Failed to initiate AutoPay"));

      const options = {
        key: data.key_id || window.RAZORPAY_KEY_ID,
        subscription_id: data.subscription_id,
        name: "RK Dial",
        description: `AutoPay for ${planData.plan}`,
        handler: function (response) {
          alert(t("✅ AutoPay enabled successfully!"));
          fetchPlan();
        },
        modal: { ondismiss: function () { alert(t("AutoPay setup cancelled")); } },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("AutoPay Error:", err);
      alert(t("Server error"));
    }
  };

  const goToUpgrade = () => navigate("/plan");

  // ================= HELPERS =================
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getDaysRemaining = (expiryDate) => {
    const total = Date.parse(expiryDate) - Date.parse(new Date());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateProgress = (used, total) => {
    if (!total) return 0;
    const pct = (used / total) * 100;
    return pct > 100 ? 100 : pct;
  };

  // ================= RENDER =================
  if (loading) return <div className="container py-5 text-center text-muted">{t("Loading payment details...")}</div>;

  if (!planData) {
    return (
      <div className="container py-5 text-center">
        <div className="mb-4 text-muted"><Icons.CreditCard /></div>
        <h3 className="fw-bold">{t("No Active Subscription")}</h3>
        <p className="text-muted mb-4">{t("You are currently on the free tier. Upgrade to unlock features.")}</p>
        <button className="btn btn-dark px-4" onClick={goToUpgrade}>{t("View Plans")}</button>
      </div>
    );
  }

  // Check if user is on the highest plan (Case Insensitive)
  const isHighestPlan = planData.plan.toLowerCase() === HIGHEST_PLAN.toLowerCase();
  const daysLeft = getDaysRemaining(planData.expiry_date);

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t("Subscription & Billing")}</h2>
          <p className="text-muted mb-0">{t("Manage your plan, billing history and usage.")}</p>
        </div>
      </div>

      <div className="row g-4">

        {/* === LEFT COLUMN: PLAN DETAILS === */}
        <div className="col-md-7">

          {/* Active Plan Card */}
          <div className="card shadow-sm border-0 mb-4 bg-primary text-white" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <div className="badge bg-white text-primary mb-2 px-3 py-1 rounded-pill fw-bold text-uppercase">
                    {planData.plan} Plan
                  </div>
                  <h1 className="fw-bold display-6 mb-0 text-capitalize">{planData.plan}</h1>
                </div>
                <div className="bg-white bg-opacity-25 p-2 rounded-circle">
                  <Icons.CreditCard />
                </div>
              </div>

              <div className="d-flex align-items-center mt-3">
                <div className="me-4">
                  <small className="opacity-75 d-block text-uppercase fw-bold" style={{ fontSize: "0.75rem" }}>Status</small>
                  <span className="fw-bold d-flex align-items-center">
                    <span className="bg-success rounded-circle d-inline-block me-2" style={{ width: 8, height: 8 }}></span>
                    Active
                  </span>
                </div>
                <div>
                  <small className="opacity-75 d-block text-uppercase fw-bold" style={{ fontSize: "0.75rem" }}>Renews Price</small>
                  <span className="fw-bold">₹{planData.amount || "---"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Details */}
          <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center">
              <span className="me-2 text-muted"><Icons.Calendar /></span>
              <span style={{ fontFamily: "Noto Sans Tamil, system-ui, sans-serif" }}>
                {t("Billing Cycle")}
              </span>
            </h5>

              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-2">
                <div>
                  <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>{t("Expiry Date")}</small>
                  <span className="fw-bold text-dark fs-5">{formatDate(planData.expiry_date)}</span>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>{t("Time Remaining")}</small>
                  <span className={`fw-bold fs-5 ${daysLeft < 5 ? 'text-danger' : 'text-success'}`}>
                    {daysLeft} {t("Days")}
                  </span>
                </div>
              </div>
              <small className="text-muted">
                {t("Your plan will automatically expire on this date unless AutoPay is enabled.")}
              </small>
            </div>
          </div>

          {/* AutoPay Section */}
          <div className="card shadow-sm border-0" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-1 d-flex align-items-center">
                  <span className="me-2 text-warning"><Icons.Zap /></span>
                  {t("Enable AutoPay")}
                </h6>
                <p className="text-muted small mb-0">{t("Automatically renew your plan to avoid interruption.")}</p>
              </div>
              <button className="btn btn-dark btn-sm px-3 py-2" onClick={enableAutoPay}>
                {t("Enable Now")}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: USAGE & ACTIONS  */}
        <div className="col-md-5">

          {/* Usage Stats */}
          <div className="card shadow-sm border-0 mb-4 h-100" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">{t("Current Usage")}</h5>

              {/* Shops Usage */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-bold small text-muted">{t("Shops Created")}</span>
                  <span className="fw-bold small">{planData.usage.shops_used} / {planData.limits.shops}</span>
                </div>
                <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${calculateProgress(planData.usage.shops_used, planData.limits.shops)}%` }}
                  ></div>
                </div>
              </div>

              {/* Offers Usage */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-bold small text-muted">{t("Offers Posted")}</span>
                  <span className="fw-bold small">{planData.usage.offers_used} / {planData.limits.offers}</span>
                </div>
                <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                  <div
                    className="progress-bar bg-info"
                    role="progressbar"
                    style={{ width: `${calculateProgress(planData.usage.offers_used, planData.limits.offers)}%` }}
                  ></div>
                </div>
              </div>

              {/* Conditional Upgrade Button */}
              {!isHighestPlan ? (
                <div className="mt-5 text-center">
                  <p className="text-muted small mb-3">{t("Need more limits? Upgrade to our Premium plan for unlimited access.")}</p>
                  <button className="btn btn-outline-primary w-100 py-2 fw-bold" onClick={goToUpgrade}>
                    {t("Upgrade Plan")}
                  </button>
                </div>
              ) : (
                <div className="mt-5 text-center p-3 bg-success bg-opacity-10 rounded-3">
                  <div className="text-success mb-2"><Icons.Check /></div>
                  <h6 className="fw-bold text-success mb-1">{t("Highest Plan Active")}</h6>
                  <p className="text-muted small mb-0">{t("You are on the top tier plan. Enjoy full access!")}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Payments;
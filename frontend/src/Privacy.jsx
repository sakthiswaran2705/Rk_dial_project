import React from "react";
import Navbar from "./Navbar.jsx";

function Privacy() {
  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: "900px",
          margin: "80px auto",
          padding: "20px",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Privacy Policy</h1>

        <p>
          At <b>RK Dial</b>, we respect your privacy and are committed to
          protecting your personal information. This Privacy Policy explains
          how we collect, use, and safeguard your data.
        </p>

        <h3>1. Information We Collect</h3>
        <p>
          We may collect personal information such as your name, phone number,
          email address, location, and business details when you register,
          submit forms, or use our services.
        </p>

        <h3>2. How We Use Your Information</h3>
        <p>
          Your information is used to:
        </p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Process payments and subscriptions</li>
          <li>Communicate important updates and support</li>
          <li>Improve user experience and security</li>
        </ul>

        <h3>3. Data Security</h3>
        <p>
          We implement reasonable security measures to protect your personal
          data from unauthorized access, misuse, or disclosure.
        </p>

        <h3>4. Sharing of Information</h3>
        <p>
          We do not sell, trade, or rent your personal information to third
          parties. Information may be shared only when required by law or for
          essential service operations.
        </p>

        <h3>5. Cookies</h3>
        <p>
          Our website may use cookies to enhance user experience and analyze
          usage patterns. You can choose to disable cookies through your browser
          settings.
        </p>

        <h3>6. Third-Party Services</h3>
        <p>
          We may use trusted third-party services (such as payment gateways)
          that have their own privacy policies. We are not responsible for their
          privacy practices.
        </p>

        <h3>7. Your Consent</h3>
        <p>
          By using our website and services, you consent to this Privacy Policy.
        </p>

        <h3>8. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page.
        </p>

        <h3>9. Contact Us</h3>
        <p>
          If you have any questions about this Privacy Policy, please contact
          us:
        </p>

        <p>
          <b>Email:</b> sakthibala2705@gmail.com <br />
          <b>Phone:</b> +91 7868998544 <br />
          <b>Location:</b> Thanjavur, Tamil Nadu, India
        </p>
      </div>
    </>
  );
}

export default Privacy;

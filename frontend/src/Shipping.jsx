import React from "react";
import Navbar from "./Navbar.jsx";

function Shipping() {
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
        <h1 style={{ marginBottom: "20px" }}>Shipping Policy</h1>

        <p>
          This Shipping Policy explains how <b>RK Dial</b> delivers its services
          to customers.
        </p>

        <h3>1. Nature of Services</h3>
        <p>
          RK Dial provides <b>digital services</b>, online business listings, and
          subscription-based plans. We do not ship any physical products.
        </p>

        <h3>2. Service Delivery</h3>
        <p>
          All services are delivered electronically through our website,
          dashboard, or via email after successful payment confirmation.
        </p>

        <h3>3. Delivery Timeline</h3>
        <p>
          Services are usually activated instantly or within <b>24 hours</b> of
          payment. In rare cases, activation may take slightly longer due to
          technical reasons.
        </p>

        <h3>4. Shipping Charges</h3>
        <p>
          Since no physical shipping is involved, <b>no shipping charges</b> are
          applicable.
        </p>

        <h3>5. Delays</h3>
        <p>
          If there is any delay in service activation, customers will be
          informed via email or phone.
        </p>

        <h3>6. Contact Information</h3>
        <p>
          If you have questions regarding this Shipping Policy, please contact
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

export default Shipping;

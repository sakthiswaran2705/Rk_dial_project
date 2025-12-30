import React from "react";
import Navbar from "./Navbar.jsx";

function Terms() {
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
        <h1 style={{ marginBottom: "20px" }}>Terms & Conditions</h1>

        <p>
          These Terms & Conditions govern your use of the <b>RK Dial</b> website
          and services. By accessing or using our platform, you agree to comply
          with these terms.
        </p>

        <h3>1. Use of Services</h3>
        <p>
          RK Dial provides digital business listings, advertisements, and
          subscription-based services. You agree to use our services only for
          lawful purposes.
        </p>

        <h3>2. User Responsibilities</h3>
        <p>
          You are responsible for ensuring that the information you provide is
          accurate, complete, and up to date. Any misuse of the platform may
          result in suspension or termination of services.
        </p>

        <h3>3. Payments</h3>
        <p>
          Payments made on RK Dial are processed through secure payment gateways.
          By making a payment, you agree to the pricing, billing cycle, and
          applicable taxes.
        </p>

        <h3>4. Subscription & Services</h3>
        <p>
          Subscription services are activated after successful payment. Service
          features may vary based on the selected plan.
        </p>

        <h3>5. Cancellation & Refund</h3>
        <p>
          Cancellation and refund requests are subject to our Cancellation &
          Refund Policy. Please review the policy before making a purchase.
        </p>

        <h3>6. Intellectual Property</h3>
        <p>
          All content, logos, and materials on RK Dial are the property of RK
          Dial and may not be copied, reproduced, or distributed without prior
          written consent.
        </p>

        <h3>7. Limitation of Liability</h3>
        <p>
          RK Dial shall not be liable for any direct, indirect, or incidental
          damages arising from the use of our services.
        </p>

        <h3>8. Changes to Terms</h3>
        <p>
          We reserve the right to update or modify these Terms & Conditions at
          any time. Changes will be effective immediately upon posting.
        </p>

        <h3>9. Governing Law</h3>
        <p>
          These terms are governed by the laws of India. Any disputes shall be
          subject to the jurisdiction of Tamil Nadu.
        </p>

        <h3>10. Contact Information</h3>
        <p>
          If you have any questions about these Terms & Conditions, please
          contact us:
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

export default Terms;

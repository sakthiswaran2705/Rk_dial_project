import React from "react";
import Navbar from "./Navbar.jsx";

function Refund() {
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
        <h1 style={{ marginBottom: "20px" }}>
          Cancellation & Refund Policy
        </h1>

        <p>
          This Cancellation & Refund Policy outlines the terms under which
          cancellations and refunds are processed by <b>RK Dial</b>.
        </p>

        <h3>1. Nature of Services</h3>
        <p>
          RK Dial provides digital services and subscription-based plans.
          Once a service is activated, it is considered delivered.
        </p>

        <h3>2. Cancellation Policy</h3>
        <p>
          Users may request cancellation before service activation. After
          activation, cancellation requests may not be accepted.
        </p>

        <h3>3. Refund Policy</h3>
        <p>
          Refunds are generally not provided once the service is activated.
          However, refunds may be considered in exceptional cases such as:
        </p>

        <ul>
          <li>Duplicate payment</li>
          <li>Payment deducted but service not activated</li>
          <li>Technical errors caused by our system</li>
        </ul>

        <h3>4. Refund Processing Time</h3>
        <p>
          Approved refunds will be processed within <b>5–7 business days</b>
          to the original payment method.
        </p>

        <h3>5. Non-Refundable Items</h3>
        <p>
          Fees paid for successfully delivered digital services or promotional
          listings are non-refundable.
        </p>

        <h3>6. Contact for Refunds</h3>
        <p>
          To request a cancellation or refund, please contact us with your
          payment details:
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

export default Refund;

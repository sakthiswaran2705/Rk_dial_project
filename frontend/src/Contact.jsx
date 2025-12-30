import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap styles

export default function Contact() {
  // 1. Form Data store panna State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
  });

  const [status, setStatus] = useState(""); // Success/Error message ku

  // 2. Input Change aagum podhu state update panna
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Form Submit pannum podhu nadakkura logic
  const handleSubmit = async (e) => {
    e.preventDefault(); // Page refresh aagama thadukka
    setStatus("Sending...");

    try {
      // 👇 Inga unga Backend API URL podanum (Example: http://127.0.0.1:8000/contact)
      // const response = await fetch("http://127.0.0.1:8000/contact", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      // Simulate success for now
      setTimeout(() => {
        setStatus("Success! We will contact you soon.");
        setFormData({ name: "", email: "", mobile: "", message: "" }); // Reset form
      }, 1000);

    } catch (error) {
      console.error("Error:", error);
      setStatus("Error sending message. Please try again.");
    }
  };

  return (
    <div className="container" style={{ marginTop: "80px", marginBottom: "50px" }}>
      <div className="row justify-content-center">

        {/* Left Side: Contact Information */}
        <div className="col-md-5 mb-4">
          <div className="p-4 bg-light rounded shadow-sm h-100">
            <h2 className="text-primary fw-bold mb-4">Get in Touch</h2>
            <p className="mb-3">
              <i className="bi bi-building me-2"></i>
              <b>Business Name:</b> <br /> RK Dial
            </p>
            <p className="mb-3">
              <i className="bi bi-envelope me-2"></i>
              <b>Email:</b> <br /> <a href="mailto:sakthibala2705@gmail.com" style={{textDecoration:'none'}}>sakthibala2705@gmail.com</a>
            </p>
            <p className="mb-3">
              <i className="bi bi-phone me-2"></i>
              <b>Phone:</b> <br /> <a href="tel:+917868998544" style={{textDecoration:'none'}}>+91 7868998544</a>
            </p>
            <p className="mb-3">
              <i className="bi bi-geo-alt me-2"></i>
              <b>Location:</b> <br /> Thanjavur, Tamil Nadu, India
            </p>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h3 className="mb-3">Send us a Message</h3>

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Mobile */}
                <div className="mb-3">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile"
                    className="form-control"
                    placeholder="+91 99999 99999"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Message */}
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    name="message"
                    className="form-control"
                    rows="4"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-primary w-100">
                  Submit Request
                </button>

                {/* Status Message */}
                {status && (
                  <div className={`alert mt-3 ${status.includes("Success") ? "alert-success" : "alert-info"}`}>
                    {status}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
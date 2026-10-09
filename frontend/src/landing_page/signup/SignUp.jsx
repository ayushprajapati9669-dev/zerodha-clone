import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
function SignUp() {
  const [step, setStep] = useState(1);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const handleMobileSubmit = (e) => {
    e.preventDefault();

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError("Please enter a valid name.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          name,
          email,
          mobile,
          password,
        },
      );

      console.log(response.data);

      setStep(3);
    } catch (error) {
      console.log("inside signup=", error.response?.data);

      const errors = error.response?.data?.errors;

      if (errors && errors.length > 0) {
        setError(errors.join(", "));
      } else {
        setError(
          error.response?.data?.message ||
            "Something went wrong. Please try again.",
        );
      }
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
      style={{ minHeight: "80vh", backgroundColor: "#f9f9f9" }}
    >
      <div
        className="auth-card bg-white rounded-3 shadow-sm p-4 p-md-5"
        style={{
          width: "100%",
          maxWidth: "420px",
          margin: "2rem 1rem",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-4">
          <Link to="/">
            <img
              src="/assets/logo.svg"
              alt="Zerodha"
              style={{ height: "36px" }}
            />
          </Link>
        </div>

        {/* Heading */}
        <h1
          className="fs-4 fw-semibold text-center mb-1"
          style={{ color: "#424242" }}
        >
          Open a free account
        </h1>

        <p
          className="text-muted text-center mb-4"
          style={{ fontSize: "0.9rem" }}
        >
          Invest in stocks &amp; MFs, the free way
        </p>

        {/* Progress indicator */}
        <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
          {[1, 2, 3].map((item, index) => (
            <div key={item} className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: step >= item ? "#387ED1" : "#e0e0e0",
                  color: step >= item ? "#fff" : "#999",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                {item}
              </div>

              {index < 2 && (
                <div
                  style={{
                    width: "40px",
                    height: "2px",
                    backgroundColor: step > item ? "#387ED1" : "#ddd",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleMobileSubmit} noValidate>
            <div className="mb-3">
              <label
                htmlFor="mobileInput"
                className="form-label fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                Mobile number
              </label>

              <div className="input-group">
                <span
                  className="input-group-text bg-white"
                  style={{
                    color: "#424242",
                    fontWeight: "500",
                  }}
                >
                  +91
                </span>

                <input
                  id="mobileInput"
                  type="tel"
                  className="form-control"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  maxLength={10}
                  style={{ fontSize: "0.95rem" }}
                />
              </div>
            </div>

            {error && (
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                style={{ fontSize: "0.85rem" }}
              >
                {error}
              </div>
            )}

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeCheck"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />

              <label
                className="form-check-label text-muted"
                htmlFor="agreeCheck"
                style={{ fontSize: "0.82rem" }}
              >
                I agree to the{" "}
                <a href="#" style={{ color: "#387ED1" }}>
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a href="#" style={{ color: "#387ED1" }}>
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 signup-btn"
              style={{
                fontSize: "1rem",
                letterSpacing: "0.3px",
              }}
            >
              Continue
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleRegister} noValidate>
            <div className="mb-3">
              <label
                className="form-label fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                Full name
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                Email
              </label>

              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                Confirm password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                style={{ fontSize: "0.85rem" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              style={{
                fontSize: "1rem",
                letterSpacing: "0.3px",
              }}
            >
              Create Account
            </button>

            <button
              type="button"
              className="btn btn-link w-100 mt-2 text-decoration-none"
              onClick={() => {
                setStep(1);
                setError("");
              }}
            >
              ← Back
            </button>
          </form>
        )}
        {/* STEP 3 */}
        {step === 3 && (
          <div className="text-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: "70px",
                height: "70px",
                backgroundColor: "#e8f5e9",
                color: "#198754",
                fontSize: "2rem",
              }}
            >
              ✓
            </div>

            <h4 className="fw-semibold mb-2" style={{ color: "#424242" }}>
              Account created successfully!
            </h4>

            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Your account has been created successfully. You can now login and
              access your dashboard.
            </p>

            <Link to="/login" className="btn btn-primary w-100 py-2">
              Login to your account
            </Link>
          </div>
        )}
        {/* Benefits */}
        <div className="mt-4 pt-3 border-top">
          <div className="row g-2 text-center">
            <div className="col-4">
              <i
                className="fa-solid fa-lock mb-1"
                style={{
                  color: "#387ED1",
                  fontSize: "1.1rem",
                }}
              ></i>

              <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>
                100% Secure
              </p>
            </div>

            <div className="col-4">
              <i
                className="fa-solid fa-indian-rupee-sign mb-1"
                style={{
                  color: "#387ED1",
                  fontSize: "1.1rem",
                }}
              ></i>

              <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>
                ₹0 Account Fee
              </p>
            </div>

            <div className="col-4">
              <i
                className="fa-solid fa-bolt mb-1"
                style={{
                  color: "#387ED1",
                  fontSize: "1.1rem",
                }}
              ></i>

              <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>
                Instant KYC
              </p>
            </div>
          </div>
        </div>

        <p
          className="text-center mt-4 text-muted"
          style={{ fontSize: "0.82rem" }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#387ED1" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;

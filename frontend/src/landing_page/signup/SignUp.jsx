import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function SignUp() {
  // 1: Mobile, 2: OTP, 3: Details, 4: Success
  const [step, setStep] = useState(1);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleMobileSubmit = async (e) => {
    e?.preventDefault();

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setError("");
    
    try {
      setLoading(true);
      await axios.post("http://localhost:3000/api/auth/otp/send", {
        mobile,
        purpose: "signup",
      });
      setStep(2); // Move to OTP verification
      setResendTimer(30);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:3000/api/auth/register/verify-mobile", {
        mobile,
        otp,
      });
      setVerificationToken(response.data.verificationToken);
      setStep(3); // Move to Details
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
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
      setLoading(true);
      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          name,
          email,
          mobile,
          password,
          verificationToken,
        },
        { withCredentials: true }
      );

      setStep(4);
      // Auto-login and redirect to dashboard
      setTimeout(() => {
        window.location.href = "http://localhost:5174/dashboard";
      }, 1500);
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors && errors.length > 0) {
        setError(errors.join(", "));
      } else {
        setError(error.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
      style={{ minHeight: "80vh", backgroundColor: "#f9f9f9" }}
    >
      <div
        className="auth-card bg-white rounded-3 shadow-sm p-4 p-md-5"
        style={{ width: "100%", maxWidth: "420px", margin: "2rem 1rem" }}
      >
        <div className="text-center mb-4">
          <Link to="/">
            <img src="/assets/logo.svg" alt="Zerodha" style={{ height: "36px" }} />
          </Link>
        </div>

        <h1 className="fs-4 fw-semibold text-center mb-1" style={{ color: "#424242" }}>
          Open a free account
        </h1>
        <p className="text-muted text-center mb-4" style={{ fontSize: "0.9rem" }}>
          Invest in stocks & MFs, the free way
        </p>

        {/* Progress indicator */}
        <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
          {[1, 2, 3].map((item, index) => {
            // Map our 4 internal steps to the 3 visual steps
            let visualStep = step;
            if (step === 2) visualStep = 1; // OTP is still part of step 1 visually
            if (step === 3) visualStep = 2; // Details is step 2 visually
            if (step === 4) visualStep = 3; // Success is step 3 visually

            return (
            <div key={item} className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "28px", height: "28px",
                  backgroundColor: visualStep >= item ? "#387ED1" : "#e0e0e0",
                  color: visualStep >= item ? "#fff" : "#999",
                  fontSize: "0.8rem", fontWeight: "600",
                }}
              >
                {item}
              </div>
              {index < 2 && (
                <div
                  style={{
                    width: "40px", height: "2px",
                    backgroundColor: visualStep > item ? "#387ED1" : "#ddd",
                  }}
                />
              )}
            </div>
            );
          })}
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* STEP 1: Mobile Input */}
        {step === 1 && (
          <form onSubmit={handleMobileSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="mobileInput" className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>
                Mobile number
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white" style={{ color: "#424242", fontWeight: "500" }}>
                  +91
                </span>
                <input
                  id="mobileInput"
                  type="tel"
                  className="form-control"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeCheck"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label className="form-check-label text-muted" htmlFor="agreeCheck" style={{ fontSize: "0.82rem" }}>
                I agree to the <a href="#" style={{ color: "#387ED1" }}>Terms & Conditions</a> and <a href="#" style={{ color: "#387ED1" }}>Privacy Policy</a>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2 signup-btn"
              style={{ fontSize: "1rem", letterSpacing: "0.3px" }}
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} noValidate>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>
                Enter OTP sent to +91 ******{mobile.slice(-4)}
              </label>
              <input
                type="text"
                className="form-control text-center fs-4 letter-spacing-lg"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2 mb-3"
              style={{ fontSize: "1rem", letterSpacing: "0.3px" }}
            >
              {loading ? "Verifying..." : "Verify Mobile"}
            </button>
            
            <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.82rem" }}>
              <button 
                type="button" 
                className="btn btn-link p-0 text-decoration-none" 
                onClick={() => setStep(1)}
              >
                Change Number
              </button>
              
              {resendTimer > 0 ? (
                <span>Resend in {resendTimer}s</span>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-decoration-none" 
                  onClick={() => handleMobileSubmit()}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: Details */}
        {step === 3 && (
          <form onSubmit={handleRegister} noValidate>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>Full name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>Confirm password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2"
              style={{ fontSize: "1rem", letterSpacing: "0.3px" }}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <button
              type="button"
              className="btn btn-link w-100 mt-2 text-decoration-none"
              onClick={() => {
                setStep(1);
                setError("");
              }}
            >
              ← Start Over
            </button>
          </form>
        )}

        {/* STEP 4: Success & Auto-redirect */}
        {step === 4 && (
          <div className="text-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: "70px", height: "70px", backgroundColor: "#e8f5e9", color: "#198754", fontSize: "2rem" }}
            >
              ✓
            </div>
            <h4 className="fw-semibold mb-2" style={{ color: "#424242" }}>Account created successfully!</h4>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Welcome aboard! You have been automatically logged in. Redirecting to your dashboard...
            </p>
            <a href="http://localhost:5174/dashboard" className="btn btn-primary w-100 py-2">
              Go to Dashboard Now
            </a>
          </div>
        )}
        
        {/* Footer info omitted for brevity but keeping styling simple */}
      </div>
    </div>
  );
}

export default SignUp;

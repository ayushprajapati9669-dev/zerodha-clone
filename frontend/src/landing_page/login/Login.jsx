import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Login() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  
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

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:3000/api/auth/otp/send", {
        mobile,
        purpose: "login",
      });
      setStep(2);
      setResendTimer(30); // 30 seconds cooldown
    } catch (error) {
      console.log(error);
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
      const response = await axios.post(
        "http://localhost:3000/api/auth/login/otp",
        { mobile, otp },
        { withCredentials: true }
      );
      
      // Dashboard runs on port 5174; login frontend is on 5173
      window.location.href = "http://localhost:5174/dashboard";
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Invalid OTP.");
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
          Welcome back
        </h1>
        <p className="text-muted text-center mb-4" style={{ fontSize: "0.9rem" }}>
          {step === 1 ? "Login to continue to your account" : `OTP sent to +91 ******${mobile.slice(-4)}`}
        </p>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>
                Mobile Number
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white" style={{ color: "#424242", fontWeight: "500" }}>
                  +91
                </span>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
              style={{ fontSize: "1rem", letterSpacing: "0.3px" }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: "0.9rem" }}>
                6-Digit OTP
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
              className="btn btn-primary w-100 py-2 mb-3"
              disabled={loading}
              style={{ fontSize: "1rem", letterSpacing: "0.3px" }}
            >
              {loading ? "Verifying..." : "Verify OTP"}
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
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        <p className="text-center mt-4 text-muted" style={{ fontSize: "0.82rem" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#387ED1" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

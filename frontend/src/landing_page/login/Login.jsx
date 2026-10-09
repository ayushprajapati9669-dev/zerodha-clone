import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          email,
          password,
        },
        { withCredentials: true },
      );

      console.log(response.data);

      window.location.href = "http://localhost:5174/dashboard";
    } catch (error) {
      console.log(error);

      setError(error.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
      style={{
        minHeight: "80vh",
        backgroundColor: "#f9f9f9",
      }}
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
          Welcome back
        </h1>

        <p
          className="text-muted text-center mb-4"
          style={{ fontSize: "0.9rem" }}
        >
          Login to continue to your account
        </p>

        {/* Error */}
        {error && (
          <div
            className="alert alert-danger py-2 px-3 mb-3"
            style={{ fontSize: "0.85rem" }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
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

          {/* Password */}
          <div className="mb-4">
            <label
              className="form-label fw-medium"
              style={{ fontSize: "0.9rem" }}
            >
              Password
            </label>

            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={loading}
            style={{
              fontSize: "1rem",
              letterSpacing: "0.3px",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Signup */}
        <p
          className="text-center mt-4 text-muted"
          style={{ fontSize: "0.82rem" }}
        >
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

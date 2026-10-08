import { Link } from "react-router-dom";

function Stats() {
  return (
    <div className="container my-5 py-3">
      <div className="row g-4 align-items-center">
        {/* Left text column */}
        <div className="col-sm-12 col-md-12 col-lg-6 px-4 px-lg-5">
          <h2
            className="fs-4 mb-4"
            style={{ color: "#424242", fontWeight: "600" }}
          >
            Trust with confidence
          </h2>
          <h3 style={{ color: "#424242", fontWeight: "500", fontSize: "1.3rem" }}>
            Customer-first always
          </h3>
          <p className="mb-4 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            That's why 1.6+ crore customers trust Zerodha with ~ ₹6 lakh crores
            of equity investments, making us India's largest broker;
            contributing to 15% of daily retail exchange volumes in India.
          </p>
          <h3 style={{ color: "#424242", fontWeight: "500", fontSize: "1.3rem" }}>
            No spam or gimmicks
          </h3>
          <p className="mb-4 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            No gimmicks, spam, "gamification", or annoying push notifications.
            High quality apps that you use at your pace, the way you like.
            &nbsp;
            <Link to="/about" style={{ color: "#387ED1" }}>
              Our philosophies.
            </Link>
          </p>
          <h3 style={{ color: "#424242", fontWeight: "500", fontSize: "1.3rem" }}>
            The Zerodha universe
          </h3>
          <p className="mb-4 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            Not just an app, but a whole ecosystem. Our investments in 30+
            fintech startups offer you tailored services specific to your needs.
          </p>
          <h3 style={{ color: "#424242", fontWeight: "500", fontSize: "1.3rem" }}>
            Do better with money
          </h3>
          <p className="mb-4 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            With initiatives like{" "}
            <a href="/" style={{ color: "#387ED1" }}>Nudge</a> and{" "}
            <a href="/" style={{ color: "#387ED1" }}>Kill Switch</a>, we don't just facilitate transactions,
            but actively help you do better with your money.
          </p>
        </div>

        {/* Right image column */}
        <div className="col-sm-12 col-md-12 col-lg-6 px-4 px-lg-5 text-center">
          <img
            src="assets/ecosystem.png"
            alt="Zerodha Ecosystem"
            className="img-fluid section-img"
          />
          <div className="mt-4 d-flex flex-wrap justify-content-center gap-4 fs-5">
            <Link to="/products" style={{ color: "#387ED1", textDecoration: "none" }}>
              Explore our products <i className="fa-solid fa-arrow-right"></i>
            </Link>
            <a href="https://kite-demo.zerodha.com/" target="_blank" rel="noreferrer" style={{ color: "#387ED1", textDecoration: "none" }}>
              Try Kite demo <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;

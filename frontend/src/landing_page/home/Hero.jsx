import { Link } from "react-router-dom";

function Hero() {
  return (
    <div className="container mb-5 py-4">
      <div className="row mt-4">
        <div className="col d-flex flex-column justify-content-center align-items-center text-center">
          <img
            src="assets/homeHero.svg"
            alt="Invest in stocks, mutual funds, ETFs and more"
            className="hero-img mb-4"
          />
          <h1 className="fw-bold" style={{ color: "#424242", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
            Invest in everything
          </h1>
          <p className="fs-5 mt-3 mb-3 text-muted" style={{ maxWidth: "520px" }}>
            Online platform to invest in stocks, derivatives, mutual funds,
            ETFs, bonds, and more.
          </p>
          <Link to="/signup">
            <button
              className="btn btn-primary px-5 fs-5 py-2 mt-3 signup-btn"
            >
              Sign up for free
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Hero;

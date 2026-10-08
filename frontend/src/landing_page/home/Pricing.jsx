import { Link } from "react-router-dom";

function Pricing() {
  return (
    <div className="container py-5">
      <div className="row g-4 px-2 px-md-4">
        {/* Left description */}
        <div className="col-sm-12 col-md-12 col-lg-4 d-flex flex-column justify-content-center">
          <h2 className="text-muted fs-4 mb-4" style={{ fontWeight: "600" }}>Unbeatable pricing</h2>
          <p className="mb-4 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            We pioneered the concept of discount broking and price transparency
            in India. Flat fees and no hidden charges.
          </p>
          <Link to="/pricing" style={{ color: "#387ED1", fontSize: "1.05rem", fontWeight: "500" }}>
            See pricing <i className="fa-solid fa-arrow-right ps-2"></i>
          </Link>
        </div>

        {/* Pricing cards */}
        <div className="col-sm-12 col-md-12 col-lg-8">
          <div className="row g-4 mt-1">
            <div className="col-12 col-sm-4 d-flex flex-column align-items-center text-center">
              <img
                src="/assets/pricing-eq.svg"
                alt="Free account opening"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
              />
              <p className="mt-3 fw-500" style={{ fontSize: "0.95rem" }}>
                Free account opening
              </p>
            </div>
            <div className="col-12 col-sm-4 d-flex flex-column align-items-center text-center">
              <img
                src="/assets/pricing-eq.svg"
                alt="Free equity delivery"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
              />
              <p className="mt-3" style={{ fontSize: "0.95rem" }}>
                Free equity delivery and direct mutual funds
              </p>
            </div>
            <div className="col-12 col-sm-4 d-flex flex-column align-items-center text-center">
              <img
                src="/assets/other-trades.svg"
                alt="Intraday and F&O"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
              />
              <p className="mt-3" style={{ fontSize: "0.95rem" }}>
                Intraday and F&O
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;

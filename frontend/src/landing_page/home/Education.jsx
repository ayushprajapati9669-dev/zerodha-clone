import { Link } from "react-router-dom";

function Education() {
  return (
    <div className="container py-5">
      <div className="row g-4 align-items-center px-2 px-md-4 mb-4">
        {/* Image column */}
        <div className="col-sm-12 col-md-12 col-lg-6 d-flex justify-content-center">
          <img
            src="/assets/index-education.svg"
            alt="Varsity – Stock Market Education"
            className="img-fluid section-img"
          />
        </div>
        {/* Text column */}
        <div className="col-sm-12 col-md-12 col-lg-6">
          <h2 className="text-muted fs-4 mb-4" style={{ fontWeight: "600" }}>
            Free and open market education
          </h2>
          <p className="mb-3 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            Varsity, the largest online stock market education book in the world
            covering everything from the basics to advanced trading.
          </p>
          <Link to="/products" style={{ color: "#387ED1", fontSize: "1.05rem", fontWeight: "500" }}>
            Varsity <i className="fa-solid fa-arrow-right ps-2"></i>
          </Link>
          <p className="my-4 text-muted" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
            TradingQ&A, the most active trading and investment community in
            India for all your market related queries.
          </p>
          <Link to="/support" style={{ color: "#387ED1", fontSize: "1.05rem", fontWeight: "500" }}>
            TradingQ&A <i className="fa-solid fa-arrow-right ps-2"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Education;

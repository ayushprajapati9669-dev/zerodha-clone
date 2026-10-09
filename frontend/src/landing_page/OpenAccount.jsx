import { Link } from "react-router-dom";

function OpenAccount() {
  return (
    <section className="container mt-5 account-cta">
      <div className="row">
        <div className="col text-center mb-5">
          <h1 className="text-muted fs-4">Open a Zerodha account</h1>
          <p className="fs-5 mt-3 mb-3 text-muted">
            Modern platforms and apps, ₹0 investments, and flat ₹20 intraday and
            F&O trades.
          </p>
          <Link
            to="/signup"
            className="btn btn-primary px-5 fs-5 py-2 mt-4 signup-btn"
          >
            Sign up for free
          </Link>
        </div>
      </div>
    </section>
  );
}

export default OpenAccount;

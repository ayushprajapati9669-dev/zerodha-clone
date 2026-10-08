function OpenAccount() {
  return (
    <div className="container mt-5 ">
      <div className="row ">
        <div className="col text-center mb-5">
          <h1 className="text-muted fs-4">Open a Zerodha account</h1>
          <p className="fs-5 mt-3 mb-3 text-muted">
            Modern platforms and apps, ₹0 investments, and flat ₹20 intraday and
            F&O trades.
          </p>
          <button
            className=" btn btn-primary px-5 fs-5 py-2 mt-4 signup-btn"
            style={{ backgroundColor: "#387ED1" }}
          >
            Sign up for free
          </button>
        </div>
      </div>
    </div>
  );
}

export default OpenAccount;

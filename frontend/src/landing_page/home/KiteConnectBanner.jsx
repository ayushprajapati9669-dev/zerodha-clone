function KiteConnectBanner() {
  return (
    <div
      className="py-4 my-4"
      style={{ backgroundColor: "#F6FBFF", width: "100%" }}
    >
      <div className="container">
        <div className="row align-items-center g-3 px-2 px-md-4">
          <div className="col-12 col-md-2 text-center text-md-start">
            <img
              src="/assets/kc-logo-landing.svg"
              alt="Kite Connect Logo"
              style={{ height: "40px", width: "auto" }}
            />
          </div>
          <div className="col-12 col-md-8">
            <p className="mb-0" style={{ color: "#424242", fontSize: "1rem", lineHeight: "1.7" }}>
              Need more? Build your own trading and investing experience with
              Kite Connect, simple HTTP APIs to place orders, stream market
              data, manage your account, and more.&nbsp;
              <a href="/" style={{ color: "#387ED1" }}>
                Explore <i className="fa-solid fa-arrow-right ps-1"></i>
              </a>
            </p>
          </div>
          <div className="col-12 col-md-2 text-center">
            <img
              style={{ width: "100%", maxWidth: "120px" }}
              src="/assets/kc-banner-image.svg"
              alt="Kite Connect Banner"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default KiteConnectBanner;

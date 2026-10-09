import Price from "./Price";
function Hero() {
  return (
    <div className="container">
      <div className="row text-center p-3">
        <h1 className="fs-3 mt-5" style={{ color: "#424242" }}>
          Charges
        </h1>
        <p className="text-muted" style={{ fontSize: "1.5rem" }}>
          List of all charges and taxes
        </p>
      </div>
      <div className="row p-2 p-md-5 g-3">
        <Price
          imageUrl="assets/pricing-eq.svg"
          title="Free equity delivery"
          description=" All equity delivery investments (NSE, BSE), are absolutely free
        — ₹ 0 brokerage."
        />
        <Price
          imageUrl="assets/other-trades.svg"
          title="Intraday and F&O trades"
          description="Flat ₹ 20 or 0.03% (whichever is lower) per executed order on intraday trades across equity, currency, and commodity trades. Flat ₹20 on all option trades."
        />
        <Price
          imageUrl="assets/pricing-eq.svg"
          title="Free direct MF"
          description="All direct mutual fund investments are absolutely free — ₹ 0 commissions & DP charges."
        />
      </div>
    </div>
  );
}

export default Hero;

import ZerodhaUniverse from "./ZerodhaUniverse.jsx";
function Universe() {
  return (
    <div className="container">
      <p
        className="text-center pb-5 "
        style={{ color: "#424242", fontSize: "1.2rem" }}
      >
        Want to know more about our technology stack? Check out the{" "}
        <a href="" className="me-2 products-anchor">
          Zerodha.tech
        </a>
        blog.
      </p>
      <h1 className="text-center fs-3 mt-5" style={{ color: "#424242" }}>
        The Zerodha Universe
      </h1>
      <p
        className="text-center  mt-3"
        style={{ color: "#424242", fontSize: "1rem" }}
      >
        Extend your trading and investment experience even further with our
        partner platforms
      </p>

      <div className="row  px-5">
        <ZerodhaUniverse
          imageUrl1="assets/zerodhafundhouse.png"
          description1=" Our asset management venture that is creating simple and transparent
        index funds to help you save for your goals."
          imageUrl2="assets/streak-logo.png"
          description2="  Systematic trading platform that allows you to create and backtest
        strategies without coding."
          url1="https://www.zerodhafundhouse.com/"
          url2="https://www.streak.tech/"
        />
        <ZerodhaUniverse
          imageUrl1="assets/sensibull-logo.svg"
          description1=" 
Options trading platform that lets you
create strategies, analyze positions, and examine
data points like open interest, FII/DII, and more.
"
          imageUrl2="assets/smallcase-logo.png"
          description2="  
Thematic investing platform
that helps you invest in diversified
baskets of stocks on ETFs."
          url1="https://sensibull.com/"
          url2="https://smallcase.zerodha.com/"
        />
        <ZerodhaUniverse
          imageUrl1="assets/tijori.svg"
          description1="
Investment research platform
that offers detailed insights on stocks,
sectors, supply chains, and more.
"
          imageUrl2="assets/ditto-logo.png"
          description2=" 
Personalized advice on life
and health insurance. No spam
and no mis-selling."
          url1="https://www.tijorifinance.com/dashboard/"
          url2="https://joinditto.in/"
        />
      </div>
      <div className="text-center">
        <button
          className=" btn btn-primary px-5 fs-5 py-2  signup-btn"
          style={{ backgroundColor: "#387ED1" }}
        >
          Sign up for free
        </button>
      </div>
    </div>
  );
}

export default Universe;

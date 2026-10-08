function Hero() {
  return (
    <div className="container mt-5 p-5 ">
      <div className="row text-center border-bottom">
        <h1 className="fs-2" style={{ color: "#424242" }}>
          Zerodha Products
        </h1>
        <p className="fs-5">Sleek, modern, and intuitive trading platforms</p>
        <p className="mb-5 pb-5">
          {" "}
          Check out our{" "}
          <a className="products-anchor" href="https://zerodha.com/investments">investment offerings →</a>
        </p>
      </div>
    </div>
  );
}

export default Hero;

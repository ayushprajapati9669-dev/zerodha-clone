function Hero() {
  return (
    <section className="container about-hero py-5 mb-5">
      <div className="row text-center my-5 pb-5 ">
        <h1
          style={{ fontSize: "1.5rem", color: "#424242", lineHeight: "2rem" }}
        >
          We pioneered the discount broking model in India.<br></br> Now, we are
          breaking ground with our technology.
        </h1>
      </div>
      <div className="row about-hero__copy border-top">
        <div className="col-12 col-md-6 p-3 p-md-5 mt-md-4" style={{ lineHeight: "1.8rem" }}>
          <p>
            We kick-started operations on the 15th of August, 2010 with the goal
            of breaking all barriers that traders and investors face in India in
            terms of cost, support, and technology. We named the company
            Zerodha, a combination of Zero and "Rodha", the Sanskrit word for
            barrier.
          </p>
          <p>
            Today, our disruptive pricing models and in-house technology have
            made us the biggest stock broker in India.
          </p>
          <p>
            Over 1.6+ crore clients place billions of orders every year through
            our powerful ecosystem of investment platforms, contributing over
            15% of all Indian retail trading volumes.
          </p>
        </div>
        <div className="col-12 col-md-6 p-3 p-md-5 mt-md-4" style={{ lineHeight: "1.8rem" }}>
          <p>
            In addition, we run a number of popular open online educational and
            community initiatives to empower retail traders and investors.
          </p>
          <p>
            <a href="https://rainmatter.com/"> Rainmatter</a>, our fintech fund
            and incubator, has invested in several fintech startups with the
            goal of growing the Indian capital markets.
          </p>
          <p>
            And yet, we are always up to something new every day. Catch up on
            the latest updates on our{" "}
            <a href="https://zerodha.com/z-connect/">blog</a> or see what the
            media is <a href="https://zerodha.com/media">saying about us</a> or
            learn more about our business and product
            <a href="https://zerodha.com/about/philosophy/"> philosophies.</a>
          </p>
        </div>
      </div>
      <div className="row text-center mt-5  ">
        <h1
          style={{ fontSize: "1.7rem", color: "#424242", lineHeight: "2rem" }}
        >
          People
        </h1>
      </div>
    </section>
  );
}

export default Hero;

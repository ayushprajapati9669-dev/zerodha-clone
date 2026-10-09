import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="home-hero">
      <div className="container text-center">
        <div className="home-hero__content">
          <img
            src="assets/homeHero.svg"
            alt="Invest in stocks, mutual funds, ETFs and more"
            className="hero-img"
          />
          <h1>Invest in everything</h1>
          <p className="mt-3 mb-3 mx-auto">
            Online platform to invest in stocks, derivatives, mutual funds,
            ETFs, bonds, and more.
          </p>
          <Link to="/signup" className="btn btn-primary signup-btn">
            Sign up for free
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;

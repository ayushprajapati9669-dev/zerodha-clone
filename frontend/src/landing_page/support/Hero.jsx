function Hero() {
  return (
    <section className="support-hero">
      <div className="container">
        <div className="support-hero__heading d-flex justify-content-between align-items-center">
          <h1 className="mt-4">Support Portal</h1>
          <button
            className="btn btn-primary mt-4 signup-btn"
            style={{
              backgroundColor: "#387ED1",
              fontSize: "1.1rem",
              width: "10rem",
              height: "3rem",
            }}
          >
            My tickets
          </button>
        </div>
        <div className="support-search">
          <span className="support-search__icon" aria-hidden="true">
            <i className="fa-solid fa-magnifying-glass text-muted"></i>
          </span>
          <input
            className="w-100"
            id="inputHero"
            type="search"
            placeholder="Eg: How do I open my account, How do i activate F&O...
"
          ></input>
        </div>
      </div>
    </section>
  );
}

export default Hero;

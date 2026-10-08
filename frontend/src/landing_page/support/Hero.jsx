function Hero() {
  return (
    <div className="container-fluid" style={{ backgroundColor: "#EEEEEE" }}>
      <div className="container ">
        <div className="d-flex justify-content-between px-5">
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
        <div className="px-5 " style={{ position: "relative" }}>
          <span style={{ position: "absolute", top: "4rem", left: "4rem" }}>
            {" "}
            <i className="fa-solid fa-magnifying-glass text-muted"></i>
          </span>
          <input
            className="w-100 p-3 ps-5 my-5  "
            id="inputHero"
            style={{
              border: "1px solid rgba(0,0,0,0.2)",
              borderRadius: "0.5rem",
            }}
            placeholder="Eg: How do I open my account, How do i activate F&O...
"
          ></input>
        </div>
      </div>
    </div>
  );
}

export default Hero;

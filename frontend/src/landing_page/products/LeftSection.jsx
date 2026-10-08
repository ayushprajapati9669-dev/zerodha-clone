function LeftSection({ imageUrl, title, description, url1, url2, str1, str2 }) {
  return (
    <div className="container py-4">
      <div className="row g-4 align-items-center px-2 px-md-4">
        {/* Image column */}
        <div className="col-12 col-md-6 text-center">
          <img src={imageUrl} alt={title} className="img-fluid section-img" />
        </div>
        {/* Text column */}
        <div className="col-12 col-md-6">
          <h2 className="fs-3 mb-3" style={{ color: "#424242", fontWeight: "600" }}>
            {title}
          </h2>
          <p
            className="mt-3 text-muted"
            style={{
              lineHeight: "2rem",
              fontSize: "1.05rem",
            }}
          >
            {description}
          </p>
          <div className="mt-3 d-flex flex-wrap gap-4 align-items-center">
            {url1 && str1 && (
              <a className="products-anchor" href={url1} target="_blank" rel="noreferrer">
                {str1}
                <i className="fa-solid fa-arrow-right ps-2"></i>
              </a>
            )}
            {url2 && str2 && (
              <a href={url2} className="products-anchor" target="_blank" rel="noreferrer">
                {str2}
                <i className="fa-solid fa-arrow-right ps-2"></i>
              </a>
            )}
          </div>
          <div className="app-badges mt-4 d-flex flex-wrap gap-2">
            <a href="">
              <img src="/assets/google-play-badge.svg" alt="Google Play" />
            </a>
            <a href="">
              <img src="/assets/appstore-badge.svg" alt="App Store" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSection;

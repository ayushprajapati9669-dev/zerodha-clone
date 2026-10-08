function Price({ imageUrl, title, description }) {
  return (
    <div className="col-12 col-sm-4 p-4 text-center">
      <img src={imageUrl} alt={title} className="mb-3" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
      <h2 className="fs-4 mb-3" style={{ fontWeight: "600", color: "#424242" }}>{title}</h2>
      <p className="text-muted" style={{ fontSize: "1rem", lineHeight: "1.7" }}>
        {description}
      </p>
    </div>
  );
}

export default Price;

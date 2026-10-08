function ZerodhaUniverse({
  imageUrl1,
  description1,
  imageUrl2,
  description2,
  url1,
  url2,
}) {
  return (
    <div className="col-4  p-5">
      <a href="" className=" text-muted">
        <img src={imageUrl1} className="w-50 ms-5 "></img>
        <p className="px-5 py-2 mb-3 text-muted">{description1}</p>
      </a>
      <a href="" className=" text-muted">
        <img src={imageUrl2} className="w-50 ms-5 mt-5  text-muted"></img>
        <p className="px-5 py-2">{description2}</p>
      </a>
    </div>
  );
}

export default ZerodhaUniverse;

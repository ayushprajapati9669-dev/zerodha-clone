import { Link } from "react-router-dom";
function NotFound() {
  return (
    <div className="container mt-5 ">
      <div className="row ">
        <div className="col text-center mb-5">
          <h1 className="text-muted fs-4">404,Not Found</h1>
          <p className="fs-5 mt-3 mb-3 text-muted">
            We couldn’t find the page you were looking for.
          </p>
          <p>
            Visit <Link to="/">Zerodha’s home page</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

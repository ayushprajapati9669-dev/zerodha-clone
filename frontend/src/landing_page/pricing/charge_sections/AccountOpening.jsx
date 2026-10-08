function AccountOpening() {
  return (
    <div className="container">
      <div className="row   p-5">
        <h2 className="text-muted mx-4 px-4 ">Charges for account opening</h2>
        <div className="row p-5 mx-1">
          <table className=" border" style={{ marginRight: "10rem" }}>
            <thead>
              <tr>
                <th className="text-muted p-2">Type of account</th>
                <th className="text-muted p-2"> Charges</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-muted p-2">Individual account</td>
                <td>
                  <img
                    src="assets/free-removebg-preview.png"
                    style={{ width: "5rem" }}
                  ></img>
                </td>
              </tr>
              <tr>
                <td className="text-muted p-2">Minor account</td>
                <td>
                  {" "}
                  <img
                    src="assets/free-removebg-preview.png"
                    style={{ width: "5rem" }}
                  ></img>
                </td>
              </tr>
              <tr>
                <td className="text-muted p-2">NRI account</td>
                <td className="text-muted p-2">₹ 500</td>
              </tr>
              <tr>
                <td className="text-muted p-2">HUF account</td>
                <td>
                  <img
                    src="assets/free-removebg-preview.png"
                    style={{ width: "5rem" }}
                  ></img>{" "}
                  <span className="text-muted p-2">
                    {" "}
                    (online) / ₹ 500 (offline)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="text-muted p-2">
                  Partnership, LLP, and Corporate accounts (offline only)
                </td>
                <td className="text-muted p-2"> ₹ 500</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccountOpening;

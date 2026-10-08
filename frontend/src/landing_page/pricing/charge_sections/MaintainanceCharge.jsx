function MaintainanceCharge() {
  return (
    <div className="container">
      <div className="row   p-5">
        <h2 className="text-muted mx-4 px-4 ">
          Demat AMC (Annual Maintenance Charge)
        </h2>
        <div
          class="   d-flex justify-content-start align-items-center"
          style={{ marginLeft: "2.5rem" }}
        >
          <div
            style={{
              height: "3.5rem",
              width: "5px",
              backgroundColor: "#0D6EFD",
              marginTop: "9px",
            }}
          ></div>{" "}
          <p
            className=" p-3 mt-4 d-flex text-center"
            style={{
              width: "15%",
              backgroundColor: "rgba(171, 210, 250,0.1)",
            }}
          >
            <span>Free for first year*</span>
          </p>
        </div>
        <p className="mx-4 px-4">
          From second year onwards, for BSDA accounts:
        </p>
        <div className="row px-5 py-2 mx-1">
          <table className=" border" style={{ marginRight: "10rem" }}>
            <thead>
              <tr>
                <th className="text-muted p-2">Value of holdings</th>
                <th className="text-muted p-2"> AMC</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-muted p-2">Up to ₹4 lakh</td>
                <td>
                  <img
                    src="assets/free-removebg-preview.png"
                    style={{ width: "5rem" }}
                  ></img>
                </td>
              </tr>
              <tr>
                <td className="text-muted p-2">₹4 lakh – ₹10 lakh</td>
                <td>₹100 per year + 18% GST, charged quarterly</td>
              </tr>
              <tr>
                <td className="text-muted p-2">Above ₹10 lakh</td>
                <td className="text-muted p-2">
                  ₹300 per year + 18% GST, charged quarterly
                </td>
              </tr>
            </tbody>
          </table>

          <p className="mt-3 ">
            For a non-BSDA account, AMC is ₹300 per year + 18% GST, regardless
            of holdings value, charged quarterly.
          </p>
          <p>
            To learn more about BSDA, <a href="">click here.</a> To learn more
            about AMC, <a href="">click here.</a>
          </p>
          <p>*Resident individual accounts only.</p>
        </div>
      </div>
    </div>
  );
}

export default MaintainanceCharge;

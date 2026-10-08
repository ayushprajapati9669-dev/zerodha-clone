function Currency() {
  return (
    <div className="container">
      <div className="row px-5 mx-5 mt-4">
        <table className="table border table-light table-borderless ">
          <thead>
            <tr className="border-bottom ">
              <th>&nbsp;</th>
              <th style={{ fontWeight: "400" }}> Currency futures</th>
              <th style={{ fontWeight: "400" }}> Currency options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Brokerage</td>
              <td> 0.03% or ₹ 20/executed order whichever is lower</td>
              <td>₹ 20/executed order</td>
            </tr>
            <tr>
              <td>STT/CTT</td>
              <td>No STT</td>
              <td>No STT</td>
            </tr>
            <tr>
              <td>Transaction charges</td>
              <td>
                <p>NSE: 0.00035%</p> <p>BSE: 0.00045%</p>
              </td>
              <td>
                <p>NSE: 0.0311%</p> <p>BSE: 0.001%</p>
              </td>
            </tr>
            <tr>
              <td>GST</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
            </tr>
            <tr>
              <td>SEBI charges</td>
              <td>₹10 / crore</td>
              <td>₹10 / crore</td>
            </tr>
            <tr>
              <td>Stamp charges</td>
              <td> 0.0001% or ₹10 / crore on buy side</td>
              <td>0.0001% or ₹10 / crore on buy side</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Currency;

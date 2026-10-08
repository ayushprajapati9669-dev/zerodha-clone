function Commodity() {
  return (
    <div className="container">
      <div className="row px-5 mx-5 mt-4">
        <table className="table border table-light table-borderless ">
          <thead>
            <tr className="border-bottom ">
              <th>&nbsp;</th>
              <th style={{ fontWeight: "400" }}> Commodity futures</th>
              <th style={{ fontWeight: "400" }}> Commodity options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Brokerage</td>
              <td> 0.03% or Rs. 20/executed order whichever is lower</td>
              <td> ₹ 20/executed order</td>
            </tr>
            <tr>
              <td>STT/CTT</td>
              <td> 0.01% on sell side (Non-Agri)</td>
              <td> 0.05% on sell side</td>
            </tr>
            <tr>
              <td>Transaction charges</td>
              <td>
                <p>MCX: 0.0021%</p> <p>NSE: 0.0001%</p>
              </td>
              <td>
                <p>MCX: 0.0418%</p> <p>NSE: 0.001%</p>
              </td>
            </tr>
            <tr>
              <td>GST</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
            </tr>
            <tr>
              <td>SEBI charges</td>
              <td>
                <p>Agri:</p>
                <p>₹1 / crore</p>
                <p>Non-agri:</p>
                <p>₹10 / crore</p>
              </td>
              <td>₹10 / crore</td>
            </tr>
            <tr>
              <td>Stamp charges</td>
              <td> 0.002% or ₹200 / crore on buy side</td>
              <td>0.003% or ₹300 / crore on buy side</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Commodity;

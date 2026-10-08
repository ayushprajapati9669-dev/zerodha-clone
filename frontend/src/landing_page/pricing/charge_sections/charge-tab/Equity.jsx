function Equity() {
  return (
    <div className="container">
      <div className="row px-5 mx-5 mt-4">
        <table className="table border table-light table-borderless ">
          <thead>
            <tr className="border-bottom">
              <th>&nbsp;</th>
              <th style={{ fontWeight: "400" }}> Equity delivery</th>
              <th style={{ fontWeight: "400" }}> Equity intraday</th>
              <th style={{ fontWeight: "400" }}> F&O - Futures</th>
              <th style={{ fontWeight: "400" }}> F&O - Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Brokerage</td>
              <td>Zero Brokerage</td>
              <td>
                <p>0.03% or Rs. 20/executed </p>
                <p>order whichever is lower</p>
              </td>
              <td>
                <p>0.03% or Rs. 20/executed </p>
                <p>order whichever is lower</p>
              </td>
              <td>Flat Rs. 20 per executed order</td>
            </tr>
            <tr>
              <td>STT/CTT</td>
              <td>0.1% on buy & sell</td>
              <td>0.025% on the sell side</td>
              <td>0.05% on the sell side</td>
              <td>
                <ul>
                  <li>
                    0.15% of the intrinsic value on options that are bought and
                  </li>
                  <li> exercised 0.15% on sell side (on premium)</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>Transaction charges</td>
              <td>
                <p>NSE: 0.00307%</p> <p>BSE: 0.00375%</p>
              </td>
              <td>
                <p>NSE: 0.00307%</p> <p>BSE: 0.00375%</p>
              </td>
              <td>
                <p>NSE: 0.00183% </p>
                <p>BSE: 0</p>
              </td>
              <td>
                <p>NSE: 0.03553% (on premium) NSE: 0.03553% (on premium) </p>
                <p>BSE: 0.0325% (on premium)</p>
              </td>
            </tr>
            <tr>
              <td>GST</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
              <td>18% on (brokerage + SEBI charges + transaction charges)</td>
            </tr>
            <tr>
              <td>SEBI charges</td>
              <td>₹10 / crore</td>
              <td>₹10 / crore</td>
              <td>₹10 / crore</td>
              <td>₹10 / crore</td>
            </tr>
            <tr>
              <td>Stamp charges</td>
              <td>0.015% or ₹1500 / crore on buy side</td>
              <td>0.003% or ₹300 / crore on buy side</td>
              <td>0.002% or ₹200 / crore on buy side</td>
              <td>0.003% or ₹300 / crore on buy side</td>
            </tr>
          </tbody>
        </table>
        <p className="text-center fs-4 mt-2">
          {" "}
          <a href="">Calculate your costs upfront</a>&nbsp;using our brokerage
          calculator
        </p>
      </div>
    </div>
  );
}

export default Equity;

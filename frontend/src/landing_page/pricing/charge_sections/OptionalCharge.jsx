function OptionalCharge() {
  return (
    <div className="container">
      <div className="row   p-5">
        <h2 className="text-muted mx-4 px-4 ">
          Charges for optional value added services
        </h2>
        <div className="row p-5 mx-1">
          <table className=" border" style={{ marginRight: "10rem" }}>
            <thead>
              <tr>
                <th className="text-muted p-2">Service</th>
                <th className="text-muted p-2"> Billing Frequency</th>
                <th className="text-muted p-2"> Charges</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-muted p-2">Tickertape</td>
                <td className="text-muted p-2">Monthly / Quarterly / Annual</td>
                <td className="text-muted p-2">Free: 0 | Pro: 249/699/2399</td>
              </tr>
              <tr>
                <td className="text-muted p-2">Smallcase</td>
                <td className="text-muted p-2">Per transaction</td>
                <td className="text-muted p-2">
                  Buy & Invest More: 100 | SIP: 10
                </td>
              </tr>
              <tr>
                <td className="text-muted p-2">Kite Connect</td>
                <td className="text-muted p-2"> Monthly</td>
                <td className="text-muted p-2">
                  Connect: 500 | Personal: Free
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OptionalCharge;

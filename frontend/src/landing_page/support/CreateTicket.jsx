import AccountOpening from "./AccountOpening";

function CreateTicket() {
  return (
    <div className="container">
      <div className="row py-4 px-2 px-md-4 g-4">
        {/* Main topics */}
        <div className="col-12 col-md-8">
          <AccountOpening
            icon="fa-regular fa-square-plus fs-5"
            title="Account Opening"
            links={[
              "Resident individual",
              "Minor",
              "Non Resident Indian (NRI)",
              "Company, Partnership, HUF and LLP",
              "Glossary",
            ]}
          />
          <AccountOpening
            icon="fa-regular fa-circle-user fs-5"
            title="Your Zerodha Account"
            links={[
              "Your Profile",
              "Account modification",
              "Client Master Report (CMR) and Depository Participant (DP)",
              "Nomination",
              "Transfer and conversion of securities",
            ]}
          />

          <AccountOpening
            icon="fa-regular fa-square-caret-left fs-5"
            title="Kite"
            links={[
              "IPO",
              "Trading FAQs",
              "Margin Trading Facility (MTF) and Margins",
              "Charts and orders",
              "Alerts and Nudges",
              "General",
            ]}
          />

          <AccountOpening
            icon="fa-solid fa-indian-rupee-sign fs-5"
            title="Funds"
            links={[
              "Add money",
              "Withdraw money",
              "Add bank accounts",
              "eMandates",
            ]}
          />

          <AccountOpening
            icon="fa-solid fa-circle-dot fs-5"
            title="Console"
            links={[
              "Portfolio",
              "Corporate actions",
              "Funds statement",
              "Reports",
              "Profile",
              "Segments",
            ]}
          />
          <AccountOpening
            icon="fa-solid fa-coins fs-5"
            title="Coin"
            links={[
              "Mutual funds",
              "National Pension Scheme (NPS)",
              "Fixed Deposit (FD)",
              "Features on Coin",
              "Payments and Orders",
              "General",
            ]}
          />
        </div>

        {/* Sidebar */}
        <div className="col-12 col-md-4 mb-2">
          <div
            className="mt-4 p-3"
            style={{
              backgroundColor: "#FFF9D8",
              borderLeft: "0.6rem solid #FF9D50",
            }}
          >
            <ul className="mb-0">
              <li className="mb-3" style={{ color: " #0D6EFD" }}>
                <a style={{ textDecoration: "underline", color: "#0D6EFD" }} href="">
                  Current Takeovers and Delisting – September 2026
                </a>
              </li>
              <li style={{ color: " #0D6EFD" }}>
                <a style={{ textDecoration: "underline", color: "#0D6EFD" }} href="">
                  Surveillance measure on scrips - September 2026
                </a>
              </li>
            </ul>
          </div>
          <div className="mt-3">
            <p
              className="px-4 py-2 border mb-0"
              style={{ backgroundColor: "#EEEEEE" }}
            >
              <h3 className="fs-5 text-muted mb-0">Quick links</h3>
            </p>
            <ol className="border py-2" style={{ lineHeight: "2.5rem" }}>
              <li>
                <a href="" style={{ color: "#387ED1" }}>Track account opening</a>
              </li>
              <li>
                <a href="" style={{ color: "#387ED1" }}>Track segment activation</a>
              </li>
              <li>
                <a href="" style={{ color: "#387ED1" }}>Intraday margins</a>
              </li>
              <li>
                <a href="" style={{ color: "#387ED1" }}>Kite user manual</a>
              </li>
              <li>
                <a href="" style={{ color: "#387ED1" }}>Learn how to create a ticket</a>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTicket;

function Footer() {
  return (
    <div
      className="border-top mt-5"
      style={{ backgroundColor: "rgba(240,240,240,0.4)" }}
    >
      <div className="container mt-2">
        {/* Main footer columns */}
        <div className="row mb-4 g-4">
          {/* Brand column */}
          <div className="col-12 col-md-3 mt-3">
            <img src="/assets/logo.svg" style={{ width: "130px" }} />
            <p className="my-3" style={{ fontSize: "0.9rem" }}>
              © 2010 - 2026, Zerodha Broking Ltd. All rights reserved.
            </p>
            <div className="border-bottom pb-3 mb-3">
              <div className="social d-flex gap-3" style={{ fontSize: "1.3rem" }}>
                <a href="" className="text-muted"><i className="fa-brands fa-x-twitter"></i></a>
                <a href="" className="text-muted"><i className="fa-brands fa-facebook"></i></a>
                <a href="" className="text-muted"><i className="fa-brands fa-instagram"></i></a>
                <a href="" className="text-muted"><i className="fa-brands fa-linkedin-in"></i></a>
              </div>
            </div>
            <div className="social my-3 d-flex gap-3" style={{ fontSize: "1.3rem" }}>
              <a href="" className="text-muted"><i className="fa-brands fa-youtube"></i></a>
              <a href="" className="text-muted"><i className="fa-brands fa-whatsapp"></i></a>
              <a href="" className="text-muted"><i className="fa-brands fa-telegram"></i></a>
            </div>
            <div className="app-badges d-flex flex-wrap gap-2 mt-2">
              <a href=""><img src="/assets/google-play-badge-light.svg" alt="Google Play" /></a>
              <a href=""><img src="/assets/appstore-badge-light.svg" alt="App Store" /></a>
            </div>
          </div>

          {/* Links columns */}
          <div className="col-12 col-md-9">
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <ul className="list-style" style={{ listStyleType: "none" }}>
                  <li><h2 className="text-muted fs-6 fw-semibold text-uppercase" style={{ letterSpacing: "0.05em" }}>Account</h2></li>
                  <li><a href="">Open demat account</a></li>
                  <li><a href="">Minor demat account</a></li>
                  <li><a href="">NRI demat account</a></li>
                  <li><a href="">HUF demat account</a></li>
                  <li><a href="">Commodity</a></li>
                  <li><a href="">Dematerialisation</a></li>
                  <li><a href="">Fund transfer</a></li>
                  <li><a href="">MTF</a></li>
                </ul>
              </div>
              <div className="col-6 col-md-3">
                <ul className="list-style" style={{ listStyleType: "none" }}>
                  <li><h2 className="text-muted fs-6 fw-semibold text-uppercase" style={{ letterSpacing: "0.05em" }}>Support</h2></li>
                  <li><a href="">Contact us</a></li>
                  <li><a href="">Support portal</a></li>
                  <li><a href="">How to file a complaint?</a></li>
                  <li><a href="">Status of your complaints</a></li>
                  <li><a href="">Bulletin</a></li>
                  <li><a href="">Circular</a></li>
                  <li><a href="">Z-Connect blog</a></li>
                  <li><a href="">Downloads</a></li>
                </ul>
              </div>
              <div className="col-6 col-md-3">
                <ul className="list-style" style={{ listStyleType: "none" }}>
                  <li><h2 className="text-muted fs-6 fw-semibold text-uppercase" style={{ letterSpacing: "0.05em" }}>Company</h2></li>
                  <li><a href="">About</a></li>
                  <li><a href="">Philosophy</a></li>
                  <li><a href="">Press &amp; media</a></li>
                  <li><a href="">Careers</a></li>
                  <li><a href="">Zerodha Cares (CSR)</a></li>
                  <li><a href="">Zerodha.tech</a></li>
                  <li><a href="">Open source</a></li>
                  <li><a href="">Referral program</a></li>
                </ul>
              </div>
              <div className="col-6 col-md-3">
                <ul className="list-style" style={{ listStyleType: "none" }}>
                  <li><h2 className="text-muted fs-6 fw-semibold text-uppercase" style={{ letterSpacing: "0.05em" }}>Quick links</h2></li>
                  <li><a href="">Upcoming IPOs</a></li>
                  <li><a href="">Brokerage charges</a></li>
                  <li><a href="">Market holidays</a></li>
                  <li><a href="">Economic calendar</a></li>
                  <li><a href="">Calculators</a></li>
                  <li><a href="">Markets</a></li>
                  <li><a href="">Sectors</a></li>
                  <li><a href="">Gift Nifty</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="row">
          <div className="col">
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              Zerodha Broking Ltd.: Member of NSE, BSE, MCX &amp; MSEI – SEBI Registration no.: INZ000031633
              CDSL/NSDL: Depository services through Zerodha Broking Ltd. – SEBI Registration no.: IN-DP-431-2019
              Registered Address: Zerodha Broking Ltd., #153/154, 4th Cross, Dollars Colony, Opp. Clarence Public School,
              J.P Nagar 4th Phase, Bengaluru - 560078, Karnataka, India. For any complaints pertaining to securities
              broking please write to <a href="">complaints@zerodha.com</a>, for DP related to{" "}
              <a href="">dp@zerodha.com</a>. Please ensure you carefully read the Risk Disclosure Document as
              prescribed by SEBI | ICF
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              Procedure to file a complaint on <a href="">SEBI SCORES/SMARTODR</a>: Register on SCORES portal &amp;
              SMARTODR. Mandatory details for filing complaints on SCORES: Name, PAN, Address, Mobile Number, E-mail ID.
              Benefits: Effective Communication, Speedy redressal of grievances
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              <a href="">Smart Online Dispute Resolution</a> | <a href="">Grievances Redressal Mechanism</a>
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              Investments in securities market are subject to market risks; read all the related documents carefully
              before investing.
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              Attention investors: 1) Stock brokers can accept securities as margins from clients only by way of pledge
              in the depository system w.e.f September 01, 2020. 2) Update your e-mail and phone number with your stock
              broker / depository participant and receive OTP directly from depository on your e-mail and/or mobile
              number to create pledge. 3) Check your securities / MF / bonds in the consolidated account statement
              issued by NSDL/CDSL every month.
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              India's largest broker based on networth as per NSE. <a href="">NSE broker factsheet</a>
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              "Prevent unauthorised transactions in your account. Update your mobile numbers/email IDs with your stock
              brokers/depository participants. Receive information of your transactions directly from
              Exchange/Depositories on your mobile/email at the end of the day. Issued in the interest of investors.
              KYC is one time exercise while dealing in securities markets - once KYC is done through a SEBI registered
              intermediary (broker, DP, Mutual Fund etc.), you need not undergo the same process again when you approach
              another intermediary." Dear Investor, if you are subscribing to an IPO, there is no need to issue a
              cheque. Please write the Bank account number and sign the IPO application form to authorize your bank to
              make payment in case of allotment. In case of non allotment the funds will remain in your bank account.
              As a business we don't give stock tips, and have not authorized anyone to trade on behalf of others. If
              you find anyone claiming to be part of Zerodha and offering such services, please{" "}
              <a href="">create a ticket here.</a>
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              *Customers availing insurance advisory services offered by Ditto (Tacterial Consulting Private Limited |
              IRDAI Registered Corporate Agent (Composite) License No CA0738) will not have access to the exchange
              investor grievance redressal forum, SEBI SCORES/ODR, or arbitration mechanism for such products.
            </p>
            <p className="text-muted lh-base mb-3" style={{ fontSize: "0.7rem", wordSpacing: "5px" }}>
              Fixed deposit products offered on this platform are third-party products (TPP) and are not Exchange traded
              products. These are offered through Blostem Fintech Private Limited. Zerodha Broking Limited (SEBI
              Registration No.: INZ000031633) is acting solely as a distributor for these products. Any disputes arising
              with respect to such distribution activity will not have access to SEBI SCORES/ODR, Exchange Investor
              Grievance Redressal Forum, or Arbitration mechanism. Fixed deposits are regulated by the Reserve Bank of
              India (RBI).
            </p>
          </div>
        </div>

        {/* Bottom links */}
        <div className="row my-4 footer-bottom-links">
          <div className="col-12">
            <div className="d-flex flex-wrap gap-3">
              <div><a href="">NSE</a></div>
              <div><a href="">BSE</a></div>
              <div><a href="">MCX</a></div>
              <div><a href="">MSEI</a></div>
              <div><a href="">Terms &amp; conditions</a></div>
              <div><a href="">Policies &amp; procedures</a></div>
              <div><a href="">Privacy policy</a></div>
              <div><a href="">Disclosure</a></div>
              <div><a href="">For investor's attention</a></div>
              <div><a href="">Investor charter</a></div>
              <div><a href="">Sitemap</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;

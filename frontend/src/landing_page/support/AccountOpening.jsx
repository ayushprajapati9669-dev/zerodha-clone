import { useState } from "react";

function AccountOpening({ icon, title, links }) {
  let [showLink, setShowLink] = useState(false);

  let showlinkInfo = (event) => {
    setShowLink(!showLink);
  };
  return (
    <>
      <div
        className="border d-flex justify-content-between align-items-center pe-3 mt-4 account-info"
        onClick={showlinkInfo}
      >
        <div className="d-flex align-items-center " style={{ height: "100%" }}>
          <div
            className="d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: "#E3F2FD",
              height: "3.2rem",
              width: "4rem",
            }}
          >
            <i className={icon}></i>
          </div>
          <h2 className="fs-5 text-muted ms-2">{title}</h2>
        </div>
        <div style={{ color: "#0D6EFD" }}>
          <i
            className={
              showLink ? "fa-solid fa-angle-up" : "fa-solid fa-angle-down"
            }
          ></i>
        </div>
      </div>
      {showLink && (
        <div
          className="p-4 border account-info"
          style={{ lineHeight: "2.5rem" }}
        >
          <ul>
            {links?.map((link, idx) => {
              return (
                <a href="">
                  {" "}
                  <li style={{ color: "#0D6EFD" }} key={idx}>
                    {link}
                  </li>
                </a>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

export default AccountOpening;

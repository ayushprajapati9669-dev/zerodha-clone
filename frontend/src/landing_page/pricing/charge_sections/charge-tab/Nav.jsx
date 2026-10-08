import { useState } from "react";
import { NavLink } from "react-router-dom";
function Nav() {
  return (
    <div className="container ">
      <div className="row border-bottom  " style={{ margin: "0 6rem" }}>
        <ul className="nav fs-4">
          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-link active-link" : "nav-link"
              }
              to="/pricing"
              end
            >
              Equity
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-link active-link" : "nav-link"
              }
              to="/pricing/currency"
            >
              Currency
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-link active-link" : "nav-link"
              }
              to="/pricing/commodity"
            >
              Commodity
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Nav;

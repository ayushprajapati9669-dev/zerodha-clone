import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Login", to: "/login" },
  { label: "About", to: "/about" },
  { label: "Products", to: "/products" },
  { label: "Pricing", to: "/pricing" },
  { label: "Support", to: "/support" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="site-nav sticky-top">
      <div className="container site-nav__inner d-flex align-items-center justify-content-between">
        <Link to="/" className="site-nav__brand" onClick={closeMenu}>
          <img src="/assets/logo.svg" alt="Zerodha home" />
        </Link>

        <button
          className="site-nav__toggle d-lg-none"
          type="button"
          aria-controls="navbarMain"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="site-nav__toggle-icon" aria-hidden="true" />
        </button>

        <div
          className={`site-nav__menu${menuOpen ? " is-open" : ""}`}
          id="navbarMain"
        >
          <ul className="navbar-nav site-nav__links">
            {navItems.map(({ label, to }) => (
              <li className="nav-item" key={to}>
                <NavLink
                  className={({ isActive }) =>
                    `site-nav__link${isActive ? " active-link" : ""}`
                  }
                  to={to}
                  onClick={closeMenu}
                >
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  `site-nav__link site-nav__link--cta${isActive ? " active-link" : ""}`
                }
                to="/signup"
                onClick={closeMenu}
              >
                Signup
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

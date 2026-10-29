import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const userRole = user?.role;

  const navLinkClass = ({ isActive }) =>
    isActive ? "active" : "";

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          RealEstate AI
        </Link>

        {/* ==================== */}
        {/* DESKTOP NAV LINKS */}
        {/* ==================== */}

        <div className="nav-links">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>

          <NavLink to="/properties" className={navLinkClass}>
            Properties
          </NavLink>

          <NavLink to="/questions" className={navLinkClass}>
            Q&A
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>

              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          ) : (
            <>
              {/* USER */}
              {userRole === "USER" && (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>

                  <NavLink to="/bookmarks" className={navLinkClass}>
                    Bookmarks
                  </NavLink>

                  <NavLink to="/inquiries" className={navLinkClass}>
                    My Inquiries
                  </NavLink>
                </>
              )}

              {/* AGENT */}
              {userRole === "AGENT" && (
                <>
                  <NavLink to="/agent-dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>

                  <NavLink to="/my-properties" className={navLinkClass}>
                    My Properties
                  </NavLink>

                  <NavLink to="/received-inquiries" className={navLinkClass}>
                    Received Inquiries
                  </NavLink>
                </>
              )}

              {/* ADMIN */}
              {userRole === "ADMIN" && (
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
              )}

              <span className="welcome-user">
                Hi, {user?.username}
              </span>

              <button
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* ==================== */}
        {/* MOBILE HAMBURGER */}
        {/* ==================== */}

        <button
          className={`nav-toggle${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* ==================== */}
        {/* MOBILE DROPDOWN MENU */}
        {/* ==================== */}

        {menuOpen && (
          <div className="nav-mobile-menu open">

            <Link to="/" onClick={closeMenu}>
              Home
            </Link>

            <Link to="/properties" onClick={closeMenu}>
              Properties
            </Link>

            <Link to="/questions" onClick={closeMenu}>
              Q&A
            </Link>

            {!isAuthenticated ? (
              <>
                <div className="nav-mobile-divider"></div>

                <Link to="/login" onClick={closeMenu}>
                  Login
                </Link>

                <Link to="/register" onClick={closeMenu}>
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className="nav-mobile-divider"></div>

                {/* USER */}
                {userRole === "USER" && (
                  <>
                    <Link to="/dashboard" onClick={closeMenu}>
                      Dashboard
                    </Link>

                    <Link to="/bookmarks" onClick={closeMenu}>
                      Bookmarks
                    </Link>

                    <Link to="/inquiries" onClick={closeMenu}>
                      My Inquiries
                    </Link>
                  </>
                )}

                {/* AGENT */}
                {userRole === "AGENT" && (
                  <>
                    <Link to="/agent-dashboard" onClick={closeMenu}>
                      Dashboard
                    </Link>

                    <Link to="/my-properties" onClick={closeMenu}>
                      My Properties
                    </Link>

                    <Link to="/received-inquiries" onClick={closeMenu}>
                      Received Inquiries
                    </Link>
                  </>
                )}

                {/* ADMIN */}
                {userRole === "ADMIN" && (
                  <Link to="/dashboard" onClick={closeMenu}>
                    Dashboard
                  </Link>
                )}

                <div className="nav-mobile-divider"></div>

                <span className="welcome-user">
                  Hi, {user?.username}
                </span>

                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole = user?.role;

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <Link to="/" className="logo">
          RealEstate AI
        </Link>

        <div className="nav-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/properties">
            Properties
          </Link>

          {!isAuthenticated ? (
            <>
              <Link to="/login">
                Login
              </Link>

              <Link to="/register">
                Register
              </Link>
            </>
          ) : (
            <>
              {/* ==================== */}
              {/* USER */}
              {/* ==================== */}

              {userRole === "USER" && (
                <>
                  <Link to="/dashboard">
                    Dashboard
                  </Link>

                  <Link to="/bookmarks">
                    Bookmarks
                  </Link>

                  <Link to="/inquiries">
                    My Inquiries
                  </Link>
                </>
              )}


              {/* ==================== */}
              {/* AGENT */}
              {/* ==================== */}

              {userRole === "AGENT" && (
                <>
                  <Link to="/agent-dashboard">
                    Dashboard
                  </Link>

                  <Link to="/my-properties">
                    My Properties
                  </Link>

                  <Link to="/received-inquiries">
                    Received Inquiries
                  </Link>
                </>
              )}


              {/* ==================== */}
              {/* ADMIN */}
              {/* ==================== */}

              {userRole === "ADMIN" && (
                <Link to="/dashboard">
                  Dashboard
                </Link>
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
      </div>
    </nav>
  );
}

export default Navbar;
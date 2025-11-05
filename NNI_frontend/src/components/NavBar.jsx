import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogout = () => {
    try {
      auth.logout("/");
    } catch (e) {}
    navigate("/");
  };

  return (
    <header>
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo">
            LET'SPREAD
          </Link>
          <div className="search-box">
            <input
              type="text"
              placeholder="Sign Up for Our Paris Olympics Newsletter"
            />
            <button>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <nav>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Home
          </NavLink>
          <NavLink
            to="/join"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Join Us
          </NavLink>
          <NavLink
            to="/customer-care"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Customer Care
          </NavLink>
          <NavLink
            to="/reach-out"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Reach Out
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            About Us
          </NavLink>
          <button className="subscribe-button">Subscribe</button>
          {auth?.user?.role === "ADMIN" && (
            <NavLink
              to="/cms"
              className={({ isActive }) =>
                `subscribe-button cms-button ${isActive ? "active" : ""}`
              }
            >
              CMS
            </NavLink>
          )}

          {auth?.isAuthenticated ? (
            <>
              <span className="nav-user">
                {auth.user?.name || auth.user?.email}
              </span>
              <button
                className="subscribe-button login-button"
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `subscribe-button login-button ${isActive ? "active" : ""}`
              }
              aria-label="Login"
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

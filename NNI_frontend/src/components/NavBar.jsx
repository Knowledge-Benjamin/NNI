import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    try {
      auth.logout("/");
    } catch (e) {}
    navigate("/");
  };

  function handleNavClick() {
    // close mobile menu when a nav link is used
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <header>
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo" onClick={handleNavClick}>
            NNI
          </Link>
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (searchTerm || "").trim();
              // navigate to home with search param; ArticlesView will handle it
              navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
              // collapse mobile menu if open
              if (mobileOpen) setMobileOpen(false);
            }}
          >
            <input
              type="text"
              placeholder="Search articles"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search articles"
            />
            <button type="submit" aria-label="Search">
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
          </form>
        </div>

        {/* Hamburger for small screens */}
        <button
          className={`hamburger ${mobileOpen ? "open" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((s) => !s)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={mobileOpen ? "mobile-open" : ""}>
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
            onClick={handleNavClick}
          >
            Home
          </NavLink>
          <NavLink
            to="/join"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Join Us
          </NavLink>
          <NavLink
            to="/customer-care"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Customer Care
          </NavLink>
          <NavLink
            to="/reach-out"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Reach Out
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            About Us
          </NavLink>
          <button
            className="subscribe-button"
            onClick={() => {
              // open newsletter modal globally
              window.dispatchEvent(new Event("open-newsletter"));
              handleNavClick();
            }}
          >
            Subscribe
          </button>
          {auth?.user?.role === "ADMIN" && (
            <NavLink
              to="/cms"
              className={({ isActive }) =>
                `subscribe-button cms-button ${isActive ? "active" : ""}`
              }
              onClick={handleNavClick}
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
                onClick={() => {
                  handleLogout();
                  handleNavClick();
                }}
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
              onClick={handleNavClick}
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

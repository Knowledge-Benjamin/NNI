import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function SideNav({ initialCollapsed = false, onNavigate }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function handleNavClick() {
    if (onNavigate) onNavigate();
  }

  return (
    <aside className={`sidenav ${collapsed ? "collapsed" : ""}`} aria-label="Admin sidebar">
      <div className="sidenav-inner">
        <button
          className="sidenav-toggle"
          onClick={() => setCollapsed((s) => !s)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "➤" : "⬅"}
        </button>

        <nav className="sidenav-nav">
          <NavLink to="/cms" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            CMS
          </NavLink>
          <NavLink to="/dashboard/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            Users Management
          </NavLink>
          <NavLink to="/dashboard/posts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            Posts
          </NavLink>
          <NavLink to="/dashboard/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            Site Settings
          </NavLink>
          <NavLink to="/dashboard/profile" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            Profile
          </NavLink>
          <NavLink to="/dashboard/media" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            Media
          </NavLink>
          <NavLink to="/dashboard/analytics" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={handleNavClick}>
            Analytics
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}

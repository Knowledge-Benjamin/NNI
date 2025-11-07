import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import SideNav from "../components/SideNav";
import ProtectedRoute from "../components/ProtectedRoute";

function Overview() {
  return (
    <div className="dashboard-overview">
      <h2>Overview</h2>
      <div className="dashboard-cards">
        <div className="card">Users: —</div>
        <div className="card">Posts: —</div>
        <div className="card">Subscribers: —</div>
      </div>
      <section className="dashboard-section">
        <h3>Quick Links</h3>
        <div className="quick-links">
          <Link to="/cms" className="subscribe-button">
            Open CMS
          </Link>
          <Link to="/dashboard/users" className="subscribe-button">
            Manage Users
          </Link>
        </div>
      </section>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="dashboard-placeholder">
      <h2>{title}</h2>
      <p>Coming soon — you can manage {title.toLowerCase()} here.</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="dashboard-layout">
        <SideNav />
        <div className="dashboard-main">
          <Routes>
            <Route index element={<Overview />} />
            <Route
              path="users"
              element={<Placeholder title="Users Management" />}
            />
            <Route path="posts" element={<Placeholder title="Posts" />} />
            <Route
              path="settings"
              element={<Placeholder title="Site Settings" />}
            />
            <Route path="profile" element={<Placeholder title="Profile" />} />
            <Route path="media" element={<Placeholder title="Media" />} />
            <Route
              path="analytics"
              element={<Placeholder title="Analytics" />}
            />
          </Routes>
        </div>
      </div>
    </ProtectedRoute>
  );
}

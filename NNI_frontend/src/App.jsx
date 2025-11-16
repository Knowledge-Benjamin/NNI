import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
// We intentionally avoid react-helmet packages to prevent peer-dependency issues
// with React 19. Instead we programmatically set the canonical link in a
// useEffect below.
// import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ArticleView from "./pages/ArticleView";
import CMS from "./pages/CMS";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import NewsletterModal from "./components/NewsletterModal";
// import Login from "./pages/Login";
// import Admin from "./pages/Admin";
// import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "light";
    } catch (e) {
      return "light";
    }
  });

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem("theme", theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const location = useLocation();

  useEffect(() => {
    try {
      const href = `https://www.nni.news${location.pathname}`;
      let link = document.querySelector("link[rel='canonical']");
      if (link) {
        link.setAttribute("href", href);
      } else {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        link.setAttribute("href", href);
        document.head.appendChild(link);
      }
    } catch (e) {
      // ignore DOM exceptions in non-browser environments
    }
  }, [location.pathname]);

  return (
    <div className="container">
      <NavBar
        theme={theme}
        toggleTheme={toggleTheme}
        showLogout={location.pathname === "/login"}
      />
      <NewsletterModal />
      <main style={{ marginTop: "1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={<Login theme={theme} toggleTheme={toggleTheme} />}
          />
          <Route path="/article/:slug" element={<ArticleView />} />
          <Route
            path="/cms"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <CMS />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

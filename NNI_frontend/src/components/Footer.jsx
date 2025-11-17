import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-col footer-brand">
          <div className="logo">NNI</div>
          <p className="footer-tag">
            Reliable reporting. Thoughtful perspective.
          </p>
        </div>

        <div className="footer-col footer-links">
          <h4>Explore</h4>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/articles">Articles</Link>
            <Link to="/about">About Us</Link>
            <Link to="/reach-out">Reach Out</Link>
          </nav>
        </div>

        <div className="footer-col footer-help">
          <h4>Support</h4>
          <nav>
            <Link to="/join">Join Us</Link>
            <Link to="/customer-care">Customer Care</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
        </div>

        {/* Removed newsletter signup form for a cleaner footer UX on mobile */}
        <div className="footer-col footer-contact">
          <h4>Contact</h4>
          <p className="muted">
            Have a question or story idea? We'd love to hear from you.
          </p>
          <nav>
            <Link to="/reach-out">Get in touch</Link>
            <a href="mailto:hello@nni.example">hello@nni.example</a>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <small>© {new Date().getFullYear()} NNI — All rights reserved.</small>
        </div>
        <div className="footer-bottom-right">
          <nav className="socials" aria-label="Social links">
            <a href="#" aria-label="Twitter" rel="noopener noreferrer">
              Twitter
            </a>
            <a href="#" aria-label="Instagram" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="#" aria-label="LinkedIn" rel="noopener noreferrer">
              LinkedIn
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

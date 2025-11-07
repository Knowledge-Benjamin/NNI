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

        <div className="footer-col footer-newsletter">
          <h4>Stay informed</h4>
          <p className="muted">
            Subscribe to our newsletter for curated stories.
          </p>
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const input = form.querySelector("input[name=email]");
              // simple client-side feedback
              if (input && input.value) {
                alert(`Thanks — we'll send updates to ${input.value}`);
                input.value = "";
              }
            }}
          >
            <input
              name="email"
              type="email"
              placeholder="Your email address"
              aria-label="Email for newsletter"
            />
            <button className="subscribe-button" type="submit">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
            <small>
            © {new Date().getFullYear()} NNI — All rights reserved.
          </small>
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

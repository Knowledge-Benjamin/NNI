import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Simple sanitizers
function sanitizeText(s) {
  if (!s) return "";
  // remove tags and control characters, collapse whitespace
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEmail(email) {
  if (!email) return false;
  // Basic RFC-like check (not exhaustive)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const ref = useRef(null);
  const okRef = useRef(null);
  const lastSubmitRef = useRef(0);

  const auth = useAuth();

  useEffect(() => {
    function onOpen() {
      setExiting(false);
      setOpen(true);
      setStatus("idle");
      // Prefill fields for authenticated users
      try {
        const a = auth;
        if (a && a.user) {
          const name = a.user.name || "";
          const parts = name.trim().split(/\s+/);
          setFirstName(parts.shift() || "");
          setLastName(parts.join(" ") || "");
          setEmail(a.user.email || "");
        }
      } catch (e) {}
      // focus the first input after open
      setTimeout(() => {
        if (ref.current) {
          const input = ref.current.querySelector("input[name=firstName]");
          if (input) input.focus();
        }
      }, 120);
    }

    window.addEventListener("open-newsletter", onOpen);
    return () => window.removeEventListener("open-newsletter", onOpen);
  }, []);

  // close with exit animation
  const close = () => {
    setExiting(true);
    setTimeout(() => {
      setOpen(false);
      setExiting(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fn = sanitizeText(firstName);
    const ln = sanitizeText(lastName);
    const em = sanitizeText(email).toLowerCase();
    // Basic validations
    if (!fn || !ln) {
      setErrorMessage("Please enter your full name (first and last).");
      return;
    }
    if (!isValidEmail(em)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // debounce / prevent double submits: require 5s gap
    const now = Date.now();
    if (now - lastSubmitRef.current < 5000) {
      setErrorMessage("Please wait a moment before submitting again.");
      return;
    }
    lastSubmitRef.current = now;

    setErrorMessage("");
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: fn, lastName: ln, email: em }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && data.error) || "Failed to subscribe. Try again later.";
        setErrorMessage(msg);
        setStatus("idle");
        return;
      }

      setStatus("success");
      // keep modal open on success; user will close with OK or the close button
      // focus the OK button for keyboard users
      setTimeout(() => {
        if (okRef.current) okRef.current.focus();
      }, 120);
    } catch (err) {
      console.error("Newsletter submit error:", err);
      setErrorMessage("Network error. Please try again later.");
      setStatus("idle");
    }
  };

  if (!open) return null;

  return (
    <div
      className={`nn-modal-overlay ${exiting ? "exiting" : "entering"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
    >
      <div className="nn-modal-backdrop" />
      <div className={`nn-modal ${exiting ? "nn-exit" : "nn-enter"}`} ref={ref}>
        <button className="nn-close" onClick={close} aria-label="Close">
          ×
        </button>
        <h2>Subscribe to NNI</h2>
        <p className="nn-sub">
          Get weekly updates — no spam. Unsubscribe anytime.
        </p>
        <form onSubmit={handleSubmit} className="nn-form">
          <div className="nn-row">
            <input
              name="firstName"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="nn-row">
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!auth?.user}
            />
          </div>

          <div className="nn-actions">
            {status !== "success" ? (
              <>
                <button
                  type="submit"
                  className="subscribe-button"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Submitting..." : "Subscribe"}
                </button>
                <button type="button" className="nn-cancel" onClick={close}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="subscribe-ok"
                  onClick={close}
                  ref={okRef}
                >
                  OK
                </button>
                <button type="button" className="nn-cancel" onClick={close}>
                  Close
                </button>
              </>
            )}
          </div>

          <div className="nn-message" aria-live="polite">
            {errorMessage && <div className="nn-error">{errorMessage}</div>}
            {status === "success" && (
              <div className="nn-success">Thanks — check your inbox!</div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

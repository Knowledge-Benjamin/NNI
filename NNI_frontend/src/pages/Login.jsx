import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      if (mode === "signup") {
        await auth.register({ name, email, password });
      } else {
        await auth.login({ email, password });
      }
      // on success redirect to home
      navigate("/");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card" role="region" aria-label="Authentication">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to continue to NNI</p>
          </div>

          <div className="auth-toggle">
            <button
              className={`tab ${mode === "signin" ? "active" : ""}`}
              onClick={() => setMode("signin")}
              aria-pressed={mode === "signin"}
            >
              Sign in
            </button>
            <button
              className={`tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => setMode("signup")}
              aria-pressed={mode === "signup"}
            >
              Sign up
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            aria-live="polite"
          >
            {mode === "signup" && (
              <label className="field">
                <span className="label">Full name</span>
                <input
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  className="input"
                />
              </label>
            )}

            <label className="field">
              <span className="label">Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@domain.com"
                className="input"
                required
              />
            </label>

            <label className="field">
              <span className="label">Password</span>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                className="input"
                required
              />
            </label>

            <div className="auth-row">
              <label className="checkbox-inline">
                <input type="checkbox" /> Remember me
              </label>
              <a className="link muted" href="#forgot">
                Forgot password?
              </a>
            </div>

            <div className="auth-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading
                  ? mode === "signin"
                    ? "Signing in..."
                    : "Creating..."
                  : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin"
                  ? "Create an account"
                  : "Already have an account?"}
              </button>
            </div>

            {error && (
              <div role="alert" className="auth-error">
                {error}
              </div>
            )}

            <div className="divider">or continue with</div>

            <div className="socials">
              <button type="button" className="btn btn-social">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M21.6 12.227c0-.79-.07-1.552-.203-2.276H12v4.14h5.44c-.234 1.26-.945 2.333-2.02 3.056v2.536h3.26c1.9-1.748 2.9-4.33 2.9-7.456z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 22c2.7 0 4.976-.9 6.635-2.444l-3.26-2.536c-.91.61-2.08.972-3.375.972-2.6 0-4.806-1.754-5.592-4.108H2.95v2.58C4.6 19.86 8 22 12 22z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.408 13.884a6.002 6.002 0 010-3.768V7.536H2.95A9.997 9.997 0 002 12c0 1.6.378 3.12 1.05 4.464l3.358-2.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 6.1c1.47 0 2.8.508 3.847 1.506l2.882-2.882C16.972 2.99 14.7 2 12 2 8 2 4.6 4.14 2.95 7.536l3.458 2.58C7.194 7.854 9.4 6.1 12 6.1z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

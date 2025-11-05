import React from "react";

function LoginForm({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <h2
          className="text-center"
          style={{ fontSize: "1.8rem", marginBottom: "1.5rem" }}
        >
          NNI CMS Login
        </h2>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p
          className="text-center mt-4"
          style={{ fontSize: "0.9rem", color: "#666" }}
        >
          Use: <strong>admin@nni.com</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;

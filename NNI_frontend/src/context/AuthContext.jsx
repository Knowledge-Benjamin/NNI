import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      }
    } catch (e) {
      console.warn("Failed to read auth from storage", e);
    }
  }, []);

  useEffect(() => {
    const payload = { user, token };
    try {
      if (user && token) {
        localStorage.setItem("auth", JSON.stringify(payload));
      } else {
        localStorage.removeItem("auth");
      }
    } catch (e) {}
  }, [user, token]);

  async function login({ email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Login failed");
    setUser(json.user || null);
    setToken(json.token || null);
    return json;
  }

  async function register({ name, email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Registration failed");
    setUser(json.user || null);
    setToken(json.token || null);
    return json;
  }

  function logout(redirect = "/") {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("auth");
    } catch (e) {}
    navigate(redirect);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;

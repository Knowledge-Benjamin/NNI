import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // redirect to login, preserving the attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const role = user?.role || null;
    // only allow exact match or array membership
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(role)) return <Navigate to="/" replace />;
    } else {
      if (role !== requiredRole) return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

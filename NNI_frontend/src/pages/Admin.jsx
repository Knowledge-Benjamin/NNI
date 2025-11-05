import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CreateArticleForm from "../components/CreateArticleForm";

export default function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Content Management</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <CreateArticleForm />
    </div>
  );
}

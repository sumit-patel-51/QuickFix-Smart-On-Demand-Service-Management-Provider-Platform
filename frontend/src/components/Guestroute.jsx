// PATH: src/components/GuestRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";

function GuestRoute({ children }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  const savedRole = localStorage.getItem("role");

  // ==========================================
  // NOT LOGGED IN - Show the page
  // ==========================================

  if (!token || !userData) {
    return children;
  }

  // ==========================================
  // PARSE USER
  // ==========================================

  let user;

  try {
    user = JSON.parse(userData);
  } catch (error) {
    console.error("Invalid user data");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return children;
  }

  // ==========================================
  // ROLE
  // ==========================================

  const userRole = user?.role || savedRole;

  // ==========================================
  // STATUS
  // ==========================================

  if (
    user?.status &&
    user.status !== "active"
  ) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return children;
  }

  // ==========================================
  // REDIRECT BASED ON ROLE
  // ==========================================

  // ADMIN
  if (userRole === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // PROVIDER
  if (userRole === "provider") {
    return (
      <Navigate
        to="/provider/dashboard"
        replace
      />
    );
  }

  // CUSTOMER / USER
  if (
    userRole === "customer" ||
    userRole === "user"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // Fallback - if role is unknown, show the page
  return children;
}

export default GuestRoute;
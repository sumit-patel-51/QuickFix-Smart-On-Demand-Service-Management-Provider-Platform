// PATH: src/components/ProtectedRoute.jsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  const savedRole = localStorage.getItem("role");

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!token || !userData) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // ==========================================
  // PARSE USER
  // ==========================================

  let user;

  try {
    user = JSON.parse(userData);
  } catch (error) {
    console.error("Invalid user data:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // ROLE
  // ==========================================

  const userRole = user?.role || savedRole;

  // ==========================================
  // ROLE NOT FOUND
  // ==========================================

  if (!userRole) {
    console.error("User role not found");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // ACCOUNT STATUS
  // ==========================================

  if (
    user?.status &&
    user.status !== "active"
  ) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // ADMIN - Allow admin to access all routes
  // ==========================================

  if (userRole === "admin") {
    // Admin can access any protected route
    return children;
  }

  // ==========================================
  // ROLE CHECK FOR NON-ADMIN USERS
  // ==========================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    console.log(
      "Access denied:",
      userRole,
      "Allowed:",
      allowedRoles
    );

    // Provider
    if (userRole === "provider") {
      return (
        <Navigate
          to="/provider/dashboard"
          replace
        />
      );
    }

    // Customer
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

    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // ALLOWED
  // ==========================================

  return children;
}

export default ProtectedRoute;
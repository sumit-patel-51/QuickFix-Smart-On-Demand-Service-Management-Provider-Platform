import React from "react";
import { Navigate } from "react-router-dom";

function ProviderGuestRoute({ children }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // ==========================================
  // NOT LOGGED IN
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return children;
  }

  // ==========================================
  // ONLY PROVIDER
  // ==========================================

  if (user?.role === "provider") {

    // Approved provider
    if (
      user?.verification_status === "approved"
    ) {
      return (
        <Navigate
          to="/provider/dashboard"
          replace
        />
      );
    }

    // If verification status is not available
    // dashboard will handle verification state
    return (
      <Navigate
        to="/provider/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProviderGuestRoute;
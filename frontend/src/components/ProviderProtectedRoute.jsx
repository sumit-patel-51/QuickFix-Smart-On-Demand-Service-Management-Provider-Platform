import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/axios";

function ProviderProtectedRoute({
  children,
  allowUnverified = false,
}) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    checkProviderAccess();
  }, []);

  const checkProviderAccess = async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!token || !userData) {
      setRedirectPath("/provider/login");
      setLoading(false);
      return;
    }

    // =====================================================
    // PARSE USER
    // =====================================================

    let user;

    try {
      user = JSON.parse(userData);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setRedirectPath("/provider/login");
      setLoading(false);
      return;
    }

    // =====================================================
    // PROVIDER ROLE CHECK
    // =====================================================

    if (user?.role !== "provider") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setRedirectPath("/provider/login");
      setLoading(false);
      return;
    }

    // =====================================================
    // USER ACCOUNT STATUS
    // =====================================================

    if (user?.status && user.status !== "active") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setRedirectPath("/provider/login");
      setLoading(false);
      return;
    }

    // =====================================================
    // IF UNVERIFIED ROUTES ARE ALLOWED
    // =====================================================

    if (allowUnverified) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    // =====================================================
    // GET LATEST PROVIDER PROFILE
    // =====================================================

    try {
      const response = await api.get("/provider/profile");

      const provider =
        response.data?.data?.provider ||
        response.data?.data ||
        response.data?.provider;

      // ===================================================
      // NO PROVIDER DATA
      // ===================================================

      if (!provider) {
        setRedirectPath("/provider/setup");
        setLoading(false);
        return;
      }

      const verificationStatus =
        provider.verification_status || "pending";

      // ===================================================
      // APPROVED
      // ===================================================

      if (verificationStatus === "approved") {
        setAllowed(true);

        // Update localStorage with latest verification data
        const updatedUser = {
          ...user,
          verification_status: "approved",
          is_verified: true,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        setLoading(false);
        return;
      }

      // ===================================================
      // REJECTED
      // ===================================================

      if (verificationStatus === "rejected") {
        setRedirectPath("/provider/verification");
        setLoading(false);
        return;
      }

      // ===================================================
      // PENDING
      // ===================================================

      setRedirectPath("/provider/verification");
      setLoading(false);

    } catch (error) {
      console.error(
        "Provider verification check error:",
        error
      );

      // If profile cannot be loaded, send provider
      // to verification page instead of dashboard.
      setRedirectPath("/provider/verification");
      setLoading(false);
    }
  };

  // =======================================================
  // LOADING SCREEN
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">

          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>

          <h3 className="text-lg font-semibold text-slate-800">
            Checking Provider Verification
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Please wait...
          </p>

        </div>
      </div>
    );
  }

  // =======================================================
  // REDIRECT
  // =======================================================

  if (redirectPath) {
    return (
      <Navigate
        to={redirectPath}
        state={{
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // =======================================================
  // ALLOWED
  // =======================================================

  if (allowed) {
    return children;
  }

  return null;
}

export default ProviderProtectedRoute;


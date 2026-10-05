import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ShieldAlert,
  FileCheck,
  PhoneCall,
  Mail,
  RefreshCw,
  LogOut,
  Sparkles,
  XCircle,
  AlertTriangle,
  Upload,
} from "lucide-react";

import api from "../../api/axios";

const ProviderVerificationPending = () => {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({});
  const [provider, setProvider] = useState(null);

  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setUser(storedUser);
    } catch {
      setUser({});
    }

    fetchProviderStatus();
  }, []);

  // =========================================================
  // FETCH PROVIDER STATUS
  // =========================================================

  const fetchProviderStatus = async () => {
    try {
      setLoading(true);

      const response = await api.get("/provider/profile");

      console.log("Provider profile:", response.data);

      const providerData =
        response.data?.data?.provider ||
        response.data?.data ||
        response.data?.provider;

      if (!providerData) {
        console.error("Provider data not found");
        return;
      }

      setProvider(providerData);

      // =====================================================
      // APPROVED
      // =====================================================

      if (
        providerData.verification_status === "approved" ||
        providerData.status === "approved" ||
        providerData.is_verified === true
      ) {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        const updatedUser = {
          ...storedUser,
          is_verified: true,
          verification_status: "approved",
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        navigate("/provider/dashboard", {
          replace: true,
        });
      }

      // =====================================================
      // PENDING
      // =====================================================

      if (
        providerData.verification_status === "pending"
      ) {
        console.log("Provider verification is pending");
      }

      // =====================================================
      // REJECTED
      // =====================================================

      if (
        providerData.verification_status === "rejected"
      ) {
        console.log(
          "Provider verification rejected"
        );
      }
    } catch (error) {
      console.error(
        "Provider status fetch failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefreshStatus = async () => {
    setChecking(true);

    try {
      await fetchProviderStatus();
    } finally {
      setTimeout(() => {
        setChecking(false);
      }, 600);
    }
  };

  // =========================================================
  // UPDATE DOCUMENTS
  // =========================================================

  const handleUpdateDocuments = () => {
    navigate("/provider/documents/edit");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("provider");
    localStorage.removeItem("role");
    localStorage.removeItem("remember");

    window.location.href = "/provider/login";
  };

  // =========================================================
  // STATUS
  // =========================================================

  const status =
    provider?.verification_status ||
    provider?.status ||
    "pending";

  const rejectionReason =
    provider?.rejection_reason || "";

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading verification status...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // REJECTED
  // =========================================================

  if (status === "rejected") {
    return (
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto flex w-full max-w-lg flex-col items-center">

          {/* BRAND */}

          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-sm font-bold text-white shadow-sm">
              S
            </div>

            <span className="text-base font-bold tracking-tight text-slate-900">
              Service<span className="text-blue-600">
                Hub
              </span>
            </span>
          </div>

          {/* CARD */}

          <div className="w-full rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-8">

            {/* REJECTION ICON */}

            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/60">

              <XCircle
                className="h-10 w-10"
                strokeWidth={2}
              />

              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white ring-2 ring-white">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>

            </div>

            {/* HEADING */}

            <div className="text-center">

              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Verification Rejected
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">

                Hello{" "}

                <span className="font-semibold text-slate-700">
                  {user?.name || "Partner"}
                </span>
                , your provider verification request
                was rejected by the administrator.

              </p>

            </div>

            {/* REJECTION REASON */}

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">

              <div className="flex items-start gap-3">

                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                <div className="min-w-0">

                  <p className="text-sm font-semibold text-red-800">
                    Admin's Reason
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {rejectionReason ||
                      "Your verification request was rejected. Please update your documents and submit them again."}
                  </p>

                </div>

              </div>

            </div>

            {/* STATUS */}

            <div className="mt-6 rounded-xl border border-red-100 bg-red-50/50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Verification Status
              </p>

              <div className="mt-3 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>

                <div>

                  <p className="text-sm font-semibold text-red-800">
                    Verification Rejected
                  </p>

                  <p className="text-xs text-red-500">
                    Please update the required documents.
                  </p>

                </div>

              </div>

            </div>

            {/* IMPORTANT MESSAGE */}

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <div className="flex items-start gap-3">

                <Upload className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>

                  <p className="text-sm font-semibold text-amber-800">
                    Update your documents
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    You do not need to create a new account.
                    Update your existing documents and
                    submit them for verification again.
                  </p>

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-6 space-y-2.5">

              {/* UPDATE DOCUMENTS */}

              <button
                type="button"
                onClick={handleUpdateDocuments}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 active:scale-[0.99]"
              >
                <Upload className="h-4 w-4" />

                Update Documents & Re-submit
              </button>

              {/* CHECK STATUS */}

              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={checking}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <RefreshCw
                  className={`h-4 w-4 ${
                    checking ? "animate-spin" : ""
                  }`}
                />

                {checking
                  ? "Checking Status..."
                  : "Check Status Again"}

              </button>

              {/* LOGOUT */}

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >

                <LogOut className="h-4 w-4 text-slate-500" />

                Sign Out

              </button>

            </div>

            {/* SUPPORT */}

            <div className="mt-6 border-t border-slate-100 pt-4 text-center">

              <p className="text-xs text-slate-400">
                Need help with your verification?
              </p>

              <div className="mt-2 flex items-center justify-center gap-4 text-xs font-medium text-slate-600">

                <a
                  href="mailto:support@servicehub.com"
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  Email Support
                </a>

                <span className="text-slate-300">
                  •
                </span>

                <a
                  href="tel:+911800123456"
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />
                  Call Desk
                </a>

              </div>

            </div>

          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            ServiceHub Partner Portal • All rights reserved
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // PENDING
  // =========================================================

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-50/70 px-3.5 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto flex w-full max-w-lg flex-col items-center">

        {/* BRAND */}

        <div className="mb-6 flex items-center gap-2 select-none">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-sm font-bold text-white shadow-sm shadow-blue-500/20">
            S
          </div>

          <span className="text-base font-bold tracking-tight text-slate-900">
            Service<span className="text-blue-600">
              Hub
            </span>
          </span>

        </div>

        {/* CARD */}

        <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">

          {/* ICON */}

          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/60 sm:h-20 sm:w-20">

            <Clock
              className="h-8 w-8 animate-pulse sm:h-10 sm:w-10"
              strokeWidth={2}
            />

            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white shadow-sm">

              <ShieldAlert className="h-3.5 w-3.5" />

            </span>

          </div>

          {/* HEADING */}

          <div className="text-center">

            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">
              Verification in Progress
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">

              Hello{" "}

              <span className="font-semibold text-slate-700">
                {user?.name || "Partner"}
              </span>

              ! Your provider account and submitted
              documents are currently under review.

            </p>

          </div>

          {/* TIMELINE */}

          <div className="mt-6 space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">

            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Review Pipeline
            </span>

            {/* STEP 1 */}

            <div className="flex items-center gap-3">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FileCheck className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-semibold text-slate-800">
                  Documents Submitted
                </p>

                <p className="text-[11px] text-slate-400">
                  Documents successfully received
                </p>

              </div>

            </div>

            {/* STEP 2 */}

            <div className="flex items-center gap-3">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-semibold text-slate-800">
                  Admin Verification
                </p>

                <p className="text-[11px] text-slate-400">
                  Usually takes 24 to 48 business hours
                </p>

              </div>

            </div>

            {/* STEP 3 */}

            <div className="flex items-center gap-3 opacity-50">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-semibold text-slate-800">
                  Account Activation
                </p>

                <p className="text-[11px] text-slate-400">
                  Start accepting customer service requests
                </p>

              </div>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="mt-6 space-y-2.5">

            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={checking}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >

              <RefreshCw
                className={`h-4 w-4 ${
                  checking ? "animate-spin" : ""
                }`}
              />

              <span>
                {checking
                  ? "Checking Approval Status..."
                  : "Check Status Now"}
              </span>

            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] sm:text-sm"
            >

              <LogOut className="h-4 w-4 text-slate-500" />

              <span>Sign Out</span>

            </button>

          </div>

          {/* SUPPORT */}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">

            <p className="text-xs text-slate-400">
              Need urgent assistance with your onboarding?
            </p>

            <div className="mt-2 flex items-center justify-center gap-4 text-xs font-medium text-slate-600">

              <a
                href="mailto:support@servicehub.com"
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                Email Support
              </a>

              <span className="text-slate-300">
                •
              </span>

              <a
                href="tel:+911800123456"
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />
                Call Desk
              </a>

            </div>

          </div>

        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          ServiceHub Partner Onboarding • All rights reserved
        </p>

      </div>

    </main>
  );
};

export default ProviderVerificationPending;
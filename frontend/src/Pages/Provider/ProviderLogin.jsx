import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "../../api/axios";

const ProviderLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password show/hide
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (error) setError("");
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    setFieldErrors({
      email: "",
      password: "",
    });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/provider/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.data.success) {
        const {
          token,
          user,
          verification_status,
        } = response.data.data;

        // Ensure this user has the provider role
        if (user.role !== "provider") {
          setError(
            "This account is not registered as a service provider."
          );

          setLoading(false);
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        localStorage.setItem("role", user.role);

        window.dispatchEvent(
          new Event("userUpdated")
        );

        if (verification_status === "approved") {
          navigate("/provider/dashboard");
        } else {
          navigate("/provider/verification");
        }
      }
    } catch (err) {
      console.error("Provider login error:", err);

      const responseData = err.response?.data;

      // Handle Laravel validation errors
      if (responseData?.errors) {
        const backendFieldErrors = {};

        Object.keys(responseData.errors).forEach((key) => {
          backendFieldErrors[key] = Array.isArray(
            responseData.errors[key]
          )
            ? responseData.errors[key][0]
            : responseData.errors[key];
        });

        setFieldErrors((prev) => ({
          ...prev,
          ...backendFieldErrors,
        }));

        setError(
          responseData.message ||
            "Please fix the validation errors below."
        );
      } else {
        setError(
          responseData?.message ||
            "Unable to sign in. Please verify your credentials and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ================================= */}
        {/* LEFT SIDE                         */}
        {/* ================================= */}

        <div className="hidden border-r border-sky-100 bg-gradient-to-br from-blue-50/80 via-sky-100/70 to-slate-50 p-12 lg:flex lg:flex-col lg:justify-between">

          <div>

            <div className="flex items-center gap-2.5">

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm shadow-blue-500/30">
                Q
              </div>

              <span className="text-xl font-bold tracking-tight text-slate-900">
                Quick<span className="text-blue-600">Service</span>
              </span>

            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700 shadow-xs">
              <Briefcase size={13} className="text-blue-600" />
              Service Provider Portal
            </span>

          </div>

          <div className="max-w-md">

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Welcome back, Provider.
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Manage incoming customer requests, navigate
              doorstep routes, and grow your service business
              effortlessly.
            </p>

          </div>

          <p className="text-xs font-medium text-slate-400">
            © 2026 QuickService. All rights reserved.
          </p>

        </div>

        {/* ================================= */}
        {/* RIGHT SIDE                        */}
        {/* ================================= */}

        <div className="flex items-center justify-center px-5 py-10 sm:px-8">

          <div className="w-full max-w-md">

            {/* Mobile Header */}

            <div className="mb-8 lg:hidden">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white shadow-xs shadow-blue-500/30">
                  Q
                </div>

                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Quick<span className="text-blue-600">Service</span>
                </span>

              </div>

              <p className="mt-2 text-xs font-semibold text-blue-600">
                Provider Portal
              </p>

            </div>

            {/* Heading */}

            <div className="mb-6">

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Provider Sign In
              </h2>

              <p className="mt-1.5 text-xs text-slate-500">
                Sign in to manage your bookings and view active
                requests.
              </p>

            </div>

            {/* Backend General Error */}

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-medium text-rose-600">

                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>

              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
            >

              {/* Email */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Email Address{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={`h-11 w-full rounded-xl border px-3.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white sm:text-sm ${
                    fieldErrors.email
                      ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  }`}
                />

                {fieldErrors.email && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                    <AlertCircle size={12} />
                    {fieldErrors.email}
                  </p>
                )}

              </div>

              {/* Password */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Password{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`h-11 w-full rounded-xl border px-3.5 pr-11 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white sm:text-sm ${
                      fieldErrors.password
                        ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

                {fieldErrors.password && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                    <AlertCircle size={12} />
                    {fieldErrors.password}
                  </p>
                )}

              </div>

              {/* Sign In Button */}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-100/90 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

            </form>

            {/* Register */}

            <div className="mt-6 text-center text-xs text-slate-500">
              New service provider?

              <Link
                to="/provider/register"
                className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Create Account
              </Link>
            </div>

            {/* Customer Login */}

            <div className="mt-5 border-t border-slate-200/80 pt-5 text-center text-xs text-slate-500">
              Looking for home services?

              <Link
                to="/login"
                className="ml-1 font-semibold text-slate-700 hover:text-orange-600 hover:underline"
              >
                Customer Login
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderLogin;
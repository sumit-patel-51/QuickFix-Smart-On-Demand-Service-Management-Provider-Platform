import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "../../api/axios";

const ProviderRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password show/hide
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!formData.name.trim()) {
      errors.name = "Full name is required.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");

    if (!cleanPhone) {
      errors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = "Enter a valid 10-digit mobile number.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!formData.password_confirmation) {
      errors.password_confirmation = "Please confirm your password.";
    } else if (
      formData.password !== formData.password_confirmation
    ) {
      errors.password_confirmation = "Passwords do not match.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    setFieldErrors({
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
    });

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post("/provider/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (response.data.success) {
        const { token, user, provider } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (provider) {
          localStorage.setItem(
            "provider",
            JSON.stringify(provider)
          );
        }

        navigate("/provider/setup");
      }
    } catch (err) {
      console.error("Provider registration error:", err);

      const responseData = err.response?.data;

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
            "Please fix the highlighted errors below."
        );
      } else {
        setError(
          responseData?.message ||
            "Registration failed. Please try again."
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
        {/* LEFT SIDE (Provider Branding)     */}
        {/* ================================= */}

        <div className="hidden border-r border-sky-100 bg-gradient-to-br from-blue-50/80 via-sky-100/70 to-slate-50 p-10 lg:flex lg:flex-col lg:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white shadow-xs shadow-blue-500/30">
                Q
              </div>

              <span className="text-lg font-bold tracking-tight text-slate-900">
                Quick<span className="text-blue-600">Service</span>
              </span>
            </div>

            <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-white/90 px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-xs">
              <Briefcase size={12} className="text-blue-600" />
              Service Partner Network
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Grow your professional business with QuickService.
            </h1>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
              Connect with nearby customers, accept on-demand jobs,
              and manage your services seamlessly.
            </p>

            <div className="mt-6 space-y-3 text-xs text-slate-700">

              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-xs">
                  <CheckCircle2 size={13} />
                </span>
                <span>Direct customer bookings in your area</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-xs">
                  <CheckCircle2 size={13} />
                </span>
                <span>Live dispatch navigation & tracking</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-xs">
                  <CheckCircle2 size={13} />
                </span>
                <span>
                  Direct earnings & zero advance commission
                </span>
              </div>

            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-400">
            © 2026 QuickService. All rights reserved.
          </p>
        </div>

        {/* ================================= */}
        {/* RIGHT SIDE (Compact Form)         */}
        {/* ================================= */}

        <div className="flex items-center justify-center px-4 py-8 sm:px-6">

          <div className="w-full max-w-sm">

            {/* Mobile Header */}

            <div className="mb-6 lg:hidden">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-xs shadow-blue-500/30">
                  Q
                </div>

                <span className="text-base font-bold tracking-tight text-slate-900">
                  Quick<span className="text-blue-600">Service</span>
                </span>

              </div>

              <p className="mt-1 text-[11px] font-semibold text-blue-600">
                Provider Onboarding
              </p>

            </div>

            {/* Title */}

            <div className="mb-5">

              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Become a Partner
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Create your verified service provider account.
              </p>

            </div>

            {/* Global Error Banner */}

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-600">

                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                <span>{error}</span>

              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-3"
            >

              {/* Full Name */}

              <div>

                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Full Name{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`h-9 w-full rounded-xl border px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white ${
                    fieldErrors.name
                      ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  }`}
                />

                {fieldErrors.name && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
                    <AlertCircle size={11} />
                    {fieldErrors.name}
                  </p>
                )}

              </div>

              {/* Email */}

              <div>

                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Email Address{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="provider@example.com"
                  className={`h-9 w-full rounded-xl border px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white ${
                    fieldErrors.email
                      ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  }`}
                />

                {fieldErrors.email && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
                    <AlertCircle size={11} />
                    {fieldErrors.email}
                  </p>
                )}

              </div>

              {/* Phone */}

              <div>

                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Phone Number{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength="10"
                  className={`h-9 w-full rounded-xl border px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white ${
                    fieldErrors.phone
                      ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  }`}
                />

                {fieldErrors.phone && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
                    <AlertCircle size={11} />
                    {fieldErrors.phone}
                  </p>
                )}

              </div>

              {/* Password */}

              <div>

                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Password{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className={`h-9 w-full rounded-xl border px-3 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white ${
                      fieldErrors.password
                        ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

                {fieldErrors.password && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
                    <AlertCircle size={11} />
                    {fieldErrors.password}
                  </p>
                )}

              </div>

              {/* Confirm Password */}

              <div>

                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Confirm Password{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Re-type your password"
                    className={`h-9 w-full rounded-xl border px-3 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white ${
                      fieldErrors.password_confirmation
                        ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/70 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

                {fieldErrors.password_confirmation && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
                    <AlertCircle size={11} />
                    {fieldErrors.password_confirmation}
                  </p>
                )}

              </div>

              {/* Submit Button */}

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sky-100/90 text-xs font-bold text-blue-700 transition hover:bg-blue-100 hover:text-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Creating Partner Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Partner Account</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

            </form>

            {/* Existing Account / Login */}

            <div className="mt-5 text-center text-xs text-slate-500">
              Already a service partner?

              <Link
                to="/provider/login"
                className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign In
              </Link>
            </div>

            {/* Customer Portal Link */}

            <div className="mt-4 border-t border-slate-200/80 pt-4 text-center text-xs text-slate-500">
              Looking for home services instead?

              <Link
                to="/login"
                className="ml-1 font-semibold text-slate-700 hover:text-orange-600 hover:underline"
              >
                Customer Portal
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderRegister;
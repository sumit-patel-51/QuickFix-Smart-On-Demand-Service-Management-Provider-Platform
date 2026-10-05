import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    terms: false,
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Remove field error when user starts typing again
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Remove general message while editing
    if (message) {
      setMessage("");
      setIsError(false);
    }
  };

  // ==========================================
  // CLIENT SIDE VALIDATION
  // ==========================================

  const validateForm = () => {
    const errors = {};

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!name) {
      errors.name = "Full name is required.";
    } else if (name.length < 2) {
      errors.name = "Name must contain at least 2 characters.";
    }

    if (!email) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(phone)) {
      errors.phone = "Phone number must contain exactly 10 digits.";
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

    if (!formData.terms) {
      errors.terms = "Please accept the Terms & Conditions.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setIsError(false);
    setFieldErrors({});

    // Client validation
    if (!validateForm()) {
      setIsError(true);
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/register", formData);

      console.log("Register Response:", response.data);

      // Save token if API returns token
      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
      }

      // Save user if API returns user
      if (response.data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      }

      setIsError(false);
      setMessage(
        response.data?.message ||
          "Registration successful! Redirecting to login..."
      );

      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        terms: false,
      });

      // Redirect to login
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      console.error("Registration Error:", error);

      setIsError(true);

      // ==========================================
      // SERVER VALIDATION ERROR - 422
      // ==========================================

      if (error.response?.status === 422) {
        const serverErrors = error.response?.data?.errors || {};

        setFieldErrors(serverErrors);

        const firstError = Object.values(serverErrors)
          .flat()
          .find(Boolean);

        setMessage(
          firstError ||
            error.response?.data?.message ||
            "Please correct the highlighted fields."
        );

        return;
      }

      // ==========================================
      // UNAUTHORIZED
      // ==========================================

      if (error.response?.status === 401) {
        setMessage(
          error.response?.data?.message ||
            "Registration was not authorized."
        );
        return;
      }

      // ==========================================
      // CONFLICT - EMAIL/PHONE ALREADY EXISTS
      // ==========================================

      if (error.response?.status === 409) {
        setMessage(
          error.response?.data?.message ||
            "An account with these details already exists."
        );
        return;
      }

      // ==========================================
      // SERVER ERROR
      // ==========================================

      if (error.response?.status >= 500) {
        setMessage(
          "Server error. Please try again after some time."
        );
        return;
      }

      // ==========================================
      // NETWORK ERROR
      // ==========================================

      if (error.request && !error.response) {
        setMessage(
          "Unable to connect to the server. Please check Laravel server and your network."
        );
        return;
      }

      // ==========================================
      // UNKNOWN ERROR
      // ==========================================

      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EYE ICON
  // ==========================================

  const EyeIcon = ({ open }) => {
    if (open) {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />

          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }

    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.58 10.58a2 2 0 002.84 2.84"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.88 5.09A10.94 10.94 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.97 10.97 0 01-4.13 5.21"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.61 6.61A10.97 10.97 0 002.458 12C3.732 16.057 7.523 19 12 19c1.61 0 3.13-.35 4.5-.98"
        />
      </svg>
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">

          {/* Brand Logo */}
          <div className="flex justify-center">
            <img
              src="/Quick_Service_Logos/full-logo/quick-service-full-128.png"
              alt="Quick Service Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-blue-950">
              Register your account
            </h2>

            <p className="mt-2 mb-6 text-sm text-slate-600">
              Get started with your free account today
            </p>
          </div>

          {/* General Message */}
          {message && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm font-medium flex items-start gap-3 ${
                isError
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <span className="text-base">
                {isError ? "⚠️" : "✓"}
              </span>

              <p>{message}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full name
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`block w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.name
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  autoComplete="name"
                  required
                />
              </div>

              {fieldErrors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`block w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.email
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  autoComplete="email"
                  required
                />
              </div>

              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Phone number
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength="10"
                  inputMode="numeric"
                  className={`block w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.phone
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  autoComplete="tel"
                  required
                />
              </div>

              {fieldErrors.phone ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.phone}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Enter a 10-digit mobile number.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`block w-full rounded-xl border pl-10 pr-12 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.password
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  autoComplete="new-password"
                  required
                />

                {/* Eye Button */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              {fieldErrors.password ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.password}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Must be at least 6 characters long.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Confirm password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>

                <input
                  id="password_confirmation"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`block w-full rounded-xl border pl-10 pr-12 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.password_confirmation
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  autoComplete="new-password"
                  required
                />

                {/* Eye Button */}
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>

              {fieldErrors.password_confirmation && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.password_confirmation}
                </p>
              )}
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />

                <label
                  htmlFor="terms"
                  className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              {fieldErrors.terms && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>

                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>

                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                Or
              </span>
            </div>
          </div>

          {/* Login */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;
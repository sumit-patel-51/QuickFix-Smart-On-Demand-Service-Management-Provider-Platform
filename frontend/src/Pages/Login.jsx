// PATH: src/Pages/Login.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Load saved message from localStorage on component mount
  useEffect(() => {
    const savedMessage = localStorage.getItem("userLoginMessage");
    const savedIsError = localStorage.getItem("userLoginIsError") === "true";
    const savedSuccess = localStorage.getItem("userLoginSuccess") === "true";
    
    if (savedMessage) {
      setMessage(savedMessage);
      setIsError(savedIsError);
      setSuccess(savedSuccess);
    }
  }, []);

  // ============================
  // HANDLE INPUT CHANGE
  // ============================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Only clear field-specific errors when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    // Clear general message when user types
    if (message) {
      setMessage("");
      setIsError(false);
      setSuccess(false);
      localStorage.removeItem("userLoginMessage");
      localStorage.removeItem("userLoginIsError");
      localStorage.removeItem("userLoginSuccess");
    }
  };

  // Clear message when user clicks X
  const handleClearMessage = () => {
    setMessage("");
    setIsError(false);
    setSuccess(false);
    // Clear from localStorage
    localStorage.removeItem("userLoginMessage");
    localStorage.removeItem("userLoginIsError");
    localStorage.removeItem("userLoginSuccess");
  };

  // ============================
  // LOGIN SUBMIT - USER ONLY
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ CLIENT-SIDE VALIDATION: Check if email or password is empty
    if (!formData.email || !formData.password) {
      setIsError(true);
      setSuccess(false);
      setMessage("Please fill in email and password");
      setLoading(false);
      
      localStorage.setItem("userLoginMessage", "Please fill in email and password");
      localStorage.setItem("userLoginIsError", "true");
      localStorage.setItem("userLoginSuccess", "false");
      
      const newErrors = {};
      if (!formData.email) newErrors.email = ["Email is required"];
      if (!formData.password) newErrors.password = ["Password is required"];
      setErrors(newErrors);
      
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);
    setSuccess(false);
    setErrors({});
    
    localStorage.removeItem("userLoginMessage");
    localStorage.removeItem("userLoginIsError");
    localStorage.removeItem("userLoginSuccess");

    try {
      const response = await api.post("/login", formData);

      console.log("✅ User Login Response:", response.data);

      const loginData = response.data?.data;

      if (!loginData || !loginData.token || !loginData.user) {
        const errorMsg = "Invalid response structure from server.";
        setIsError(true);
        setMessage(errorMsg);
        setLoading(false);
        localStorage.setItem("userLoginMessage", errorMsg);
        localStorage.setItem("userLoginIsError", "true");
        localStorage.setItem("userLoginSuccess", "false");
        return;
      }

      const { token, user } = loginData;

      // ✅ CHECK: Prevent admin users from logging in here
      if (user.role === "admin") {
        const errorMsg = "Invalid email or password";
        setIsError(true);
        setSuccess(false);
        setMessage(errorMsg);
        setLoading(false);
        localStorage.setItem("userLoginMessage", errorMsg);
        localStorage.setItem("userLoginIsError", "true");
        localStorage.setItem("userLoginSuccess", "false");
        return;
      }

      // Save credentials (only for regular users)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role || "customer");

      console.log("✅ User saved:", user);
      console.log("✅ Token saved:", token);

      const successMsg = response.data.message || "Login successful! Redirecting...";
      setSuccess(true);
      setIsError(false);
      setMessage(successMsg);
      
      localStorage.setItem("userLoginMessage", successMsg);
      localStorage.setItem("userLoginIsError", "false");
      localStorage.setItem("userLoginSuccess", "true");

      // Redirect to user dashboard
      setTimeout(() => {
        setLoading(false);
        localStorage.removeItem("userLoginMessage");
        localStorage.removeItem("userLoginIsError");
        localStorage.removeItem("userLoginSuccess");
        navigate("/dashboard");
      }, 2000);
      
    } catch (error) {
      console.error("❌ Login Error:", error);
      
      if (error.response) {
        console.error("❌ Error Response Data:", error.response.data);
        console.error("❌ Error Status:", error.response.status);
      } else if (error.request) {
        console.error("❌ No response received:", error.request);
      } else {
        console.error("❌ Error message:", error.message);
      }

      setIsError(true);
      setSuccess(false);
      setLoading(false);

      let errorMsg = "";

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 422) {
          if (errorData.errors) {
            setErrors(errorData.errors);
            const firstErrorKey = Object.keys(errorData.errors)[0];
            errorMsg = errorData.errors[firstErrorKey]?.[0] || "Validation failed. Please check your input.";
          } else {
            errorMsg = errorData.message || "Validation failed. Please check your input.";
          }
        } 
        else if (status === 401) {
          errorMsg = errorData.message || "Invalid email or password. Please try again.";
        }
        else if (status === 403) {
          errorMsg = errorData.message || "Access denied. Please contact support.";
        }
        else {
          errorMsg = errorData.message || "Login failed. Please try again.";
        }
      } else if (error.request) {
        errorMsg = "Unable to connect to the server. Please check your network connection.";
      } else {
        errorMsg = "Something went wrong. Please try again.";
      }

      setMessage(errorMsg);
      localStorage.setItem("userLoginMessage", errorMsg);
      localStorage.setItem("userLoginIsError", "true");
      localStorage.setItem("userLoginSuccess", "false");
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="rounded-xl flex items-center justify-center text-white text-2xl font-bold size-full">
          <img src="../../public/Quick_Service_Logos/full-logo/quick-service-full-128.png" alt="Quick Service Logo" />
          </div>
        </div>

        {/* Header Text */}
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-blue-950">
          User Login
        </h2>
        <p className="mt-2 mb-6 text-center text-sm text-slate-600">
          Sign in to access your dashboard and services
        </p>
      </div>
          
          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-start gap-3 transition-all ${
                isError
                  ? "bg-red-50 text-red-700 border border-red-200/60"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              }`}
            >
              <span className="text-base mt-0.5">
                {isError ? "❌" : "✅"}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{message}</p>
                {success && (
                  <p className="text-xs mt-1 text-emerald-600">
                    <span className="animate-pulse">⏳ Please wait...</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearMessage}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200/50"
                aria-label="Close message"
                title="Dismiss message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`block w-full rounded-xl border ${
                    errors.email ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300"
                  } pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-medium">
                  <span className="mr-1">⚠️</span> {errors.email[0]}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`block w-full rounded-xl border ${
                    errors.password ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300"
                  } pl-10 pr-12 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 font-medium">
                  <span className="mr-1">⚠️</span> {errors.password[0]}
                </p>
              )}
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 text-sm cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white transition-all ${
                loading && success
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-orange-600 hover:bg-orange-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-80 disabled:cursor-not-allowed shadow-sm shadow-blue-500/10`}
            >
              {loading && success ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting...</span>
                </>
              ) : loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
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

          {/* Register Callout */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>

       

        </div>
      </div>
    </div>
  );
}

export default Login;
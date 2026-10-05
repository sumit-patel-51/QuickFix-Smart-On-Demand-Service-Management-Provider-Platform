// PATH: src/Pages/AdminLogin.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function AdminLogin() {
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

  useEffect(() => {
    const savedMessage = localStorage.getItem("loginMessage");
    const savedIsError = localStorage.getItem("loginIsError") === "true";
    const savedSuccess = localStorage.getItem("loginSuccess") === "true";
    
    if (savedMessage) {
      setMessage(savedMessage);
      setIsError(savedIsError);
      setSuccess(savedSuccess);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (message) {
      setMessage("");
      setIsError(false);
      setSuccess(false);
      localStorage.removeItem("loginMessage");
      localStorage.removeItem("loginIsError");
      localStorage.removeItem("loginSuccess");
    }
  };

  const handleClearMessage = () => {
    setMessage("");
    setIsError(false);
    setSuccess(false);
    localStorage.removeItem("loginMessage");
    localStorage.removeItem("loginIsError");
    localStorage.removeItem("loginSuccess");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ Client-side validation
    if (!formData.email || !formData.password) {
      setIsError(true);
      setSuccess(false);
      setMessage("Please fill in email and password");
      setLoading(false);
      
      localStorage.setItem("loginMessage", "Please fill in email and password");
      localStorage.setItem("loginIsError", "true");
      localStorage.setItem("loginSuccess", "false");
      
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
    
    localStorage.removeItem("loginMessage");
    localStorage.removeItem("loginIsError");
    localStorage.removeItem("loginSuccess");

    try {
      const response = await api.post("/admin/login", formData);

      console.log("✅ Admin Login Response:", response.data);

      const loginData = response.data?.data;

      if (!loginData || !loginData.token || !loginData.user) {
        // ❌ DON'T redirect - stay on admin login page
        setIsError(true);
        setMessage("Invalid email or password");
        setLoading(false);
        localStorage.setItem("loginMessage", "Invalid email or password");
        localStorage.setItem("loginIsError", "true");
        localStorage.setItem("loginSuccess", "false");
        return;
      }

      const { token, user } = loginData;

      // ✅ ONLY ADMIN CAN LOGIN HERE
      if (user.role !== "admin") {
        // ❌ DON'T redirect - stay on admin login page
        setIsError(true);
        setSuccess(false);
        setMessage("Invalid email or password");
        setLoading(false);
        localStorage.setItem("loginMessage", "Invalid email or password");
        localStorage.setItem("loginIsError", "true");
        localStorage.setItem("loginSuccess", "false");
        return;
      }

      // Save credentials (only for admin)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      console.log("✅ Admin User saved:", user);
      console.log("✅ Token saved:", token);

      const successMsg = "Admin login successful! Redirecting...";
      setSuccess(true);
      setIsError(false);
      setMessage(successMsg);
      
      localStorage.setItem("loginMessage", successMsg);
      localStorage.setItem("loginIsError", "false");
      localStorage.setItem("loginSuccess", "true");

      // ✅ Redirect to admin dashboard ONLY on success
      setTimeout(() => {
        setLoading(false);
        localStorage.removeItem("loginMessage");
        localStorage.removeItem("loginIsError");
        localStorage.removeItem("loginSuccess");
        navigate("/admin/dashboard");
      }, 2000);
      
    } catch (error) {
      console.error("❌ Admin Login Error:", error);
      
      // Log the full error for debugging
      if (error.response) {
        console.error("❌ Error Response Data:", error.response.data);
        console.error("❌ Error Status:", error.response.status);
        
        // ✅ Handle specific status codes without redirect
        const status = error.response.status;
        const errorData = error.response.data;
        
        // ✅ Always stay on admin login page
        if (status === 401 || status === 403 || status === 422) {
          // Wrong credentials or validation error
          setIsError(true);
          setSuccess(false);
          setMessage("Invalid email or password");
          setLoading(false);
          localStorage.setItem("loginMessage", "Invalid email or password");
          localStorage.setItem("loginIsError", "true");
          localStorage.setItem("loginSuccess", "false");
          return;
        }
      } else if (error.request) {
        // ✅ Network error - stay on admin login page
        setIsError(true);
        setSuccess(false);
        setLoading(false);
        setMessage("Unable to connect to the server. Please check your network.");
        localStorage.setItem("loginMessage", "Unable to connect to the server.");
        localStorage.setItem("loginIsError", "true");
        localStorage.setItem("loginSuccess", "false");
        return;
      }

      // ✅ Fallback - stay on admin login page
      setIsError(true);
      setSuccess(false);
      setLoading(false);
      setMessage("Invalid email or password");
      localStorage.setItem("loginMessage", "Invalid email or password");
      localStorage.setItem("loginIsError", "true");
      localStorage.setItem("loginSuccess", "false");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
    
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-xl border border-slate-200/60 rounded-2xl sm:px-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="rounded-xl flex items-center justify-center text-white text-2xl font-bold size-full w-80">
          <img src="../../public/Quick_Admin_Logos/admintext.png" alt="Admin Logo" />
          </div>
        </div>

        {/* Header Text */}
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-blue-950">
          Admin Login
        </h2>
        <p className="mt-2 mb-6 text-center text-sm text-slate-600">
          Sign in to access your dashboard and services
        </p>
      </div>
          
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
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Admin Email Address <span className="text-red-500">*</span>
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
                  placeholder="admin@school.com"
                  className={`block w-full rounded-xl border ${
                    errors.email ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300"
                  } pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-medium">
                  <span className="mr-1">⚠️</span> {errors.email[0]}
                </p>
              )}
            </div>

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
                  } pl-10 pr-12 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all`}
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 text-sm cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <Link
                to="/admin/forgot-password"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white transition-all ${
                loading && success
                  ? "bg-emerald-600 hover:bg-orange-700"
                  : "bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-80 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20`}
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
                  <span>Sign in as Admin</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 backdrop-blur-sm px-3 text-slate-400 font-medium tracking-wider">
                Or
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Are you a user?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Go to User Login
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100/60">
            <p className="text-xs text-slate-600 text-center">
              <span className="font-semibold">Demo Admin:</span> admin@school.com / Admin@123
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
// PATH: src/components/CustomerNavbar.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CustomerNavbar = ({ onMenuClick, onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load user
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );
        setUser(storedUser);
      } catch (error) {
        console.error("User Load Error:", error);
        setUser({});
      }
    };

    loadUser();

    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

  // Close dropdown outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleImageError = (e) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md sm:h-20">
      <div className="relative mx-auto flex h-full items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left - Mobile Menu */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:scale-95 sm:h-10 sm:w-10 lg:hidden"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Center Brand - Mobile */}
        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 select-none items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-xs font-bold text-white shadow-sm shadow-blue-500/20 sm:h-9 sm:w-9 sm:text-sm">
            S
          </div>
          <span className="whitespace-nowrap text-sm font-bold tracking-tight text-gray-900 sm:text-base">
            Service
            <span className="text-blue-600">Hub</span>
          </span>
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {/* Notification */}
          <button
            type="button"
            aria-label="Notifications"
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:scale-95 sm:h-10 sm:w-10"
          >
            <Bell className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6 sm:h-5 sm:w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2 sm:right-2.5 sm:top-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </span>
          </button>

          <div className="hidden h-6 w-px bg-gray-200 sm:block" />

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-gray-100 active:scale-95 sm:p-1.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-xs font-semibold text-blue-600 ring-1 ring-blue-600/10 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user?.name || "Customer"}
                    onError={handleImageError}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getUserInitial()}</span>
                )}
              </div>

              <div className="hidden text-left md:block">
                <p className="max-w-28 truncate text-xs font-semibold leading-tight text-gray-800 lg:max-w-40 sm:text-sm">
                  {user?.name || "Customer"}
                </p>
                <p className="text-[11px] font-medium capitalize text-gray-400">
                  {user?.role || "Customer"}
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-gray-400 transition-transform duration-200 sm:block ${
                  isDropdownOpen ? "rotate-180 text-gray-600" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-900/5 ring-1 ring-black/5">
                {/* Mobile User Info */}
                <div className="mb-1 flex items-center gap-3 border-b border-gray-100 px-3 py-3 md:hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    {user?.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user?.name || "Customer"}
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getUserInitial()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-900">
                      {user?.name || "Customer"}
                    </p>
                    <p className="truncate text-[11px] text-gray-400">
                      {user?.email || "customer@servicehub.com"}
                    </p>
                  </div>
                </div>

                {/* My Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/customer/profile");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  My Profile
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/customer/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </button>

                <div className="my-1 h-px bg-gray-100" />

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout ? onLogout() : handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CustomerNavbar;
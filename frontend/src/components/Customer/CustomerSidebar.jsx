// PATH: src/components/CustomerSidebar.jsx

import React, { useState, useEffect } from "react";
import {
  Home,
  Wrench,
  ClipboardList,
  MapPin,
  Heart,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import api from "../../api/axios";

const CustomerSidebar = ({ isOpen, onClose, onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  // Load user from localStorage
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

    // Profile update hone ke baad refresh
    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("userUpdated", loadUser);
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

  // Main Menu
  const menuItems = [
    {
      name: "Home",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Services",
      path: "/customer/services",
      icon: Wrench,
    },
    
    {
      name: "My Bookings",
      path: "/customer/bookings",
      icon: ClipboardList,
    },
    {
      name: "My Requests",
       path:"/customer/my-requests",
      icon: MapPin,
    },
    {
      name: "Favorites",
      path: "/customer/favorites",
      icon: Heart,
    },
  ];

  // Account Menu
  const accountItems = [
    {
      name: "My Profile",
      path: "/customer/profile",
      icon: User,
    },
    {
      name: "Settings",
      path: "/customer/settings",
      icon: Settings,
    },
  ];

  // Support Menu
  const supportItems = [
    {
      name: "Help & Support",
      path: "/customer/help",
      icon: HelpCircle,
    },
  ];

  // Render Menu
  const renderMenu = (items) => {
    return items.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={onClose}
          className={({ isActive }) =>
            `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/25"
                : "text-gray-600 hover:bg-orange-50/70 hover:text-orange-600 active:scale-[0.99]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center gap-3">
                <Icon
                  size={19}
                  strokeWidth={2}
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:scale-110 group-hover:text-orange-600"
                  }`}
                />

                <span className="tracking-tight">
                  {item.name}
                </span>
              </div>

              <ChevronRight
                size={15}
                className={`transition-all duration-200 ${
                  isActive
                    ? "translate-x-0 text-white/80 opacity-100"
                    : "-translate-x-1 text-blue-500 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              />
            </>
          )}
        </NavLink>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen
            ? "translate-x-0 shadow-2xl shadow-gray-900/10"
            : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 sm:h-20 sm:px-6">
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-xl flex items-center justify-center text-white text-2xl font-bold size-full">
              <img src="../../public/user_header_logo.png" alt="Quick Service Logo" />
            </div>

            {/* <div>
              <h2 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
                Service
                <span className="text-blue-600">
                  Hub
                </span>
              </h2>
            </div> */}
          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:scale-95 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* User Card */}
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50/80 p-2.5 ring-1 ring-gray-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-sm font-semibold text-blue-600 ring-1 ring-blue-600/10">
              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user?.name || "Customer"}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : "U"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xs font-semibold leading-snug text-gray-900 sm:text-sm">
                {user?.name || "Customer"}
              </h2>

              <p className="truncate text-[11px] font-medium text-gray-400">
                {user?.email || "customer@servicehub.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
          </p>
          <div className="space-y-1">{renderMenu(menuItems)}</div>

          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Account
          </p>
          <div className="space-y-1">{renderMenu(accountItems)}</div>

          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Support
          </p>
          <div className="space-y-1">{renderMenu(supportItems)}</div>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onLogout || handleLogout}
            className="group flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-150 hover:bg-red-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <LogOut
                size={18}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              <span>Sign Out</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CustomerSidebar;
import React, { useEffect, useState } from "react";
import {
  Home,
  Wrench,
  ClipboardList,
  CalendarDays,
  ShieldCheck,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const ProviderSidebar = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const [user, setUser] = useState({});

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        setUser(storedUser);
      } catch (error) {
        console.error(
          "Provider user load error:",
          error
        );

        setUser({});
      }
    };

    loadUser();

    window.addEventListener(
      "userUpdated",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        loadUser
      );
    };
  }, []);

  // ==========================================
  // MAIN MENU
  // ==========================================

  const mainMenu = [
    {
      name: "Dashboard",
      path: "/provider/dashboard",
      icon: Home,
    },
    {
      name: "My Services",
      path: "/provider/services",
      icon: Wrench,
    },
    {
      name: "My Active Requests",
      path: "/provider/requests",
      icon: ClipboardList,
    },
    {
      name: "My Bookings",
      path: "/provider/bookings",
      icon: CalendarDays,
    },
  ];

  // ==========================================
  // ACCOUNT
  // ==========================================

  const accountMenu = [
    // {
    //   name: "Verification",
    //   path: "/provider/verification",
    //   icon: ShieldCheck,
    // },
    {
      name: "My Profile",
      path: "/provider/profile",
      icon: User,
    },
    {
      name: "Settings",
      path: "/provider/settings",
      icon: Settings,
    },
  ];

  // ==========================================
  // SUPPORT
  // ==========================================

  const supportMenu = [
    {
      name: "Help & Support",
      path: "/provider/help",
      icon: HelpCircle,
    },
  ];

  // ==========================================
  // RENDER MENU
  // ==========================================

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
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-gray-600 hover:bg-blue-50/70 hover:text-blue-600 active:scale-[0.99]"
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
                      : "text-gray-400 group-hover:scale-110 group-hover:text-blue-600"
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

  // ==========================================
  // USER INITIAL
  // ==========================================

  const getInitial = () => {
    if (user?.name) {
      return user.name
        .charAt(0)
        .toUpperCase();
    }

    return "P";
  };

  return (
    <>
      {/* ==========================================
          MOBILE BACKDROP
      ========================================== */}

      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full"
        }`}
      >
      {/* ==========================================
    HEADER / LOGO
========================================== */}

<div className="flex h-20 items-center justify-center border-b border-gray-100 px-5 sm:h-24 sm:px-6">

  {/* CENTER LOGO */}
  <div className="flex w-full items-center justify-center">
    <img
      src="/user_header_logo.png"
      alt="Quick Service Portal"
      className="h-14 w-auto max-w-[220px] object-contain"
    />
  </div>

  {/* MOBILE CLOSE */}
  <button
    type="button"
    onClick={onClose}
    className="absolute right-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
  >
    <X size={19} />
  </button>

</div>

        {/* ==========================================
            PROVIDER CARD
        ========================================== */}

        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50/80 p-2.5 ring-1 ring-gray-100">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-sm font-semibold text-blue-600 ring-1 ring-blue-600/10">

              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user?.name || "Provider"}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitial()
              )}

            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xs font-semibold text-gray-900 sm:text-sm">
                {user?.name || "Provider"}
              </h2>

              <p className="truncate text-[11px] font-medium text-gray-400">
                {user?.email ||
                  "provider@quickfix.com"}
              </p>
            </div>
          </div>
        </div>

        {/* ==========================================
            NAVIGATION
        ========================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">

          {/* MAIN MENU */}
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {renderMenu(mainMenu)}
          </div>

          {/* ACCOUNT */}
          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Account
          </p>

          <div className="space-y-1">
            {renderMenu(accountMenu)}
          </div>

          {/* SUPPORT */}
          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Support
          </p>

          <div className="space-y-1">
            {renderMenu(supportMenu)}
          </div>

        </nav>

        {/* ==========================================
            LOGOUT
        ========================================== */}

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="group flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 active:scale-[0.99]"
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

export default ProviderSidebar;
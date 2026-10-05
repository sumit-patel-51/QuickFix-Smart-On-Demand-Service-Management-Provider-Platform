import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Search,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminNavbar = ({ onMenuClick, onLogout }) => {
  const [user, setUser] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "New provider registration pending",
      time: "5 min ago",
      read: false,
    },
    {
      id: 2,
      message: "Payment #1234 completed",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      message: "Service request #567 assigned",
      time: "3 hours ago",
      read: true,
    },
  ]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }

    return "A";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">

        {/* Left */}
        <div className="flex items-center gap-3">

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 lg:hidden"
          >
            <Menu size={19} />
          </button>

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wrench size={16} />
            </div>

            <span className="text-sm font-bold text-slate-900">
              Quick<span className="text-blue-600">Service</span>
            </span>
          </div>

          {/* Search */}
          <div className="hidden md:flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Search size={15} className="text-slate-400" />

            <input
              type="text"
              placeholder="Search requests, users, providers..."
              className="w-64 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() =>
                setShowNotifications((prev) => !prev)
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Notifications
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Recent portal activity
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotifications(
                        notifications.map((n) => ({
                          ...n,
                          read: true,
                        }))
                      )
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto p-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                    >
                      <div className="flex gap-2">
                        {!notification.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                        )}

                        <div>
                          <p className="text-xs font-medium text-slate-700">
                            {notification.message}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() =>
                setIsDropdownOpen((prev) => !prev)
              }
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-bold text-white">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user?.name || "Admin"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getUserInitial()
                )}
              </div>

              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-800">
                  {user?.name || "Admin"}
                </p>

                <p className="text-[10px] text-slate-400">
                  {user?.role || "Portal Manager"}
                </p>
              </div>

              <ChevronDown
                size={15}
                className="hidden text-slate-400 md:block"
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">

                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-800">
                    {user?.name || "Admin"}
                  </p>

                  <p className="truncate text-[10px] text-slate-400">
                    {user?.email || "admin@quickservice.com"}
                  </p>
                </div>

                <Link
                  to="/admin/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <User size={15} />
                  My Profile
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Settings size={15} />
                  Settings
                </Link>

                <div className="my-1 h-px bg-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
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

export default AdminNavbar;
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const ProviderNavbar = ({
  onMenuClick,
  onLogout,

  // Online / Offline props
  isOnline = false,
  onToggleStatus,
  statusLoading = false,
  locationLoading = false,
}) => {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] =
    useState(false);

  const dropdownRef = useRef(null);

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
          "Unable to load provider user:",
          error
        );

        setUser({});
      }
    };

    // Initial load
    loadUser();

    // Listen for profile updates
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
  // CLOSE DROPDOWN WHEN CLICK OUTSIDE
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ==========================================
  // GET USER INITIAL
  // ==========================================

  const getInitial = () => {
    if (user?.name) {
      return user.name
        .charAt(0)
        .toUpperCase();
    }

    return "P";
  };

  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  const profileImage =
    user?.profile_image ||
    user?.profile_photo ||
    null;

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md sm:h-20">

      <div className="relative mx-auto flex h-full items-center justify-between px-3 sm:px-6 lg:px-8">

        {/* ======================================
            MOBILE MENU
        ====================================== */}

        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* ======================================
            MOBILE BRAND
        ====================================== */}

        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:hidden">

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-xs font-bold text-white">
            P
          </div>

          <span className="text-sm font-bold text-gray-900">
            Provider
            <span className="text-blue-600">
              Hub
            </span>
          </span>

        </div>

        {/* ======================================
            RIGHT SECTION
        ====================================== */}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">

          {/* ====================================
              NOTIFICATION
          ==================================== */}

          <button
            type="button"
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 sm:h-10 sm:w-10"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="hidden h-6 w-px bg-gray-200 sm:block" />

          {/* ====================================
              PROFILE
          ==================================== */}

          <div
            className="relative"
            ref={dropdownRef}
          >

            <button
              type="button"
              onClick={() =>
                setIsDropdownOpen(
                  (previous) => !previous
                )
              }
              className="flex items-center gap-2 rounded-xl p-1 hover:bg-gray-100 sm:p-1.5"
            >

              {/* =================================
                  PROFILE IMAGE
              ================================= */}

              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-xs font-semibold text-blue-600 ring-1 ring-blue-600/10 sm:h-9 sm:w-9 lg:h-10 lg:w-10">

                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={
                      user?.name ||
                      "Provider"
                    }
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  getInitial()
                )}

              </div>

              {/* =================================
                  USER NAME
              ================================= */}

              <div className="hidden text-left md:block">

                <p className="max-w-40 truncate text-sm font-semibold text-gray-800">
                  {user?.name || "Provider"}
                </p>

                <p className="text-[11px] capitalize text-gray-400">
                  Service Provider
                </p>

              </div>

              {/* =================================
                  DROPDOWN ICON
              ================================= */}

              <ChevronDown
                className={`hidden h-4 w-4 text-gray-400 transition-transform sm:block ${
                  isDropdownOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {/* ====================================
                DROPDOWN
            ==================================== */}

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl">

                {/* Mobile User Info */}

                <div className="border-b border-gray-100 px-3 py-3 md:hidden">

                  <div className="mb-2 flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-semibold text-blue-600">

                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={
                            user?.name ||
                            "Provider"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitial()
                      )}

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-xs font-semibold text-gray-900">
                        {user?.name ||
                          "Provider"}
                      </p>

                      <p className="truncate text-[11px] text-gray-400">
                        {user?.email || ""}
                      </p>

                    </div>

                  </div>

                </div>

                {/* My Profile */}

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);

                    navigate(
                      "/provider/profile"
                    );
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-gray-400" />

                  My Profile
                </button>

                {/* Settings */}

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);

                    navigate(
                      "/provider/settings"
                    );
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-gray-400" />

                  Settings
                </button>

                <div className="my-1 h-px bg-gray-100" />

                {/* Logout */}

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);

                    if (onLogout) {
                      onLogout();
                    }
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />

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

export default ProviderNavbar;
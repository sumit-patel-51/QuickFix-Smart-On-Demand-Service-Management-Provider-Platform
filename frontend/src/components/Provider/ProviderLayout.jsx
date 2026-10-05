import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import ProviderNavbar from "./ProviderNavbar";
import ProviderSidebar from "./ProviderSidebar";
import api from "../../api/axios";

function ProviderLayout() {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      // Logout API
      await api.post("/logout");
    } catch (error) {
      console.error("Provider logout API error:", error);
    } finally {
      // Clear authentication
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("refresh_token");

      // Provider related data
      localStorage.removeItem("provider");
      localStorage.removeItem("remember");
      localStorage.removeItem("loginMessage");
      localStorage.removeItem("loginIsError");
      localStorage.removeItem("loginSuccess");

      // Clear session
      sessionStorage.clear();

      // Tell navbar/sidebar user data changed
      window.dispatchEvent(new Event("userUpdated"));

      navigate("/provider/login", {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <ProviderSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* ==========================================
          MAIN AREA
      ========================================== */}

      <div className="lg:pl-72">

        {/* Navbar */}

        <ProviderNavbar
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />

        {/* Provider Pages */}

        <main>
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default ProviderLayout;
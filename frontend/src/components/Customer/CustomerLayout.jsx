// PATH: src/components/Customer/CustomerLayout.jsx

import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import CustomerNavbar from "./CustomerNavbar";
import CustomerSidebar from "./CustomerSidebar";
import api from "../../api/axios";

function CustomerLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ============================
  // LOGOUT
  // ============================
  const handleLogout = async () => {
    try {
      // Tries to invalidate the token on the server (best effort)
      await api.post("/logout");
    } catch (error) {
      // Even if the API call fails (e.g. token already expired),
      // we still want to clear local session and log the user out.
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("refresh_token");

      // Let any listening components (like the navbar avatar) know the user changed
      window.dispatchEvent(new Event("userUpdated"));

      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-72">
        <CustomerNavbar
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />

        {/* Nested customer routes (Dashboard, Services, etc.) render here */}
        <Outlet />
      </div>
    </div>
  );
}

export default CustomerLayout;
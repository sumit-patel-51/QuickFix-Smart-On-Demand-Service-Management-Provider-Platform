import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import api from "../../api/axios";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout API Error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("remember");
      localStorage.removeItem("loginMessage");
      localStorage.removeItem("loginIsError");
      localStorage.removeItem("loginSuccess");

      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <AdminNavbar
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
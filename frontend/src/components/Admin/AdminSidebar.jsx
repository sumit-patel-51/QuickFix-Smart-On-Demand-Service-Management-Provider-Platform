// PATH: src/components/Admin/AdminSidebar.jsx

import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Wrench,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  MessageSquareText,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Star,
  Bell,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const AdminSidebar = ({ isOpen, onClose, onLogout }) => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "Service Providers",
      path: "/admin/providers",
      icon: UserCog,
    },
    {
      name: "Services",
      path: "/admin/services",
      icon: Wrench,
    },
    {
      name: "Service Requests",
      path: "/admin/requests",
      icon: ClipboardList,
    },
     
    // {
    //   name: "Bookings",
    //   path: "/admin/bookings",
    //   icon: CalendarCheck,
    // },
  ];

  const managementItems = [
    {
      name: "Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: BarChart3,
    },
    {
      name: "Audit Log",
      path: "/admin/audit-log",
      icon: ShieldCheck,
    },
    {
      name: "Feedback",
      path: "/admin/feedback",
      icon: Star,
    },
  ];

  const communicationItems = [
    {
      name: "Messages",
      path: "/admin/messages",
      icon: MessageSquare,
    },
    {
      name: "Notifications",
      path: "/admin/notifications",
      icon: Bell,
    },
  ];

  const accountItems = [
    {
      name: "My Profile",
      path: "/admin/profile",
      icon: Settings,
    },
    {
      name: "Help & Support",
      path: "/admin/help",
      icon: HelpCircle,
    },
  ];

  const renderMenu = (items) =>
    items.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={onClose}
          className={({ isActive }) =>
            `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/15"
                      : "bg-slate-50 group-hover:bg-blue-100"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.3 : 2}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-blue-600"
                    }
                  />
                </div>

                <span className="truncate">{item.name}</span>
              </div>

              <ChevronRight
                size={15}
                className={`shrink-0 transition-all duration-200 ${
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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <Wrench size={18} strokeWidth={2.4} />
            </div>

            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Quick
                <span className="text-blue-600">Service</span>
              </h2>

              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Small Portal Label */}
        <div className="px-4 pt-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-blue-700">
                Portal is active
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {renderMenu(menuItems)}
          </div>

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Management
          </p>

          <div className="space-y-1">
            {renderMenu(managementItems)}
          </div>

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Communication
          </p>

          <div className="space-y-1">
            {renderMenu(communicationItems)}
          </div>

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Account
          </p>

          <div className="space-y-1">
            {renderMenu(accountItems)}
          </div>
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100">
              <LogOut
                size={17}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            </div>

            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;


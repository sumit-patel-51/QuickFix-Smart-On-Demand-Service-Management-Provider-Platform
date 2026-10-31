
// PATH: src/Pages/Admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import {
  Users,
  UserCog,
  Wrench,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Activity,
  RefreshCw,
  Star,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [user, setUser] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setUser(storedUser);
    } catch (err) {
      console.error("User Load Error:", err);
    }

    fetchDashboardData();
  }, []);

  // Fetch real database data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");

      if (response.data?.success) {
        setDashboard(response.data.data);
      } else {
        setError("Unable to load dashboard data.");
      }
    } catch (err) {
      console.error("Dashboard Error:", err);

      setError(
        err.response?.data?.message ||
        "Failed to connect to dashboard API."
      );
    } finally {
      setLoading(false);
    }
  };

  const customers = dashboard?.customers || {};
  const providers = dashboard?.providers || {};
  const services = dashboard?.services || {};
  const requests = dashboard?.requests || {};
  const reviews = dashboard?.reviews || {};

  const recentRequests = dashboard?.recent_requests || [];
  const recentProviders = dashboard?.recent_providers || [];
  const monthlyStatistics = dashboard?.monthly_statistics || [];

  // Dashboard Cards
  const stats = [
    {
      title: "Total Customers",
      value: customers.total ?? 0,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      link: "/admin/users",
    },
    {
      title: "Service Providers",
      value: providers.total ?? 0,
      icon: UserCog,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      link: "/admin/providers",
    },
    {
      title: "Total Services",
      value: services.total ?? 0,
      icon: Wrench,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/admin/services",
    },
    {
      title: "Service Requests",
      value: requests.total ?? 0,
      icon: ClipboardList,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      link: "/admin/requests",
    },
  ];

  // Quick Management
  const quickActions = [
    {
      title: "Customers",
      description: "View and manage customers",
      icon: Users,
      link: "/admin/users",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Providers",
      description: "Manage service providers",
      icon: UserCog,
      link: "/admin/providers",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Services",
      description: "Manage portal services",
      icon: Wrench,
      link: "/admin/services",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Requests",
      description: "Manage all service requests",
      icon: ClipboardList,
      link: "/admin/requests",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Bookings",
      description: "Monitor customer bookings",
      icon: CalendarCheck,
      link: "/admin/requests",
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Reviews",
      description: "Manage customer feedback",
      icon: Star,
      link: "/admin/feedback",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "service_completed":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";

      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-100";

      case "provider_assigned":
      case "provider_on_the_way":
      case "assigned":
      case "on_way":
        return "bg-blue-50 text-blue-700 border border-blue-100";

      case "arrived":
      case "service_started":
        return "bg-indigo-50 text-indigo-700 border border-indigo-100";

      default:
        return "bg-amber-50 text-amber-700 border border-amber-100";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const maxMonthlyRequests = Math.max(
    ...monthlyStatistics.map((item) => Number(item.total || 0)),
    1
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <section className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-6 text-white shadow-md sm:px-7">

            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                    <Activity size={15} />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Admin Dashboard
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Good Evening, {user?.name || "Admin"} 👋
                </h1>

                <p className="mt-1.5 max-w-xl text-sm text-blue-100">
                  Manage your QuiFix Service Portal from one simple dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <Link
                  to="/admin/requests"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
                >
                  <ClipboardList size={15} />
                  View Requests
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>

            <button
              onClick={fetchDashboardData}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.title}
                to={stat.link}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {loading ? "..." : stat.value.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Actual database records
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}
                  >
                    <Icon size={20} className={stat.iconColor} />
                  </div>

                </div>

                <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors group-hover:text-blue-600">
                  View details
                  <ArrowUpRight size={13} />
                </div>
              </Link>
            );
          })}

        </section>

        {/* Provider and Request Overview */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Pending Verification",
              value: providers.pending,
              icon: Clock3,
              color: "text-amber-600",
              bg: "bg-amber-50",
              link: "/admin/providers",
            },
            {
              title: "Online Providers",
              value: providers.online,
              icon: Wifi,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              link: "/admin/providers",
            },
            {
              title: "Active Requests",
              value: requests.active,
              icon: Activity,
              color: "text-blue-600",
              bg: "bg-blue-50",
              link: "/admin/requests",
            },
            {
              title: "Completed Requests",
              value: requests.completed,
              icon: CheckCircle2,
              color: "text-purple-600",
              bg: "bg-purple-50",
              link: "/admin/requests",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                to={item.link}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}
                >
                  <Icon size={20} className={item.color} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {loading ? "..." : (item.value ?? 0)}
                  </p>
                </div>
              </Link>
            );
          })}

        </section>

        {/* Quick Management */}
        <section className="mb-7">

          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Quick Management
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Quickly access the main portal sections
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  to={item.link}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                  >
                    <Icon size={20} className={item.iconColor} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                      {item.title}
                    </h3>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                  />
                </Link>
              );
            })}

          </div>
        </section>

        {/* Monthly Statistics */}
        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Monthly Service Requests
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Actual requests created during the current year
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <BarChart3 size={19} className="text-blue-600" />
            </div>
          </div>

          {loading ? (
            <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
          ) : monthlyStatistics.length > 0 ? (
            <div className="flex h-48 items-end gap-2 overflow-x-auto border-b border-slate-100 pb-2">

              {monthlyStatistics.map((item) => {
                const height =
                  Number(item.total) > 0
                    ? Math.max(
                        (Number(item.total) / maxMonthlyRequests) * 100,
                        5
                      )
                    : 0;

                return (
                  <div
                    key={item.month}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] font-semibold text-slate-600">
                      {item.total}
                    </span>

                    <div className="flex h-32 w-full items-end justify-center">
                      <div
                        title={`${item.total} requests`}
                        className="w-full max-w-10 rounded-t-md bg-blue-500 transition-all hover:bg-blue-700"
                        style={{
                          height: `${height}%`,
                          minHeight: item.total > 0 ? "4px" : "0px",
                        }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {item.month}
                    </span>
                  </div>
                );
              })}

            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No monthly statistics available.
            </p>
          )}

        </section>

        {/* Bottom Section */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* Recent Requests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Service Requests
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Latest requests from customers
                </p>
              </div>

              <Link
                to="/admin/requests"
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : recentRequests.length > 0 ? (
              <div className="space-y-2.5">

                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-blue-100 hover:bg-white"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <ClipboardList size={16} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold text-slate-800">
                        {request.service?.name || "Service Request"}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        #{request.id} · {request.customer?.name || "Customer"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDate(request.created_at)}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </div>
                ))}

              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">

                <ClipboardList
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No recent requests
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New customer requests will appear here.
                </p>

              </div>
            )}

          </div>

          {/* System Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  System Overview
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Current database status
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Activity size={16} className="text-emerald-600" />
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">

              {/* Services */}
              <div className="flex items-center gap-3 py-3 first:pt-0">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 size={17} className="text-emerald-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Active Services
                  </p>

                  <p className="text-[11px] text-emerald-600">
                    {loading ? "..." : `${services.active ?? 0} active`}
                  </p>
                </div>

              </div>

              {/* Requests */}
              <div className="flex items-center gap-3 py-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Clock3 size={17} className="text-blue-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Searching Requests
                  </p>

                  <p className="text-[11px] text-blue-600">
                    {loading ? "..." : `${requests.searching ?? 0} searching`}
                  </p>
                </div>

              </div>

              {/* Providers */}
              <div className="flex items-center gap-3 py-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <AlertCircle size={17} className="text-amber-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Pending Verification
                  </p>

                  <p className="text-[11px] text-amber-600">
                    {loading ? "..." : `${providers.pending ?? 0} providers`}
                  </p>
                </div>

              </div>

              {/* Offline Providers */}
              <div className="flex items-center gap-3 py-3 last:pb-0">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <WifiOff size={17} className="text-slate-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Offline Providers
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {loading ? "..." : `${providers.offline ?? 0} offline`}
                  </p>
                </div>

              </div>

            </div>

            {/* Ratings */}
            <div className="mt-5 rounded-xl bg-amber-50 p-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[11px] font-medium text-amber-700">
                    Average Customer Rating
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {loading
                      ? "..."
                      : Number(reviews.average_rating ?? 0).toFixed(2)}
                    <span className="ml-1 text-sm text-amber-500">
                      / 5
                    </span>
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {reviews.total ?? 0} actual reviews
                  </p>
                </div>

                <Star size={25} className="fill-amber-400 text-amber-400" />

              </div>

            </div>

            {/* Approved Providers */}
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">

              <p className="text-[11px] font-semibold text-emerald-700">
                Approved Providers
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-800">
                {loading ? "..." : providers.approved ?? 0}
              </p>

              <p className="mt-1 text-[11px] text-emerald-600">
                Verified service providers
              </p>

            </div>

          </div>

        </section>

        {/* Recent Providers */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recently Registered Providers
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Latest providers from the database
              </p>
            </div>

            <Link
              to="/admin/providers"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
              <ArrowRight size={14} />
            </Link>

          </div>

          {loading ? (
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ) : recentProviders.length > 0 ? (

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

              {recentProviders.map((provider) => (

                <div
                  key={provider.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {provider.user?.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {provider.user?.name || "Provider"}
                      </p>

                      <p className="truncate text-[10px] text-slate-400">
                        {provider.user?.email || "—"}
                      </p>
                    </div>

                  </div>

                  <div className="mt-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        provider.verification_status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : provider.verification_status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {formatStatus(provider.verification_status)}
                    </span>
                  </div>

                </div>

              ))}

            </div>

          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              No providers registered yet.
            </p>
          )}

        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;

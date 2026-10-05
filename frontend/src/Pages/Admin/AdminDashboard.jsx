
// PATH: src/Pages/Admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import {
  Users,
  UserCog,
  Wrench,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
  DollarSign,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [user, setUser] = useState({});
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setUser(storedUser);
    } catch (error) {
      console.error("User Load Error:", error);
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [servicesResponse, requestsResponse] =
        await Promise.allSettled([
          api.get("/services"),
          api.get("/service-requests"),
        ]);

      if (
        servicesResponse.status === "fulfilled" &&
        servicesResponse.value?.data?.data
      ) {
        setServices(servicesResponse.value.data.data);
      }

      if (
        requestsResponse.status === "fulfilled" &&
        requestsResponse.value?.data?.data
      ) {
        setRequests(requestsResponse.value.data.data);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Customers",
      value: "1,247",
      change: "+12.5%",
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      link: "/admin/users",
    },
    {
      title: "Service Providers",
      value: "186",
      change: "+8.2%",
      icon: UserCog,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      link: "/admin/providers",
    },
    {
      title: "Total Revenue",
      value: "₹24,850",
      change: "+18.4%",
      icon: DollarSign,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/admin/payments",
    },
    {
      title: "Service Requests",
      value: requests.length || 328,
      change: "+4.6%",
      icon: ClipboardList,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      link: "/admin/requests",
    },
  ];

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
      description: "Verify service providers",
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
      description: "Monitor service requests",
      icon: ClipboardList,
      link: "/admin/requests",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Bookings",
      description: "Manage confirmed bookings",
      icon: CalendarCheck,
      link: "/admin/bookings",
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Reports",
      description: "View reports and analytics",
      icon: BarChart3,
      link: "/admin/reports",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const recentRequests = requests.slice(0, 5);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "service_completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";

      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-100";

      case "provider_assigned":
      case "assigned":
      case "provider_on_the_way":
      case "on_way":
        return "bg-blue-50 text-blue-700 border border-blue-100";

      case "arrived":
      case "service_started":
      case "started":
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
                  Good Afternoon, {user?.name || "Admin"} 👋
                </h1>

                <p className="mt-1.5 max-w-xl text-sm text-blue-100">
                  Manage your Quick Service Portal from one simple dashboard.
                </p>
              </div>

              <Link
                to="/admin/requests"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
              >
                <ClipboardList size={15} />
                View Requests
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
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
                      {loading ? "..." : stat.value}
                    </p>

                    <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                      ↑ {stat.change}
                      <span className="ml-1 font-normal text-slate-400">
                        this month
                      </span>
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
                {recentRequests.map((request, index) => (
                  <div
                    key={request.id || index}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-blue-100 hover:bg-white"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <ClipboardList size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {request.service?.name ||
                          request.service_name ||
                          "Service Request"}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        Request #{request.id || "—"}
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
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                  <ClipboardList
                    size={20}
                    className="text-slate-300"
                  />
                </div>

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
                  Current portal status
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Activity
                  size={16}
                  className="text-emerald-600"
                />
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">

              {/* Services */}
              <div className="flex items-center gap-3 py-3 first:pt-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2
                    size={17}
                    className="text-emerald-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Services
                  </p>

                  <p className="text-[11px] text-emerald-600">
                    System operational
                  </p>
                </div>
              </div>

              {/* Requests */}
              <div className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Clock3
                    size={17}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Requests
                  </p>

                  <p className="text-[11px] text-blue-600">
                    Monitoring active
                  </p>
                </div>
              </div>

              {/* Providers */}
              <div className="flex items-center gap-3 py-3 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <AlertCircle
                    size={17}
                    className="text-amber-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Providers
                  </p>

                  <p className="text-[11px] text-amber-600">
                    Verification required
                  </p>
                </div>
              </div>
            </div>

            {/* Service Count */}
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    Available Services
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {loading ? "..." : services.length}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Wrench
                    size={17}
                    className="text-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Admin Tip */}
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
              <p className="text-[11px] font-semibold text-blue-700">
                Admin Tip
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-600">
                Verify service providers before allowing them to accept
                customer requests.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;


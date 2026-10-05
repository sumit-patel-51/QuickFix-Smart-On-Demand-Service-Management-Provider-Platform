// PATH: src/Pages/Customer/MyBookings.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  XCircle,
  Loader2,
  ClipboardList,
  User,
  IndianRupee,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";

import api from "../../api/axios";

const MyBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /*
  |--------------------------------------------------------------------------
  | GET CUSTOMER BOOKINGS
  |--------------------------------------------------------------------------
  */
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customer/service-requests");

      if (response.data.success) {
        const allBookings = response.data.service_requests || [];

        // Show completed and cancelled requests
        const completedCancelledBookings = allBookings.filter((booking) =>
          ["service_completed", "completed", "cancelled"].includes(
            booking.status
          )
        );

        setBookings(completedCancelledBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Service History Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | STATUS STYLES & LABELS
  |--------------------------------------------------------------------------
  */
  const getStatusBadge = (status) => {
    const isCompleted = ["service_completed", "completed"].includes(status);
    if (isCompleted) {
      return {
        label: "Completed",
        icon: <CheckCircle2 size={13} className="text-emerald-600" />,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
    }
    if (status === "cancelled") {
      return {
        label: "Cancelled",
        icon: <XCircle size={13} className="text-rose-600" />,
        className: "bg-rose-50 text-rose-700 border-rose-200/80",
      };
    }
    return {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
      icon: null,
      className: "bg-slate-50 text-slate-700 border-slate-200/80",
    };
  };

  /*
  |--------------------------------------------------------------------------
  | DATE & TIME FORMATTERS
  |--------------------------------------------------------------------------
  */
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "Instant";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const completedCount = bookings.filter((booking) =>
    ["service_completed", "completed"].includes(booking.status)
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  const filteredBookings =
    statusFilter === "all"
      ? bookings
      : bookings.filter((booking) =>
          statusFilter === "completed"
            ? ["service_completed", "completed"].includes(booking.status)
            : booking.status === "cancelled"
        );

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium text-slate-500">
            Loading your bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="mb-2.5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Bookings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View your past completed services and cancellation history.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-sm border border-orange-100">
            <ClipboardList size={24} />
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Completed Metric */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed Bookings
              </p>
              <h3 className="mt-1 text-3xl font-bold text-slate-900">
                {completedCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Cancelled Metric */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cancelled Bookings
              </p>
              <h3 className="mt-1 text-3xl font-bold text-slate-900">
                {cancelledCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <XCircle size={24} />
            </div>
          </div>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "all", label: `All (${bookings.length})` },
            { value: "completed", label: `Completed (${completedCount})` },
            { value: "cancelled", label: `Cancelled (${cancelledCount})` },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                statusFilter === filter.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-600">
            <XCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && filteredBookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <ClipboardList size={30} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              No bookings found
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              You do not have any past service requests in this category.
            </p>
            <button
              onClick={() => navigate("/customer/services")}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-orange-100 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98]"
            >
              Browse Services
            </button>
          </div>
        )}

        {/* BOOKING CARDS LIST */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredBookings.map((booking) => {
            const statusInfo = getStatusBadge(booking.status);

            return (
              <div
                key={booking.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
              >
                <div>
                  {/* TOP: Service Name, ID, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Booking #{booking.id}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {formatDate(booking.created_at)}
                        </span>
                      </div>
                      <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">
                        {booking.service?.name || "Service Booking"}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs ${statusInfo.className}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* DETAILS WELL */}
                  <div className="mt-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/75 p-3.5 text-xs">
                    {/* Schedule / Type */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-slate-500">
                        {booking.request_type === "now" ? (
                          <Zap size={14} className="text-amber-500" />
                        ) : (
                          <Clock size={14} className="text-blue-500" />
                        )}
                        Schedule
                      </span>
                      <span className="font-semibold text-slate-800">
                        {booking.request_type === "scheduled" && booking.scheduled_at
                          ? `${formatDate(booking.scheduled_at)} • ${formatTime(
                              booking.scheduled_at
                            )}`
                          : "⚡ Instant Service"}
                      </span>
                    </div>

                    {/* Provider */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-slate-500">
                        <User size={14} className="text-purple-500" />
                        Provider
                      </span>
                      <span className="truncate max-w-[200px] font-semibold text-slate-800">
                        {booking.provider?.name ||
                          booking.provider?.user?.name ||
                          "Not assigned"}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start justify-between gap-3 pt-0.5">
                      <span className="flex items-center gap-1.5 shrink-0 font-medium text-slate-500">
                        <MapPin size={14} className="text-orange-500" />
                        Location
                      </span>
                      <span className="truncate max-w-[220px] text-right font-medium text-slate-600">
                        {booking.address || "Address not provided"}
                      </span>
                    </div>
                  </div>

                  {/* Problem Note if present */}
                  {booking.problem_description && (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 border border-slate-100 line-clamp-2">
                      <span className="font-semibold text-slate-700">Note: </span>
                      {booking.problem_description}
                    </div>
                  )}
                </div>

                {/* BOTTOM: Price and Action Button */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400">
                      Total Amount
                    </span>
                    <span className="flex items-center text-base font-bold text-slate-900">
                      <IndianRupee size={15} className="mr-0.5 text-emerald-600" />
                      {Number(booking.service?.base_price ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/customer/service-requests/${booking.id}`)
                    }
                    className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-100/80 px-4 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98]"
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} className="transition-transform duration-150 group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
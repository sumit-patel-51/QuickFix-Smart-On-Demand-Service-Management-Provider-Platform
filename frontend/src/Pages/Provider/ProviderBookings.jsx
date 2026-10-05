import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  User,
  MapPin,
  IndianRupee,
  CheckCircle2,
  XCircle,
  ClipboardList,
  ChevronRight,
  Clock3,
  Wrench,
  Zap,
} from "lucide-react";

import api from "../../api/axios";

function ProviderBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  // --------------------------------------------------
  // GET ACCEPTED SERVICE REQUESTS
  // --------------------------------------------------

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const response = await api.get("/provider/service-requests-accepted");

      console.log("ACCEPTED SERVICE REQUESTS API:", response.data);

      if (response.data.success) {
        // /service-requests-accepted may return the list as service_requests,
        // data, or bookings depending on the Laravel response.
        const acceptedRequests =
          response.data?.requests ||
          response.data.data ||
          [];

        setBookings(Array.isArray(acceptedRequests) ? acceptedRequests : []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching accepted service requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // STATUS HELPERS
  // --------------------------------------------------

  const isCompleted = (status) => {
    return ["service_completed", "completed"].includes(status);
  };

  const isCancelled = (status) => {
    return status === "cancelled";
  };

  const getStatusBadge = (status) => {
    if (isCompleted(status)) {
      return {
        label: "Completed",
        icon: <CheckCircle2 size={13} />,
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
    }

    if (isCancelled(status)) {
      return {
        label: "Cancelled",
        icon: <XCircle size={13} />,
        className:
          "bg-rose-50 text-rose-700 border-rose-200/80",
      };
    }

    return {
      label: status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Unknown",
      icon: null,
      className:
        "bg-slate-50 text-slate-700 border-slate-200/80",
    };
  };

  // --------------------------------------------------
  // FINAL PRICE
  // --------------------------------------------------

  const getFinalPrice = (booking) => {
    if (
      booking.final_price !== null &&
      booking.final_price !== undefined
    ) {
      return Number(booking.final_price);
    }

    const basic = Number(booking.provider_service_price || 0);
    const extra = Number(booking.extra_charges || 0);

    return basic + extra;
  };

  // --------------------------------------------------
  // COUNTS
  // --------------------------------------------------

  const completedCount = bookings.filter((booking) =>
    isCompleted(booking.status)
  ).length;

  const cancelledCount = bookings.filter((booking) =>
    isCancelled(booking.status)
  ).length;

  // --------------------------------------------------
  // FILTER + SEARCH + SORT
  // --------------------------------------------------

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Status filter
    if (statusFilter === "completed") {
      result = result.filter((booking) =>
        isCompleted(booking.status)
      );
    }

    if (statusFilter === "cancelled") {
      result = result.filter((booking) =>
        isCancelled(booking.status)
      );
    }

    // Search
    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((booking) => {
        const serviceName =
          booking.service?.name?.toLowerCase() || "";

        const serviceCategory =
          booking.service?.category?.toLowerCase() || "";

        const customerName =
          booking.customer?.name?.toLowerCase() || "";

        const customerPhone =
          booking.customer?.phone?.toLowerCase() || "";

        const address =
          booking.address?.toLowerCase() || "";

        const bookingId =
          String(booking.id || "").toLowerCase();

        const formattedBookingId =
          `#qsp-${String(booking.id)
            .padStart(5, "0")
            .toLowerCase()}`;

        const cleanBookingId =
          formattedBookingId.replace("#", "");

        return (
          serviceName.includes(searchText) ||
          serviceCategory.includes(searchText) ||
          customerName.includes(searchText) ||
          customerPhone.includes(searchText) ||
          address.includes(searchText) ||
          bookingId.includes(searchText) ||
          formattedBookingId.includes(searchText) ||
          cleanBookingId.includes(searchText)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(
        a.updated_at || a.created_at
      );

      const dateB = new Date(
        b.updated_at || b.created_at
      );

      return sortOrder === "latest"
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }, [bookings, statusFilter, search, sortOrder]);

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

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

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm font-medium text-slate-500">
            Loading your bookings...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Bookings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View your completed services and cancellation history.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
            <ClipboardList size={24} />
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Total */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Bookings
              </p>

              <h3 className="mt-1 text-3xl font-bold text-slate-900">
                {bookings.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardList size={24} />
            </div>
          </div>

          {/* Completed */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed Services
              </p>

              <h3 className="mt-1 text-3xl font-bold text-slate-900">
                {completedCount}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Cancelled */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cancelled Services
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

        {/* SEARCH + SORT */}
        <div className="flex flex-col gap-3 sm:flex-row">

          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service, customer, booking ID, phone or address..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-44"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>

        </div>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
              statusFilter === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({bookings.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Completed ({completedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("cancelled")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
              statusFilter === "cancelled"
                ? "bg-rose-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cancelled ({cancelledCount})
          </button>

        </div>

        {/* EMPTY STATE */}
        {filteredBookings.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <ClipboardList size={30} />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              No bookings found
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              You do not have any completed or cancelled bookings in this category.
            </p>

          </div>

        ) : (

          /* ------------------------------------------------
             BOOKING CARDS
          ------------------------------------------------ */

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {filteredBookings.map((booking) => {

              const statusInfo = getStatusBadge(
                booking.status
              );

              const completed = isCompleted(
                booking.status
              );

              const finalPrice = getFinalPrice(
                booking
              );

              return (
                <div
                  key={booking.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                >

                  <div>

                    {/* TOP */}
                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Booking #{booking.id}
                          </span>

                          <span className="text-xs text-slate-300">
                            •
                          </span>

                          <span className="text-[11px] font-medium text-slate-500">
                            {formatDate(
                              booking.created_at
                            )}
                          </span>

                        </div>

                        <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">
                          {booking.service?.name ||
                            "Service Booking"}
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {booking.service?.category ||
                            "Home Service"}
                        </p>

                      </div>

                      {/* STATUS */}
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs ${statusInfo.className}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>

                    </div>

                    {/* DETAILS WELL */}
                    <div className="mt-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/75 p-3.5 text-xs">

                      {/* Schedule */}
                      <div className="flex items-center justify-between gap-3">

                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          {booking.request_type === "now" ? (
                            <Zap
                              size={14}
                              className="text-amber-500"
                            />
                          ) : (
                            <Clock3
                              size={14}
                              className="text-blue-500"
                            />
                          )}

                          Schedule
                        </span>

                        <span className="text-right font-semibold text-slate-800">

                          {booking.request_type ===
                            "scheduled" &&
                          booking.scheduled_at
                            ? `${formatDate(
                                booking.scheduled_at
                              )} • ${formatTime(
                                booking.scheduled_at
                              )}`
                            : "⚡ Instant Service"}

                        </span>

                      </div>

                      {/* Customer */}
                      <div className="flex items-center justify-between gap-3">

                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <User
                            size={14}
                            className="text-purple-500"
                          />
                          Customer
                        </span>

                        <span className="max-w-[200px] truncate font-semibold text-slate-800">
                          {booking.customer?.name ||
                            "N/A"}
                        </span>

                      </div>

                      {/* Customer Phone */}
                      {booking.customer?.phone && (
                        <div className="flex items-center justify-between gap-3">

                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <User
                              size={14}
                              className="text-slate-400"
                            />
                            Contact
                          </span>

                          <span className="font-semibold text-slate-800">
                            {booking.customer.phone}
                          </span>

                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-start justify-between gap-3">

                        <span className="flex items-center gap-1.5 shrink-0 font-medium text-slate-500">
                          <MapPin
                            size={14}
                            className="text-blue-500"
                          />
                          Location
                        </span>

                        <span className="max-w-[220px] truncate text-right font-medium text-slate-600">
                          {booking.address ||
                            booking.customer?.address ||
                            "Address not provided"}
                        </span>

                      </div>

                    </div>

                    {/* Problem */}
                    {booking.problem_description && (
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 line-clamp-2">

                        <span className="font-semibold text-slate-700">
                          Customer Request:{" "}
                        </span>

                        {booking.problem_description}

                      </div>
                    )}

                  </div>

                  {/* BOTTOM */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                    {/* PRICE */}
                    <div>

                      <span className="block text-[11px] font-medium text-slate-400">
                        Total Amount
                      </span>

                      <span
                        className={`flex items-center text-base font-bold ${
                          completed
                            ? "text-emerald-600"
                            : "text-slate-700"
                        }`}
                      >
                        <IndianRupee
                          size={15}
                          className="mr-0.5"
                        />

                        {finalPrice > 0
                          ? finalPrice.toFixed(2)
                          : "N/A"}
                      </span>

                    </div>

                    {/* VIEW DETAILS */}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/provider/service-requests/${booking.id}`
                        )
                      }
                      className={`group/btn inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                        completed
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>View Details</span>

                      <ChevronRight
                        size={14}
                        className="transition-transform duration-150 group-hover/btn:translate-x-0.5"
                      />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default ProviderBookings;
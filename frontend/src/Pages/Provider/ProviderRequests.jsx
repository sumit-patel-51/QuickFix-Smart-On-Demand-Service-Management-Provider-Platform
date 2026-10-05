import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Wrench,
  Loader2,
  ChevronRight,
  Zap,
  AlertCircle,
  IndianRupee,
} from "lucide-react";

import api from "../../api/axios";

const ACTIVE_STATUSES = [
  "provider_assigned",
  "provider_on_the_way",
  "arrived",
  "service_started",
];

const ProviderRequests = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH PROVIDER REQUESTS
  // ==========================================
  const fetchRequests = async (showRefreshLoader = false) => {
    try {
      setError("");

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/provider/service-requests-accepted");
      const allRequests = response.data?.requests || [];

      // Filter only currently active accepted requests
      const activeAcceptedRequests = allRequests.filter((request) =>
        ACTIVE_STATUSES.includes(request.status)
      );

      setRequests(activeAcceptedRequests);
    } catch (err) {
      console.error("Provider requests error:", err);
      setError(
        err?.response?.data?.message || "Unable to load active service requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==========================================
  // STATUS STYLE & BADGE HELPERS
  // ==========================================
  const getStatusBadge = (status) => {
    switch (status) {
      case "provider_assigned":
        return {
          label: "Assigned",
          className: "bg-sky-50 text-sky-700 border-sky-200/80",
        };
      case "provider_on_the_way":
        return {
          label: "On the Way",
          className: "bg-blue-50 text-blue-700 border-blue-200/80",
        };
      case "arrived":
        return {
          label: "Arrived",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        };
      case "service_started":
        return {
          label: "In Progress",
          className: "bg-amber-50 text-amber-700 border-amber-200/80",
        };
      default:
        return {
          label: status?.replaceAll("_", " ") || "Active",
          className: "bg-slate-50 text-slate-700 border-slate-200/80",
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-[11px] font-semibold text-slate-500">
            Loading active requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-5">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* ==========================================
            HEADER BAR
        ========================================== */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Dispatch Queue
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-medium text-blue-600">
                {requests.length} Active {requests.length === 1 ? "Job" : "Jobs"}
              </span>
            </div>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              My Active Requests
            </h1>
            <p className="text-xs text-slate-500">
              Track and proceed with customer jobs you have accepted.
            </p>
          </div>

          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={13}
              className={`text-slate-500 ${refreshing ? "animate-spin text-blue-600" : ""}`}
            />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>

        {/* ==========================================
            ERROR NOTIFICATION
        ========================================== */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* ==========================================
            EMPTY STATE
        ========================================== */}
        {!error && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-blue-600">
              <Wrench size={22} />
            </div>

            <h2 className="text-sm font-bold text-slate-900">
              No Active Requests
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              You do not have any accepted jobs in progress. Check the dashboard to accept new incoming service requests.
            </p>

            <button
              onClick={() => navigate("/provider/dashboard")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-100/90 px-4 py-2 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* ==========================================
            ACTIVE REQUEST CARDS GRID
        ========================================== */}
        {requests.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => {
              const statusInfo = getStatusBadge(request.status);
              const customerName =
                request.customer?.name || request.user?.name || "Customer";
              const customerPhone =
                request.customer?.phone || request.user?.phone || null;

              return (
                <div
                  key={request.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="p-3.5">
                    {/* TOP: Service Info & Status Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Request #{request.id}
                        </span>
                        <h2 className="truncate text-sm font-bold text-slate-900">
                          {request.service?.name || "Service Request"}
                        </h2>
                        <p className="truncate text-[11px] font-medium text-blue-600">
                          {request.service?.category || "General Service"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* DETAILS WELL */}
                    <div className="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px]">
                      {/* Customer Info */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <User size={13} className="text-slate-400" />
                          Client
                        </span>
                        <span className="truncate max-w-[170px] font-bold text-slate-800">
                          {customerName}
                        </span>
                      </div>

                      {/* Phone if available */}
                      {customerPhone && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <Phone size={13} className="text-slate-400" />
                            Contact
                          </span>
                          <a
                            href={`tel:${customerPhone}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {customerPhone}
                          </a>
                        </div>
                      )}

                      {/* Schedule / Type */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          {request.request_type === "now" ? (
                            <Zap size={13} className="text-amber-500" />
                          ) : (
                            <Clock size={13} className="text-purple-500" />
                          )}
                          Timing
                        </span>
                        <span className="font-semibold text-slate-800">
                          {request.request_type === "now"
                            ? "⚡ Immediate Need"
                            : request.scheduled_at
                            ? formatDateTime(request.scheduled_at)
                            : "Scheduled"}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start justify-between gap-2 pt-0.5">
                        <span className="flex items-center gap-1.5 shrink-0 font-medium text-slate-500">
                          <MapPin size={13} className="text-rose-500 mt-0.5" />
                          Location
                        </span>
                        <span className="truncate max-w-[170px] text-right font-medium text-slate-700">
                          {request.address ||
                            request.customer?.address ||
                            "Location not provided"}
                        </span>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center justify-between pt-0.5 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          Accepted On
                        </span>
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </div>

                    {/* Problem Note if present */}
                    {request.problem_description && (
                      <div className="mt-2.5 rounded-lg border border-slate-100 bg-white p-2 text-[11px] text-slate-600 line-clamp-2">
                        <span className="font-bold text-slate-800">Note: </span>
                        {request.problem_description}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM: Price and Action Button */}
                  <div className="border-t border-slate-100 p-3 bg-slate-50/40">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400">
                        Service Payout
                      </span>
                      <span className="flex items-center text-xs font-bold text-slate-900">
                        <IndianRupee size={12} className="mr-0.5 text-emerald-600" />
                        {Number(request.service?.base_price || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/provider/service-requests/${request.id}`)
                      }
                      className="group/btn flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-100/90 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
                    >
                      <span>View Route & Actions</span>
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
};

export default ProviderRequests;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Calendar,
  Clock,
  Wrench,
  Loader2,
  XCircle,
  ArrowRight,
  Zap,
} from "lucide-react";
import api from "../../api/axios";

const MyRequests = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH CUSTOMER REQUESTS
  // ==========================================
  const fetchRequests = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/customer/service-requests");

      const allRequests = response.data?.service_requests || [];

      const activeRequests = allRequests.filter((request) =>
        [
          "searching",
          "provider_assigned",
          "provider_on_the_way",
          "arrived",
          "service_started",
        ].includes(request.status)
      );

      setRequests(activeRequests);
    } catch (err) {
      console.error("Fetch Requests Error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.message || "Unable to load your service requests."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==========================================
  // STATUS BADGE CONFIG
  // ==========================================
  const getStatusConfig = (status) => {
    switch (status) {
      case "searching":
        return {
          label: "Searching",
          color: "bg-amber-50 text-amber-700 border-amber-200/60",
          dot: "bg-amber-500",
        };
      case "provider_assigned":
        return {
          label: "Assigned",
          color: "bg-sky-50 text-sky-700 border-sky-200/60",
          dot: "bg-sky-500",
        };
      case "provider_on_the_way":
        return {
          label: "On The Way",
          color: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
          dot: "bg-indigo-500",
        };
      case "arrived":
        return {
          label: "Arrived",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          dot: "bg-emerald-500",
        };
      case "service_started":
        return {
          label: "In Progress",
          color: "bg-orange-50 text-orange-700 border-orange-200/60",
          dot: "bg-orange-500 animate-ping",
        };
      case "service_completed":
        return {
          label: "Completed",
          color: "bg-green-50 text-green-700 border-green-200/60",
          dot: "bg-green-500",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-rose-50 text-rose-700 border-rose-200/60",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: status || "Unknown",
          color: "bg-slate-50 text-slate-700 border-slate-200/60",
          dot: "bg-slate-400",
        };
    }
  };

  // ==========================================
  // DATE & TIME FORMAT
  // ==========================================
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium text-slate-500">
            Loading your requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Active Service Requests
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Live updates and tracking for your active home services.
            </p>
          </div>

          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin text-orange-500" : "text-slate-500"}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-700">
            <div className="flex items-center gap-2.5">
              <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => fetchRequests(true)}
              className="text-sm font-semibold underline underline-offset-2 hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <Wrench className="h-6 w-6 text-orange-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              No active service requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All ongoing or dispatched requests will show up here.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 inline-flex items-center rounded-xl bg-orange-100 px-5 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-200 active:scale-95"
            >
              Browse Services
            </button>
          </div>
        )}

        {/* REQUEST GRID */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => {
            const statusMeta = getStatusConfig(request.status);
            const isInstant = request.request_type === "now";

            return (
              <div
                key={request.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  {/* TOP ROW: Icon, Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 ring-1 ring-orange-100">
                        <Wrench className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">
                          {request.service?.name || "Service Request"}
                        </h3>
                        <p className="truncate text-xs text-slate-400">
                          {request.service?.category || "General"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta.color}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                      />
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* DETAILS CARD */}
                  <div className="mt-5 space-y-2.5 rounded-xl bg-slate-50/75 p-3 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                        {isInstant ? (
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        )}
                        Mode
                      </span>
                      <span className="font-semibold text-slate-800">
                        {isInstant ? "Instant (Now)" : "Scheduled"}
                      </span>
                    </div>

                    {request.request_type === "scheduled" &&
                      request.scheduled_at && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-purple-500" />
                            Scheduled
                          </span>
                          <span className="font-medium text-slate-800">
                            {formatDate(request.scheduled_at)} •{" "}
                            {formatTime(request.scheduled_at)}
                          </span>
                        </div>
                      )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Requested on</span>
                      <span className="text-slate-600">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION: Light Orange Button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() =>
                      navigate(`/customer/service-requests/${request.id}`)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 hover:text-orange-800 active:scale-[0.98] border border-orange-200/50"
                  >
                    <span>View Request Details</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

export default MyRequests;
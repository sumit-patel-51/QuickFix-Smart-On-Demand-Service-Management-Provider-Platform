
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle,
  Clock,
  Compass,
  MapPin,
  Navigation,
  RefreshCw,
  X,
  Zap,
  Calendar,
  IndianRupee,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

// ========================================
// REQUEST TIMER STORAGE
// ========================================
const REQUEST_EXPIRY_KEY = "provider_request_expiries";

const getRequestExpiries = () => {
  try {
    return JSON.parse(
      localStorage.getItem(REQUEST_EXPIRY_KEY) || "{}"
    );
  } catch {
    return {};
  }
};

const saveRequestExpiries = (expiries) => {
  try {
    localStorage.setItem(
      REQUEST_EXPIRY_KEY,
      JSON.stringify(expiries)
    );
  } catch (error) {
    console.error("Unable to save request expiry:", error);
  }
};

const ProviderDashboard = () => {
  const navigate = useNavigate();

  // =========================
  // CORE STATES
  // =========================
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // =========================
  // LOCATION STATES
  // =========================
  const [providerLocation, setProviderLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // =========================
  // REQUEST STATES
  // =========================
  const [requestLoading, setRequestLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [requestProcessingId, setRequestProcessingId] = useState(null);
  const [requestTimers, setRequestTimers] = useState({});

  // Local ignored list
  const [ignoredRequestIds, setIgnoredRequestIds] = useState(() => {
    try {
      const saved = localStorage.getItem("provider_ignored_requests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const ignoredRef = useRef(ignoredRequestIds);

  useEffect(() => {
    ignoredRef.current = ignoredRequestIds;
  }, [ignoredRequestIds]);

  // =========================
  // LOAD USER
  // =========================
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");

      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  // =========================
  // SAVE IGNORED REQUESTS
  // =========================
  const saveIgnored = (ids) => {
    try {
      localStorage.setItem(
        "provider_ignored_requests",
        JSON.stringify(ids)
      );
    } catch (err) {
      console.error("Unable to save ignored requests:", err);
    }
  };

  // =========================
  // HAVERSINE DISTANCE
  // =========================
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (
      lat1 == null ||
      lon1 == null ||
      lat2 == null ||
      lon2 == null
    ) {
      return null;
    }

    const nLat1 = Number(lat1);
    const nLon1 = Number(lon1);
    const nLat2 = Number(lat2);
    const nLon2 = Number(lon2);

    if (
      !Number.isFinite(nLat1) ||
      !Number.isFinite(nLon1) ||
      !Number.isFinite(nLat2) ||
      !Number.isFinite(nLon2)
    ) {
      return null;
    }

    const R = 6371;
    const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
    const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((nLat1 * Math.PI) / 180) *
        Math.cos((nLat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c).toFixed(1);
  };

  // =========================
  // FETCH DASHBOARD
  // =========================
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await api.get("/provider/dashboard");
      const data = res.data?.data || res.data;
      const provData = data?.provider || null;

      setProvider(provData);

      if (
        provData?.latitude != null &&
        provData?.longitude != null
      ) {
        setProviderLocation({
          latitude: Number(provData.latitude),
          longitude: Number(provData.longitude),
        });
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH SERVICE REQUESTS
  // =========================
  const fetchServiceRequests = async () => {
    try {
      setRequestLoading(true);

      const res = await api.get("/provider/service-requests");
      const resData = res.data;

      const rawRequests = Array.isArray(resData)
        ? resData
        : resData?.data || resData?.requests || [];

      const now = Date.now();
      const expiries = getRequestExpiries();

      // Searching and not ignored requests
      const available = rawRequests.filter(
        (r) =>
          r.status === "searching" &&
          !ignoredRef.current.includes(String(r.id))
      );

      const validRequests = [];
      const expiredIds = [];

      available.forEach((request) => {
        const id = String(request.id);

        // First time request appears
        if (!expiries[id]) {
          expiries[id] = now + 5 * 60 * 1000;
        }

        // Check actual expiry timestamp
        if (expiries[id] <= now) {
          expiredIds.push(id);
          delete expiries[id];
        } else {
          validRequests.push(request);
        }
      });

      // Save expiry timestamps
      saveRequestExpiries(expiries);

      // Expire old requests
      if (expiredIds.length > 0) {
        expiredIds.forEach((id) => {
          api
            .post(`/provider/service-requests/${id}/expire`)
            .catch((err) => {
              console.error("Request expiry error:", err);
            });
        });

        const updatedIgnored = [
          ...new Set([
            ...ignoredRef.current,
            ...expiredIds,
          ]),
        ];

        ignoredRef.current = updatedIgnored;
        setIgnoredRequestIds(updatedIgnored);
        saveIgnored(updatedIgnored);
      }

      // Calculate remaining time
      const updatedTimers = {};

      validRequests.forEach((request) => {
        const id = String(request.id);

        updatedTimers[request.id] = Math.max(
          0,
          Math.ceil((expiries[id] - now) / 1000)
        );
      });

      setRequestTimers(updatedTimers);
      setServiceRequests(validRequests);
    } catch (err) {
      console.error("Service requests error:", err);
    } finally {
      setRequestLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchDashboard();
    fetchServiceRequests();
  }, []);

  // =========================
  // POLL NEW REQUESTS EVERY 6 SECONDS
  // =========================
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchServiceRequests();
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // =========================
  // COUNTDOWN TIMER
  // Uses saved expiry timestamp
  // =========================
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const expiries = getRequestExpiries();

      const updatedTimers = {};
      const expiredIds = [];

      serviceRequests.forEach((request) => {
        const id = String(request.id);
        const expiryTime = expiries[id];

        if (!expiryTime) return;

        const remaining = Math.ceil(
          (expiryTime - now) / 1000
        );

        if (remaining <= 0) {
          expiredIds.push(id);
          delete expiries[id];
        } else {
          updatedTimers[request.id] = remaining;
        }
      });

      setRequestTimers(updatedTimers);

      if (expiredIds.length > 0) {
        saveRequestExpiries(expiries);

        expiredIds.forEach((id) => {
          api
            .post(`/provider/service-requests/${id}/expire`)
            .catch((err) => {
              console.error("Expiry API error:", err);
            });
        });

        const updatedIgnored = [
          ...new Set([
            ...ignoredRef.current,
            ...expiredIds,
          ]),
        ];

        ignoredRef.current = updatedIgnored;
        setIgnoredRequestIds(updatedIgnored);
        saveIgnored(updatedIgnored);

        setServiceRequests((prev) =>
          prev.filter(
            (request) =>
              !expiredIds.includes(String(request.id))
          )
        );
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [serviceRequests]);

  // =========================
  // FORMAT TIMER
  // =========================
  const formatTimer = (seconds = 0) => {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;

    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // =========================
  // DECLINE REQUEST
  // =========================
  const handleDeclineRequest = async (requestId) => {
    const id = String(requestId);

    try {
      setRequestProcessingId(requestId);

      await api.post(
        `/provider/service-requests/${id}/reject`
      );

      // Remove saved expiry
      const expiries = getRequestExpiries();
      delete expiries[id];
      saveRequestExpiries(expiries);

      setServiceRequests((prev) =>
        prev.filter((r) => String(r.id) !== id)
      );

      const updated = [
        ...new Set([...ignoredRef.current, id]),
      ];

      ignoredRef.current = updated;
      setIgnoredRequestIds(updated);
      saveIgnored(updated);
    } catch (err) {
      console.error("Decline error:", err);

      Swal.fire({
        icon: "error",
        title: "Unable to Decline",
        text:
          err?.response?.data?.message ||
          "This request is no longer available.",
      });
    } finally {
      setRequestProcessingId(null);
    }
  };

  // =========================
  // ACCEPT REQUEST
  // =========================
  const handleAcceptRequest = async (requestId) => {
    const id = String(requestId);

    try {
      setRequestProcessingId(requestId);

      await api.post(
        `/provider/service-requests/${id}/accept`
      );

      // Remove saved expiry
      const expiries = getRequestExpiries();
      delete expiries[id];
      saveRequestExpiries(expiries);

      setServiceRequests((prev) =>
        prev.filter((r) => String(r.id) !== id)
      );

      const updated = [
        ...new Set([...ignoredRef.current, id]),
      ];

      ignoredRef.current = updated;
      setIgnoredRequestIds(updated);
      saveIgnored(updated);

      await Swal.fire({
        icon: "success",
        title: "Request Accepted!",
        text: "Directing you to the customer route and request details.",
        timer: 1400,
        showConfirmButton: false,
      });

      navigate(`/provider/service-requests/${requestId}`);
    } catch (err) {
      console.error("Accept error:", err);

      Swal.fire({
        icon: "error",
        title: "Unable to Accept",
        text:
          err?.response?.data?.message ||
          "Failed to accept the request.",
      });
    } finally {
      setRequestProcessingId(null);
    }
  };

  // =========================
  // CURRENT LOCATION (GPS)
  // =========================
  const updateCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        setProviderLocation({
          latitude,
          longitude,
        });

        try {
          await api.put("/provider/location", {
            latitude,
            longitude,
          });
        } catch (err) {
          console.error("Location sync failed:", err);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationError(
          "Unable to acquire GPS coordinates."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      }
    );
  };

  // =========================
  // PERIODIC LOCATION PING
  // =========================
  useEffect(() => {
    if (!provider?.is_online) return;

    updateCurrentLocation();

    const interval = setInterval(
      updateCurrentLocation,
      25000
    );

    return () => clearInterval(interval);
  }, [provider?.is_online]);

  // =========================
  // ONLINE / OFFLINE TOGGLE
  // =========================
  const toggleOnlineStatus = async () => {
    if (!provider) return;

    try {
      setStatusLoading(true);

      const newStatus = !provider.is_online;

      const res = await api.post(
        "/provider/update-status",
        {
          is_online: newStatus,
          availability_status: newStatus
            ? "online"
            : "offline",
        }
      );

      const updated =
        res.data?.provider ||
        res.data?.data?.provider || {
          ...provider,
          is_online: newStatus,
        };

      setProvider(updated);

      if (newStatus) {
        updateCurrentLocation();
      }
    } catch (err) {
      console.error("Status update error:", err);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          err?.response?.data?.message ||
          "Could not change status.",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // =========================
  // LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-2.5">
          <RefreshCw
            size={28}
            className="animate-spin text-blue-600"
          />
          <p className="text-xs font-semibold text-slate-500">
            Loading provider dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD UI
  // =========================
  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER & AVAILABILITY BAR */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Partner Console
              </span>

              <span className="text-xs text-slate-300">•</span>

              <span className="text-xs font-medium text-blue-600">
                QuickService Pro
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Welcome,{" "}
                {user?.name ||
                  provider?.name ||
                  "Service Partner"}
              </h1>

              {provider?.verification_status === "approved" && (
                <BadgeCheck
                  size={20}
                  className="text-blue-600"
                />
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Accept jobs, track customer locations, and manage incoming requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Manual Refresh */}
            <button
              onClick={() => {
                fetchDashboard();
                fetchServiceRequests();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-blue-200 hover:bg-sky-50 hover:text-blue-700 active:scale-95"
              title="Refresh Requests"
            >
              <RefreshCw
                size={16}
                className={
                  requestLoading
                    ? "animate-spin text-blue-600"
                    : ""
                }
              />
            </button>

            {/* Online Toggle */}
            <button
              onClick={toggleOnlineStatus}
              disabled={statusLoading}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2 transition-all active:scale-[0.98] disabled:opacity-60 ${
                provider?.is_online
                  ? "border-sky-200 bg-sky-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    provider?.is_online
                      ? "bg-emerald-500 ring-4 ring-emerald-100"
                      : "bg-slate-400"
                  }`}
                />

                <span className="text-xs font-bold sm:text-sm">
                  {statusLoading
                    ? "Updating..."
                    : provider?.is_online
                    ? "Online"
                    : "Offline"}
                </span>
              </div>

              <div
                className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${
                  provider?.is_online
                    ? "bg-blue-600"
                    : "bg-slate-300"
                }`}
              >
                <div
                  className={`h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform ${
                    provider?.is_online
                      ? "translate-x-4"
                      : "translate-x-1"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* PROVIDER GPS LOCATION BAR */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-blue-600">
              <Navigation size={18} />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">
                {providerLocation
                  ? `GPS: ${providerLocation.latitude.toFixed(4)}, ${providerLocation.longitude.toFixed(4)}`
                  : "GPS Coordinates Missing"}
              </p>

              <p className="text-[11px] text-slate-400">
                {locationError ? (
                  <span className="text-rose-500">
                    {locationError}
                  </span>
                ) : (
                  "Required to calculate accurate distance to customer requests"
                )}
              </p>
            </div>
          </div>

          <button
            onClick={updateCurrentLocation}
            disabled={locationLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-100/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-sky-200 active:scale-95 disabled:opacity-60"
          >
            <Compass
              size={14}
              className={
                locationLoading
                  ? "animate-spin text-blue-600"
                  : ""
              }
            />

            {locationLoading
              ? "Acquiring..."
              : "Update GPS"}
          </button>
        </div>

        {/* NEW SERVICE REQUESTS */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Available Service Requests
              </h2>

              <p className="text-xs text-slate-500">
                Incoming nearby jobs waiting for your response.
              </p>
            </div>

            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {serviceRequests.length} Available
            </span>
          </div>

          {serviceRequests.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-blue-600">
                <Briefcase size={26} />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                No active service requests
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                {provider?.is_online
                  ? "You are currently online. New neighborhood job alerts will appear here automatically."
                  : "You are currently offline. Turn your availability switch to Online above to receive jobs."}
              </p>
            </div>
          ) : (
            /* REQUEST CARDS */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {serviceRequests.map((request) => {
                const distance = calculateDistance(
                  providerLocation?.latitude,
                  providerLocation?.longitude,
                  request.latitude,
                  request.longitude
                );

                const timerLeft =
                  requestTimers[request.id] ?? 300;

                const isProcessing =
                  requestProcessingId === request.id;

                return (
                  <div
                    key={request.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-sky-300 hover:shadow-md"
                  >
                    <div>
                      {/* CARD HEADER */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Request #{request.id}
                          </span>

                          <h3 className="truncate text-base font-bold text-slate-900">
                            {request.service?.name ||
                              "Service Request"}
                          </h3>

                          <p className="truncate text-xs font-medium text-slate-500">
                            {request.service?.category ||
                              "General"}
                          </p>
                        </div>

                        {/* COUNTDOWN */}
                        <div
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            timerLeft <= 60
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <Clock size={12} />
                          <span>{formatTimer(timerLeft)}</span>
                        </div>
                      </div>

                      {/* REQUEST DETAILS */}
                      <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">

                        {/* Request Type */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <Zap
                              size={13}
                              className="text-amber-500"
                            />
                            Booking Type
                          </span>

                          <span className="font-semibold text-slate-800">
                            {request.request_type === "now"
                              ? "⚡ Immediate"
                              : "📅 Scheduled"}
                          </span>
                        </div>

                        {/* Address */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex shrink-0 items-center gap-1.5 font-medium text-slate-500">
                            <MapPin
                              size={13}
                              className="text-rose-500"
                            />
                            Address
                          </span>

                          <span className="max-w-[190px] truncate text-right font-medium text-slate-700">
                            {request.address ||
                              "Address provided on booking"}
                          </span>
                        </div>

                        {/* Distance */}
                        {distance !== null && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-slate-500">
                              <Compass
                                size={13}
                                className="text-blue-500"
                              />
                              Approx. Distance
                            </span>

                            <span className="font-bold text-blue-700">
                              {distance} km away
                            </span>
                          </div>
                        )}

                        {/* Scheduled Time */}
                        {request.scheduled_at && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-slate-500">
                              <Calendar
                                size={13}
                                className="text-purple-500"
                              />
                              Scheduled For
                            </span>

                            <span className="font-semibold text-slate-800">
                              {new Date(
                                request.scheduled_at
                              ).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* PROBLEM DESCRIPTION */}
                      {request.problem_description && (
                        <div className="mt-3 line-clamp-2 rounded-lg border border-slate-100 bg-white p-2.5 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            Note:{" "}
                          </span>
                          {request.problem_description}
                        </div>
                      )}
                    </div>

                    {/* CARD FOOTER */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                          Base Payout
                        </span>

                        <span className="flex items-center text-sm font-bold text-slate-900">
                          <IndianRupee
                            size={14}
                            className="mr-0.5 text-emerald-600"
                          />

                          {Number(
                            request.service?.base_price || 0
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* DECLINE */}
                        <button
                          onClick={() =>
                            handleDeclineRequest(request.id)
                          }
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                        >
                          <X size={14} />
                          Decline
                        </button>

                        {/* ACCEPT */}
                        <button
                          onClick={() =>
                            handleAcceptRequest(request.id)
                          }
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1 rounded-xl bg-sky-100/90 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw
                              size={14}
                              className="animate-spin text-blue-600"
                            />
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Accept Job
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;

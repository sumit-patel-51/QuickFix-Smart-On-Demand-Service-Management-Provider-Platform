import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Wrench,
  Clock,
  CheckCircle,
  Navigation,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  Compass,
  Radio,
  X,
  MessageCircle,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ChatBox from "../../components/ChatBox";
import useChatUnread from "../../firebase/hooks/useChatUnread";
import api from "../../api/axios";
import useChatPresenceWriter from "../../firebase/hooks/useChatPresenceWriter";

// CUSTOMER ICON
const customerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32],
});

// COMPACT PROVIDER BIKE ICON
const providerIcon = L.divIcon({
  className: "provider-bike-marker",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      background: #0284c7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2.5px solid white;
      box-shadow: 0 3px 10px rgba(2, 132, 199, 0.4);
      font-size: 15px;
    ">
      🛵
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

// MAP RE-CENTER
const MapCenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [position, map]);
  return null;
};

// SMOOTH PROVIDER MARKER
const SmoothProviderMarker = ({ position }) => {
  const markerRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!position || !markerRef.current) return;
    const marker = markerRef.current;
    const current = marker.getLatLng();
    const startLat = current.lat;
    const startLng = current.lng;
    const endLat = position[0];
    const endLng = position[1];

    if (startLat === endLat && startLng === endLng) return;

    const duration = 1200;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        marker.setLatLng([endLat, endLng]);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={providerIcon}>
      <Popup>
        <div className="p-0.5 text-[11px]">
          <strong className="text-slate-900">Your Location</strong>
          <p className="text-slate-500 mt-0.5">Live provider coordinates</p>
        </div>
      </Popup>
    </Marker>
  );
};

// HAVERSINE DISTANCE
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

  const R = 6371;
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const ProviderRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [providerLocation, setProviderLocation] = useState(null);
  //revide provider to customer
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewError, setReviewError] = useState("");
  //chat states
  const [showChat, setShowChat] = useState(false);
  const providerUserId =
    request?.provider?.user_id ||
    request?.provider?.user?.id ||
    request?.provider?.id;

  useChatPresenceWriter({
    requestId: request?.id,
    currentUserId: providerUserId,
  });

  const unreadCount = useChatUnread({
    requestId: request?.id,
    currentUserId: providerUserId,
  });

  const fetchExistingReview = async () => {
    if (!request?.customer?.id && !request?.user?.id) return;

    const customerId = request?.customer?.id || request?.user?.id;

    try {
      console.log("Checking review for customer:", customerId);

      const response = await api.get(
        `/provider/customers/${customerId}/review-status`,
      );

      if (response.data.has_reviewed) {
        setExistingReview(response.data.review);
        setReviewSubmitted(true);
        setShowReviewModal(false);
      } else {
        setExistingReview(null);
        setReviewSubmitted(false);
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error(
        "Existing customer review error:",
        err.response?.data || err,
      );
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError("Please select a rating.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");

      const response = await api.post(
        `/provider/service-requests/${id}/review`,
        {
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        },
      );

      if (response.data.success) {
        setExistingReview(
          response.data.review || {
            rating: reviewRating,
            comment: reviewComment.trim() || null,
          },
        );

        setReviewSubmitted(true);
        setShowReviewModal(false);

        setSuccess(
          response.data.message || "Customer review submitted successfully.",
        );
      } else {
        setReviewError(response.data.message || "Unable to submit review.");
      }
    } catch (err) {
      console.error("Provider Review Error:", err.response?.data || err);

      setReviewError(
        err.response?.data?.message ||
          "Unable to submit review. Please try again.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (request?.status === "service_completed") {
      fetchExistingReview();
    }
  }, [request?.status, request?.customer?.id, request?.user?.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/provider/service-requests/${id}`);
      if (response.data.success) {
        setRequest(response.data.request || response.data.service_request);
      } else {
        setError(response.data.message || "Unable to load request.");
      }
    } catch (err) {
      console.error("Request Fetch Error:", err);
      setError(
        err.response?.data?.message || "Unable to load service request.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderLocation = async () => {
    try {
      setLocationLoading(true);
      const response = await api.get(
        `/provider/service-requests/${id}/live-location`,
      );
      if (response.data.success && response.data.provider_location) {
        const location = response.data.provider_location;
        const lat = Number(location.latitude);
        const lng = Number(location.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setProviderLocation([lat, lng]);
        }
      }
    } catch (err) {
      console.error("Provider Location Error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  useEffect(() => {
    if (!request) return;
    const liveStatuses = [
      "provider_assigned",
      "provider_on_the_way",
      "arrived",
      "service_started",
    ];
    if (!liveStatuses.includes(request.status)) return;

    fetchProviderLocation();
    const interval = setInterval(fetchProviderLocation, 10000);
    return () => clearInterval(interval);
  }, [request?.status, id]);

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");
      const response = await api.put(
        `/provider/service-requests/${id}/status`,
        {
          status: newStatus,
        },
      );

      if (response.data.success) {
        setRequest(response.data.request || response.data.service_request);
        setSuccess(response.data.message || "Status updated.");
        fetchProviderLocation();
      } else {
        setError(response.data.message || "Unable to update status.");
      }
    } catch (err) {
      console.error("Status Update Error:", err);
      setError(
        err.response?.data?.message || "Unable to update request status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const cancelRequest = async () => {
    if (!window.confirm("Are you sure you want to cancel this service job?"))
      return;
    try {
      setUpdating(true);
      setError("");
      setSuccess("");
      const response = await api.post(
        `/provider/service-requests/${id}/cancel`,
      );
      if (response.data.success) {
        setRequest((prev) => ({ ...prev, status: "cancelled" }));
        setSuccess("Job cancelled successfully.");
      } else {
        setError(response.data.message || "Unable to cancel request.");
      }
    } catch (err) {
      console.error("Cancel Error:", err);
      setError(err.response?.data?.message || "Unable to cancel request.");
    } finally {
      setUpdating(false);
    }
  };

  const getNextAction = () => {
    if (!request) return null;
    switch (request.status) {
      case "provider_assigned":
        return {
          status: "provider_on_the_way",
          label: "Start Journey",
          icon: Navigation,
        };
      case "provider_on_the_way":
        return {
          status: "arrived",
          label: "Mark Arrived",
          icon: MapPin,
        };
      case "arrived":
        return {
          status: "service_started",
          label: "Start Service",
          icon: Play,
        };
      case "service_started":
        return {
          status: "service_completed",
          label: "Complete Service",
          icon: CheckCircle,
        };
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "provider_assigned":
        return {
          label: "Assigned",
          className: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "provider_on_the_way":
        return {
          label: "On Way",
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "arrived":
        return {
          label: "Arrived",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "service_started":
        return {
          label: "In Progress",
          className: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "service_completed":
        return {
          label: "Completed",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-rose-50 text-rose-700 border-rose-200",
        };
      default:
        return {
          label: status?.replaceAll("_", " ") || "In Review",
          className: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <p className="text-[11px] font-semibold text-slate-500">
            Loading details...
          </p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-4">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs">
            <AlertCircle size={30} className="mx-auto text-rose-500 mb-2" />
            <h2 className="text-sm font-bold text-slate-900">
              Request Not Found
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {error || "Unable to find this request."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const customerPosition =
    request.latitude && request.longitude
      ? [Number(request.latitude), Number(request.longitude)]
      : null;

  const currentProviderPosition = providerLocation;
  const routeLine =
    customerPosition && currentProviderPosition
      ? [currentProviderPosition, customerPosition]
      : [];

  const distanceKm =
    customerPosition && currentProviderPosition
      ? calculateDistance(
          currentProviderPosition[0],
          currentProviderPosition[1],
          customerPosition[0],
          customerPosition[1],
        )
      : null;

  const nextAction = getNextAction();
  const statusInfo = getStatusBadge(request.status);
  const canCancel = [
    "provider_assigned",
    "provider_on_the_way",
    "arrived",
  ].includes(request.status);

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-5">
      <div className="mx-auto max-w-5xl space-y-3.5">
        {/* TOP BAR NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back to Dashboard
          </button>

          <button
            onClick={() => {
              fetchRequest();
              fetchProviderLocation();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
          >
            <RefreshCw
              size={11}
              className={
                locationLoading
                  ? "animate-spin text-blue-600"
                  : "text-slate-400"
              }
            />
            Sync
          </button>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle size={14} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-800">
            <AlertCircle size={14} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. COMPACT MAP CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {/* MAP HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-blue-600">
                <Navigation size={14} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 leading-none">
                  Live Dispatch Navigation
                </h2>
                <span className="text-[10px] text-slate-400">
                  Real-time GPS tracking
                </span>
              </div>
            </div>

            {currentProviderPosition ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">Locating...</span>
            )}
          </div>

          {/* MAP CANVAS */}
          <div className="relative h-[240px] w-full sm:h-[280px]">
            {customerPosition ? (
              <MapContainer
                center={currentProviderPosition || customerPosition}
                zoom={14}
                scrollWheelZoom={false}
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapCenter
                  position={currentProviderPosition || customerPosition}
                />

                <Marker position={customerPosition} icon={customerIcon}>
                  <Popup>
                    <div className="p-0.5 text-[11px]">
                      <strong className="text-slate-900">Destination</strong>
                      <p className="text-slate-500 mt-0.5">
                        {request.address || "Customer location"}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                {currentProviderPosition && (
                  <SmoothProviderMarker position={currentProviderPosition} />
                )}

                {routeLine.length === 2 && (
                  <Polyline
                    positions={routeLine}
                    pathOptions={{
                      color: "#0284c7",
                      weight: 3,
                      opacity: 0.8,
                      dashArray: "6, 6",
                    }}
                  />
                )}
              </MapContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <MapPin size={28} className="text-slate-300 mb-1" />
                <p className="text-[11px] text-slate-500">
                  Customer coordinates not provided
                </p>
              </div>
            )}
          </div>

          {/* MAP METRICS STRIP */}
          <div className="grid grid-cols-3 divide-x border-t border-slate-100 bg-slate-50/60 text-center py-2 px-1 text-[11px]">
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                Distance
              </span>
              <span className="font-bold text-slate-800">
                {distanceKm ? `${distanceKm} km` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                GPS Sync
              </span>
              <span className="font-bold text-slate-800">
                {locationLoading ? "Syncing..." : "Active"}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                Phase
              </span>
              <span className="font-bold text-slate-800">
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* 2. COMPACT ACTION BANNER */}
        {(nextAction || canCancel) && (
          <div className="flex flex-col gap-2 rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/80 via-sky-100/40 to-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800">
                Job Milestone
              </span>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">
                {statusInfo.label}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {canCancel && (
                <button
                  type="button"
                  onClick={cancelRequest}
                  disabled={updating}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}

              {nextAction && (
                <button
                  type="button"
                  onClick={() => updateStatus(nextAction.status)}
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100/90 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 active:scale-95 disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={13} className="animate-spin text-blue-600" />
                  ) : (
                    <nextAction.icon size={13} />
                  )}
                  <span>{nextAction.label}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. COMPACT TWO-COLUMN CARDS */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* CUSTOMER CARD */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">Customer</h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  #{request.id}
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-blue-600">
                    <User size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {request.customer?.name ||
                        request.user?.name ||
                        "Customer"}
                    </p>
                    <p className="text-[10px] text-slate-400">Client</p>
                  </div>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px]">
                  {(request.customer?.phone || request.user?.phone) && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={12} className="text-slate-400" />
                      <span className="font-semibold">
                        {request.customer?.phone || request.user?.phone}
                      </span>
                    </div>
                  )}

                  {(request.customer?.email || request.user?.email) && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail size={12} className="text-slate-400" />
                      <span className="truncate">
                        {request.customer?.email || request.user?.email}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 pt-0.5 text-slate-700">
                    <MapPin
                      size={12}
                      className="mt-0.5 shrink-0 text-rose-500"
                    />
                    <span className="leading-tight line-clamp-2">
                      {request.address || "Address not provided"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
              {(request.customer?.phone || request.user?.phone) && (
                <a
                  href={`tel:${request.customer?.phone || request.user?.phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-100/80 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 active:scale-95"
                >
                  <Phone size={12} />
                  Call
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
              >
                <MessageCircle size={16} />

                <span>Chat</span>

                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
            {showChat && (
              <div className="fixed bottom-5 right-5 z-[2000]">
                <ChatBox
                  requestId={request.id}
                  currentUserId={
                    request.provider?.user_id ||
                    request.provider?.user?.id ||
                    request.provider?.id
                  }
                  currentUserRole="provider"
                  otherUserId={
                    request?.customer?.id ||
                    request?.customer?.user_id ||
                    request?.user?.id ||
                    request?.customer_id
                  }
                   otherUserName={
                    request.customer?.user?.name ||
                    request.customer?.name ||
                    "Customer"
                  }
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}
          </div>

          {/* SERVICE DETAILS CARD */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Wrench size={14} className="text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    Service Info
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <div className="mt-2.5 space-y-2 text-[11px]">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                      Service
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {request.service?.name || "Request"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                      Payout
                    </span>
                    <p className="flex items-center text-xs font-extrabold text-slate-900">
                      <IndianRupee size={11} className="text-emerald-600" />
                      {Number(request.service?.base_price || 0).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-1.5">
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Clock size={12} className="text-blue-500" />
                    Type
                  </span>
                  <span className="font-semibold text-slate-800">
                    {request.request_type === "now" ? "⚡ Now" : "📅 Scheduled"}
                  </span>
                </div>

                {request.scheduled_at && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock size={12} className="text-purple-500" />
                      Time
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(request.scheduled_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {request.problem_description && (
              <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2 text-[11px] text-slate-600 line-clamp-2">
                <span className="font-bold text-slate-800">Note: </span>
                {request.problem_description}
              </div>
            )}
          </div>
        </div>
        {/* EXISTING CUSTOMER REVIEW (PROVIDER PERSPECTIVE) */}
        {request.status === "service_completed" && existingReview && (
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
              {/* Top indicator bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400" />

              {/* HEADER */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-blue-600 shadow-2xs">
                    <User size={16} />
                  </div>

                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Your Customer Review
                    </span>

                    <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                      {request.customer?.name ||
                        request.user?.name ||
                        "Customer"}
                    </p>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center tracking-tight">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs leading-none ${
                              star <= Number(existingReview.rating)
                                ? "text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)]"
                                : "text-slate-200"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {Number(existingReview.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Submitted
                </span>
              </div>

              {/* COMMENT BOX */}
              {existingReview.comment && (
                <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/75 p-2.5">
                  <p className="text-[11px] leading-relaxed text-slate-600 italic">
                    "{existingReview.comment}"
                  </p>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Feedback recorded on QuickFix</span>
                <span className="text-emerald-600 font-medium">Thank you!</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROVIDER REVIEW SECTION */}

      {/* COMPACT REVIEW CARD (BOTTOM RIGHT, NO BLUR) */}
      {request.status === "service_completed" &&
        showReviewModal &&
        !reviewSubmitted && (
          <div className="fixed bottom-5 right-5 z-[1000] w-[310px] max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* TOP ACCENT BAR */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-500" />

              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Dismiss"
              >
                <X size={15} />
              </button>

              {/* CUSTOMER HEADER */}
              <div className="flex items-center gap-2.5 pr-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-blue-600">
                  <User size={16} />
                </div>

                <div className="min-w-0">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Rate Customer
                  </span>
                  <h3 className="truncate text-xs font-bold text-slate-900 leading-tight">
                    {request.customer?.name ||
                      request.user?.name ||
                      "Your Customer"}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Service Completed
                  </span>
                </div>
              </div>

              {/* RATING WELL */}
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
                <p className="text-xs font-bold text-slate-800">
                  How was your experience?
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Rate your interaction with the customer
                </p>

                {/* STAR SELECTION */}
                <div className="mt-1.5 flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setReviewRating(star);
                        if (setReviewError) setReviewError("");
                      }}
                      className="transition-transform duration-150 hover:scale-125 active:scale-95"
                    >
                      <span
                        className={`text-xl transition-colors ${
                          star <= reviewRating
                            ? "text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.35)]"
                            : "text-slate-200 hover:text-amber-200"
                        }`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>

                {/* DYNAMIC FEEDBACK TEXT */}
                {reviewRating > 0 && (
                  <p className="mt-1 text-[10px] font-semibold text-sky-800 animate-in fade-in duration-200">
                    {reviewRating === 5 && "Excellent customer! ⭐"}
                    {reviewRating === 4 && "Great customer experience!"}
                    {reviewRating === 3 && "Good & professional."}
                    {reviewRating === 2 && "Could be better."}
                    {reviewRating === 1 && "Difficult interaction."}
                  </p>
                )}
              </div>

              {/* COMMENT INPUT */}
              <div className="mt-2.5">
                <textarea
                  value={reviewComment}
                  onChange={(e) => {
                    setReviewComment(e.target.value);
                    if (setReviewError) setReviewError("");
                  }}
                  placeholder="Leave notes on client punctuality, location clarity, etc. (optional)..."
                  rows={2}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* INLINE ERROR */}
              {reviewError && (
                <div className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-600">
                  {reviewError}
                </div>
              )}

              {/* ACTIONS */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                >
                  Later
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || reviewRating === 0}
                  className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-100/90 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {reviewSubmitting ? (
                    <>
                      <Loader2
                        size={13}
                        className="animate-spin text-blue-600"
                      />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ProviderRequestDetails;

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Wrench,
  XCircle,
  CheckCircle,
  Navigation,
  RefreshCw,
  Bike,
  IndianRupee,
  FileText,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ChatBox from "../../components/ChatBox";
import api from "../../api/axios";
import useChatUnread from "../../firebase/hooks/useChatUnread";
import useChatPresenceWriter from "../../firebase/hooks/useChatPresenceWriter";

/*
|--------------------------------------------------------------------------
| FIX LEAFLET DEFAULT MARKER ICON
|--------------------------------------------------------------------------
*/
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/*
|--------------------------------------------------------------------------
| CUSTOM PROVIDER BIKE ICON
|--------------------------------------------------------------------------
*/
const providerVehicleIcon = L.divIcon({
  className: "provider-vehicle-marker",
  html: `
    <div style="
      width: 44px;
      height: 44px;
      background: #f97316;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"></circle>
        <circle cx="18.5" cy="17.5" r="3.5"></circle>
        <path d="M5.5 17.5 8 9h5l5.5 8.5"></path>
        <path d="M8 9h5l2.5 3.5h-6"></path>
        <path d="M13 9V6.5"></path>
        <path d="M11.5 6.5h3"></path>
      </svg>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

/*
|--------------------------------------------------------------------------
| HAVERSINE DISTANCE FORMULA
|--------------------------------------------------------------------------
*/
const calculateDistance = (latitude1, longitude1, latitude2, longitude2) => {
  const earthRadius = 6371;
  const lat1 = Number(latitude1);
  const lon1 = Number(longitude1);
  const lat2 = Number(latitude2);
  const lon2 = Number(longitude2);

  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const formatDistance = (distance) => {
  if (distance === null) return "Distance unavailable";
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(1)} km`;
};

/*
|--------------------------------------------------------------------------
| SMOOTH ANIMATING PROVIDER MARKER
|--------------------------------------------------------------------------
*/
function MovingProviderMarker({ position, distance, lastUpdated }) {
  const markerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const initialPositionRef = useRef([
    Number(position.latitude),
    Number(position.longitude),
  ]);

  useEffect(() => {
    if (!markerRef.current || !position) return;
    const marker = markerRef.current;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const currentPosition = marker.getLatLng();
    const newPosition = L.latLng(
      Number(position.latitude),
      Number(position.longitude),
    );

    if (
      currentPosition.lat === newPosition.lat &&
      currentPosition.lng === newPosition.lng
    ) {
      return;
    }

    const startLat = currentPosition.lat;
    const startLng = currentPosition.lng;
    const endLat = newPosition.lat;
    const endLng = newPosition.lng;

    const duration = 1000;
    const startTime = performance.now();

    const animateMarker = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;

      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateMarker);
      } else {
        marker.setLatLng([endLat, endLng]);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateMarker);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={initialPositionRef.current}
      icon={providerVehicleIcon}
    >
      <Popup>
        <div className="min-w-[190px] p-1">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
            <Bike size={18} className="text-orange-600" />
            Provider Location
          </div>
          <p className="text-xs text-slate-600">
            {position.is_online
              ? "🟢 Provider is online"
              : "⚪ Provider is offline"}
          </p>
          {distance !== null && (
            <p className="text-xs font-semibold text-orange-600 mt-1.5">
              {formatDistance(distance)} away
            </p>
          )}
          {lastUpdated && (
            <p className="text-[11px] text-slate-400 mt-1">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS CONFIG
|--------------------------------------------------------------------------
*/
const statusConfig = {
  searching: {
    label: "Searching Provider",
    className: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  provider_assigned: {
    label: "Provider Assigned",
    className: "bg-blue-50 text-blue-700 border-blue-200/80",
  },
  provider_on_the_way: {
    label: "Provider On The Way",
    className: "bg-purple-50 text-purple-700 border-purple-200/80",
  },
  arrived: {
    label: "Provider Arrived",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  },
  service_started: {
    label: "Service Started",
    className: "bg-orange-50 text-orange-700 border-orange-200/80",
  },
  service_completed: {
    label: "Service Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
};

const formatStatus = (status) => {
  return (
    statusConfig[status] || {
      label: status
        ? status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Unknown",
      className: "bg-slate-50 text-slate-700 border-slate-200/80",
    }
  );
};

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/
export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [providerLocation, setProviderLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Review states (Initialized properly to null/false)
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  //chat states
  const [showChat, setShowChat] = useState(false);
  const customerUserId =
    request?.customer?.id || request?.user?.id || request?.customer_id;

  useChatPresenceWriter({
    requestId: request?.id,
    currentUserId: customerUserId,
  });

  const unreadCount = useChatUnread({
    requestId: request?.id,
    currentUserId: customerUserId,
  });

  // Fetch Existing Review
  const fetchExistingReview = async () => {
    if (!request?.provider?.id) return;
    const providerId = request.provider.id;

    try {
      const response = await api.get(
        `/customer/providers/${providerId}/review-status`,
      );

      if (response.data?.success && response.data?.review) {
        setExistingReview(response.data.review);
        setReviewSubmitted(true);
        setShowReviewModal(false);
      } else {
        setExistingReview(null);
        setReviewSubmitted(false);
        setShowReviewModal(true);
      }
    } catch (err) {
      if (
        err.response?.status === 404 ||
        err.response?.data?.has_reviewed === false
      ) {
        setExistingReview(null);
        setReviewSubmitted(false);
        setShowReviewModal(true);
        return;
      }
      console.error("Existing review error:", err);
    }
  };

  useEffect(() => {
    if (request?.status === "service_completed") {
      fetchExistingReview();
    }
  }, [request?.status, request?.provider?.id]);

  const fetchRequest = async () => {
    try {
      setError("");
      const response = await api.get(`/customer/service-requests/${id}`);
      if (response.data.success) {
        setRequest(response.data.service_request);
      }
    } catch (err) {
      console.error("Request details error:", err);
      setError(
        err.response?.data?.message || "Unable to load request details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderLocation = async () => {
    if (!id) return;
    try {
      setLocationLoading(true);
      setLocationError("");
      const response = await api.get(
        `/customer/service-requests/${id}/provider-location`,
      );
      if (response.data.success) {
        const location = response.data.provider_location || null;
        setProviderLocation(location);
        if (location) {
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.error("Provider location error:", err);
      setLocationError(
        err.response?.data?.message || "Unable to load provider location.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  useEffect(() => {
    if (!request) return;

    const activeStatuses = [
      "provider_assigned",
      "provider_on_the_way",
      "arrived",
      "service_started",
    ];

    if (!activeStatuses.includes(request.status)) {
      setProviderLocation(null);
      setLastUpdated(null);
      return;
    }

    fetchProviderLocation();
    const interval = setInterval(() => {
      fetchProviderLocation();
    }, 10000);

    return () => clearInterval(interval);
  }, [request?.status, id]);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this service request?",
    );
    if (!confirmed) return;

    try {
      setCancelLoading(true);
      const response = await api.post(
        `/customer/service-requests/${id}/cancel`,
      );
      if (response.data.success) {
        setRequest(response.data.service_request);
        setProviderLocation(null);
        setLastUpdated(null);
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.message || "Unable to cancel request.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Submit Review Handle
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError("Please select a rating.");
      return;
    }

    if (!request?.provider) {
      setReviewError("Provider information is not available.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");

      const response = await api.post(
        `/customer/service-requests/${id}/review`,
        {
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        },
      );

      if (response.data.success) {
        const savedReview = response.data.review || {
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        };
        setExistingReview(savedReview);
        setReviewSubmitted(true);
        setShowReviewModal(false);
      }
    } catch (err) {
      console.error("Review submission error:", err);
      setReviewError(
        err.response?.data?.message ||
          "Unable to submit your review. Please try again.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return "Not available";
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return lastUpdated.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium text-slate-500">
            Loading request details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/customer/my-requests")}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 transition hover:bg-slate-50 mb-6"
          >
            <ArrowLeft size={16} />
            Back to My Requests
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Request Not Found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {error || "Unable to locate this service request."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const status = formatStatus(request.status);
  const customerLatitude = Number(request.latitude);
  const customerLongitude = Number(request.longitude);
  const providerLatitude = providerLocation
    ? Number(providerLocation.latitude)
    : null;
  const providerLongitude = providerLocation
    ? Number(providerLocation.longitude)
    : null;

  const hasCustomerLocation =
    Number.isFinite(customerLatitude) && Number.isFinite(customerLongitude);
  const hasProviderLocation =
    Number.isFinite(providerLatitude) && Number.isFinite(providerLongitude);

  const providerDistance =
    hasCustomerLocation && hasProviderLocation
      ? calculateDistance(
          customerLatitude,
          customerLongitude,
          providerLatitude,
          providerLongitude,
        )
      : null;

  const canCancel = [
    "searching",
    "provider_assigned",
    "provider_on_the_way",
    "arrived",
  ].includes(request.status);

  return (
    <div className="min-h-screen relative bg-slate-50/60 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/customer/my-requests")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
          >
            <ArrowLeft size={18} />
            Back to My Requests
          </button>

          <button
            onClick={() => {
              fetchRequest();
              if (hasCustomerLocation) fetchProviderLocation();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <RefreshCw size={14} className="text-slate-400" />
            Refresh
          </button>
        </div>

        {/* HERO STATUS CARD */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Service Request
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">
                ID #{request.id}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {request.service?.name || "Service Request"}
            </h1>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-1.5 text-xs font-semibold shadow-xs md:self-auto ${status.className}`}
          >
            <span className="h-2 w-2 rounded-full bg-current"></span>
            {status.label}
          </div>
        </div>

        {/* LIVE TRACKING MAP */}
        {hasCustomerLocation && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {/* MAP HEADER */}
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Navigation size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Live Route & Provider Tracking
                  </h2>
                  <p className="text-xs text-slate-500">
                    {hasProviderLocation
                      ? "Real-time updates active"
                      : "Waiting for provider coordinates..."}
                  </p>
                </div>
              </div>

              {hasProviderLocation && (
                <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-500">
                  <Clock size={14} className="text-slate-400" />
                  <span>Updated: {getLastUpdatedText()}</span>
                </div>
              )}
            </div>

            {/* LEAFLET CONTAINER */}
            <div className="relative h-[380px] w-full">
              <MapContainer
                center={[customerLatitude, customerLongitude]}
                zoom={14}
                scrollWheelZoom={false}
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[customerLatitude, customerLongitude]}>
                  <Popup>
                    <div className="p-1">
                      <strong className="text-xs font-bold text-slate-900">
                        Your Location
                      </strong>
                      <p className="text-[11px] text-slate-500">
                        Service destination
                      </p>
                    </div>
                  </Popup>
                </Marker>

                <Circle
                  center={[customerLatitude, customerLongitude]}
                  radius={120}
                  pathOptions={{
                    color: "#f97316",
                    fillColor: "#fdba74",
                    fillOpacity: 0.25,
                  }}
                />

                {hasProviderLocation && (
                  <MovingProviderMarker
                    position={providerLocation}
                    distance={providerDistance}
                    lastUpdated={lastUpdated}
                  />
                )}
              </MapContainer>
            </div>

            {/* MAP METRICS STRIP */}
            <div className="grid grid-cols-1 divide-y border-t border-slate-100 bg-slate-50/50 sm:grid-cols-2 sm:divide-x sm:divide-y-0 text-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 text-orange-600">
                  <Bike size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Distance</p>
                  <p className="font-bold text-slate-800">
                    {hasProviderLocation
                      ? `${formatDistance(providerDistance)} away`
                      : "Awaiting assignment"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 text-slate-600">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      providerLocation?.is_online
                        ? "bg-emerald-500 ring-4 ring-emerald-100"
                        : "bg-slate-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Provider Status
                  </p>
                  <p className="font-bold text-slate-800">
                    {providerLocation
                      ? providerLocation.is_online
                        ? "Active & Online"
                        : "Offline"
                      : "Pending connection"}
                  </p>
                </div>
              </div>
            </div>

            {locationError && (
              <div className="border-t border-red-100 bg-red-50/60 p-3 text-center text-xs text-red-600">
                {locationError}
              </div>
            )}
          </div>
        )}

        {/* 2-COLUMN GRID DETAILS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* PROVIDER DETAILS CARD */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Assigned Provider
                </h2>
                <span className="text-xs font-medium text-slate-400">
                  {request.provider ? "Matched" : "Unassigned"}
                </span>
              </div>

              {request.provider ? (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <User size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">
                        {request.provider.user?.name ||
                          request.provider.name ||
                          "Service Technician"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Partner ID #{request.provider.id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 text-xs">
                    {request.provider.user?.phone && (
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Phone size={15} className="text-slate-400" />
                        <span className="font-medium">
                          {request.provider.user.phone}
                        </span>
                      </div>
                    )}
                    {request.provider.user?.email && (
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Mail size={15} className="text-slate-400" />
                        <span className="truncate font-medium">
                          {request.provider.user.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <User size={28} className="text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Finding nearby provider
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    We will automatically assign the best technician for this
                    job.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              {request.provider?.user?.phone && (
                <a
                  href={`tel:${request.provider.user.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-100/80 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98]"
                >
                  <Phone size={15} />
                  Call
                </a>
              )}

              {request.provider && (
                <button
                  type="button"
                  onClick={() => setShowChat(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-100/80 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98]"
                >
                  <MessageCircle size={16} />

                  <span>Chat</span>

                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>
            {showChat && (
              <div className="fixed bottom-5 right-5 z-[2000]">
                <ChatBox
                  requestId={request.id}
                  currentUserId={
                    request.customer?.id ||
                    request.user?.id ||
                    request.customer_id
                  }
                  currentUserRole="customer"
                  otherUserId={
                    request?.provider?.user_id ||
                    request?.provider?.user?.id ||
                    request?.provider?.id
                  }
                  otherUserName={
                    request.provider?.user?.name ||
                    request.provider?.name ||
                    "Service Provider"
                  }
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}
          </div>

          {/* SERVICE & BOOKING INFO */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Service & Timing
                </h2>
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                  {request.request_type === "now"
                    ? "⚡ On-Demand"
                    : "📅 Scheduled"}
                </span>
              </div>

              <div className="mt-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500 font-medium">
                    <Wrench size={15} className="text-orange-500" />
                    Service Category
                  </span>
                  <span className="font-semibold text-slate-800">
                    {request.service?.category || "General Assistance"}
                  </span>
                </div>

                {request.scheduled_at && (
                  <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                    <span className="flex items-center gap-2 text-slate-500 font-medium">
                      <Calendar size={15} className="text-purple-500" />
                      Scheduled Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(request.scheduled_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500 font-medium">
                    <IndianRupee size={15} className="text-emerald-500" />
                    Base Price
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{request.service?.base_price ?? "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* LOCATION FOOTER */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs">
                <MapPin size={16} className="text-orange-600 mt-0.5 shrink-0" />
                <p className="text-slate-600 leading-relaxed">
                  {request.address || "Address not provided"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PROBLEM DESCRIPTION (IF ANY) */}
        {request.problem_description && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-orange-500" />
              <h2 className="text-base font-bold text-slate-900">
                Problem Description
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              {request.problem_description}
            </p>
          </div>
        )}

        {/* COMPACT FLOATING REVIEW FORM (BOTTOM-RIGHT, BEFORE SUBMISSION) */}
        {request.status === "service_completed" &&
          showReviewModal &&
          !reviewSubmitted && (
            <div className="fixed bottom-5 right-5 z-[1000] w-[320px] max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

                {/* Close modal */}
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="absolute right-3 top-3.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Dismiss"
                >
                  <XCircle size={16} />
                </button>

                {/* Provider Header */}
                <div className="flex items-center gap-2.5 pr-6">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-orange-100 bg-orange-50/80">
                    {request.provider?.profile_image ? (
                      <img
                        src={request.provider.profile_image}
                        alt={request.provider?.user?.name || "Provider"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-orange-600">
                        <User size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Rate Service
                    </span>
                    <h3 className="truncate text-xs font-bold text-slate-900">
                      {request.provider?.user?.name || "Your Service Provider"}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Service Completed
                    </span>
                  </div>
                </div>

                {/* Star Rating Area */}
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
                  <p className="text-xs font-bold text-slate-800">
                    How was your experience?
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Tap a star to give your rating
                  </p>

                  <div className="mt-2 flex items-center justify-center gap-1.5">
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

                  {reviewRating > 0 && (
                    <p className="mt-1.5 text-[10px] font-semibold text-amber-700 animate-in fade-in duration-200">
                      {reviewRating === 1 && "Poor experience"}
                      {reviewRating === 2 && "Could be better"}
                      {reviewRating === 3 && "Good service"}
                      {reviewRating === 4 && "Very satisfied!"}
                      {reviewRating === 5 && "Excellent service! ❤️"}
                    </p>
                  )}
                </div>

                {/* Comment Input */}
                <div className="mt-2.5">
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Add a quick note or feedback (optional)..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/10"
                  />
                </div>

                {reviewError && (
                  <p className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-600">
                    {reviewError}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                  >
                    Later
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || reviewRating === 0}
                    className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-100/90 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-200 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {reviewSubmitting ? (
                      <>
                        <RefreshCw
                          size={12}
                          className="animate-spin text-orange-600"
                        />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Submit Review</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* CUSTOMER'S SUBMITTED REVIEW (PERSISTENT DISPLAY) */}
        {request.status === "service_completed" && existingReview && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
            {/* Top Indicator */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-orange-200/70 bg-orange-50 shadow-2xs">
                  {request.provider?.profile_image ? (
                    <img
                      src={request.provider.profile_image}
                      alt={request.provider?.user?.name || "Provider"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-orange-600">
                      <User size={16} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Your Review
                  </span>
                  <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                    {request.provider?.user?.name || "Service Provider"}
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
                Verified
              </span>
            </div>

            {existingReview.comment && (
              <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/75 p-2.5">
                <p className="text-[11px] leading-relaxed text-slate-600 italic">
                  "{existingReview.comment}"
                </p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Shared with QuickFix</span>
              <span className="text-emerald-600 font-medium">Thank you!</span>
            </div>
          </div>
        )}

        {/* CANCEL ACTION AREA */}
        {canCancel && (
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>
                You can cancel anytime before the provider starts work.
              </span>
            </div>

            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-orange-100/80 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLoading ? (
                <>
                  <RefreshCw
                    size={15}
                    className="animate-spin text-orange-600"
                  />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle size={15} />
                  Cancel Request
                </>
              )}
            </button>
          </div>
        )}

        {/* CANCELLED BANNER */}
        {request.status === "cancelled" && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-800">
            <XCircle size={24} className="text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Request Cancelled</p>
              <p className="text-xs text-rose-700 mt-0.5">
                This service request was cancelled and is no longer active.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

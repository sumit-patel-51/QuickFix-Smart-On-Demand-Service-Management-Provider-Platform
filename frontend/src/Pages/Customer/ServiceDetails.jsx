import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Wrench,
  Zap,
  Fan,
  Droplets,
  Wind,
  Hammer,
  Sparkles,
  Refrigerator,
  MapPin,
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

import api from "../../api/axios";

const ServiceDetails = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | URL PARAMETER
  |--------------------------------------------------------------------------
  */

  const params = useParams();
  const serviceId = params.id || params.serviceId;

  // ------------------------------------------------------------------------
  // SERVICE
  // ------------------------------------------------------------------------

  const [service, setService] = useState(null);

  // ------------------------------------------------------------------------
  // PAGE STATE
  // ------------------------------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ------------------------------------------------------------------------
  // SERVICE ICONS
  // ------------------------------------------------------------------------

  const iconMap = {
    electrician: Zap,
    electrical: Zap,

    "fan repair": Fan,

    plumber: Droplets,
    plumbing: Droplets,

    ac: Wind,
    "ac repair": Wind,

    carpenter: Hammer,
    carpentry: Hammer,

    "home cleaning": Sparkles,
    cleaning: Sparkles,

    appliance: Refrigerator,
    "appliance repair": Refrigerator,

    repair: Wrench,
    "general repair": Wrench,
  };

  const getServiceIcon = (name) => {
    if (!name) {
      return Wrench;
    }

    return (
      iconMap[name.toLowerCase()] ||
      Wrench
    );
  };

  // ------------------------------------------------------------------------
  // ICON STYLES
  // ------------------------------------------------------------------------

  const iconStyles = {
    electrician: {
      bg: "bg-amber-50",
      color: "text-amber-600",
    },

    electrical: {
      bg: "bg-amber-50",
      color: "text-amber-600",
    },

    "fan repair": {
      bg: "bg-blue-50",
      color: "text-blue-600",
    },

    plumber: {
      bg: "bg-cyan-50",
      color: "text-cyan-600",
    },

    plumbing: {
      bg: "bg-cyan-50",
      color: "text-cyan-600",
    },

    ac: {
      bg: "bg-indigo-50",
      color: "text-indigo-600",
    },

    "ac repair": {
      bg: "bg-indigo-50",
      color: "text-indigo-600",
    },

    carpenter: {
      bg: "bg-orange-50",
      color: "text-orange-600",
    },

    carpentry: {
      bg: "bg-orange-50",
      color: "text-orange-600",
    },

    "home cleaning": {
      bg: "bg-purple-50",
      color: "text-purple-600",
    },

    cleaning: {
      bg: "bg-purple-50",
      color: "text-purple-600",
    },

    appliance: {
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },

    "appliance repair": {
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },

    repair: {
      bg: "bg-rose-50",
      color: "text-rose-600",
    },

    "general repair": {
      bg: "bg-rose-50",
      color: "text-rose-600",
    },
  };

  const getIconStyle = (name) => {
    const key = name?.toLowerCase();

    return (
      iconStyles[key] || {
        bg: "bg-orange-50",
        color: "text-orange-600",
      }
    );
  };

  // ------------------------------------------------------------------------
  // FETCH SERVICE
  // ------------------------------------------------------------------------

  const fetchService = async () => {
    if (!serviceId) {
      setError("Service ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log(
        "Fetching Service ID:",
        serviceId
      );

      const response = await api.get(
        `/services/${serviceId}`
      );

      console.log(
        "Service Details API Response:",
        response.data
      );

      const serviceData =
        response.data?.service ||
        response.data?.data;

      if (!serviceData) {
        setService(null);

        setError(
          response.data?.message ||
            "Service not found."
        );

        return;
      }

      setService(serviceData);

    } catch (err) {
      console.error(
        "Service Details API Error:",
        err.response?.data || err.message
      );

      setService(null);

      setError(
        err.response?.data?.message ||
          "Unable to load service details. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------------
  // LOAD SERVICE
  // ------------------------------------------------------------------------

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  // ------------------------------------------------------------------------
  // REQUEST SERVICE
  // ------------------------------------------------------------------------

  const handleRequestService = () => {
    if (!serviceId) {
      return;
    }

    navigate(
      `/customer/services/${serviceId}/request`
    );
  };

  // ------------------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <Loader2
              size={40}
              className="mx-auto animate-spin text-orange-500"
            />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading service details...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ------------------------------------------------------------------------
  // ERROR
  // ------------------------------------------------------------------------

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-50/60">

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate("/customer/services")
            }
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
          >
            <ArrowLeft size={18} />

            Back to Services
          </button>

          <div className="rounded-3xl border border-rose-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">

              <AlertCircle size={30} />

            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load service
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error ||
                "The requested service could not be found."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

              <button
                type="button"
                onClick={fetchService}
                className="rounded-xl bg-orange-100/80 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98]"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/customer/services")
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Services
              </button>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ------------------------------------------------------------------------
  // SERVICE INFORMATION
  // ------------------------------------------------------------------------

  const Icon = getServiceIcon(
    service.name
  );

  const style = getIconStyle(
    service.name
  );

  const basePrice =
    service.base_price !== null &&
    service.base_price !== undefined
      ? Number(service.base_price)
      : null;

  // ------------------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/60">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="border-b border-slate-200/80 bg-white">

        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate("/customer/services")
            }
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-600"
          >
            <ArrowLeft size={18} />

            Back to Services
          </button>

        </div>

      </div>

      {/* ================================================================
          MAIN
      ================================================================ */}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* ================================================================
            SERVICE CARD
        ================================================================ */}

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">

          <div className="p-6 sm:p-8 lg:p-10">

            {/* TOP */}

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

              {/* SERVICE INFO */}

              <div className="flex gap-4">

                {/* ICON */}

                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${style.bg}`}
                >
                  <Icon
                    size={32}
                    strokeWidth={2}
                    className={style.color}
                  />
                </div>

                {/* NAME */}

                <div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-700 border border-orange-100">
                      {service.category ||
                        "Service"}
                    </span>

                    {service.is_active && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">

                        <CheckCircle size={12} />

                        Active

                      </span>
                    )}

                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                    {service.name}
                  </h1>

                </div>

              </div>

              {/* PRICE */}

              <div className="rounded-2xl border border-orange-100 bg-orange-50/50 px-5 py-4 md:min-w-[180px]">

                <div className="flex items-center gap-1.5 text-orange-600">

                  <IndianRupee size={16} />

                  <span className="text-xs font-semibold">
                    Starting Price
                  </span>

                </div>

                <p className="mt-1 text-2xl font-bold text-slate-900">

                  {basePrice !== null
                    ? `₹${basePrice.toLocaleString(
                        "en-IN"
                      )}`
                    : "N/A"}

                </p>

              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="mt-8">

              <h2 className="text-lg font-bold text-slate-900">
                About This Service
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500 sm:text-base">

                {service.description ||
                  "Professional service for your home. Submit a service request and provide your location and problem details."}

              </p>

            </div>

            {/* SERVICE INFORMATION */}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* CATEGORY */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">

                <div className="flex items-center gap-2 text-slate-400">

                  <Wrench size={17} />

                  <span className="text-xs font-medium">
                    Category
                  </span>

                </div>

                <p className="mt-2 text-base font-bold text-slate-900">

                  {service.category ||
                    "General Service"}

                </p>

              </div>

              {/* PRICE */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">

                <div className="flex items-center gap-2 text-slate-400">

                  <IndianRupee size={17} />

                  <span className="text-xs font-medium">
                    Base Cost
                  </span>

                </div>

                <p className="mt-2 text-base font-bold text-slate-900">

                  {basePrice !== null
                    ? `₹${basePrice.toLocaleString(
                        "en-IN"
                      )}`
                    : "Not specified"}

                </p>

              </div>

              {/* AVAILABILITY */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">

                <div className="flex items-center gap-2 text-slate-400">

                  <Clock size={17} />

                  <span className="text-xs font-medium">
                    Availability
                  </span>

                </div>

                <p className="mt-2 text-base font-bold text-slate-900">
                  {service.is_active
                    ? "Available"
                    : "Currently Unavailable"}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================================
            REQUEST SERVICE SECTION
        ================================================================ */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-orange-200/60 bg-white shadow-sm">

          <div className="bg-orange-50/40 p-6 sm:p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              {/* TEXT */}

              <div>

                <div className="flex items-center gap-2 text-orange-600">

                  <MapPin size={19} />

                  <span className="text-xs font-bold uppercase tracking-wide">
                    Ready to request?
                  </span>

                </div>

                <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                  Request {service.name}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Choose whether you need the service now or want to schedule it for a later date and time.
                </p>

              </div>

              {/* LIGHT ORANGE BUTTON */}

              <button
                type="button"
                onClick={handleRequestService}
                disabled={
                  service.is_active === false
                }
                className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-100/80 px-6 py-3.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                Request Service

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>

            </div>

          </div>

        </section>

        {/* ================================================================
            WHAT HAPPENS NEXT
        ================================================================ */}

        <section className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-lg font-bold text-slate-900">
            What happens next?
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* STEP 1 */}

            <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                1
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                Submit Request
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Enter your address, current location and describe your problem.
              </p>

            </div>

            {/* STEP 2 */}

            <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                2
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                Provider Assignment
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                QuickFix can assign an appropriate verified provider after your request is submitted.
              </p>

            </div>

            {/* STEP 3 */}

            <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                3
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                Service
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                The assigned provider can visit your selected location and complete the requested service.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
};

export default ServiceDetails;
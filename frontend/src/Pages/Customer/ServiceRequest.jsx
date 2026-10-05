// PATH: src/Pages/Customer/ServiceRequest.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import Swal from "sweetalert2";

import api from "../../api/axios";
import LocationPicker from "../../components/Customer/LocationPicker";

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  // --------------------------------------------------
  // SERVICE
  // --------------------------------------------------
  const [service, setService] = useState(null);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------
  const [formData, setFormData] = useState({
    address: "",
    latitude: "",
    longitude: "",
    problem_description: "",
    request_type: "now",
    scheduled_at: "",
  });

  // --------------------------------------------------
  // FIELD ERRORS
  // --------------------------------------------------
  const [fieldErrors, setFieldErrors] = useState({
    address: "",
    problem_description: "",
  });

  // --------------------------------------------------
  // PAGE STATES
  // --------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // FETCH SERVICE
  // --------------------------------------------------
  useEffect(() => {
    if (!serviceId) {
      setError("Service ID is missing.");
      setLoading(false);
      return;
    }

    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/services/${serviceId}`);

      const serviceData =
        response.data?.service ||
        response.data?.data;

      if (!serviceData) {
        setError("Service not found.");
        setService(null);
        return;
      }

      setService(serviceData);
    } catch (err) {
      console.error(
        "Service Details Error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message || "Unable to load service."
      );

      setService(null);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error while typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // --------------------------------------------------
  // LOCATION CHANGE
  // --------------------------------------------------
  const handleLocationChange = ({ latitude, longitude, address }) => {
    setFormData((prev) => ({
      ...prev,
      latitude,
      longitude,
      address: address || prev.address,
    }));

    if (address && fieldErrors.address) {
      setFieldErrors((prev) => ({ ...prev, address: "" }));
    }
  };

  // --------------------------------------------------
  // CLIENT-SIDE VALIDATION
  // --------------------------------------------------
  const validateForm = () => {
    const errors = {};
    const trimmedAddress = formData.address.trim();
    const trimmedProblem = formData.problem_description.trim();

    // Address validation
    if (!trimmedAddress) {
      errors.address = "Please enter your complete address.";
    } else if (trimmedAddress.length < 10) {
      errors.address = "Address must be at least 10 characters long.";
    }

    // Problem description validation
    if (!trimmedProblem) {
      errors.problem_description = "Please describe the problem or requirement.";
    } else if (trimmedProblem.length < 15) {
      errors.problem_description = "Please provide more detail (minimum 15 characters).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --------------------------------------------------
  // SUBMIT REQUEST
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Map Pin Check
    if (!formData.latitude || !formData.longitude) {
      await Swal.fire({
        title: "Location Required",
        text: "Please select your service location on the map.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    // 2. Validate Address & Problem Description
    if (!validateForm()) {
      const firstErrorMessage =
        !formData.address.trim() || formData.address.trim().length < 10
          ? "Please provide a complete address (minimum 10 characters)."
          : "Please explain the problem clearly (minimum 15 characters).";

      await Swal.fire({
        title: "Incomplete Details",
        text: firstErrorMessage,
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    // 3. Schedule Time Check
    if (
      formData.request_type === "scheduled" &&
      !formData.scheduled_at
    ) {
      await Swal.fire({
        title: "Schedule Required",
        text: "Please select a scheduled date and time.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        service_id: Number(serviceId),
        address: formData.address.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        problem_description: formData.problem_description.trim(),
        request_type: formData.request_type,
        scheduled_at:
          formData.request_type === "scheduled"
            ? formData.scheduled_at
            : null,
      };

      const response = await api.post(
        "/customer/service-requests",
        payload
      );

      await Swal.fire({
        title: "Request Created Successfully!",
        text: "We are finding a nearby service provider for you.",
        icon: "success",
        confirmButtonText: "View My Requests",
        confirmButtonColor: "#f97316",
      });

      navigate(
        `/customer/service-requests/${response.data.service_request.id}`
      );
    } catch (err) {
      console.error(
        "Create Service Request Error:",
        err.response?.data || err.message
      );

      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        const messages = Object.values(validationErrors).flat().join(" ");
        setError(messages);

        await Swal.fire({
          title: "Validation Error",
          text: messages,
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#f97316",
        });
      } else {
        const message =
          err.response?.data?.message || "Unable to create service request.";

        setError(message);

        await Swal.fire({
          title: "Request Failed",
          text: message,
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#f97316",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // LOADING PAGE
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/60">
        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500 sm:text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          Loading service details...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // SERVICE NOT FOUND
  // --------------------------------------------------
  if (!service) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50/60 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-3">
          <AlertCircle className="h-7 w-7" />
        </div>
        <p className="text-xs font-medium text-rose-600 sm:text-sm">
          {error || "Service not found."}
        </p>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl bg-orange-100/80 px-4 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------
  return (
    <main className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-slate-50/60 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col">

        {/* TOP BAR */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-orange-600 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>

          <div className="hidden items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50/60 px-3 py-1 text-[11px] font-medium text-orange-700 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
            Verified & Protected Booking
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="w-full">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">

            {/* ==================================================
                LEFT SIDE
            ================================================== */}
            <div className="order-2 space-y-4 lg:order-1 lg:col-span-7">

              {/* SERVICE SUMMARY */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                      <Sparkles className="h-3 w-3" />
                      Service Request
                    </span>

                    <h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                      {service.name}
                    </h1>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {service.category || "Home Care & Maintenance"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-3.5 py-2 text-right">
                    <span className="block text-[10px] font-medium uppercase text-slate-400">
                      Starting at
                    </span>
                    <span className="text-base font-bold text-slate-900 sm:text-lg">
                      ₹{Number(service.base_price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* API ERROR */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/80 p-3.5 text-xs font-medium text-rose-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ==================================================
                  ADDRESS FIELD
              ================================================== */}
              <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 sm:text-sm">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Complete Address <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Min 10 characters</span>
                </div>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House/Flat No., Building Name, Landmark, Street..."
                  rows="3"
                  className={`w-full resize-none rounded-xl border p-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white sm:text-sm ${
                    fieldErrors.address
                      ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/70 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  }`}
                />

                {fieldErrors.address && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                    <AlertCircle size={13} />
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              {/* ==================================================
                  PROBLEM / REQUIREMENTS FIELD
              ================================================== */}
              <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 sm:text-sm">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Describe Problem / Requirements <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Min 15 characters</span>
                </div>

                <textarea
                  name="problem_description"
                  value={formData.problem_description}
                  onChange={handleChange}
                  placeholder="Explain what is broken, needed parts, or specific requirements in detail..."
                  rows="3"
                  className={`w-full resize-none rounded-xl border p-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white sm:text-sm ${
                    fieldErrors.problem_description
                      ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/70 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  }`}
                />

                {fieldErrors.problem_description && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                    <AlertCircle size={13} />
                    {fieldErrors.problem_description}
                  </p>
                )}
              </div>

              {/* ==================================================
                  TIMING
              ================================================== */}
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 sm:text-sm">
                  <Clock className="h-4 w-4 text-orange-600" />
                  When do you need the service?
                </label>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* NOW */}
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      formData.request_type === "now"
                        ? "border-orange-300 bg-orange-50/70 text-orange-950 ring-1 ring-orange-300"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap
                        className={`h-4 w-4 ${
                          formData.request_type === "now"
                            ? "text-orange-600"
                            : "text-slate-400"
                        }`}
                      />
                      <div>
                        <span className="block text-xs font-semibold sm:text-sm">
                          Immediate
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Available expert
                        </span>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="request_type"
                      value="now"
                      checked={formData.request_type === "now"}
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>

                  {/* SCHEDULE */}
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      formData.request_type === "scheduled"
                        ? "border-orange-300 bg-orange-50/70 text-orange-950 ring-1 ring-orange-300"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar
                        className={`h-4 w-4 ${
                          formData.request_type === "scheduled"
                            ? "text-orange-600"
                            : "text-slate-400"
                        }`}
                      />
                      <div>
                        <span className="block text-xs font-semibold sm:text-sm">
                          Schedule
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Pick date & time
                        </span>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="request_type"
                      value="scheduled"
                      checked={formData.request_type === "scheduled"}
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* SCHEDULE DATE/TIME */}
                {formData.request_type === "scheduled" && (
                  <div className="pt-2">
                    <input
                      type="datetime-local"
                      name="scheduled_at"
                      value={formData.scheduled_at}
                      onChange={handleChange}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs text-slate-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* ==================================================
                  SUBMIT BUTTON
              ================================================== */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-orange-100/80 text-xs font-semibold text-orange-700 transition hover:bg-orange-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-12 sm:text-sm"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                      Finding Service Provider...
                    </div>
                  ) : (
                    "Confirm & Request Service"
                  )}
                </button>

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  No advance payment required. Pay after service completion.
                </p>
              </div>

            </div>

            {/* ==================================================
                RIGHT SIDE LOCATION
            ================================================== */}
            <div className="order-1 space-y-4 lg:sticky lg:top-24 lg:order-2 lg:col-span-5">

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 sm:text-sm">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Pin Exact Location
                  </span>

                  <span className="text-[10px] font-medium text-slate-400">
                    GPS Accurate
                  </span>
                </div>

                <div className="min-h-[220px] overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:min-h-[280px]">
                  <LocationPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationChange={handleLocationChange}
                  />
                </div>

                {/* COORDINATES */}
                {formData.latitude && formData.longitude && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={15}
                        className="text-emerald-600"
                      />
                      <span className="text-[10px] font-semibold text-slate-700">
                        Location selected
                      </span>
                    </div>

                    <p className="mt-1 text-[9px] text-slate-400">
                      Lat: {formData.latitude}
                      {" • "}
                      Lng: {formData.longitude}
                    </p>
                  </div>
                )}
              </div>

              {/* AUTOMATIC PROVIDER MESSAGE */}
              <div className="rounded-2xl border border-orange-200/60 bg-orange-50/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-white text-orange-600 shadow-sm">
                    <MapPin size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      We'll Find a Provider for You
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                      After you submit the request, QuickFix will
                      automatically find nearby verified providers
                      who offer this service.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </form>

      </div>
    </main>
  );
};

export default ServiceRequest;
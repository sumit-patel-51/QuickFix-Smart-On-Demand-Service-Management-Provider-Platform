// PATH: src/Pages/Provider/EditService.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle,
  IndianRupee,
} from "lucide-react";

import api from "../../api/axios";

const EditService = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newImagePreview, setNewImagePreview] = useState("");
  const [oldImageError, setOldImageError] = useState(false);

  const [formData, setFormData] = useState({
    price: "",
    experience: "",
    service_area: "",
    service_image: null,
    is_active: true,
  });

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

  const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

  const getImageUrl = (image) => {
    if (!image) return "";
    const imageString = String(image).trim();
    if (!imageString) return "";

    if (imageString.startsWith("http://") || imageString.startsWith("https://")) {
      return imageString;
    }

    let cleanImage = imageString.replace(/^\/+/, "");

    if (cleanImage.startsWith("storage/")) {
      return `${STORAGE_BASE_URL}/${cleanImage}`;
    }

    if (cleanImage.startsWith("public/storage/")) {
      cleanImage = cleanImage.replace("public/storage/", "storage/");
      return `${STORAGE_BASE_URL}/${cleanImage}`;
    }

    if (cleanImage.startsWith("api/storage/")) {
      cleanImage = cleanImage.replace("api/", "");
      return `${STORAGE_BASE_URL}/${cleanImage}`;
    }

    return `${STORAGE_BASE_URL}/storage/${cleanImage}`;
  };

  useEffect(() => {
    fetchService();

    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError("");
      setOldImageError(false);

      const response = await api.get(`/provider/services/${id}`);
      const data = response.data?.service;

      if (!data) {
        setService(null);
        setError("Service data not found.");
        return;
      }

      setService(data);
      setFormData({
        price: data.price ?? "",
        experience: data.experience ?? "",
        service_area: data.service_area ?? "",
        service_image: null,
        is_active: Boolean(data.is_active),
      });
    } catch (err) {
      console.error("Fetch service error:", err);
      setError(err.response?.data?.message || "Unable to load service.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files?.[0];
      if (!file) return;

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Please select JPG, JPEG, PNG, or WEBP image.");
        e.target.value = "";
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2 MB.");
        e.target.value = "";
        return;
      }

      setError("");

      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }

      const previewUrl = URL.createObjectURL(file);
      setNewImagePreview(previewUrl);
      setFormData((prev) => ({
        ...prev,
        service_image: file,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const removeNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImagePreview("");
    setFormData((prev) => ({
      ...prev,
      service_image: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);
      const data = new FormData();

      data.append("price", formData.price);
      data.append("experience", formData.experience);
      data.append("service_area", formData.service_area);
      data.append("is_active", formData.is_active ? "1" : "0");

      if (formData.service_image) {
        data.append("service_image", formData.service_image);
      }

      data.append("_method", "PUT");

      const response = await api.post(`/provider/services/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(response.data?.message || "Service updated successfully.");

      setTimeout(() => {
        navigate("/provider/services");
      }, 700);
    } catch (err) {
      console.error("Update service error:", err);

      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstError = Object.values(validationErrors)?.[0]?.[0];
        setError(firstError || "Please check the form.");
      } else {
        setError(err.response?.data?.message || "Unable to update service.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-[11px] font-semibold text-slate-500">
            Loading service...
          </span>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-4">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs">
          <AlertCircle size={30} className="mx-auto text-rose-500 mb-2" />
          <p className="text-xs font-semibold text-slate-800">
            {error || "Service not found."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/provider/services")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-100/90 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95"
          >
            <ArrowLeft size={13} />
            Back to My Services
          </button>
        </div>
      </div>
    );
  }

  const currentImageUrl = getImageUrl(service.service_image);

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-5">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/provider/services")}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Services
          </button>

          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            ID #{service.id}
          </span>
        </div>

        {/* FORM CONTAINER */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"
        >
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
              Edit Service Listing
            </h1>
            <p className="text-xs text-slate-500">
              Update pricing, coverage radius, and photos for this service.
            </p>
          </div>

          {/* ALERTS */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertCircle size={14} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800">
              <CheckCircle size={14} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* SERVICE META SUMMARY */}
          <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              {service.service?.category || "General Service"}
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              {service.service?.name || "Service"}
            </h2>
            {service.service?.description && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                {service.service.description}
              </p>
            )}
          </div>

          <div className="space-y-3.5">
            {/* PRICE & EXPERIENCE ROW */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* PRICE */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Visit / Base Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <IndianRupee size={13} />
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              {/* EXPERIENCE */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g. 3"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
                />
              </div>
            </div>

            {/* SERVICE AREA */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Service Area Coverage <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="service_area"
                value={formData.service_area}
                onChange={handleChange}
                required
                placeholder="e.g. Navrangpura, Satellite, Bodakdev"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
              />
            </div>

            {/* IMAGES: CURRENT & NEW UPLOAD */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* CURRENT IMAGE */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Current Photo
                </label>
                {currentImageUrl && !oldImageError ? (
                  <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={currentImageUrl}
                      alt={service.service?.name || "Service"}
                      className="h-full w-full object-cover"
                      onError={() => setOldImageError(true)}
                    />
                    <div className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-[9px] font-semibold text-white">
                      Current
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                    <ImageIcon size={22} />
                    <span className="mt-1 text-[10px]">No image on file</span>
                  </div>
                )}
              </div>

              {/* UPLOAD NEW IMAGE */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Replace Photo
                </label>
                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-center transition hover:border-blue-300 hover:bg-sky-50/40">
                  <Upload size={18} className="text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-full">
                    {formData.service_image
                      ? formData.service_image.name
                      : "Choose new file"}
                  </span>
                  <span className="mt-0.5 text-[9px] text-slate-400">
                    JPG, PNG, WEBP (Max 2MB)
                  </span>
                  <input
                    type="file"
                    name="service_image"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* NEW IMAGE PREVIEW (IF SELECTED) */}
            {newImagePreview && (
              <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800">
                    New Preview Selected
                  </span>
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 hover:underline"
                  >
                    <X size={12} />
                    Remove
                  </button>
                </div>
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={newImagePreview}
                    alt="New preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* STATUS TOGGLE */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Service Availability
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Active services can be discovered and requested by customers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-5 flex gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate("/provider/services")}
              disabled={submitting}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-100/90 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={13} />
                  Update Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditService;
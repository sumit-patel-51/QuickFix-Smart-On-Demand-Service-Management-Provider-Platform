// PATH: src/Pages/Provider/AddService.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Upload,
  AlertCircle,
  CheckCircle,
  IndianRupee,
  Briefcase,
  X,
} from "lucide-react";

import api from "../../api/axios";

const AddService = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    service_id: "",
    price: "",
    experience: "",
    service_area: "",
    service_image: null,
    is_active: true,
  });

  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchAvailableServices();
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  const fetchAvailableServices = async () => {
    try {
      setLoadingServices(true);
      const response = await api.get("/provider/available-services");
      setServices(response.data.services || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Unable to load available services."
      );
    } finally {
      setLoadingServices(false);
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
        setError("Please upload JPG, JPEG, PNG, or WEBP image.");
        e.target.value = "";
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2 MB.");
        e.target.value = "";
        return;
      }

      setError("");
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "service_id") {
      const service = services.find(
        (item) => String(item.id) === String(value)
      );
      setSelectedService(service || null);
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      service_image: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.service_id) {
      setError("Please select a service.");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      data.append("service_id", formData.service_id);
      data.append("price", formData.price);
      data.append("experience", formData.experience);
      data.append("service_area", formData.service_area);
      data.append("is_active", formData.is_active ? "1" : "0");

      if (formData.service_image) {
        data.append("service_image", formData.service_image);
      }

      await api.post("/provider/services", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Service added successfully.");
      setTimeout(() => {
        navigate("/provider/services");
      }, 700);
    } catch (err) {
      console.error("Add service error:", err);

      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstError = Object.values(validationErrors)[0]?.[0];
        setError(firstError || "Please check the form.");
      } else {
        setError(err.response?.data?.message || "Unable to add service.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-5">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/provider/services")}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Services
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Catalog Creation
          </span>
        </div>

        {/* FORM CONTAINER */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"
        >
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
              Add New Service
            </h1>
            <p className="text-xs text-slate-500">
              List a new home service offering with custom pricing and service radius.
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

          <div className="space-y-3.5">
            {/* SELECT SERVICE */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Service Category <span className="text-rose-500">*</span>
              </label>

              {loadingServices ? (
                <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                  Loading available categories...
                </div>
              ) : (
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleChange}
                  required
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
                >
                  <option value="">Select a service category</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.category || "General"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* AUTO SERVICE INFORMATION PREVIEW */}
            {selectedService && (
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  {selectedService.category}
                </span>
                <h3 className="font-bold text-slate-900 mt-0.5">
                  {selectedService.name}
                </h3>
                {selectedService.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                    {selectedService.description}
                  </p>
                )}
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Market base rate: ₹{selectedService.base_price || 0}
                </p>
              </div>
            )}

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
                    placeholder="0.00"
                    required
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
                placeholder="e.g. Navrangpura, Satellite, Bodakdev"
                required
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
              />
            </div>

            {/* IMAGE UPLOAD & PREVIEW */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Service Cover Image
              </label>

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-sky-200 bg-sky-50/40 p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">
                      Selected Cover Photo
                    </span>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 hover:underline"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                  <div className="relative h-28 w-full overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={imagePreview}
                      alt="Cover Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-2 text-center transition hover:border-blue-300 hover:bg-sky-50/40">
                  <Upload size={18} className="text-blue-600 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700">
                    Click to upload cover photo
                  </span>
                  <span className="text-[9px] text-slate-400">
                    JPG, JPEG, PNG, WEBP (Max 2MB)
                  </span>
                  <input
                    type="file"
                    name="service_image"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* STATUS TOGGLE */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Publish Immediately
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Make this service discoverable by customers upon saving.
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
              disabled={submitting || loadingServices}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-100/90 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={13} />
                  Add Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddService;
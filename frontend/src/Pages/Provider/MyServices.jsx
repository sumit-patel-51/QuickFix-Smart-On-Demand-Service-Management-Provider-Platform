// PATH: src/Pages/Provider/MyServices.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  BriefcaseBusiness,
  IndianRupee,
  Loader2,
  Wrench,
  AlertCircle,
} from "lucide-react";

import api from "../../api/axios";

const MyServices = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Provider Services
  |--------------------------------------------------------------------------
  */
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/provider/services");
      setServices(response.data.services || []);
    } catch (err) {
      console.error("Fetch services error:", err);
      setError(
        err.response?.data?.message || "Unable to load your services."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Delete Service
  |--------------------------------------------------------------------------
  */
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );
    if (!confirmed) return;

    try {
      setDeleteLoading(id);
      await api.delete(`/provider/services/${id}`);

      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err) {
      console.error("Delete service error:", err);
      alert(err.response?.data?.message || "Unable to delete service.");
    } finally {
      setDeleteLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Image URL Helper
  |--------------------------------------------------------------------------
  */
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${import.meta.env.VITE_API_BASE_URL}/storage/${image}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Format Price
  |--------------------------------------------------------------------------
  */
  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "0.00";
    }
    return Number(price).toFixed(2);
  };

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-[11px] font-semibold text-slate-500">
            Loading your catalog...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-5">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* =========================================
            HEADER BAR
        ========================================= */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Catalog Management
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-medium text-blue-600">
                {services.length} Listed
              </span>
            </div>
            <h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              My Services
            </h1>
            <p className="text-xs text-slate-500">
              Manage offerings, rates, and active service areas.
            </p>
          </div>

          <button
            onClick={() => navigate("/provider/services/add")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-100/90 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 active:scale-95 sm:self-auto"
          >
            <Plus size={14} />
            Add New Service
          </button>
        </div>

        {/* =========================================
            ERROR NOTIFICATION
        ========================================= */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================
            EMPTY STATE
        ========================================= */}
        {!error && services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-blue-600">
              <Wrench size={22} />
            </div>

            <h2 className="text-sm font-bold text-slate-900">
              No Services Added Yet
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Publish services to your profile so customers in your area can discover and book you.
            </p>

            <button
              onClick={() => navigate("/provider/services/add")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-100/90 px-4 py-2 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 active:scale-95"
            >
              <Plus size={14} />
              Add First Service
            </button>
          </div>
        )}

        {/* =========================================
            COMPACT SERVICES GRID
        ========================================= */}
        {services.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((item) => {
              const service = item.service;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:border-sky-300 hover:shadow-md"
                >
                  <div>
                    {/* Media Thumbnail */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                      {item.service_image ? (
                        <img
                          src={getImageUrl(item.service_image)}
                          alt={service?.name || "Service"}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-slate-300">
                          <Wrench size={28} />
                          <span className="mt-1 text-[10px] text-slate-400">
                            No Image Provided
                          </span>
                        </div>
                      )}

                      {/* Floating Status Chip */}
                      <span
                        className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="p-3.5">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          {service?.category || "General Service"}
                        </span>
                        <h2 className="truncate text-sm font-bold text-slate-900">
                          {service?.name || "Service Name"}
                        </h2>
                      </div>

                      {service?.description && (
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      {/* Meta Information List */}
                      <div className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs">
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <IndianRupee size={13} className="text-emerald-600" />
                            Visit / Base Rate
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{formatPrice(item.price)}
                          </span>
                        </div>

                        {/* Experience */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <BriefcaseBusiness size={13} className="text-blue-500" />
                            Experience
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.experience || 0} years
                          </span>
                        </div>

                        {/* Service Area */}
                        <div className="flex items-start justify-between gap-2 pt-0.5">
                          <span className="flex items-center gap-1.5 shrink-0 text-slate-500">
                            <MapPin size={13} className="text-rose-500" />
                            Coverage
                          </span>
                          <span className="truncate max-w-[150px] text-right font-medium text-slate-700">
                            {item.service_area || "Citywide"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
                    <button
                      onClick={() =>
                        navigate(`/provider/services/edit/${item.id}`)
                      }
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/50 hover:text-blue-700 active:scale-95"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteLoading === item.id}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                    >
                      {deleteLoading === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Delete
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

export default MyServices;
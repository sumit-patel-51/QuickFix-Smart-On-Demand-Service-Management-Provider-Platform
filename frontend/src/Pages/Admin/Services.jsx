
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Wrench,
  Pencil,
  Trash2,
  Eye,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Layers,
  Tags,
  IndianRupee,
  Filter,
  ArrowUpDown,
  Power,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

const initialForm = {
  name: "",
  category: "",
  description: "",
  base_price: "",
  is_active: true,
};

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0,
  });

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // --------------------------------
  // Fetch services
  // --------------------------------

  const fetchServices = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/admin/services", {
        params: {
          search: search.trim(),
          category: categoryFilter,
          status: statusFilter,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          per_page: perPage,
        },
      });

      const result = response.data.data;

      setServices(result.data || []);

      setPagination({
        current_page: result.current_page || 1,
        last_page: result.last_page || 1,
        total: result.total || 0,
        from: result.from || 0,
        to: result.to || 0,
      });
    } catch (error) {
      console.error("Services fetch error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "Unable to fetch services.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    search,
    categoryFilter,
    statusFilter,
    sortBy,
    sortOrder,
    page,
    perPage,
  ]);

  // --------------------------------
  // Fetch statistics
  // --------------------------------

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/services/stats");

      setStats(response.data.data);
    } catch (error) {
      console.error("Stats error:", error);
    }
  };

  // --------------------------------
  // Fetch categories
  // --------------------------------

  const fetchCategories = async () => {
    try {
      const response = await api.get(
        "/admin/services/categories"
      );

      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Categories error:", error);
    }
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchServices(),
      fetchStats(),
      fetchCategories(),
    ]);
  }, [fetchServices]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  // --------------------------------
  // Form handling
  // --------------------------------

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const openAddModal = () => {
    setEditingService(null);
    setForm(initialForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);

    setForm({
      name: service.name || "",
      category: service.category || "",
      description: service.description || "",
      base_price: service.base_price ?? "",
      is_active: Boolean(service.is_active),
    });

    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingService(null);
    setForm(initialForm);
    setErrors({});
  };

  // --------------------------------
  // Save service
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      base_price: Number(form.base_price),
    };

    try {
      if (editingService) {
        await api.put(
          `/admin/services/${editingService.id}`,
          payload
        );
      } else {
        await api.post("/admin/services", payload);
      }

      setModalOpen(false);
      setEditingService(null);
      setForm(initialForm);

      await refreshAll();

      Swal.fire({
        icon: "success",
        title: "Success",
        text: editingService
          ? "Service updated successfully!"
          : "Service added successfully!",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      const response = error.response?.data;

      if (response?.errors) {
        setErrors(response.errors);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text:
            response?.message ||
            "Something went wrong.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // View service
  // --------------------------------

  const handleView = (service) => {
    setViewingService(service);
    setViewModalOpen(true);
  };

  // --------------------------------
  // Toggle status
  // --------------------------------

  const handleToggleStatus = async (service) => {
    const action = service.is_active
      ? "deactivate"
      : "activate";

    const result = await Swal.fire({
      title: `${action === "activate" ? "Activate" : "Deactivate"} service?`,
      text: `Are you sure you want to ${action} ${service.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: service.is_active
        ? "#d97706"
        : "#16a34a",
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(
        `/admin/services/${service.id}/toggle-status`
      );

      await refreshAll();

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Service ${action}d successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          error.response?.data?.message ||
          "Unable to update service status.",
      });
    }
  };

  // --------------------------------
  // Delete service
  // --------------------------------

  const handleDelete = async (service) => {
    const result = await Swal.fire({
      title: "Delete service?",
      html: `
        Are you sure you want to delete
        <strong>${service.name}</strong>?
        <br/><br/>
        <span style="color:#dc2626">
          This action cannot be undone.
        </span>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/services/${service.id}`);

      await refreshAll();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Service deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text:
          error.response?.data?.message ||
          "Unable to delete service.",
      });
    }
  };

  // --------------------------------
  // Sorting
  // --------------------------------

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }

    setPage(1);
  };

  // --------------------------------
  // Reset filters
  // --------------------------------

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  const hasFilters =
    search ||
    categoryFilter ||
    statusFilter ||
    sortBy !== "created_at" ||
    sortOrder !== "desc";

  // --------------------------------
  // Helpers
  // --------------------------------

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFieldError = (field) => {
    return errors[field]?.[0] || "";
  };

  // --------------------------------
  // Statistics card
  // --------------------------------

  const statCards = [
    {
      title: "Total Services",
      value: stats.total,
      icon: Layers,
      color: "blue",
      description: "All registered services",
    },
    {
      title: "Active Services",
      value: stats.active,
      icon: CheckCircle,
      color: "green",
      description: "Available to customers",
    },
    {
      title: "Inactive Services",
      value: stats.inactive,
      icon: XCircle,
      color: "amber",
      description: "Currently disabled",
    },
    {
      title: "Categories",
      value: stats.categories,
      icon: Tags,
      color: "purple",
      description: "Unique service categories",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Wrench size={16} />
            <span>Admin</span>
            <span>/</span>
            <span className="font-medium text-blue-600">
              Services
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Services Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your platform's master services, pricing and availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </h3>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClasses[card.color]}`}
                >
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Services Table */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Table Header */}

        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Services
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              View and manage your service catalogue.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Package size={17} />
            <span>
              {pagination.total} records
            </span>
          </div>
        </div>

        {/* Filters */}

        <div className="space-y-4 border-b border-slate-100 p-5">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

            {/* Search */}

            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, category or description..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Category */}

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Filter size={14} />
                Sort by:
              </span>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Service Name</option>
                <option value="category">Category</option>
                <option value="base_price">Price</option>
              </select>

              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === "asc" ? "desc" : "asc"
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ArrowUpDown size={14} />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">

            <thead className="bg-slate-50/80">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Base Price</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-blue-600"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading services...
                    </p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Wrench size={26} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-800">
                      No services found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your filters or add a new service.
                    </p>

                    <button
                      type="button"
                      onClick={openAddModal}
                      className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      + Add your first service
                    </button>
                  </td>
                </tr>
              ) : (
                services.map((service, index) => (
                  <tr
                    key={service.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Service */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Wrench size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {service.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            ID: #{service.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                        {service.category}
                      </span>
                    </td>

                    {/* Price */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        {formatPrice(service.base_price)}
                      </span>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Base price
                      </p>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        title="Click to change status"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80 ${
                          service.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            service.is_active
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />

                        {service.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Date */}

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(service.created_at)}
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">

                        <button
                          type="button"
                          onClick={() => handleView(service)}
                          title="View service"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          title="Edit service"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(service)}
                          title="Delete service"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}

        {!loading && services.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                Showing{" "}
                <strong className="text-slate-800">
                  {pagination.from}–{pagination.to}
                </strong>{" "}
                of{" "}
                <strong className="text-slate-800">
                  {pagination.total}
                </strong>
              </span>

              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-[90px] text-center text-xs font-medium text-slate-600">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                type="button"
                disabled={page >= pagination.last_page}
                onClick={() => setPage((prev) => prev + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {editingService ? (
                    <Pencil size={19} />
                  ) : (
                    <Plus size={20} />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingService
                      ? "Edit Service"
                      : "Add New Service"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingService
                      ? "Update the service information."
                      : "Enter the details to create a new service."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleSubmit}>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">

                {/* Service Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Service Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. AC Repair"
                    maxLength={255}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                      errors.name
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />

                  {getFieldError("name") && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                {/* Category */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="category"
                    list="service-category-options"
                    value={form.category}
                    onChange={handleInputChange}
                    placeholder="e.g. AC & Appliance"
                    maxLength={255}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                      errors.category
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />

                  <datalist id="service-category-options">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>

                  {getFieldError("category") && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {getFieldError("category")}
                    </p>
                  )}
                </div>

                {/* Base Price */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      name="base_price"
                      value={form.base_price}
                      onChange={handleInputChange}
                      placeholder="299"
                      min="0"
                      step="0.01"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                        errors.base_price
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {getFieldError("base_price") && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {getFieldError("base_price")}
                    </p>
                  )}
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe the service..."
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                      errors.description
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />

                  <div className="mt-1 flex items-center justify-between">
                    {getFieldError("description") ? (
                      <p className="text-xs text-red-500">
                        {getFieldError("description")}
                      </p>
                    ) : (
                      <span />
                    )}

                    <span className="text-xs text-slate-400">
                      {form.description.length}/2000
                    </span>
                  </div>
                </div>

                {/* Active Status */}

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Service Availability
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Make this service available to customers.
                    </p>
                  </div>

                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleInputChange}
                      className="peer sr-only"
                    />

                    <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-100 after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>

                {/* Preview */}

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Wrench size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">
                        {form.name || "Service Name"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {form.category || "Service Category"}
                      </p>
                    </div>

                    <p className="font-bold text-blue-700">
                      {formatPrice(form.base_price)}
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingService
                    ? "Save Changes"
                    : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}

      {viewModalOpen && viewingService && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setViewModalOpen(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Service Details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Complete information about this service.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">

              <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Wrench size={26} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {viewingService.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {viewingService.category}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    viewingService.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {viewingService.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Service ID
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    #{viewingService.id}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Base Price
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatPrice(viewingService.base_price)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Created At
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(viewingService.created_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Last Updated
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(viewingService.updated_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Description
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {viewingService.description ||
                    "No description available."}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  openEditModal(viewingService);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Pencil size={16} />
                Edit Service
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminServices;
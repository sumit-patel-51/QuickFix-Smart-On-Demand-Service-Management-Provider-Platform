// PATH: src/Pages/Admin/Providers.jsx

import React, { useEffect, useState } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  UserCog,
  Phone,
  Wrench,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import api from "../../api/axios";
import Swal from "sweetalert2";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const [showIdColumn] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });

  useEffect(() => {
    fetchProviders();
  }, [status, currentPage, sortConfig]);

  // --------------------------------------------------
  // Document URL
  // --------------------------------------------------

  const handleViewDocument = (documentFile, documentUrl) => {
    if (!documentFile && !documentUrl) {
      Swal.fire({
        icon: "warning",
        title: "No File",
        text: "This document has no file attached.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    let url = documentUrl;

    if (!url && documentFile) {
      let path = documentFile.replace(/^public\//, "");
      path = path.replace(/^storage\//, "");

      url = `http://127.0.0.1:8000/storage/${path}`;
    }

    if (!url) {
      Swal.fire({
        icon: "error",
        title: "Unable to open document",
        text: "Document URL is not available.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // --------------------------------------------------
  // Fetch Providers
  // --------------------------------------------------

  const fetchProviders = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/providers", {
        params: {
          status: status !== "all" ? status : undefined,
          search: search || undefined,
          page: currentPage,
          per_page: perPage,
          sort: sortConfig.key,
          direction:
            sortConfig.direction === "ascending" ? "asc" : "desc",
        },
      });

      let providersData = [];
      let paginationData = {};

      if (response.data?.success && response.data?.data) {
        if (
          response.data.data.data &&
          Array.isArray(response.data.data.data)
        ) {
          providersData = response.data.data.data;

          paginationData = {
            current_page: response.data.data.current_page || 1,
            last_page: response.data.data.last_page || 1,
            total: response.data.data.total || 0,
            per_page: response.data.data.per_page || 10,
          };
        } else if (Array.isArray(response.data.data)) {
          providersData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        providersData = response.data;
      }

      setProviders(providersData);
      setTotalPages(paginationData.last_page || 1);
      setTotalItems(paginationData.total || providersData.length);
    } catch (error) {
      console.error("Providers error:", error);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          error.response?.data?.message ||
          "Failed to load providers. Please try again.",
        confirmButtonColor: "#2563eb",
      });

      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Sorting
  // --------------------------------------------------

  const handleSort = (key) => {
    let direction = "ascending";

    if (
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }

    setSortConfig({
      key,
      direction,
    });

    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <ArrowUpDown
          size={12}
          className="ml-1 text-slate-400"
        />
      );
    }

    return sortConfig.direction === "ascending" ? (
      <ArrowUp
        size={12}
        className="ml-1 text-blue-600"
      />
    ) : (
      <ArrowDown
        size={12}
        className="ml-1 text-blue-600"
      />
    );
  };

  // --------------------------------------------------
  // Approve Provider
  // --------------------------------------------------

  const approveProvider = async (provider) => {
    const result = await Swal.fire({
      title: "Approve Provider?",
      html: `
        <div class="text-left">
          <p class="text-sm text-slate-600 mb-3">
            Are you sure you want to approve
            <strong>${provider.user?.name || "this provider"}</strong>?
          </p>

          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
              ${provider.user?.name?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div>
              <p class="font-medium text-slate-900">
                ${provider.user?.name || "Provider"}
              </p>

              <p class="text-sm text-slate-500">
                ${provider.user?.email || "No email"}
              </p>
            </div>
          </div>

          <p class="text-sm text-slate-500 mt-3">
            The provider will be able to accept service requests after approval.
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, approve",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);

      const response = await api.post(
        `/admin/providers/${provider.id}/approve`
      );

      await Swal.fire({
        icon: "success",
        title: "Approved!",
        text:
          response.data?.message ||
          "Provider approved successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      setSelectedProvider(null);
      await fetchProviders();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          error.response?.data?.message ||
          "Unable to approve provider.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Reject
  // --------------------------------------------------

  const openRejectModal = (provider) => {
    setSelectedProvider(provider);
    setRejectReason(provider.rejection_reason || "");
    setShowRejectModal(true);
  };

  const rejectProvider = async () => {
    if (!rejectReason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Reason Required",
        text: "Please enter a rejection reason.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    try {
      setActionLoading(true);

      const response = await api.post(
        `/admin/providers/${selectedProvider.id}/reject`,
        {
          reason: rejectReason,
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Rejected!",
        text:
          response.data?.message ||
          "Provider rejected successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      setShowRejectModal(false);
      setSelectedProvider(null);
      setRejectReason("");

      await fetchProviders();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          error.response?.data?.message ||
          "Unable to reject provider.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Status Badge
  // --------------------------------------------------

  const statusBadge = (providerStatus) => {
    if (providerStatus === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle size={13} />
          Approved
        </span>
      );
    }

    if (providerStatus === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          <XCircle size={13} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Clock size={13} />
        Pending
      </span>
    );
  };

  // --------------------------------------------------
  // Search debounce
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProviders();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* -------------------------------- Header -------------------------------- */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <UserCog size={19} />
              </div>

              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Service Providers
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Review, verify and manage service providers.
            </p>
          </div>

          <button
            onClick={fetchProviders}
            className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Clock size={16} />
            Refresh
          </button>
        </div>

        {/* -------------------------------- Stats -------------------------------- */}
        {!loading && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            {/* Total */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Total Providers
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {totalItems || providers.length}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <UserCog size={18} />
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Pending
                  </p>

                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {
                      providers.filter(
                        (p) =>
                          p.verification_status === "pending"
                      ).length
                    }
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock size={18} />
                </div>
              </div>
            </div>

            {/* Approved */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Approved
                  </p>

                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {
                      providers.filter(
                        (p) =>
                          p.verification_status === "approved"
                      ).length
                    }
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle size={18} />
                </div>
              </div>
            </div>

            {/* Rejected */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Rejected
                  </p>

                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {
                      providers.filter(
                        (p) =>
                          p.verification_status === "rejected"
                      ).length
                    }
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <XCircle size={18} />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------- Filters -------------------------------- */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search by name, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Status */}
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setStatus(value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    status === value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Clear */}
            <button
              onClick={() => {
                setSearch("");
                setStatus("all");
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* -------------------------------- Table -------------------------------- */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

                <p className="text-sm text-slate-500">
                  Loading providers...
                </p>
              </div>
            </div>
          ) : providers.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <UserCog size={28} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                No providers found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                No providers match your current filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {showIdColumn && (
                      <th
                        className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-blue-600"
                        onClick={() => handleSort("id")}
                      >
                        <div className="flex items-center">
                          ID
                          {getSortIcon("id")}
                        </div>
                      </th>
                    )}

                    <th
                      className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-blue-600"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Provider
                        {getSortIcon("name")}
                      </div>
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Services
                    </th>

                    <th
                      className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-blue-600"
                      onClick={() =>
                        handleSort("verification_status")
                      }
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("verification_status")}
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-blue-600"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Joined
                        {getSortIcon("created_at")}
                      </div>
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {providers.map((provider) => (
                    <tr
                      key={provider.id}
                      className="transition hover:bg-blue-50/40"
                    >
                      {showIdColumn && (
                        <td className="px-5 py-4 text-sm font-medium text-slate-500">
                          #{provider.id}
                        </td>
                      )}

                      {/* Provider */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {provider.user?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {provider.user?.name || "Unknown"}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {provider.user?.email || "No email"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone
                            size={13}
                            className="text-slate-400"
                          />

                          {provider.user?.phone || "-"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {provider.documents?.length || 0} documents
                        </p>
                      </td>

                      {/* Services */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5">
                          <Wrench
                            size={14}
                            className="text-blue-600"
                          />

                          <span className="text-xs font-semibold text-blue-700">
                            {provider.services?.length || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {statusBadge(
                          provider.verification_status
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {provider.created_at
                          ? new Date(
                              provider.created_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              setSelectedProvider(provider)
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {provider.verification_status !==
                            "approved" && (
                            <button
                              disabled={actionLoading}
                              onClick={() =>
                                approveProvider(provider)
                              }
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                          )}

                          {provider.verification_status !==
                            "rejected" && (
                            <button
                              disabled={actionLoading}
                              onClick={() =>
                                openRejectModal(provider)
                              }
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && providers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-slate-500">
                Showing{" "}
                {(currentPage - 1) * perPage + 1} to{" "}
                {Math.min(
                  currentPage * perPage,
                  totalItems
                )}{" "}
                of {totalItems} providers
              </p>

              <div className="flex items-center gap-1">

                <button
                  onClick={() =>
                    goToPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from(
                  {
                    length: Math.min(5, totalPages),
                  },
                  (_, i) => {
                    let pageNum;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      currentPage >=
                      totalPages - 2
                    ) {
                      pageNum =
                        totalPages - 4 + i;
                    } else {
                      pageNum =
                        currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() =>
                          goToPage(pageNum)
                        }
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                {totalPages > 5 &&
                  currentPage < totalPages - 2 && (
                    <>
                      <span className="px-1 text-slate-400">
                        ...
                      </span>

                      <button
                        onClick={() =>
                          goToPage(totalPages)
                        }
                        className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                <button
                  onClick={() =>
                    goToPage(currentPage + 1)
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          PROVIDER DETAILS MODAL
      ========================================================= */}

      {selectedProvider && !showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <UserCog size={16} />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Provider Details
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Review provider information
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedProvider(null)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-5 p-5">

              {/* User */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                    {selectedProvider.user?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "P"}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {selectedProvider.user?.name}
                    </h3>

                    <p className="text-xs text-slate-500">
                      {selectedProvider.user?.email}
                    </p>

                    <p className="text-xs text-slate-500">
                      {selectedProvider.user?.phone ||
                        "No phone"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-400">
                    Provider ID
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    #{selectedProvider.id}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-1 text-xs text-slate-400">
                    Status
                  </p>

                  {statusBadge(
                    selectedProvider.verification_status
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-400">
                    Total Services
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedProvider.services?.length ||
                      0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-400">
                    Total Documents
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedProvider.documents?.length ||
                      0}
                  </p>
                </div>

              </div>

              {/* Services */}
              <div>

                <div className="mb-2 flex items-center gap-2">
                  <Wrench
                    size={16}
                    className="text-blue-600"
                  />

                  <h3 className="text-sm font-bold text-slate-800">
                    Selected Services
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">

                  {selectedProvider.services?.length >
                  0 ? (
                    selectedProvider.services.map(
                      (service) => (
                        <span
                          key={service.id}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                        >
                          {service.name}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-xs text-slate-400">
                      No services selected
                    </span>
                  )}

                </div>
              </div>

              {/* Documents */}
              <div>

                <div className="mb-2 flex items-center gap-2">
                  <FileText
                    size={16}
                    className="text-blue-600"
                  />

                  <h3 className="text-sm font-bold text-slate-800">
                    Verification Documents
                  </h3>
                </div>

                <div className="space-y-2">

                  {selectedProvider.documents?.length >
                  0 ? (
                    selectedProvider.documents.map(
                      (document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/30"
                        >

                          <div>
                            <p className="text-sm font-semibold capitalize text-slate-800">
                              {document.document_type?.replace(
                                /_/g,
                                " "
                              ) || "Document"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {document.document_number ||
                                "No document number"}
                            </p>

                            {document.document_file && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleViewDocument(
                                    document.document_file,
                                    document.document_url
                                  )
                                }
                                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <ExternalLink size={12} />
                                View File
                              </button>
                            )}
                          </div>

                          <div className="text-right">

                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                                document.status ===
                                "approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : document.status ===
                                    "rejected"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {document.status ||
                                "pending"}
                            </span>

                            {document.rejection_reason && (
                              <p className="mt-1 max-w-[160px] text-xs text-red-500">
                                {document.rejection_reason}
                              </p>
                            )}

                          </div>

                        </div>
                      )
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">

                      <FileText
                        size={25}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-sm text-slate-500">
                        No documents uploaded
                      </p>

                    </div>
                  )}

                </div>
              </div>

              {/* Rejection Reason */}
              {selectedProvider.rejection_reason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-700">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    {selectedProvider.rejection_reason}
                  </p>
                </div>
              )}

            </div>

            {/* Actions */}
            {selectedProvider.verification_status !==
              "approved" && (
              <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-5">

                <button
                  onClick={() =>
                    approveProvider(selectedProvider)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <CheckCircle size={17} />
                  Approve Provider
                </button>

                <button
                  onClick={() =>
                    openRejectModal(selectedProvider)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <XCircle size={17} />
                  Reject
                </button>

              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================
          REJECT MODAL
      ========================================================= */}

      {showRejectModal && selectedProvider && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reject Provider
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {selectedProvider.user?.name}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowRejectModal(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

            </div>

            <div className="p-5">

              <div className="mb-4 rounded-lg bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">
                  Please provide a clear reason for rejecting
                  this provider.
                </p>
              </div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Rejection Reason
              </label>

              <textarea
                value={rejectReason}
                onChange={(e) =>
                  setRejectReason(e.target.value)
                }
                rows={5}
                placeholder="Explain why this provider verification was rejected..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
              />

              <p className="mt-2 text-xs text-slate-400">
                This message will be shown to the provider.
              </p>

            </div>

            <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-5">

              <button
                onClick={() =>
                  setShowRejectModal(false)
                }
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                disabled={
                  actionLoading || !rejectReason.trim()
                }
                onClick={rejectProvider}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Rejecting..."
                  : "Confirm Reject"}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Providers;
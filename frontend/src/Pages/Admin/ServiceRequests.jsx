import React, { useEffect, useRef, useState } from "react";

import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Download,
  User,
  Wrench,
  MapPin,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

import Swal from "sweetalert2";

import api from "../../api/axios";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

/*
|--------------------------------------------------------------------------
| Fix Leaflet Marker
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
| Status Labels
|--------------------------------------------------------------------------
*/

const statusLabels = {
  searching: "Searching",
  provider_assigned: "Provider Assigned",
  provider_on_the_way: "Provider On The Way",
  arrived: "Arrived",
  service_started: "Service Started",
  service_completed: "Completed",
  cancelled: "Cancelled",
  no_provider_found: "No Provider Found",
};

/*
|--------------------------------------------------------------------------
| Status Label Helper
|--------------------------------------------------------------------------
*/

const getStatusLabel = (status) => {
  return (
    statusLabels[status] ||
    status?.replaceAll("_", " ") ||
    "Unknown"
  );
};

/*
|--------------------------------------------------------------------------
| Status Class Helper
|--------------------------------------------------------------------------
*/

const getStatusClass = (status) => {
  switch (status) {
    case "searching":
      return "bg-yellow-100 text-yellow-700";

    case "provider_assigned":
      return "bg-blue-100 text-blue-700";

    case "provider_on_the_way":
      return "bg-indigo-100 text-indigo-700";

    case "arrived":
      return "bg-purple-100 text-purple-700";

    case "service_started":
      return "bg-orange-100 text-orange-700";

    case "service_completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "no_provider_found":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

/*
|--------------------------------------------------------------------------
| Price Formatter
|--------------------------------------------------------------------------
*/

const formatPrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
};

/*
|--------------------------------------------------------------------------
| Date Formatter
|--------------------------------------------------------------------------
*/

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/*
|--------------------------------------------------------------------------
| Default Filters
|--------------------------------------------------------------------------
*/

const defaultFilters = {
  search: "",
  status: "",
  service_id: "",
  provider_id: "",
  request_type: "",
  date_from: "",
  date_to: "",
  min_price: "",
  max_price: "",

  /*
  |----------------------------------------------------------------------
  | Sorting
  |----------------------------------------------------------------------
  |
  | created_at = Date
  | final_price = Amount
  | id = Request ID
  |
  */

  sort_by: "created_at",
  sort_order: "desc",

  per_page: 15,
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    searching: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    no_provider_found: 0,
  });

  const [services, setServices] = useState([]);

  const [providers, setProviders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showCancel, setShowCancel] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState("");

  const [saving, setSaving] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Current Page
  |--------------------------------------------------------------------------
  */

  const [page, setPage] = useState(1);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [pagination, setPagination] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [filters, setFilters] =
    useState({
      ...defaultFilters,
    });

  /*
  |--------------------------------------------------------------------------
  | Admin Notes / Issue
  |--------------------------------------------------------------------------
  */

  const [editForm, setEditForm] = useState({
    admin_notes: "",
    issue_classification: "",
    issue_status: "none",
  });

  /*
  |--------------------------------------------------------------------------
  | Search Timer
  |--------------------------------------------------------------------------
  */

  const searchTimer = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Load Options
  |--------------------------------------------------------------------------
  */

  const loadOptions = async () => {
    try {
      const response = await api.get(
        "/admin/service-requests/options"
      );

      setServices(
        response.data.services || []
      );

      setProviders(
        response.data.providers || []
      );
    } catch (error) {
      console.error(
        "Options Error:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Requests
  |--------------------------------------------------------------------------
  */

  const loadRequests = async (
    currentFilters = filters,
    currentPage = page,
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = {
        ...currentFilters,
        page: currentPage,
      };

      const response = await api.get(
        "/admin/service-requests",
        {
          params,
        }
      );

      setRequests(
        response.data.requests?.data || []
      );

      setPagination(
        response.data.requests || null
      );

      setStats(
        response.data.stats || {}
      );
    } catch (error) {
      console.error(
        "Service Requests Error:",
        error
      );

      Swal.fire(
        "Error",
        "Unable to load service requests.",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Options
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadOptions();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Automatic Filter + Pagination
  |--------------------------------------------------------------------------
  |
  | Whenever filters or page changes, API automatically runs.
  |
  | Search gets 400ms debounce.
  |
  */

  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadRequests(
          filters,
          page,
          true
        );
      },
      filters.search ? 400 : 0
    );

    return () => {
      clearTimeout(timer);
    };
  }, [filters, page]);

  /*
  |--------------------------------------------------------------------------
  | Cleanup Search Timer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(
          searchTimer.current
        );
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Update Filter
  |--------------------------------------------------------------------------
  |
  | Any filter change automatically moves to page 1.
  |
  */

  const updateFilter = (
    name,
    value
  ) => {
    setPage(1);

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Search Change
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (
    value
  ) => {
    if (searchTimer.current) {
      clearTimeout(
        searchTimer.current
      );
    }

    setFilters((previous) => ({
      ...previous,
      search: value,
    }));

    setPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Reset Filters
  |--------------------------------------------------------------------------
  |
  | One click:
  | Filters reset
  | Page reset
  | API automatically reloads
  |
  */

  const resetFilters = () => {
    if (searchTimer.current) {
      clearTimeout(
        searchTimer.current
      );
    }

    setFilters({
      ...defaultFilters,
    });

    setPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  |
  | Refresh keeps current filters and current page.
  |
  */

  const handleRefresh = () => {
    loadRequests(
      filters,
      page,
      false
    );
  };

  /*
  |--------------------------------------------------------------------------
  | View Details
  |--------------------------------------------------------------------------
  */

  const viewRequest = async (
    id
  ) => {
    try {
      const response = await api.get(
        `/admin/service-requests/${id}`
      );

      setSelectedRequest(
        response.data.request
      );

      setShowDetails(true);
    } catch (error) {
      console.error(
        "Request Details Error:",
        error
      );

      Swal.fire(
        "Error",
        "Unable to load request details.",
        "error"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel Request Modal
  |--------------------------------------------------------------------------
  */

  const openCancelModal = (
    request
  ) => {
    setSelectedRequest(request);

    setCancelReason("");

    setShowCancel(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel Request
  |--------------------------------------------------------------------------
  */

  const cancelRequest = async () => {
    if (!cancelReason.trim()) {
      Swal.fire(
        "Reason Required",
        "Please enter cancellation reason.",
        "warning"
      );

      return;
    }

    try {
      setSaving(true);

      await api.post(
        `/admin/service-requests/${selectedRequest.id}/cancel`,
        {
          reason:
            cancelReason.trim(),
        },
      );

      setShowCancel(false);

      setShowDetails(false);

      setCancelReason("");

      await loadRequests(
        filters,
        page,
        false
      );

      Swal.fire(
        "Cancelled",
        "Service request cancelled successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Cancel Error:",
        error
      );

      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "Unable to cancel request.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open Edit Modal
  |--------------------------------------------------------------------------
  */

  const openEditModal = (
    request
  ) => {
    setSelectedRequest(request);

    setEditForm({
      admin_notes:
        request.admin_notes || "",

      issue_classification:
        request.issue_classification ||
        "",

      issue_status:
        request.issue_status ||
        "none",
    });

    setShowEdit(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Update Request
  |--------------------------------------------------------------------------
  */

  const updateRequest = async () => {
    try {
      setSaving(true);

      const response =
        await api.put(
          `/admin/service-requests/${selectedRequest.id}`,
          editForm
        );

      setSelectedRequest(
        response.data.request
      );

      setShowEdit(false);

      await loadRequests(
        filters,
        page,
        false
      );

      Swal.fire(
        "Updated",
        "Request information updated.",
        "success"
      );
    } catch (error) {
      console.error(
        "Update Request Error:",
        error
      );

      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "Unable to update request.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  |
  | Current filters are sent.
  | Page is NOT sent because export should export
  | all filtered records, not only current page.
  |
  */

  const exportCSV = async () => {
    try {
      const response =
        await api.get(
          "/admin/service-requests/export",
          {
            params: filters,
            responseType: "blob",
          }
        );

      const blob = new Blob(
        [response.data],
        {
          type: "text/csv",
        }
      );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `service_requests_${Date.now()}.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (error) {
      console.error(
        "Export Error:",
        error
      );

      Swal.fire(
        "Error",
        "Unable to export requests.",
        "error"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="p-6 space-y-6">

      {/* ================================================================
          Header
      ================================================================ */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Service Requests
          </h1>

          <p className="text-gray-500 mt-1">
            Monitor and manage active customer service requests.
          </p>
        </div>

        <div className="flex gap-2">

          {/* Refresh */}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          {/* Export */}

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2 hover:bg-gray-900"
          >
            <Download size={17} />

            Export CSV
          </button>

        </div>
      </div>


      {/* ================================================================
          Stats
      ================================================================ */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

        <StatCard
          title="Total"
          value={stats.total}
          icon={
            <FileText size={20} />
          }
        />

        <StatCard
          title="Searching"
          value={stats.searching}
          icon={
            <Search size={20} />
          }
        />

        <StatCard
          title="In Progress"
          value={stats.in_progress}
          icon={
            <Clock size={20} />
          }
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon={
            <CheckCircle size={20} />
          }
        />

        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={
            <X size={20} />
          }
        />

        <StatCard
          title="No Provider"
          value={
            stats.no_provider_found
          }
          icon={
            <AlertCircle size={20} />
          }
        />

      </div>


      {/* ================================================================
          Filters
      ================================================================ */}

      <div className="bg-white rounded-xl border p-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

          <div className="flex items-center gap-2">

            <Filter size={18} />

            <h2 className="font-semibold">
              Search & Filters
            </h2>

          </div>

          <p className="text-xs text-gray-500">
            Filters are applied automatically
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Search */}

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              value={filters.search}
              onChange={(e) =>
                handleSearchChange(
                  e.target.value
                )
              }
              placeholder="ID, customer, provider..."
              className="w-full border rounded-lg pl-10 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          {/* Status */}

          <select
            value={filters.status}
            onChange={(e) =>
              updateFilter(
                "status",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">
              All Status
            </option>

            {Object.entries(
              statusLabels
            ).map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              )
            )}

          </select>


          {/* Service */}

          <select
            value={filters.service_id}
            onChange={(e) =>
              updateFilter(
                "service_id",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">
              All Services
            </option>

            {services.map(
              (service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name}
                </option>
              )
            )}

          </select>


          {/* Provider */}

          <select
            value={filters.provider_id}
            onChange={(e) =>
              updateFilter(
                "provider_id",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">
              All Providers
            </option>

            {providers.map(
              (provider) => (
                <option
                  key={provider.id}
                  value={provider.id}
                >
                  {provider.user?.name ||
                    `Provider #${provider.id}`}
                </option>
              )
            )}

          </select>


          {/* Request Type */}

          <select
            value={filters.request_type}
            onChange={(e) =>
              updateFilter(
                "request_type",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">
              All Request Types
            </option>

            <option value="instant">
              Instant
            </option>

            <option value="scheduled">
              Scheduled
            </option>

          </select>


          {/* Date From */}

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) =>
              updateFilter(
                "date_from",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          />


          {/* Date To */}

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) =>
              updateFilter(
                "date_to",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          />


          {/* Sort By */}

          <select
            value={filters.sort_by}
            onChange={(e) =>
              updateFilter(
                "sort_by",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="created_at">
              Sort By Date
            </option>

            <option value="final_price">
              Sort By Amount
            </option>

            <option value="id">
              Sort By ID
            </option>

          </select>


          {/* Sort Order */}

          <select
            value={filters.sort_order}
            onChange={(e) =>
              updateFilter(
                "sort_order",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="desc">
              Descending
            </option>

            <option value="asc">
              Ascending
            </option>

          </select>


          {/* Min Price */}

          <input
            type="number"
            min="0"
            placeholder="Min Price"
            value={filters.min_price}
            onChange={(e) =>
              updateFilter(
                "min_price",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          />


          {/* Max Price */}

          <input
            type="number"
            min="0"
            placeholder="Max Price"
            value={filters.max_price}
            onChange={(e) =>
              updateFilter(
                "max_price",
                e.target.value
              )
            }
            className="border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>


        {/* Filter Footer */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">

          <p className="text-sm text-gray-500">
            Changing any filter automatically reloads the data.
          </p>

          <button
            onClick={resetFilters}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>

        </div>

      </div>


      {/* ================================================================
          Table
      ================================================================ */}

      <div className="bg-white border rounded-xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50 border-b">

              <tr>

                <th className="text-left px-5 py-4 text-sm">
                  ID
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Customer
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Service
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Provider
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Request
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Date / Time
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Amount
                </th>

                <th className="text-left px-5 py-4 text-sm">
                  Status
                </th>

                <th className="text-right px-5 py-4 text-sm">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="divide-y">

              {loading ? (

                <tr>

                  <td
                    colSpan="9"
                    className="py-16 text-center"
                  >

                    <Loader2
                      className="animate-spin mx-auto"
                      size={30}
                    />

                    <p className="mt-2 text-gray-500">
                      Loading requests...
                    </p>

                  </td>

                </tr>

              ) : requests.length === 0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="py-16 text-center text-gray-500"
                  >
                    No service requests found.
                  </td>

                </tr>

              ) : (

                requests.map(
                  (request) => (

                    <tr
                      key={request.id}
                      className="hover:bg-gray-50"
                    >

                      {/* ID */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-gray-800">
                          {request.id}
                        </p>

                      </td>


                      {/* Customer */}

                      <td className="px-5 py-4">

                        <p className="font-medium">
                          {request.customer?.name ||
                            "Unknown"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {request.customer?.phone ||
                            "—"}
                        </p>

                      </td>


                      {/* Service */}

                      <td className="px-5 py-4">

                        <p className="font-medium">
                          {request.service?.name ||
                            "Unknown"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {request.service?.category ||
                            ""}
                        </p>

                      </td>


                      {/* Provider */}

                      <td className="px-5 py-4">

                        {request.provider?.user ? (

                          <>
                            <p className="font-medium">
                              {
                                request.provider.user
                                  .name
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              {
                                request.provider.user
                                  .phone
                              }
                            </p>
                          </>

                        ) : (

                          <span className="text-gray-400">
                            Not Assigned
                          </span>

                        )}

                      </td>


                      {/* Request Type */}

                      <td className="px-5 py-4">

                        <span className="capitalize">
                          {request.request_type ||
                            "—"}
                        </span>

                      </td>


                      {/* Date */}

                      <td className="px-5 py-4">

                        <p className="text-sm">
                          {request.scheduled_at
                            ? formatDate(
                                request.scheduled_at
                              )
                            : formatDate(
                                request.created_at
                              )}
                        </p>

                        {request.scheduled_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Scheduled
                          </p>
                        )}

                      </td>


                      {/* Amount */}

                      <td className="px-5 py-4 font-semibold">

                        {formatPrice(
                          request.final_price ??
                            request.provider_service_price
                        )}

                      </td>


                      {/* Status */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(
                            request.status
                          )}
                        </span>

                      </td>


                      {/* Action */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              viewRequest(
                                request.id
                              )
                            }
                            className="p-2 rounded-lg border hover:bg-blue-50 text-blue-600"
                            title="View Details"
                          >
                            <Eye size={17} />
                          </button>


                          {request.status !==
                            "cancelled" &&
                            request.status !==
                              "service_completed" && (

                            <button
                              onClick={() =>
                                openCancelModal(
                                  request
                                )
                              }
                              className="p-2 rounded-lg border hover:bg-red-50 text-red-600"
                              title="Cancel Request"
                            >
                              <X size={17} />
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* ================================================================
            Pagination
        ================================================================ */}

        {pagination &&
          pagination.last_page > 0 && (

            <div className="border-t px-5 py-4">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                {/* Result Information */}

                <p className="text-sm text-gray-500">

                  Showing{" "}

                  <span className="font-medium text-gray-700">
                    {pagination.from || 0}
                  </span>

                  {" "}to{" "}

                  <span className="font-medium text-gray-700">
                    {pagination.to || 0}
                  </span>

                  {" "}of{" "}

                  <span className="font-medium text-gray-700">
                    {pagination.total || 0}
                  </span>

                  {" "}requests

                </p>


                {/* Pagination Buttons */}

                {pagination.last_page > 1 && (

                  <div className="flex items-center gap-2">

                    {/* Previous */}

                    <button
                      disabled={
                        pagination.current_page <=
                          1 ||
                        loading
                      }
                      onClick={() => {

                        if (
                          pagination.current_page >
                          1
                        ) {
                          setPage(
                            pagination.current_page -
                              1
                          );
                        }

                      }}
                      className="p-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      title="Previous Page"
                    >
                      <ChevronLeft
                        size={18}
                      />
                    </button>


                    {/* Page Numbers */}

                    {Array.from(
                      {
                        length:
                          pagination.last_page,
                      },
                      (_, index) =>
                        index + 1
                    )
                      .filter(
                        (pageNumber) => {

                          const current =
                            pagination.current_page;

                          return (
                            pageNumber ===
                              1 ||
                            pageNumber ===
                              pagination.last_page ||
                            Math.abs(
                              pageNumber -
                                current
                            ) <= 1
                          );
                        }
                      )
                      .map(
                        (
                          pageNumber,
                          index,
                          array
                        ) => {

                          const previousPage =
                            array[
                              index - 1
                            ];

                          const showDots =
                            previousPage &&
                            pageNumber -
                              previousPage >
                              1;

                          return (
                            <React.Fragment
                              key={
                                pageNumber
                              }
                            >

                              {showDots && (
                                <span className="px-2 text-gray-400">
                                  ...
                                </span>
                              )}

                              <button
                                disabled={
                                  loading
                                }
                                onClick={() =>
                                  setPage(
                                    pageNumber
                                  )
                                }
                                className={`min-w-[38px] h-[38px] px-3 rounded-lg border text-sm font-medium ${
                                  pagination.current_page ===
                                  pageNumber
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                {
                                  pageNumber
                                }
                              </button>

                            </React.Fragment>
                          );
                        }
                      )}


                    {/* Next */}

                    <button
                      disabled={
                        pagination.current_page >=
                          pagination.last_page ||
                        loading
                      }
                      onClick={() => {

                        if (
                          pagination.current_page <
                          pagination.last_page
                        ) {
                          setPage(
                            pagination.current_page +
                              1
                          );
                        }

                      }}
                      className="p-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      title="Next Page"
                    >
                      <ChevronRight
                        size={18}
                      />
                    </button>

                  </div>

                )}

              </div>

            </div>

          )}

      </div>


      {/* ================================================================
          Details Modal
      ================================================================ */}

      {showDetails &&
        selectedRequest && (

          <RequestDetailsModal
            request={selectedRequest}
            onClose={() =>
              setShowDetails(false)
            }
            onCancel={() =>
              openCancelModal(
                selectedRequest
              )
            }
            onEdit={() =>
              openEditModal(
                selectedRequest
              )
            }
            refreshRequest={() =>
              viewRequest(
                selectedRequest.id
              )
            }
          />

        )}


      {/* ================================================================
          Cancel Modal
      ================================================================ */}

      {showCancel &&
        selectedRequest && (

          <Modal
            title="Cancel Service Request"
            onClose={() =>
              !saving &&
              setShowCancel(false)
            }
          >

            <div className="space-y-4">

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">

                <p className="text-sm text-red-700">

                  You are cancelling request{" "}

                  <strong>
                    ID {selectedRequest.id}
                  </strong>

                </p>

              </div>


              <div>

                <label className="block text-sm font-medium mb-2">
                  Cancellation Reason *
                </label>

                <textarea
                  rows="4"
                  value={cancelReason}
                  onChange={(e) =>
                    setCancelReason(
                      e.target.value
                    )
                  }
                  placeholder="Enter reason for cancellation..."
                  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500"
                />

              </div>


              <div className="flex justify-end gap-2">

                <button
                  disabled={saving}
                  onClick={() =>
                    setShowCancel(false)
                  }
                  className="px-4 py-2 border rounded-lg"
                >
                  Close
                </button>

                <button
                  disabled={saving}
                  onClick={
                    cancelRequest
                  }
                  className="px-5 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
                >

                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  Cancel Request

                </button>

              </div>

            </div>

          </Modal>

        )}


      {/* ================================================================
          Edit Modal
      ================================================================ */}

      {showEdit &&
        selectedRequest && (

          <Modal
            title="Request Issue / Notes"
            onClose={() =>
              !saving &&
              setShowEdit(false)
            }
          >

            <div className="space-y-4">

              {/* Issue Classification */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Issue Classification
                </label>

                <select
                  value={
                    editForm.issue_classification
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      issue_classification:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2.5"
                >

                  <option value="">
                    No Issue
                  </option>

                  <option value="provider_no_show">
                    Provider No Show
                  </option>

                  <option value="late_arrival">
                    Late Arrival
                  </option>

                  <option value="service_quality">
                    Service Quality
                  </option>

                  <option value="extra_charge">
                    Extra Charge
                  </option>

                  <option value="customer_issue">
                    Customer Issue
                  </option>

                  <option value="other">
                    Other
                  </option>

                </select>

              </div>


              {/* Issue Status */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Issue Status
                </label>

                <select
                  value={
                    editForm.issue_status
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      issue_status:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2.5"
                >

                  <option value="none">
                    None
                  </option>

                  <option value="open">
                    Open
                  </option>

                  <option value="investigating">
                    Investigating
                  </option>

                  <option value="resolved">
                    Resolved
                  </option>

                </select>

              </div>


              {/* Admin Notes */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Admin Notes
                </label>

                <textarea
                  rows="5"
                  value={
                    editForm.admin_notes
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      admin_notes:
                        e.target.value,
                    })
                  }
                  placeholder="Internal admin notes..."
                  className="w-full border rounded-lg p-3"
                />

              </div>


              {/* Buttons */}

              <div className="flex justify-end gap-2">

                <button
                  disabled={saving}
                  onClick={() =>
                    setShowEdit(false)
                  }
                  className="px-4 py-2 border rounded-lg"
                >
                  Close
                </button>

                <button
                  disabled={saving}
                  onClick={
                    updateRequest
                  }
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </Modal>

        )}

    </div>
  );
};


/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="bg-white border rounded-xl p-4">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="text-2xl font-bold mt-1">
            {value ?? 0}
          </p>

        </div>

        <div className="p-3 bg-gray-100 rounded-lg">
          {icon}
        </div>

      </div>

    </div>
  );
};


/*
|--------------------------------------------------------------------------
| Generic Modal
|--------------------------------------------------------------------------
*/

const Modal = ({
  title,
  children,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between border-b px-5 py-4">

          <h2 className="text-lg font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
};


/*
|--------------------------------------------------------------------------
| Request Details Modal
|--------------------------------------------------------------------------
*/

const RequestDetailsModal = ({
  request,
  onClose,
  onCancel,
  onEdit,
  refreshRequest,
}) => {
  const customerLat =
    request.latitude !== null &&
    request.latitude !== undefined
      ? Number(request.latitude)
      : null;

  const customerLng =
    request.longitude !== null &&
    request.longitude !== undefined
      ? Number(request.longitude)
      : null;

  const providerLat =
    request.provider?.latitude !== null &&
    request.provider?.latitude !== undefined
      ? Number(
          request.provider.latitude
        )
      : null;

  const providerLng =
    request.provider?.longitude !== null &&
    request.provider?.longitude !==
      undefined
      ? Number(
          request.provider.longitude
        )
      : null;

  const mapCenter =
    customerLat !== null &&
    customerLng !== null
      ? [
          customerLat,
          customerLng,
        ]
      : [23.0225, 72.5714];

  const canCancel =
    request.status !== "cancelled" &&
    request.status !==
      "service_completed";

  return (
    <div className="fixed inset-0 z-[900] bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">

        {/* Header */}

        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">

          <div>

            <p className="text-sm text-gray-500">
              Service Request
            </p>

            <h2 className="text-xl font-bold">
              ID {request.id}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X />
          </button>

        </div>


        <div className="p-6 space-y-6">

          {/* Status */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Current Status
              </p>

              <span
                className={`inline-flex mt-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusClass(
                  request.status
                )}`}
              >
                {getStatusLabel(
                  request.status
                )}
              </span>

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                onClick={
                  refreshRequest
                }
                className="px-4 py-2 border rounded-lg flex items-center gap-2"
              >
                <RefreshCw
                  size={17}
                />

                Refresh
              </button>

              <button
                onClick={onEdit}
                className="px-4 py-2 border rounded-lg"
              >
                Notes / Issue
              </button>

              {canCancel && (

                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
                >
                  <X size={17} />

                  Cancel
                </button>

              )}

            </div>

          </div>


          {/* Information Cards */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Request */}

            <InfoCard
              title="Request Information"
              icon={
                <FileText size={19} />
              }
            >

              <InfoRow
                label="Request ID"
                value={request.id}
              />

              <InfoRow
                label="Request Type"
                value={
                  request.request_type
                    ? request.request_type
                        .charAt(0)
                        .toUpperCase() +
                      request.request_type.slice(
                        1
                      )
                    : "—"
                }
              />

              <InfoRow
                label="Created"
                value={formatDate(
                  request.created_at
                )}
              />

              <InfoRow
                label="Scheduled At"
                value={formatDate(
                  request.scheduled_at
                )}
              />

              <InfoRow
                label="Service"
                value={
                  request.service?.name ||
                  "—"
                }
              />

            </InfoCard>


            {/* Customer */}

            <InfoCard
              title="Customer"
              icon={
                <User size={19} />
              }
            >

              <InfoRow
                label="Name"
                value={
                  request.customer?.name ||
                  "—"
                }
              />

              <InfoRow
                label="Email"
                value={
                  request.customer?.email ||
                  "—"
                }
              />

              <InfoRow
                label="Phone"
                value={
                  request.customer?.phone ||
                  "—"
                }
              />

              <InfoRow
                label="Address"
                value={
                  request.address ||
                  request.customer?.address ||
                  "—"
                }
              />

            </InfoCard>


            {/* Provider */}

            <InfoCard
              title="Provider"
              icon={
                <Wrench size={19} />
              }
            >

              {request.provider?.user ? (

                <>

                  <InfoRow
                    label="Name"
                    value={
                      request.provider.user
                        .name
                    }
                  />

                  <InfoRow
                    label="Email"
                    value={
                      request.provider.user
                        .email || "—"
                    }
                  />

                  <InfoRow
                    label="Phone"
                    value={
                      request.provider.user
                        .phone || "—"
                    }
                  />

                  <InfoRow
                    label="Rating"
                    value={
                      request.provider
                        .rating ?? "—"
                    }
                  />

                  <InfoRow
                    label="Total Jobs"
                    value={
                      request.provider
                        .total_jobs ?? 0
                    }
                  />

                </>

              ) : (

                <p className="text-gray-500">
                  No provider assigned.
                </p>

              )}

            </InfoCard>


            {/* Pricing */}

            <InfoCard
              title="Pricing"
              icon={
                <IndianRupee size={19} />
              }
            >

              <InfoRow
                label="Provider Service Price"
                value={formatPrice(
                  request.provider_service_price
                )}
              />

              <InfoRow
                label="Extra Charges"
                value={formatPrice(
                  request.extra_charges
                )}
              />

              <InfoRow
                label="Final Price"
                value={formatPrice(
                  request.final_price
                )}
              />

              <InfoRow
                label="Price Status"
                value={
                  request.price_status ||
                  "—"
                }
              />

              {request.extra_charges_reason && (

                <InfoRow
                  label="Extra Charge Reason"
                  value={
                    request.extra_charges_reason
                  }
                />

              )}

            </InfoCard>

          </div>


          {/* Problem Description */}

          {request.problem_description && (

            <div className="bg-gray-50 border rounded-xl p-5">

              <h3 className="font-semibold mb-2">
                Problem Description
              </h3>

              <p className="text-gray-700">
                {
                  request.problem_description
                }
              </p>

            </div>

          )}


          {/* Cancellation Reason */}

          {request.status ===
            "cancelled" &&
            request.cancellation_reason && (

              <div className="bg-red-50 border border-red-200 rounded-xl p-5">

                <h3 className="font-semibold text-red-700 mb-2">
                  Cancellation Reason
                </h3>

                <p className="text-red-700">
                  {
                    request.cancellation_reason
                  }
                </p>

              </div>

            )}


          {/* Admin Notes */}

          {(request.admin_notes ||
            request.issue_classification) && (

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">

              <h3 className="font-semibold mb-3">
                Admin Notes / Issue
              </h3>

              {request.issue_classification && (

                <p className="text-sm mb-2">

                  <strong>
                    Issue:
                  </strong>{" "}

                  {
                    request.issue_classification
                  }

                </p>

              )}

              {request.issue_status && (

                <p className="text-sm mb-2">

                  <strong>
                    Issue Status:
                  </strong>{" "}

                  {
                    request.issue_status
                  }

                </p>

              )}

              {request.admin_notes && (

                <p className="text-sm">

                  <strong>
                    Notes:
                  </strong>{" "}

                  {
                    request.admin_notes
                  }

                </p>

              )}

            </div>

          )}


          {/* Service Location */}

          <div className="border rounded-xl overflow-hidden">

            <div className="p-5 border-b">

              <div className="flex items-center gap-2">

                <MapPin size={19} />

                <h3 className="font-semibold">
                  Service Location
                </h3>

              </div>

              <p className="text-sm text-gray-500 mt-1">
                {request.address ||
                  "Location unavailable"}
              </p>

            </div>


            <div className="h-[400px]">

              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{
                  height: "100%",
                  width: "100%",
                }}
              >

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                {/* Customer */}

                {customerLat !== null &&
                  customerLng !== null && (

                    <>

                      <Marker
                        position={[
                          customerLat,
                          customerLng,
                        ]}
                      >

                        <Popup>
                          Customer Location
                        </Popup>

                      </Marker>


                      <Circle
                        center={[
                          customerLat,
                          customerLng,
                        ]}
                        radius={100}
                      />

                    </>

                  )}


                {/* Provider */}

                {providerLat !== null &&
                  providerLng !== null && (

                    <Marker
                      position={[
                        providerLat,
                        providerLng,
                      ]}
                    >

                      <Popup>
                        Provider Location
                      </Popup>

                    </Marker>

                  )}

              </MapContainer>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};


/*
|--------------------------------------------------------------------------
| Info Card
|--------------------------------------------------------------------------
*/

const InfoCard = ({
  title,
  icon,
  children,
}) => {
  return (
    <div className="border rounded-xl p-5">

      <div className="flex items-center gap-2 mb-4">

        {icon}

        <h3 className="font-semibold">
          {title}
        </h3>

      </div>

      <div className="space-y-3">
        {children}
      </div>

    </div>
  );
};


/*
|--------------------------------------------------------------------------
| Info Row
|--------------------------------------------------------------------------
*/

const InfoRow = ({
  label,
  value,
}) => {
  return (
    <div className="flex justify-between gap-4 text-sm">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-medium text-right">
        {value}
      </span>

    </div>
  );
};


export default ServiceRequests;
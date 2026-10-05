// PATH: src/Pages/Admin/AdminUsers.jsx

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showIdColumn, setShowIdColumn] = useState(true);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterStatus, currentPage, sortConfig]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = {
        search: searchTerm || undefined,
        status:
          filterStatus !== "all" ? filterStatus : undefined,
        page: currentPage,
        per_page: itemsPerPage,
        sort: sortConfig.key,
        direction:
          sortConfig.direction === "ascending" ? "asc" : "desc",
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get("/admin/users", { params });

      let usersData = [];
      let paginationData = {};

      if (response.data.success) {
        usersData = response.data.data || [];
        paginationData = response.data.pagination || {};
      } else {
        usersData = response.data.data || response.data || [];
      }

      const formattedUsers = usersData.map((user) => ({
        id: user.id,
        name: user.name || "N/A",
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        role: user.role || "customer",
        status: user.status || "active",
        joined: user.created_at
          ? new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A",
        bookings: user.bookings_count || user.bookings || 0,
        address: user.address || "N/A",
        profile_photo: user.profile_photo || null,
        created_at: user.created_at,
      }));

      setUsers(formattedUsers);

      setTotalPages(
        paginationData.last_page ||
          Math.ceil(formattedUsers.length / itemsPerPage) ||
          1
      );

      setTotalItems(
        paginationData.total || formattedUsers.length
      );
    } catch (error) {
      console.error("Error fetching users:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Load Customers",
        text:
          error.response?.data?.message ||
          "Failed to load customers. Please try again.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sorting
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

  // Client-side filtering
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.id && user.id.toString().includes(searchTerm));

    const matchesStatus =
      filterStatus === "all" ||
      user.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Client-side sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === "id") {
      return sortConfig.direction === "ascending"
        ? a.id - b.id
        : b.id - a.id;
    }

    if (sortConfig.key === "name") {
      return sortConfig.direction === "ascending"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }

    if (sortConfig.key === "email") {
      return sortConfig.direction === "ascending"
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    }

    if (sortConfig.key === "joined") {
      return sortConfig.direction === "ascending"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    }

    if (sortConfig.key === "bookings") {
      return sortConfig.direction === "ascending"
        ? a.bookings - b.bookings
        : b.bookings - a.bookings;
    }

    return 0;
  });

  // Local pagination
  const totalPagesLocal =
    Math.ceil(sortedUsers.length / itemsPerPage) || 1;

  const indexOfLastItem =
    currentPage * itemsPerPage;

  const indexOfFirstItem =
    indexOfLastItem - itemsPerPage;

  const currentUsers = sortedUsers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => {
    if (
      pageNumber > 0 &&
      pageNumber <= totalPagesLocal
    ) {
      setCurrentPage(pageNumber);
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const styles = {
      active: {
        bg: "bg-emerald-50 border border-emerald-100",
        text: "text-emerald-700",
        icon: <CheckCircle size={12} />,
        label: "Active",
      },

      inactive: {
        bg: "bg-slate-50 border border-slate-200",
        text: "text-slate-600",
        icon: <Clock size={12} />,
        label: "Inactive",
      },

      suspended: {
        bg: "bg-red-50 border border-red-100",
        text: "text-red-700",
        icon: <XCircle size={12} />,
        label: "Suspended",
      },
    };

    return styles[status] || styles.inactive;
  };

  // Toggle status
  const toggleUserStatus = async (user) => {
    const newStatus =
      user.status === "active"
        ? "inactive"
        : "active";

    const statusText =
      newStatus === "active"
        ? "activate"
        : "deactivate";

    const result = await Swal.fire({
      title:
        newStatus === "active"
          ? "Activate Customer?"
          : "Deactivate Customer?",

      html: `
        <div style="text-align:left">
          <p style="font-size:14px;color:#64748b;margin-bottom:14px">
            Are you sure you want to <strong>${statusText}</strong> this customer?
          </p>

          <div style="
            display:flex;
            align-items:center;
            gap:12px;
            padding:12px;
            background:#eff6ff;
            border:1px solid #dbeafe;
            border-radius:10px;
          ">
            <div style="
              width:42px;
              height:42px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              background:#dbeafe;
              color:#2563eb;
              font-weight:700;
            ">
              ${user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <p style="
                margin:0;
                font-weight:600;
                color:#1e293b;
              ">
                ${user.name}
              </p>

              <p style="
                margin:3px 0 0;
                font-size:13px;
                color:#64748b;
              ">
                ${user.email}
              </p>
            </div>
          </div>

          <p style="
            margin-top:14px;
            font-size:13px;
            color:#64748b;
          ">
            Current status:
            <strong>${user.status}</strong>
            →
            New status:
            <strong style="color:#2563eb">
              ${newStatus}
            </strong>
          </p>
        </div>
      `,

      icon: "question",
      showCancelButton: true,

      confirmButtonColor:
        newStatus === "active"
          ? "#16a34a"
          : "#ef4444",

      cancelButtonColor: "#64748b",

      confirmButtonText:
        newStatus === "active"
          ? "Yes, Activate"
          : "Yes, Deactivate",

      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await api.put(
        `/admin/users/${user.id}/status`,
        {
          status: newStatus,
        }
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: newStatus,
              }
            : u
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Customer has been ${statusText}d successfully.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Error updating user status:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.response?.data?.message ||
          "Failed to update customer status.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  // Delete user
  const deleteUser = async (user) => {
    const result = await Swal.fire({
      title: "Delete Customer?",

      html: `
        <div style="text-align:left">
          <p style="
            font-size:14px;
            color:#64748b;
            margin-bottom:14px;
          ">
            Are you sure you want to permanently delete this customer?
          </p>

          <div style="
            display:flex;
            align-items:center;
            gap:12px;
            padding:12px;
            background:#fef2f2;
            border:1px solid #fee2e2;
            border-radius:10px;
          ">
            <div style="
              width:42px;
              height:42px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              background:#fee2e2;
              color:#dc2626;
              font-weight:700;
            ">
              ${user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <p style="
                margin:0;
                font-weight:600;
                color:#1e293b;
              ">
                ${user.name}
              </p>

              <p style="
                margin:3px 0 0;
                font-size:13px;
                color:#64748b;
              ">
                ${user.email}
              </p>
            </div>
          </div>

          <p style="
            margin-top:14px;
            font-size:13px;
            color:#dc2626;
            font-weight:600;
          ">
            This action cannot be undone.
          </p>

          <p style="
            font-size:13px;
            color:#64748b;
          ">
            Customer data, bookings and requests may be permanently deleted.
          </p>
        </div>
      `,

      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(
        `/admin/users/${user.id}`
      );

      setUsers((prevUsers) =>
        prevUsers.filter(
          (u) => u.id !== user.id
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Customer Deleted",
        text: "Customer has been deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Error deleting user:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error.response?.data?.message ||
          "Failed to delete customer.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  // View customer
  const viewUser = (user) => {
    Swal.fire({
      title: "Customer Details",

      html: `
        <div style="text-align:left">

          <div style="
            display:flex;
            align-items:center;
            gap:14px;
            padding:16px;
            background:#eff6ff;
            border:1px solid #dbeafe;
            border-radius:12px;
            margin-bottom:16px;
          ">

            <div style="
              width:58px;
              height:58px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              background:#dbeafe;
              color:#2563eb;
              font-size:22px;
              font-weight:700;
            ">
              ${user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h3 style="
                margin:0;
                font-size:18px;
                font-weight:700;
                color:#0f172a;
              ">
                ${user.name}
              </h3>

              <p style="
                margin:3px 0;
                font-size:13px;
                color:#64748b;
              ">
                ${user.email}
              </p>

              <p style="
                margin:0;
                font-size:13px;
                color:#64748b;
              ">
                ${user.phone || "N/A"}
              </p>
            </div>
          </div>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
          ">

            <div style="
              padding:12px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:10px;
            ">
              <p style="margin:0;font-size:11px;color:#94a3b8">
                ID
              </p>
              <p style="margin:4px 0 0;font-weight:600;color:#1e293b">
                #${user.id}
              </p>
            </div>

            <div style="
              padding:12px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:10px;
            ">
              <p style="margin:0;font-size:11px;color:#94a3b8">
                Status
              </p>
              <p style="margin:4px 0 0;font-weight:600;color:#1e293b">
                ${user.status}
              </p>
            </div>

            <div style="
              padding:12px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:10px;
            ">
              <p style="margin:0;font-size:11px;color:#94a3b8">
                Role
              </p>
              <p style="margin:4px 0 0;font-weight:600;color:#1e293b">
                ${user.role}
              </p>
            </div>

            <div style="
              padding:12px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:10px;
            ">
              <p style="margin:0;font-size:11px;color:#94a3b8">
                Joined
              </p>
              <p style="margin:4px 0 0;font-weight:600;color:#1e293b">
                ${user.joined}
              </p>
            </div>

            <div style="
              padding:12px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:10px;
            ">
              <p style="margin:0;font-size:11px;color:#94a3b8">
                Bookings
              </p>
              <p style="margin:4px 0 0;font-weight:600;color:#1e293b">
                ${user.bookings}
              </p>
            </div>

            <div style="
              padding:12px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:10px;
            ">
              <p style="margin:0;font-size:11px;color:#94a3b8">
                Address
              </p>
              <p style="
                margin:4px 0 0;
                font-weight:600;
                color:#1e293b;
                word-break:break-word;
              ">
                ${user.address || "N/A"}
              </p>
            </div>

          </div>
        </div>
      `,

      confirmButtonColor: "#2563eb",
      confirmButtonText: "Close",
      width: "620px",
    });
  };

  // Close column menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showColumnMenu &&
        !event.target.closest(
          ".column-menu-container"
        )
      ) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showColumnMenu]);

  // Sort icon
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
                <Users size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Customers
                </h1>

                <p className="text-sm text-slate-500">
                  Manage all registered customers
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* Column Menu */}
            <div className="relative column-menu-container">

              <button
                type="button"
                onClick={() =>
                  setShowColumnMenu(
                    (prev) => !prev
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">
                  Columns
                </span>
              </button>

              {showColumnMenu && (
                <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">

                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Table Columns
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowIdColumn(
                        (prev) => !prev
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <span>ID Column</span>

                    {showIdColumn ? (
                      <Eye
                        size={15}
                        className="text-blue-600"
                      />
                    ) : (
                      <EyeOff
                        size={15}
                        className="text-slate-400"
                      />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Add Customer */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Total */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Customers
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {loading ? "..." : totalItems}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Users
                  size={19}
                  className="text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Active
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {users.filter(
                    (u) => u.status === "active"
                  ).length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle
                  size={19}
                  className="text-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Inactive */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Inactive
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-600">
                  {users.filter(
                    (u) => u.status === "inactive"
                  ).length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Clock
                  size={19}
                  className="text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Suspended */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Suspended
                </p>

                <p className="mt-1 text-2xl font-bold text-red-600">
                  {users.filter(
                    (u) => u.status === "suspended"
                  ).length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <XCircle
                  size={19}
                  className="text-red-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">

          {/* Search */}
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <Search
              size={18}
              className="shrink-0 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by name, email, phone or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
            <Filter
              size={17}
              className="text-slate-400"
            />

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-sm font-medium text-slate-600 outline-none"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="suspended">
                Suspended
              </option>
            </select>
          </div>

          {/* Clear */}
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="text-sm font-medium text-slate-500">
                Loading customers...
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">

                {/* Table Header */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">

                    {showIdColumn && (
                      <th
                        className="w-16 cursor-pointer px-5 py-3.5 transition hover:text-blue-600"
                        onClick={() =>
                          handleSort("id")
                        }
                      >
                        <div className="flex items-center">
                          ID
                          {getSortIcon("id")}
                        </div>
                      </th>
                    )}

                    <th
                      className="cursor-pointer px-5 py-3.5 transition hover:text-blue-600"
                      onClick={() =>
                        handleSort("name")
                      }
                    >
                      <div className="flex items-center">
                        Customer
                        {getSortIcon("name")}
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-5 py-3.5 transition hover:text-blue-600"
                      onClick={() =>
                        handleSort("email")
                      }
                    >
                      <div className="flex items-center">
                        Email
                        {getSortIcon("email")}
                      </div>
                    </th>

                    <th className="px-5 py-3.5">
                      Phone
                    </th>

                    <th className="px-5 py-3.5">
                      Status
                    </th>

                    <th
                      className="cursor-pointer px-5 py-3.5 transition hover:text-blue-600"
                      onClick={() =>
                        handleSort("joined")
                      }
                    >
                      <div className="flex items-center">
                        Joined
                        {getSortIcon("joined")}
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-5 py-3.5 text-center transition hover:text-blue-600"
                      onClick={() =>
                        handleSort("bookings")
                      }
                    >
                      <div className="flex items-center justify-center">
                        Bookings
                        {getSortIcon("bookings")}
                      </div>
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => {
                      const statusStyle =
                        getStatusBadge(
                          user.status
                        );

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/30"
                        >

                          {/* ID */}
                          {showIdColumn && (
                            <td className="px-5 py-3.5 text-sm font-semibold text-slate-500">
                              #{user.id}
                            </td>
                          )}

                          {/* Customer */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                {user.profile_photo ? (
                                  <img
                                    src={
                                      user.profile_photo
                                    }
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  user.name
                                    .charAt(0)
                                    .toUpperCase()
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {user.name}
                                </p>

                                <p className="text-[11px] text-slate-400">
                                  Customer
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-3.5 text-sm text-slate-600">
                            {user.email}
                          </td>

                          {/* Phone */}
                          <td className="px-5 py-3.5 text-sm text-slate-600">
                            {user.phone}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                            >
                              {statusStyle.icon}
                              {statusStyle.label}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-3.5 text-sm text-slate-500">
                            {user.joined}
                          </td>

                          {/* Bookings */}
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-700">
                              {user.bookings}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">

                              {/* View */}
                              <button
                                type="button"
                                onClick={() =>
                                  viewUser(user)
                                }
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>

                              {/* Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  toggleUserStatus(
                                    user
                                  )
                                }
                                className={`rounded-lg p-2 transition ${
                                  user.status ===
                                  "active"
                                    ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                                    : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                                }`}
                                title={
                                  user.status ===
                                  "active"
                                    ? "Deactivate Customer"
                                    : "Activate Customer"
                                }
                              >
                                {user.status ===
                                "active" ? (
                                  <UserX
                                    size={16}
                                  />
                                ) : (
                                  <UserCheck
                                    size={16}
                                  />
                                )}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  deleteUser(user)
                                }
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete Customer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          showIdColumn
                            ? 8
                            : 7
                        }
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center">

                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                            <Users
                              size={25}
                              className="text-slate-300"
                            />
                          </div>

                          <p className="mt-4 text-sm font-semibold text-slate-600">
                            No customers found
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Try adjusting your search
                            or filter settings.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sortedUsers.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {indexOfFirstItem + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      indexOfLastItem,
                      sortedUsers.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {sortedUsers.length}
                  </span>{" "}
                  customers
                </p>

                <div className="flex items-center gap-1">

                  {/* Previous */}
                  <button
                    type="button"
                    onClick={() =>
                      paginate(
                        currentPage - 1
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Pages */}
                  {Array.from(
                    {
                      length: Math.min(
                        5,
                        totalPagesLocal
                      ),
                    },
                    (_, i) => {
                      let pageNum;

                      if (
                        totalPagesLocal <= 5
                      ) {
                        pageNum = i + 1;
                      } else if (
                        currentPage <= 3
                      ) {
                        pageNum = i + 1;
                      } else if (
                        currentPage >=
                        totalPagesLocal - 2
                      ) {
                        pageNum =
                          totalPagesLocal -
                          4 +
                          i;
                      } else {
                        pageNum =
                          currentPage -
                          2 +
                          i;
                      }

                      return (
                        <button
                          type="button"
                          key={pageNum}
                          onClick={() =>
                            paginate(
                              pageNum
                            )
                          }
                          className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                            currentPage ===
                            pageNum
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  {/* Last Page */}
                  {totalPagesLocal > 5 &&
                    currentPage <
                      totalPagesLocal -
                        2 && (
                      <>
                        <span className="px-1 text-slate-400">
                          ...
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            paginate(
                              totalPagesLocal
                            )
                          }
                          className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          {totalPagesLocal}
                        </button>
                      </>
                    )}

                  {/* Next */}
                  <button
                    type="button"
                    onClick={() =>
                      paginate(
                        currentPage + 1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPagesLocal
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
// PATH: src/Pages/Admin/AdminFeedback.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Star,
  Search,
  Filter,
  Eye,
  X,
  User,
  Wrench,
  CalendarDays,
  MessageSquareText,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Award,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../api/axios";

function AdminFeedback() {
  // --------------------------------------------------
  // Reviews
  // --------------------------------------------------
  const [reviews, setReviews] = useState([]);

  // --------------------------------------------------
  // Loading / Error
  // --------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Filters
  // --------------------------------------------------
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  // --------------------------------------------------
  // Sorting
  // --------------------------------------------------
  const [sort, setSort] = useState("desc");

  // --------------------------------------------------
  // Modal
  // --------------------------------------------------
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // --------------------------------------------------
  // Fetch Reviews
  // --------------------------------------------------
  const fetchReviews = async (
    page = currentPage,
    limit = perPage,
    order = sort
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/reviews", {
        params: {
          page: page,
          per_page: limit,
          sort: order,
        },
      });

      if (response.data.success) {
        setReviews(response.data.reviews || []);

        setPagination(
          response.data.pagination || {
            current_page: page,
            last_page: 1,
            per_page: limit,
            total: 0,
            from: 0,
            to: 0,
          }
        );
      } else {
        setError("Failed to load reviews.");
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load reviews. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Load Reviews on Page Load
  // --------------------------------------------------
  useEffect(() => {
    fetchReviews(1, perPage, sort);
  }, [perPage, sort]);

  // --------------------------------------------------
  // Services
  // --------------------------------------------------
  const services = useMemo(() => {
    return [
      ...new Set(
        reviews
          .map((review) => review.service)
          .filter(Boolean)
      ),
    ];
  }, [reviews]);

  // --------------------------------------------------
  // Helper - Review ID
  // REV-001 -> 1
  // --------------------------------------------------
  const formatReviewId = (id) => {
    if (!id) {
      return "N/A";
    }

    return String(id).replace(/^REV-0*/i, "");
  };

  // --------------------------------------------------
  // Helper - Request ID
  // QSP-00025 -> 25
  // --------------------------------------------------
  const formatRequestId = (id) => {
    if (!id) {
      return "N/A";
    }

    return String(id).replace(/^QSP-0*/i, "");
  };

  // --------------------------------------------------
  // Summary
  // --------------------------------------------------
  const totalReviews = pagination.total || 0;

  const publishedReviews = reviews.filter(
    (review) => review.status === "Published"
  ).length;

  const flaggedReviews = reviews.filter(
    (review) => review.status === "Flagged"
  ).length;

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) =>
              total + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  // --------------------------------------------------
  // Filter Reviews
  // --------------------------------------------------
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(review.id || "")
          .toLowerCase()
          .includes(searchText) ||
        formatReviewId(review.id)
          .toLowerCase()
          .includes(searchText) ||
        String(review.requestId || "")
          .toLowerCase()
          .includes(searchText) ||
        formatRequestId(review.requestId)
          .toLowerCase()
          .includes(searchText) ||
        review.customer?.name
          ?.toLowerCase()
          .includes(searchText) ||
        review.customer?.email
          ?.toLowerCase()
          .includes(searchText) ||
        review.provider?.name
          ?.toLowerCase()
          .includes(searchText) ||
        review.provider?.email
          ?.toLowerCase()
          .includes(searchText) ||
        review.service
          ?.toLowerCase()
          .includes(searchText) ||
        review.comment
          ?.toLowerCase()
          .includes(searchText);

      const matchesRating =
        ratingFilter === "all" ||
        Number(review.rating) === Number(ratingFilter);

      const matchesService =
        serviceFilter === "all" ||
        review.service === serviceFilter;

      const matchesStatus =
        statusFilter === "all" ||
        review.status === statusFilter;

      let matchesDate = true;

      if (dateFilter !== "all" && review.date) {
        const reviewDate = new Date(review.date);

        const today = new Date();

        today.setHours(23, 59, 59, 999);

        if (dateFilter === "today") {
          matchesDate =
            reviewDate.toDateString() ===
            today.toDateString();
        }

        if (dateFilter === "7days") {
          const sevenDaysAgo = new Date(today);

          sevenDaysAgo.setDate(
            today.getDate() - 7
          );

          sevenDaysAgo.setHours(0, 0, 0, 0);

          matchesDate =
            reviewDate >= sevenDaysAgo &&
            reviewDate <= today;
        }

        if (dateFilter === "30days") {
          const thirtyDaysAgo = new Date(today);

          thirtyDaysAgo.setDate(
            today.getDate() - 30
          );

          thirtyDaysAgo.setHours(0, 0, 0, 0);

          matchesDate =
            reviewDate >= thirtyDaysAgo &&
            reviewDate <= today;
        }
      }

      return (
        matchesSearch &&
        matchesRating &&
        matchesService &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    reviews,
    search,
    ratingFilter,
    serviceFilter,
    statusFilter,
    dateFilter,
  ]);

  // --------------------------------------------------
  // View Review
  // --------------------------------------------------
  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  // --------------------------------------------------
  // Close Modal
  // --------------------------------------------------
  const closeModal = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  // --------------------------------------------------
  // Reset Filters
  // --------------------------------------------------
  const resetFilters = () => {
    setSearch("");
    setRatingFilter("all");
    setServiceFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  // --------------------------------------------------
  // Change Page
  // --------------------------------------------------
  const changePage = (page) => {
    if (
      page < 1 ||
      page > pagination.last_page ||
      loading
    ) {
      return;
    }

    setCurrentPage(page);
    fetchReviews(page, perPage, sort);
  };

  // --------------------------------------------------
  // Change Per Page
  // --------------------------------------------------
  const handlePerPageChange = (value) => {
    const newPerPage = Number(value);

    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  // --------------------------------------------------
  // Change Sort
  // --------------------------------------------------
  const handleSortChange = (value) => {
    setSort(value);
    setCurrentPage(1);
  };

  // --------------------------------------------------
  // Rating Stars
  // --------------------------------------------------
  const RatingStars = ({ rating, size = 16 }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Number(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  // --------------------------------------------------
  // Format Date
  // --------------------------------------------------
  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Feedback & Reviews
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor customer reviews and provider feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchReviews(currentPage, perPage, sort)
          }
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Reviews
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {totalReviews}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                All customer reviews
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3">
              <MessageSquareText
                size={22}
                className="text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Average */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Average Rating
              </p>

              <div className="mt-2 flex items-center gap-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  {averageRating}
                </h2>

                <Star
                  size={22}
                  className="fill-yellow-400 text-yellow-400"
                />
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Current page average
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-3">
              <Award
                size={22}
                className="text-yellow-600"
              />
            </div>
          </div>
        </div>

        {/* Published */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Published Reviews
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {publishedReviews}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Visible reviews
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle2
                size={22}
                className="text-green-600"
              />
            </div>
          </div>
        </div>

        {/* Flagged */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Flagged Reviews
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {flaggedReviews}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Need admin attention
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-3">
              <AlertTriangle
                size={22}
                className="text-orange-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTER SECTION
      ================================================== */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="mb-4 flex items-center gap-2">
          <Filter
            size={18}
            className="text-gray-600"
          />

          <h2 className="font-semibold text-gray-900">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

          {/* Search */}
          <div className="relative xl:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search review, customer, provider..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Rating */}
          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) =>
                setRatingFilter(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Service */}
          <div className="relative">
            <select
              value={serviceFilter}
              onChange={(e) =>
                setServiceFilter(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Services
              </option>

              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="Published">
                Published
              </option>
              <option value="Flagged">
                Flagged
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* Date + Sort + Per Page + Reset */}
        <div className="mt-3 flex flex-col gap-3 lg:flex-row">

          {/* Date */}
          <div className="relative w-full lg:w-56">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Dates
              </option>
              <option value="today">
                Today
              </option>
              <option value="7days">
                Last 7 Days
              </option>
              <option value="30days">
                Last 30 Days
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Sort */}
          <div className="relative w-full lg:w-56">
            <select
              value={sort}
              onChange={(e) =>
                handleSortChange(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="desc">
                Newest First
              </option>

              <option value="asc">
                Oldest First
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Per Page */}
          <div className="relative w-full lg:w-40">
            <select
              value={perPage}
              onChange={(e) =>
                handlePerPageChange(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="10">
                10 / Page
              </option>

              <option value="20">
                20 / Page
              </option>

              <option value="50">
                50 / Page
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ==================================================
          REVIEWS TABLE
      ================================================== */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-5 py-4">

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-gray-900">
                Customer Reviews
              </h2>

              <p className="text-sm text-gray-500">
                {pagination.total || 0} review
                {pagination.total !== 1 ? "s" : ""} total
              </p>
            </div>

            {!loading &&
              pagination.total > 0 && (
                <p className="text-xs text-gray-500">
                  Showing {pagination.from} -{" "}
                  {pagination.to}
                </p>
              )}
          </div>
        </div>

        {/* ==================================================
            Desktop Table
        ================================================== */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1100px]">

            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Review
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Provider
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Service
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rating
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center">

                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                      <p className="mt-3 text-sm text-gray-500">
                        Loading reviews...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center">

                      <AlertTriangle
                        size={40}
                        className="text-red-300"
                      />

                      <h3 className="mt-3 font-semibold text-gray-700">
                        Failed to load reviews
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          fetchReviews(
                            currentPage,
                            perPage,
                            sort
                          )
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <RefreshCw size={15} />
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                  >

                    {/* Review */}
                    <td className="px-5 py-4">

                      <p className="font-semibold text-gray-900">
                        {formatReviewId(review.id)}
                      </p>

                      <p className="mt-1 max-w-[230px] truncate text-sm text-gray-500">
                        {review.comment ||
                          "No comment"}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">

                      <p className="font-medium text-gray-900">
                        {review.customer?.name ||
                          "Unknown"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {review.customer?.email ||
                          "N/A"}
                      </p>
                    </td>

                    {/* Provider */}
                    <td className="px-5 py-4">

                      <p className="font-medium text-gray-900">
                        {review.provider?.name ||
                          "Unknown"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {review.provider?.email ||
                          "N/A"}
                      </p>
                    </td>

                    {/* Service */}
                    <td className="px-5 py-4">

                      <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
                        {review.service ||
                          "N/A"}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <RatingStars
                          rating={review.rating}
                        />

                        <span className="text-sm font-semibold text-gray-700">
                          {Number(
                            review.rating
                          ).toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">

                      {review.status ===
                      "Published" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700">

                          <CheckCircle2 size={13} />

                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700">

                          <AlertTriangle size={13} />

                          Flagged
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDate(review.date)}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">

                      <button
                        type="button"
                        onClick={() =>
                          handleViewReview(review)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={15} />

                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center">

                      <MessageSquareText
                        size={38}
                        className="text-gray-300"
                      />

                      <h3 className="mt-3 font-semibold text-gray-700">
                        No reviews found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================
            Mobile / Tablet
        ================================================== */}
        <div className="divide-y divide-gray-100 lg:hidden">

          {loading ? (
            <div className="flex flex-col items-center px-5 py-14">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading reviews...
              </p>
            </div>
          ) : error ? (
            <div className="px-5 py-14 text-center">

              <AlertTriangle
                size={38}
                className="mx-auto text-red-300"
              />

              <h3 className="mt-3 font-semibold text-gray-700">
                Failed to load reviews
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  fetchReviews(
                    currentPage,
                    perPage,
                    sort
                  )
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <RefreshCw size={15} />

                Try Again
              </button>
            </div>
          ) : filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 sm:p-5"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                      <User
                        size={20}
                        className="text-blue-600"
                      />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate font-semibold text-gray-900">
                        {review.customer?.name ||
                          "Unknown"}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        Review ID:{" "}
                        {formatReviewId(
                          review.id
                        )}
                      </p>
                    </div>
                  </div>

                  {review.status ===
                  "Published" ? (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700">
                      Flagged
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">

                  {/* Provider */}
                  <div>

                    <p className="text-xs text-gray-400">
                      Provider
                    </p>

                    <p className="mt-1 font-medium text-gray-800">
                      {review.provider?.name ||
                        "Unknown"}
                    </p>
                  </div>

                  {/* Service */}
                  <div>

                    <p className="text-xs text-gray-400">
                      Service
                    </p>

                    <p className="mt-1 font-medium text-gray-800">
                      {review.service ||
                        "N/A"}
                    </p>
                  </div>

                  {/* Rating */}
                  <div>

                    <p className="text-xs text-gray-400">
                      Rating
                    </p>

                    <div className="mt-1 flex items-center gap-2">

                      <RatingStars
                        rating={review.rating}
                        size={14}
                      />

                      <span className="font-semibold">
                        {Number(
                          review.rating
                        ).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div>

                    <p className="text-xs text-gray-400">
                      Date
                    </p>

                    <p className="mt-1 font-medium text-gray-800">
                      {formatDate(
                        review.date
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
                  "
                  {review.comment ||
                    "No comment"}
                  "
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleViewReview(review)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Eye size={16} />

                  View Review
                </button>
              </div>
            ))
          ) : (
            <div className="px-5 py-14 text-center">

              <MessageSquareText
                size={38}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-3 font-semibold text-gray-700">
                No reviews found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>

        {/* ==================================================
            PAGINATION
        ================================================== */}
        {!loading &&
          !error &&
          pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

              {/* Info */}
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.from}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.to}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.total}
                </span>
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      pagination.current_page - 1
                    )
                  }
                  disabled={
                    loading ||
                    pagination.current_page <= 1
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />

                  Previous
                </button>

                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {pagination.current_page} /{" "}
                  {pagination.last_page}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      pagination.current_page + 1
                    )
                  }
                  disabled={
                    loading ||
                    pagination.current_page >=
                      pagination.last_page
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next

                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ==================================================
          VIEW REVIEW MODAL
      ================================================== */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">

              <div>

                <p className="text-xs font-medium text-gray-400">
                  Review Details
                </p>

                <h2 className="text-lg font-bold text-gray-900">
                  Review ID:{" "}
                  {formatReviewId(
                    selectedReview.id
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-5 sm:p-6">

              {/* Customer & Provider */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Customer */}
                <div className="rounded-xl border border-gray-200 p-4">

                  <div className="mb-3 flex items-center gap-2">

                    <div className="rounded-lg bg-blue-50 p-2">
                      <User
                        size={17}
                        className="text-blue-600"
                      />
                    </div>

                    <h3 className="font-semibold text-gray-900">
                      Customer
                    </h3>
                  </div>

                  <p className="font-semibold text-gray-900">
                    {selectedReview.customer?.name ||
                      "Unknown"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedReview.customer?.email ||
                      "N/A"}
                  </p>
                </div>

                {/* Provider */}
                <div className="rounded-xl border border-gray-200 p-4">

                  <div className="mb-3 flex items-center gap-2">

                    <div className="rounded-lg bg-purple-50 p-2">
                      <Wrench
                        size={17}
                        className="text-purple-600"
                      />
                    </div>

                    <h3 className="font-semibold text-gray-900">
                      Provider
                    </h3>
                  </div>

                  <p className="font-semibold text-gray-900">
                    {selectedReview.provider?.name ||
                      "Unknown"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedReview.provider?.email ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {/* Service Information */}
              <div className="rounded-xl border border-gray-200 p-4">

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                  {/* Service */}
                  <div>

                    <p className="text-xs font-medium text-gray-400">
                      Service
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedReview.service ||
                        "N/A"}
                    </p>
                  </div>

                  {/* Request ID */}
                  <div>

                    <p className="text-xs font-medium text-gray-400">
                      Request ID
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {formatRequestId(
                        selectedReview.requestId
                      )}
                    </p>
                  </div>

                  {/* Date */}
                  <div>

                    <p className="text-xs font-medium text-gray-400">
                      Date
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 font-semibold text-gray-900">
                      <CalendarDays size={15} />

                      {formatDate(
                        selectedReview.date
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="rounded-xl border border-gray-200 p-4">

                <p className="text-xs font-medium text-gray-400">
                  Rating
                </p>

                <div className="mt-2 flex items-center gap-3">

                  <RatingStars
                    rating={selectedReview.rating}
                    size={21}
                  />

                  <span className="text-lg font-bold text-gray-900">
                    {Number(
                      selectedReview.rating
                    ).toFixed(1)}{" "}
                    / 5
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="rounded-xl border border-gray-200 p-4">

                <div className="flex items-center gap-2">

                  <MessageSquareText
                    size={17}
                    className="text-gray-500"
                  />

                  <p className="text-sm font-semibold text-gray-900">
                    Customer Comment
                  </p>
                </div>

                <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  "
                  {selectedReview.comment ||
                    "No comment"}
                  "
                </p>
              </div>

              {/* Status */}
              <div
                className={
                  selectedReview.status ===
                  "Published"
                    ? "flex items-center gap-3 rounded-xl bg-green-50 p-4"
                    : "flex items-center gap-3 rounded-xl bg-orange-50 p-4"
                }
              >

                {selectedReview.status ===
                "Published" ? (
                  <CheckCircle2
                    size={20}
                    className="text-green-600"
                  />
                ) : (
                  <AlertTriangle
                    size={20}
                    className="text-orange-600"
                  />
                )}

                <div>

                  <p
                    className={
                      selectedReview.status ===
                      "Published"
                        ? "text-sm font-semibold text-green-800"
                        : "text-sm font-semibold text-orange-800"
                    }
                  >
                    {selectedReview.status}
                  </p>

                  <p
                    className={
                      selectedReview.status ===
                      "Published"
                        ? "text-xs text-green-700"
                        : "text-xs text-orange-700"
                    }
                  >
                    {selectedReview.status ===
                    "Published"
                      ? "This review is currently visible."
                      : "This review has been flagged for attention."}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex justify-end border-t border-gray-200 bg-white p-4 sm:px-6">

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeedback;
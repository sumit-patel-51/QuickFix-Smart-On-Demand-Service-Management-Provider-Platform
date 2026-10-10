
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Star,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const ProviderAvatar = ({ name, image }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [image]);

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-100 bg-orange-50 text-orange-600">
      {image && !imageError ? (
        <img
          src={image}
          alt={name || "Provider"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-lg font-bold">
          {name?.trim()?.charAt(0)?.toUpperCase() || (
            <User size={20} />
          )}
        </span>
      )}
    </div>
  );
};

const CustomerReviews = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customer/my-reviews");
      const data = response.data;

      if (data.success) {
        setReviews(data.reviews || []);
        setAverageRating(Number(data.average_rating || 0));
        setTotalReviews(Number(data.total_reviews || 0));
      } else {
        setError(data.message || "Unable to load your reviews.");
      }
    } catch (err) {
      console.error("Customer Reviews Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your reviews. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating, size = 15) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Number(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-slate-200"
          }
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin text-orange-600"
          />
          <p className="text-sm font-medium text-slate-500">
            Loading your reviews...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/customer/profile")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
          >
            <ArrowLeft size={17} />
            Back to My Profile
          </button>

          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={19} className="shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchReviews}
              className="ml-auto font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* SUMMARY */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-100 bg-yellow-50">
                <Star
                  size={24}
                  className="fill-yellow-400 text-yellow-500"
                />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  My Reviews
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Ratings and feedback you gave to service providers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {averageRating.toFixed(1)}
                  </span>
                  {renderStars(averageRating, 13)}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Your Average Rating
                </p>
              </div>

              <div className="h-10 w-px bg-slate-200" />

              <div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {totalReviews}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Total Reviews
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEW LIST */}
        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <MessageSquare size={26} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No Reviews Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Reviews you submit after completing a service will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/customer/bookings")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              <Wrench size={17} />
              View My Bookings
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Review History
              </h2>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
              </span>
            </div>

            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 sm:p-5"
              >
                {/* PROVIDER HEADER */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProviderAvatar
                      name={review.provider?.name}
                      image={review.provider?.profile_image}
                    />

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                        {review.provider?.name || "Service Provider"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Service Provider
                      </p>
                    </div>
                  </div>

                  {review.created_at && (
                    <span className="shrink-0 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
                      {new Date(review.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  )}
                </div>

                {/* RATING */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {renderStars(review.rating, 17)}

                  <span className="text-sm font-bold text-slate-800">
                    {Number(review.rating).toFixed(1)} / 5
                  </span>
                </div>

                {/* COMMENT */}
                {review.comment ? (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                      <MessageSquare size={15} className="text-orange-500" />
                      Your Feedback
                    </div>

                    <p className="text-sm leading-6 text-slate-700">
                      “{review.comment}”
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm italic text-slate-400">
                    You submitted a rating without a written comment.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;

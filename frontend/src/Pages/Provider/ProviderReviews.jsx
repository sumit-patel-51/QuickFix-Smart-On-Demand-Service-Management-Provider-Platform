import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";

const ProviderReviews = () => {
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

      const response = await api.get(`/provider/providers/reviews`);

      if (response.data.success) {
        setReviews(response.data.reviews || []);
        setAverageRating(Number(response.data.average_rating || 0));
        setTotalReviews(response.data.total_reviews || 0);
      } else {
        setError(response.data.message || "Unable to load customer reviews.");
      }
    } catch (err) {
      console.error("Provider Reviews Error:", err);
      setError(
        err.response?.data?.message || "Unable to load customer reviews.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating, size = 13) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Number(rating)
                ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_1px_2px_rgba(250,204,21,0.3)]"
                : "text-slate-200"
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <p className="text-[11px] font-semibold text-slate-500">
            Loading reviews...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5">
      <div className="mx-auto max-w-4xl space-y-3.5">
        {/* TOP BAR NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/provider/profile")}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back to Profile
          </button>

          <button
            type="button"
            onClick={fetchReviews}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
            title="Refresh reviews"
          >
            <RefreshCw size={11} className="text-slate-400" />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            <AlertCircle size={14} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* COMPACT SUMMARY HERO */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* LEFT: TITLE & AVATAR */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-100 bg-yellow-50 shadow-2xs">
                <Star size={16} className="fill-yellow-400 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                  Customer Reviews
                </h1>
                <p className="text-[11px] text-slate-500">
                  Real feedback and ratings submitted by your completed service
                  clients
                </p>
              </div>
            </div>

            {/* RIGHT: COMPACT SCORECARD */}
            <div className="flex items-center gap-4 self-start rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 sm:self-auto">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  {averageRating.toFixed(1)}
                </span>
                <div>
                  {renderStars(averageRating, 12)}
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                    Average Score
                  </span>
                </div>
              </div>

              <div className="h-7 w-px bg-slate-200" />

              <div>
                <span className="text-xs font-bold text-slate-900">
                  {totalReviews}
                </span>
                <span className="block text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                  Total Reviews
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS LIST */}
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <MessageSquare size={18} />
            </div>
            <h2 className="mt-2.5 text-xs font-bold text-slate-900">
              No Customer Reviews Yet
            </h2>
            <p className="mx-auto mt-0.5 max-w-sm text-[11px] text-slate-500">
              Ratings and notes from customers will display here automatically
              once jobs are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs transition hover:border-slate-300"
              >
                {/* REVIEW HEADER */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-2xs">
                      <User size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                        {review.reviewer?.name || "Customer"}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        {renderStars(review.rating, 11)}
                        <span className="text-[10px] font-bold text-slate-600">
                          {Number(review.rating).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DATE BADGE */}
                  {review.created_at && (
                    <span className="shrink-0 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-100">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* REVIEW COMMENT */}
                {review.comment ? (
                  <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                    <p className="text-[11px] leading-relaxed text-slate-700">
                      “{review.comment}”
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] italic text-slate-400">
                    Rating submitted without additional written comment.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderReviews;

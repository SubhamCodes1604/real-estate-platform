
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

import {
  createReview,
  getPropertyReviews,
  getReviewSummary,
  getMyPropertyReview,
  updateReview,
  deleteReview,
} from "../services/reviewApi";

import "./PropertyReviews.css";

export default function PropertyReviews({ propertyId }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reviewData, summaryData] = await Promise.all([
        getPropertyReviews(propertyId),
        getReviewSummary(propertyId),
      ]);

      setReviews(reviewData.results || []);
      setNextPage(reviewData.next);
      setSummary(summaryData);

      if (isAuthenticated) {
        const mine = await getMyPropertyReview(propertyId);

        setMyReview(mine.review);
        setIsOwner(mine.is_owner);
      } else {
        setMyReview(null);
        setIsOwner(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load property reviews."
      );
    } finally {
      setLoading(false);
    }
  }, [propertyId, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      loadInitialData();
    }
  }, [authLoading, loadInitialData]);

  const refreshData = async () => {
    await loadInitialData();
  };

  const handleCreate = async (data) => {
    setSubmitting(true);
    setMessage("");

    try {
      await createReview(propertyId, data);

      setMessage("Your review was submitted successfully.");
      await refreshData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    setMessage("");

    try {
      await updateReview(myReview.id, data);

      setEditing(false);
      setMessage("Your review was updated successfully.");

      await refreshData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteReview(reviewId);

      setEditing(false);
      setMessage("Your review was deleted successfully.");

      await refreshData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete review."
      );
    }
  };

  const loadMore = async () => {
    if (!nextPage) return;

    setLoadingMore(true);

    try {
      // The backend returns a complete next-page URL.
      // Extract its page number and use the existing API service.
      const url = new URL(nextPage);
      const page = url.searchParams.get("page");

      const data = await getPropertyReviews(propertyId, page);

      setReviews((previous) => [
        ...previous,
        ...(data.results || []),
      ]);

      setNextPage(data.next);
    } catch {
      setError("Unable to load more reviews.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading || authLoading) {
    return (
      <section className="property-reviews">
        <p>Loading reviews...</p>
      </section>
    );
  }

  return (
    <section className="property-reviews">
      <h2>Property Reviews & Ratings</h2>

      {error && (
        <p className="review-error">{error}</p>
      )}

      {message && (
        <p className="review-success">{message}</p>
      )}

      {summary && (
        <div className="review-summary">
          <div className="review-average">
            <strong>{Number(summary.average).toFixed(1)}</strong>
            <StarRating rating={Math.round(summary.average)} />
            <span>
              {summary.total_reviews} reviews
            </span>
          </div>

          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                summary.distribution?.[String(star)] || 0;

              const percentage =
                summary.total_reviews > 0
                  ? (count / summary.total_reviews) * 100
                  : 0;

              return (
                <div key={star} className="rating-row">
                  <span>{star} ★</span>

                  <div className="rating-bar">
                    <div
                      className="rating-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAuthenticated && !isOwner && (
        <div className="review-form-section">
          {myReview && !editing ? (
            <div className="existing-review">
              <h3>Your Review</h3>

              <ReviewList
                reviews={[myReview]}
                currentUserId={user?.id}
                onEdit={() => setEditing(true)}
                onDelete={handleDelete}
              />

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="review-edit-btn"
              >
                Edit Review
              </button>
            </div>
          ) : (
            <ReviewForm
              key={editing ? myReview?.id : "new-review"}
              initialReview={editing ? myReview : null}
              submitting={submitting}
              onCancel={
                editing ? () => setEditing(false) : undefined
              }
              onSubmit={editing ? handleUpdate : handleCreate}
            />
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="review-login-prompt">
          <p>Please log in to write a review.</p>
          <a href="/login">Login</a>
        </div>
      )}

      {isOwner && (
        <p className="owner-review-message">
          You cannot review your own property listing.
        </p>
      )}

      <h3>Customer Reviews</h3>

      <ReviewList
        reviews={reviews.filter(
          (review) => review.id !== myReview?.id
        )}
        currentUserId={user?.id}
        onEdit={() => setEditing(true)}
        onDelete={handleDelete}
      />

      {nextPage && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="load-more-reviews"
        >
          {loadingMore ? "Loading..." : "Load More Reviews"}
        </button>
      )}
    </section>
  );
}

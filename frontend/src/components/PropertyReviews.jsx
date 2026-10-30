import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import reviewApi from "../services/reviewApi";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import "./PropertyReviews.css";

function PropertyReviews({ propertyId }) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] =
    useState(null);
  const [submitting, setSubmitting] = useState(
    false
  );
  const [formMessage, setFormMessage] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [listRes, avgRes] = await Promise.all([
        reviewApi.listReviews(propertyId),
        reviewApi.getAverage(propertyId),
      ]);

      setReviews(
        Array.isArray(listRes.data?.results)
          ? listRes.data.results
          : listRes.data || []
      );

      setRating(avgRes.data);
    } catch (err) {
      console.error("Reviews load error:", err);
      setError("Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setFormMessage("");

    try {
      if (editingReview) {
        await reviewApi.updateReview(
          editingReview.id,
          data
        );
        setFormMessage(
          "Review updated successfully."
        );
      } else {
        await reviewApi.createReview({
          property: propertyId,
          ...data,
        });
        setFormMessage(
          "Review submitted successfully."
        );
      }

      setShowForm(false);
      setEditingReview(null);
      await fetchReviews();
    } catch (err) {
      console.error("Review submit error:", err);

      const errorData = err.response?.data;
      let msg = "Unable to save review.";

      if (typeof errorData === "object" && errorData) {
        msg = Object.values(errorData)
          .flat()
          .join(" ");
      } else if (typeof errorData === "string") {
        msg = errorData;
      }

      setFormMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowForm(true);
    setFormMessage("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReview(null);
    setFormMessage("");
  };

  const handleDelete = async (review) => {
    if (
      !window.confirm(
        "Delete your review? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await reviewApi.deleteReview(review.id);
      setFormMessage("Review deleted.");
      await fetchReviews();
    } catch (err) {
      console.error("Review delete error:", err);
      setFormMessage("Unable to delete review.");
    }
  };

  const existingReview =
    reviews.find((r) => r.user === user?.id) ||
    null;

  return (
    <section className="property-reviews-section">
      <h2>Reviews &amp; Ratings</h2>

      {formMessage && (
        <p
          className={
            formMessage.includes("Unable") ||
            formMessage.includes("error")
              ? "reviews-message reviews-message-error"
              : "reviews-message reviews-message-success"
          }
        >
          {formMessage}
        </p>
      )}

      {loading && (
        <p className="reviews-loading">
          Loading reviews...
        </p>
      )}

      {error && (
        <p className="reviews-error">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="reviews-summary">
            <div className="reviews-summary-average">
              <span className="reviews-average-number">
                {rating?.average
                  ? Number(
                      rating.average
                    ).toFixed(1)
                  : "—"}
              </span>

              <StarRating
                value={
                  rating?.average
                    ? Math.round(rating.average)
                    : 0
                }
                size={20}
              />

              <span className="reviews-total">
                {rating?.total_reviews || 0}{" "}
                review
                {rating?.total_reviews === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            {rating?.total_reviews > 0 && (
              <div className="reviews-distribution">
                {Object.entries(
                  rating.distribution || {}
                )
                  .reverse()
                  .map(([star, count]) => {
                    const pct =
                      rating.total_reviews > 0
                        ? (count /
                            rating.total_reviews) *
                          100
                        : 0;
                    return (
                      <div
                        key={star}
                        className="distribution-row"
                      >
                        <span className="distribution-star">
                          {star}★
                        </span>

                        <div className="distribution-bar">
                          <div
                            className="distribution-bar-fill"
                            style={{
                              width: `${pct}%`,
                            }}
                          />
                        </div>

                        <span className="distribution-count">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="reviews-form-area">
              {existingReview &&
                !showForm && (
                  <p className="reviews-existing-note">
                    You have already reviewed this
                    property.
                  </p>
                )}

              {showForm ? (
                <ReviewForm
                  key={editingReview?.id || "new"}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  initialRating={
                    editingReview?.rating || 0
                  }
                  initialComment={
                    editingReview?.comment || ""
                  }
                  submitLabel={
                    editingReview
                      ? "Update Review"
                      : "Submit Review"
                  }
                  submitting={submitting}
                />
              ) : (
                !existingReview && (
                  <button
                    type="button"
                    className="reviews-add-button"
                    onClick={() =>
                      setShowForm(true)
                    }
                  >
                    Write a Review
                  </button>
                )
              )}
            </div>
          )}

          {isAuthenticated && existingReview && (
            !showForm && (
              <div className="reviews-manage-existing">
                <button
                  type="button"
                  className="reviews-add-button"
                  onClick={() =>
                    handleEdit(existingReview)
                  }
                >
                  Edit Your Review
                </button>
              </div>
            )
          )}

          {!isAuthenticated && (
            <div className="reviews-login-prompt">
              <p>
                Want to leave a review?
              </p>
              <Link to="/login">
                Login to share your experience
              </Link>
            </div>
          )}

          <ReviewList
            reviews={reviews}
            currentUserId={user?.id}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
    </section>
  );
}

export default PropertyReviews;

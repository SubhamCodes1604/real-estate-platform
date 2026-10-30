
import { useState } from "react";
import StarRating from "./StarRating";

export default function ReviewForm({
  onSubmit,
  initialReview = null,
  onCancel,
  submitting = false,
}) {
  const [rating, setRating] = useState(
    initialReview?.rating || 0
  );

  const [comment, setComment] = useState(
    initialReview?.comment || ""
  );

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a review.");
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.rating?.[0] ||
        err.response?.data?.comment?.[0] ||
        "Unable to submit review. Please try again."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>
        {initialReview ? "Edit Your Review" : "Write a Review"}
      </h3>

      <label>Your Rating</label>

      <StarRating
        rating={rating}
        onChange={setRating}
        interactive
        size="30px"
      />

      <label htmlFor="review-comment">
        Your Experience
      </label>

      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this property..."
        rows={4}
        maxLength={2000}
        required
      />

      <div className="review-form-footer">
        <span>{comment.length}/2000</span>

        <div className="review-form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="review-cancel-btn"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="review-submit-btn"
          >
            {submitting
              ? "Saving..."
              : initialReview
                ? "Update Review"
                : "Submit Review"}
          </button>
        </div>
      </div>

      {error && (
        <p className="review-error">{error}</p>
      )}
    </form>
  );
}

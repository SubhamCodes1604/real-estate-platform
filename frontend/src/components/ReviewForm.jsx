import { useState } from "react";
import StarRating from "./StarRating";

function ReviewForm({
  onSubmit,
  onCancel,
  initialRating = 0,
  initialComment = "",
  submitLabel = "Submit Review",
  submitting = false,
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(
    initialComment
  );
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rating) {
      setFormError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setFormError("Please write a comment.");
      return;
    }

    setFormError("");

    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <form
      className="review-form"
      onSubmit={handleSubmit}
    >
      <label className="review-form-label">
        Your Rating
      </label>

      <StarRating
        value={rating}
        interactive
        onChange={setRating}
      />

      <label className="review-form-label">
        Your Review
      </label>

      <textarea
        className="review-form-textarea"
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        placeholder="Share your experience with this property..."
        rows="4"
        maxLength="1000"
      />

      {formError && (
        <p className="review-form-error">
          {formError}
        </p>
      )}

      <div className="review-form-actions">
        <button
          type="submit"
          className="review-submit-button"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            className="review-cancel-button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ReviewForm;

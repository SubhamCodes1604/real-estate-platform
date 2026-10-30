import { useId, useState } from "react";
import StarRating from "./StarRating";

function ReviewForm({
  initialReview,
  onSubmit,
  onCancel,
  submitting,
  error,
  submitLabel,
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [validationError, setValidationError] = useState("");

  const commentId = useId();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating < 1) {
      setValidationError("Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      setValidationError("Please write a comment before submitting.");
      return;
    }

    setValidationError("");
    onSubmit({ rating, comment: comment.trim() });
  };

  const message = validationError || error;

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>

      <StarRating
        value={rating}
        onChange={setRating}
        name={`${commentId}-rating`}
      />

      <label htmlFor={commentId} className="review-form-label">
        Your review
      </label>

      <textarea
        id={commentId}
        className="review-form-textarea"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows="4"
        placeholder="Share what you liked or didn't like about this property."
      />

      {message && (
        <p role="alert" className="review-form-error">
          {message}
        </p>
      )}

      <div className="review-form-actions">
        <button
          type="submit"
          className="review-button review-button--primary"
          disabled={submitting}
        >
          {submitting ? "Saving..." : submitLabel}
        </button>

        <button
          type="button"
          className="review-button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>

    </form>
  );
}

export default ReviewForm;

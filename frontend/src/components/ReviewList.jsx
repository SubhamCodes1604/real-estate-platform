import StarRating from "./StarRating";

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ReviewItem({
  review,
  currentUserId,
  onEdit,
  onDelete,
}) {
  const isOwner =
    review.user === currentUserId;

  return (
    <div className="review-item">
      <div className="review-item-header">
        <div className="review-item-author">
          <span className="review-author-name">
            {review.user_username ||
              "Anonymous"}
          </span>

          <StarRating
            value={review.rating}
            size={16}
          />
        </div>

        <span className="review-date">
          {formatDate(review.created_at)}
        </span>
      </div>

      <p className="review-comment">
        {review.comment}
      </p>

      {isOwner && (
        <div className="review-item-actions">
          <button
            type="button"
            className="review-edit-button"
            onClick={() => onEdit(review)}
          >
            Edit
          </button>

          <button
            type="button"
            className="review-delete-button"
            onClick={() => onDelete(review)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewList({
  reviews,
  currentUserId,
  onEdit,
  onDelete,
}) {
  if (!reviews || reviews.length === 0) {
    return (
      <p className="reviews-empty">
        No reviews yet. Be the first to review
        this property.
      </p>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default ReviewList;

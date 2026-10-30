import StarRating from "./StarRating";

function formatReviewDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ReviewList({ reviews, currentUserId, deletingId, onEdit, onDelete }) {
  return (
    <ul className="review-list">
      {reviews.map((review) => {
        const isOwner = currentUserId !== undefined &&
          review.user === currentUserId;

        return (
          <li key={review.id} className="review-item">

            <div className="review-item-header">
              <div>
                <p className="review-author">{review.user_name}</p>
                <time className="review-date" dateTime={review.created_at}>
                  {formatReviewDate(review.created_at)}
                </time>
              </div>

              <StarRating value={review.rating} readOnly />
            </div>

            <p className="review-comment">{review.comment}</p>

            {isOwner && (
              <div className="review-item-actions">
                <button
                  type="button"
                  className="review-button"
                  onClick={() => onEdit(review)}
                  disabled={deletingId === review.id}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="review-button review-button--danger"
                  onClick={() => onDelete(review)}
                  disabled={deletingId === review.id}
                >
                  {deletingId === review.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}

          </li>
        );
      })}
    </ul>
  );
}

export default ReviewList;

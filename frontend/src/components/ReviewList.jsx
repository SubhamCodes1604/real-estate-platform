
import StarRating from "./StarRating";

export default function ReviewList({
  reviews = [],
  currentUserId,
  onEdit,
  onDelete,
}) {
  if (!reviews.length) {
    return (
      <p className="no-reviews">
        No reviews yet. Be the first to review this property!
      </p>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => {
        const isAuthor =
          String(review.user) === String(currentUserId);

        return (
          <article key={review.id} className="review-card">
            <div className="review-card-header">
              <div>
                <h4>
                  {review.user_username || "Anonymous User"}
                </h4>

                <StarRating rating={review.rating} />

                <small>
                  {new Date(review.created_at).toLocaleDateString()}
                </small>
              </div>

              {isAuthor && (
                <div className="review-actions">
                  <button
                    type="button"
                    onClick={() => onEdit(review)}
                    className="review-edit-btn"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(review.id)}
                    className="review-delete-btn"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <p className="review-comment">
              {review.comment}
            </p>
          </article>
        );
      })}
    </div>
  );
}

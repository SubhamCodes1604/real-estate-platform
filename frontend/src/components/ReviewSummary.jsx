import StarRating from "./StarRating";

const STAR_LEVELS = [5, 4, 3, 2, 1];

function ReviewSummary({ summary }) {
  const total = summary.total_reviews;
  const average = summary.average_rating;

  return (
    <div className="review-summary">

      <div className="review-summary-score">
        <p className="review-summary-average">
          {average === null ? "No rating" : average.toFixed(1)}
        </p>

        <StarRating value={average ?? 0} readOnly />

        <p className="review-summary-count">
          {total} {total === 1 ? "review" : "reviews"}
        </p>
      </div>

      {total > 0 && (
        <ul className="review-distribution" aria-label="Rating distribution">
          {STAR_LEVELS.map((star) => {
            const count = summary.distribution[String(star)] ?? 0;
            const percent = total > 0 ? (count / total) * 100 : 0;

            return (
              <li key={star} className="review-distribution-row">
                <span className="review-distribution-label">{star} star</span>

                <span className="review-distribution-track" aria-hidden="true">
                  <span
                    className="review-distribution-fill"
                    style={{ width: `${percent}%` }}
                  />
                </span>

                <span className="review-distribution-count">{count}</span>
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}

export default ReviewSummary;


import { useState } from "react";

export default function StarRating({
  rating = 0,
  onChange,
  interactive = false,
  size = "24px",
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayedRating = hoverRating || rating;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
      role={interactive ? "group" : "img"}
      aria-label={
        interactive
          ? "Select a rating from 1 to 5 stars"
          : `${rating} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onFocus={() => interactive && setHoverRating(star)}
          onBlur={() => setHoverRating(0)}
          aria-label={`Rate ${star} out of 5 stars`}
          aria-pressed={interactive ? rating === star : undefined}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: interactive ? "pointer" : "default",
            fontSize: size,
            color: star <= displayedRating ? "#f59e0b" : "#d1d5db",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

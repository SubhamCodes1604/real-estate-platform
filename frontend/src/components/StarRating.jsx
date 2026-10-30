import { useState } from "react";

function StarRating({
  value = 0,
  max = 5,
  interactive = false,
  onChange,
  size = 24,
}) {
  const [hover, setHover] = useState(0);

  const display = hover || value;

  const handleClick = (i) => {
    if (interactive && onChange) {
      onChange(i);
    }
  };

  const handleKey = (e, i) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onChange) onChange(i);
    }
  };

  return (
    <div
      className="star-rating"
      role={
        interactive ? "radiogroup" : "img"
      }
      aria-label={
        interactive
          ? "Select a rating from 1 to 5"
          : `Rating: ${value} out of ${max}`
      }
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= display;
        return (
          <button
            key={starValue}
            type="button"
            className={
              filled
                ? "star star-filled"
                : "star star-empty"
            }
            onClick={() => handleClick(starValue)}
            onMouseEnter={() =>
              interactive && setHover(starValue)
            }
            onMouseLeave={() =>
              interactive && setHover(0)
            }
            onKeyDown={(e) =>
              handleKey(e, starValue)
            }
            disabled={!interactive}
            aria-checked={
              interactive
                ? value === starValue
                : undefined
            }
            aria-label={`${starValue} star`}
            role={interactive ? "radio" : undefined}
            tabIndex={interactive ? 0 : -1}
            style={{ fontSize: size }}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;

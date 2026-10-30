const STARS = [1, 2, 3, 4, 5];

function StarRating({ value = 0, onChange, name = "rating", readOnly = false }) {
  if (readOnly) {
    const filledCount = Math.round(value);

    return (
      <span
        className="star-rating star-rating--static"
        role="img"
        aria-label={`${value} out of 5 stars`}
      >
        {STARS.map((star) => (
          <span
            key={star}
            className={star <= filledCount ? "star-glyph is-filled" : "star-glyph"}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <fieldset className="star-rating star-rating--input">
      <legend className="star-rating-legend">Your rating</legend>

      <div className="star-rating-options">
        {STARS.map((star) => (
          <label
            key={star}
            className={star <= value ? "star-option is-filled" : "star-option"}
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="visually-hidden"
            />
            <span className="star-glyph" aria-hidden="true">★</span>
            <span className="visually-hidden">
              {star} {star === 1 ? "star" : "stars"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default StarRating;

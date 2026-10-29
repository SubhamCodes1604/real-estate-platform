import { Link } from "react-router-dom";

const formatPrice = (price) => {
  const num = Number(price);

  if (num >= 10000000) {
    return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  }

  if (num >= 100000) {
    return `₹ ${(num / 100000).toFixed(2)} L`;
  }

  return `₹ ${num.toLocaleString("en-IN")}`;
};

const typeLabel = (type) =>
  ({
    FLAT: "Flat",
    HOUSE: "House",
    VILLA: "Villa",
    PLOT: "Plot",
  }[type] || type);

function PropertyCard({ property }) {
  return (
    <Link
      to={`/properties/${property.id}`}
      className="shared-property-card"
    >
      <div className="shared-property-image-wrap">
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            className="shared-property-image"
          />
        ) : (
          <div className="shared-property-no-image">
            No Image Available
          </div>
        )}

        {property.is_featured && (
          <span className="shared-property-badge">
            Featured
          </span>
        )}

        <span className="shared-property-type-badge">
          {typeLabel(property.property_type)}
        </span>
      </div>

      <div className="shared-property-body">
        <h3 className="shared-property-title">
          {property.title}
        </h3>

        <p className="shared-property-price">
          {formatPrice(property.price)}
        </p>

        <p className="shared-property-location">
          {property.city}, {property.state}
        </p>

        <div className="shared-property-features">
          <span className="shared-property-feature">
            <strong>{property.bedrooms}</strong> Beds
          </span>
          <span className="shared-property-feature">
            <strong>{property.bathrooms}</strong> Baths
          </span>
          <span className="shared-property-feature">
            <strong>
              {Number(property.area_sqft).toLocaleString()}
            </strong>{" "}
            sq.ft
          </span>
        </div>

        <span className="shared-property-link">
          View Details →
        </span>
      </div>
    </Link>
  );
}

export default PropertyCard;

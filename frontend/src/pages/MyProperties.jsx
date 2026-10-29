import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./MyProperties.css";

const formatPrice = (price) => {
  const num = Number(price);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
  return `₹ ${num.toLocaleString("en-IN")}`;
};

function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchMyProperties = async () => {
      try {
        const response = await api.get(
          "/properties/my-properties/"
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setProperties(data);
      } catch (err) {
        console.error("My properties error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load your properties."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyProperties();
  }, []);

  const handleDelete = async (propertyId, propertyTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${propertyTitle}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(propertyId);
    setError("");

    try {
      await api.delete(
        `/properties/delete/${propertyId}/`
      );

      setProperties((current) =>
        current.filter(
          (property) => property.id !== propertyId
        )
      );
    } catch (err) {
      console.error("Delete property error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete property. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-properties-page">
        <div className="my-properties-header">
          <div>
            <h1>My Properties</h1>
            <p>Manage the properties you have listed.</p>
          </div>
        </div>
        <div className="my-properties-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div className="my-property-skeleton" key={i}>
              <div className="skeleton-image skeleton-image-wide"></div>
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-line-medium"></div>
                <div className="skeleton-line skeleton-line-short"></div>
                <div className="skeleton-line skeleton-line-long"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && properties.length === 0) {
    return (
      <div className="my-properties-page">
        <div className="my-properties-header">
          <div>
            <h1>My Properties</h1>
            <p>Manage the properties you have listed.</p>
          </div>
        </div>
        <div className="my-properties-error-state">
          <h3>Unable to load properties</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-properties-page">
      {/* HEADER */}
      <div className="my-properties-header">
        <div>
          <h1>My Properties</h1>
          <p>Manage the properties you have listed.</p>
        </div>

        <Link
          to="/properties/create"
          className="my-properties-add-button"
        >
          + Add Property
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="my-properties-error-banner">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {properties.length === 0 ? (
        <div className="my-properties-empty">
          <h3>No properties yet</h3>
          <p>You haven't added any properties yet.</p>
          <Link to="/properties/create" className="my-properties-empty-button">
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="my-properties-list">
          {properties.map((property) => (
            <div
              className="my-property-card"
              key={property.id}
            >
              {/* IMAGE */}
              <div className="my-property-image-wrap">
                {property.image ? (
                  <img
                    src={property.image}
                    alt={property.title}
                    className="my-property-image"
                  />
                ) : (
                  <div className="my-property-no-image">
                    No Image
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="my-property-content">
                <div className="my-property-top">
                  <h3>{property.title}</h3>

                  <span
                    className={
                      property.is_approved
                        ? "my-property-status approved"
                        : "my-property-status pending"
                    }
                  >
                    {property.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>

                <p className="my-property-price">
                  {formatPrice(property.price)}
                </p>

                <p className="my-property-location">
                  {property.city}, {property.state}
                </p>

                <div className="my-property-features">
                  <span><strong>{property.bedrooms}</strong> Beds</span>
                  <span><strong>{property.bathrooms}</strong> Baths</span>
                  <span><strong>{Number(property.area_sqft).toLocaleString()}</strong> sq.ft</span>
                </div>

                {/* ACTIONS */}
                <div className="my-property-actions">
                  <Link
                    to={`/properties/${property.id}`}
                    className="my-property-action-view"
                  >
                    View
                  </Link>
                  <Link
                    to={`/properties/edit/${property.id}`}
                    className="my-property-action-edit"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="my-property-action-delete"
                    onClick={() =>
                      handleDelete(property.id, property.title)
                    }
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProperties;

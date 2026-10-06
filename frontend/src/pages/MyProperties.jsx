import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./MyProperties.css";

function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const fetchMyProperties = async () => {
    try {
      const response = await api.get(
        "/properties/my-properties/"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setProperties(data);

    } catch (error) {
      console.error(
        "My properties error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to load your properties."
      );

    } finally {
      setLoading(false);
    }
  };

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

    } catch (error) {
      console.error(
        "Delete property error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to delete property. Please try again."
      );

    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-properties-page">
        <h1>My Properties</h1>
        <p>Loading your properties...</p>
      </div>
    );
  }

  if (error && properties.length === 0) {
    return (
      <div className="my-properties-page">

        <h1>My Properties</h1>

        <p className="my-properties-error">
          {error}
        </p>

      </div>
    );
  }

  return (
    <div className="my-properties-page">

      {/* HEADER */}

      <div className="my-properties-header">

        <div>
          <h1>My Properties</h1>

          <p>
            Manage the properties you have listed.
          </p>
        </div>

        <Link
          to="/properties/create"
          className="add-property-button"
        >
          + Add Property
        </Link>

      </div>

      {/* ERROR */}

      {error && (
        <div className="my-properties-error">
          {error}
        </div>
      )}

      {/* EMPTY */}

      {properties.length === 0 ? (

        <div className="empty-properties">

          <h2>No properties yet</h2>

          <p>
            You haven't added any properties yet.
          </p>

          <Link to="/properties/create">
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

              {property.image && (
                <img
                  src={property.image}
                  alt={property.title}
                  className="my-property-image"
                />
              )}

              {/* CONTENT */}

              <div className="my-property-content">

                <div className="my-property-header">

                  <h2>
                    {property.title}
                  </h2>

                  <span
                    className={
                      property.is_approved
                        ? "property-status approved"
                        : "property-status pending"
                    }
                  >
                    {property.is_approved
                      ? "Approved"
                      : "Pending Approval"}
                  </span>

                </div>

                <p className="property-price">
                  ₹ {property.price}
                </p>

                <p>
                  {property.city},{" "}
                  {property.state}
                </p>

                <div className="property-features">

                  <span>
                    {property.bedrooms} Bedrooms
                  </span>

                  <span>
                    {property.bathrooms} Bathrooms
                  </span>

                  <span>
                    {property.area_sqft} sq.ft
                  </span>

                </div>

                {/* ACTIONS */}

                <div className="property-actions">

                  <Link
                    to={`/properties/${property.id}`}
                    className="view-property-button"
                  >
                    View
                  </Link>

                  <Link
                    to={`/properties/edit/${property.id}`}
                    className="edit-property-button"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    className="delete-property-button"
                    onClick={() =>
                      handleDelete(
                        property.id,
                        property.title
                      )
                    }
                    disabled={
                      deletingId === property.id
                    }
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
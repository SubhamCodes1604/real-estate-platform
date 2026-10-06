import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Properties.css";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get("/properties/list/");

        setProperties(response.data.results || response.data);
      } catch (error) {
        console.error("Properties error:", error);

        setError(
          error.response?.data?.detail ||
          "Unable to load properties."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="properties-page">
        <h1>Properties</h1>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="properties-page">
        <h1>Properties</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="properties-page">

      <div className="properties-header">
        <h1>Properties</h1>
        <p>Browse available properties.</p>
      </div>

      {properties.length === 0 ? (
        <p>No properties available.</p>
      ) : (
        <div className="property-grid">

          {properties.map((property) => (
            <div
              className="property-card"
              key={property.id}
            >

              {property.image && (
                <img
                  src={property.image}
                  alt={property.title}
                  className="property-image"
                />
              )}

              <div className="property-card-content">

                <h2>{property.title}</h2>

                <p className="property-price">
                  ₹ {property.price}
                </p>

                <p>
                  {property.city}, {property.state}
                </p>

                <div className="property-features">
                  <span>
                    🛏 {property.bedrooms} Bedrooms
                  </span>

                  <span>
                    🛁 {property.bathrooms} Bathrooms
                  </span>

                  <span>
                    📐 {property.area_sqft} sq.ft
                  </span>
                </div>

                <Link
                  to={`/properties/${property.id}`}
                  className="view-property-button"
                >
                  View Details
                </Link>

              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Properties;
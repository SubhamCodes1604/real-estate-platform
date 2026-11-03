import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PropertyReviews from "../components/PropertyReviews";
import "./PropertyDetails.css";

const formatPrice = (price) => {
  const num = Number(price);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
  return `₹ ${num.toLocaleString("en-IN")}`;
};

function PropertyDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState("");

  const userRole = user?.role;
  const isUser = userRole === "USER";
  const isAgent = userRole === "AGENT";

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get(`/properties/detail/${id}/`);
        setProperty(response.data);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Unable to load property."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchBookmarkStatus = async () => {
      if (!isAuthenticated || !isUser) {
        setBookmarked(false);
        return;
      }
      try {
        const response = await api.get(`/bookmarks/status/${id}/`);
        setBookmarked(response.data.is_bookmarked);
      } catch {
        setBookmarked(false);
      }
    };

    fetchProperty();
    fetchBookmarkStatus();
  }, [id, isAuthenticated, isUser]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecommendationsLoading(true);
        setRecommendationsError("");
        const response = await api.get(
          `/properties/recommendations/ml/?property_id=${id}`
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.recommendations || [];
        setRecommendations(data);
      } catch {
        setRecommendationsError("Unable to load similar properties.");
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [id]);

  if (loading) {
    return (
      <div className="property-details-loading">
        <div className="property-details-skeleton-image"></div>
        <div className="property-details-skeleton-title"></div>
        <div className="property-details-skeleton-text"></div>
        <div className="property-details-skeleton-text"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-details-page">
        <div className="dashboard-error-state">
          <h3>Unable to load property</h3>
          <p>{error}</p>
        </div>
        <Link to="/properties" className="property-back-link">
          ← Back to Properties
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-details-page">
        <div className="dashboard-empty-state">
          <h3>Property not found</h3>
          <p>The property you are looking for does not exist.</p>
        </div>
        <Link to="/properties" className="property-back-link">
          ← Back to Properties
        </Link>
      </div>
    );
  }

  const handleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        const listResponse = await api.get("/bookmarks/list/");
        const allBookmarks = Array.isArray(listResponse.data)
          ? listResponse.data
          : listResponse.data.results || [];
        const bookmark = allBookmarks.find(
          (b) => b.property?.id === property.id
        );
        if (!bookmark) {
          setBookmarked(false);
          setMessage("This property is not in your bookmarks.");
          return;
        }
        await api.delete(`/bookmarks/remove/${bookmark.id}/`);
        setBookmarked(false);
        setMessage("Property removed from bookmarks.");
      } else {
        await api.post("/bookmarks/add/", {
          property_id: property.id,
        });
        setBookmarked(true);
        setMessage("Property bookmarked successfully.");
      }
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = "Unable to update bookmark.";
      if (typeof errorData === "object" && errorData !== null) {
        errorMsg = Object.values(errorData).flat().join(" ");
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage(errorMsg);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    const trimmedMessage = inquiryMessage.trim();
    if (!trimmedMessage || inquiryLoading) {
      setMessage("Please enter a message before sending.");
      return;
    }
    setInquiryLoading(true);
    setMessage("");
    try {
      await api.post("/inquiries/create/", {
        property: property.id,
        message: trimmedMessage,
      });
      setMessage("Inquiry sent successfully!");
      setInquiryMessage("");
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage =
        typeof errorData === "object" && errorData
          ? Object.values(errorData).flat().join(" ")
          : errorData?.detail || "Unable to send inquiry.";
      setMessage(errorMessage);
    } finally {
      setInquiryLoading(false);
    }
  };

  return (
    <div className="property-details-page">
      <div className="property-details-container">
        {/* HEADER */}
        <div className="property-details-header">
          <h1>{property.title}</h1>
          <p className="property-price">{formatPrice(property.price)}</p>
          <p>{property.city}, {property.state}</p>
        </div>

        {/* MAIN IMAGE */}
        {property.image && (
          <img
            src={property.image}
            alt={property.title}
            className="property-details-image"
          />
        )}

        {/* GALLERY */}
        {property.gallery_images && property.gallery_images.length > 0 && (
          <section className="property-gallery">
            <h2>Gallery</h2>
            <div className="property-gallery-grid">
              {property.gallery_images.map((img) => (
                <div className="property-gallery-item" key={img.id}>
                  <img
                    src={img.image}
                    alt={img.caption || property.title}
                    className="property-gallery-image"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FEATURES */}
        <div className="property-features">
          <div className="feature-card">
            <strong>Bedrooms</strong>
            <span>{property.bedrooms}</span>
          </div>
          <div className="feature-card">
            <strong>Bathrooms</strong>
            <span>{property.bathrooms}</span>
          </div>
          <div className="feature-card">
            <strong>Area</strong>
            <span>{Number(property.area_sqft).toLocaleString()} sq.ft</span>
          </div>
        </div>

        {/* DESCRIPTION */}
        <section className="property-description">
          <h2>Description</h2>
          <p>{property.description}</p>
        </section>

        {/* USER ACTIONS */}
        {isAuthenticated && isUser && (
          <>
            <button
              className="bookmark-button"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
            >
              {bookmarkLoading
                ? "Updating..."
                : bookmarked
                  ? "♥ Bookmarked"
                  : "♡ Bookmark Property"}
            </button>

            <section className="inquiry-section">
              <h2>Interested in this property?</h2>
              <form onSubmit={handleInquiry}>
                <label>Your Message</label>
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Ask about this property, schedule a visit, negotiate the price, etc."
                  rows="5"
                  required
                />
                <button
                  type="submit"
                  className="inquiry-button"
                  disabled={inquiryLoading}
                >
                  {inquiryLoading ? "Sending..." : "Send Inquiry"}
                </button>
              </form>
            </section>
          </>
        )}

        {/* AGENT MESSAGE */}
        {isAuthenticated && isAgent && (
          <div className="agent-property-message">
            <h3>Agent Property View</h3>
            <p>
              You are viewing this property as an agent. Bookmarking and
              sending inquiries are available only to buyers.
            </p>
          </div>
        )}

        {/* NOT LOGGED IN */}
        {!isAuthenticated && (
          <div className="login-property-message">
            <p>Want to bookmark this property or send an inquiry?</p>
            <Link to="/login">Login to continue</Link>
          </div>
        )}

        {/* MESSAGE */}
        {message && <p className="property-message">{message}</p>}

        {/* REVIEWS */}
        <PropertyReviews propertyId={property.id} />

        {/* SIMILAR PROPERTIES */}
        <section className="recommendations-section">
          <h2>Similar Properties</h2>

          {recommendationsLoading && (
            <p className="recommendations-loading">
              Finding similar properties...
            </p>
          )}

          {recommendationsError && (
            <p className="recommendation-error">{recommendationsError}</p>
          )}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length === 0 && (
              <p className="no-recommendations">
                No similar properties found.
              </p>
            )}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length > 0 && (
              <div className="recommendations-grid">
                {recommendations.map((rec) => (
                  <div className="recommendation-card" key={rec.id}>
                    {rec.image ? (
                      <img
                        src={rec.image}
                        alt={rec.title}
                        className="recommendation-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    {!rec.image && (
                      <div className="recommendation-no-image">
                        No Image
                      </div>
                    )}

                    <div className="recommendation-content">
                      <h3>{rec.title}</h3>
                      <p className="recommendation-price">
                        {formatPrice(rec.price)}
                      </p>
                      <p className="recommendation-location">
                        {rec.city}, {rec.state}
                      </p>

                      <div className="recommendation-features">
                        <span>{rec.bedrooms} Beds</span>
                        <span>{rec.bathrooms} Baths</span>
                        {rec.area_sqft && (
                          <span>
                            {Number(rec.area_sqft).toLocaleString()} sq.ft
                          </span>
                        )}
                      </div>

                      {rec.similarity_score !== undefined && (
                        <p className="recommendation-score">
                          Similarity:{" "}
                          {(rec.similarity_score * 100).toFixed(1)}%
                        </p>
                      )}

                      <Link
                        to={`/properties/${rec.id}`}
                        className="view-recommendation-button"
                      >
                        View Property
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* BACK */}
        <div className="property-back">
          <Link to="/properties">← Back to Properties</Link>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;

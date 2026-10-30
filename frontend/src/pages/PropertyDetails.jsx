import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PropertyReviews from "../components/PropertyReviews";
import "./PropertyDetails.css";

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

  // =========================
  // ML RECOMMENDATIONS
  // =========================

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(true);
  const [recommendationsError, setRecommendationsError] =
    useState("");

  const userRole = user?.role;

  // USER only
  const isUser = userRole === "USER";

  // AGENT only
  const isAgent = userRole === "AGENT";


  // =========================
  // FETCH PROPERTY + BOOKMARK STATUS
  // =========================

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/properties/detail/${id}/`
        );

        setProperty(response.data);

      } catch (err) {
        console.error(
          "Property details error:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to load property."
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
        const response = await api.get(
          `/bookmarks/status/${id}/`
        );

        setBookmarked(response.data.is_bookmarked);
      } catch (err) {
        console.error(
          "Bookmark status error:",
          err
        );
      }
    };

    fetchProperty();
    fetchBookmarkStatus();
  }, [id, isAuthenticated, isUser]);


  // =========================
  // FETCH ML RECOMMENDATIONS
  // =========================

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecommendationsLoading(true);
        setRecommendationsError("");

        const response = await api.get(
          `/properties/recommendations/ml/?property_id=${id}`
        );

        // Backend returns:
        // {
        //   property_id: 8,
        //   recommendations: [...]
        // }

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.recommendations || [];

        setRecommendations(data);

      } catch (error) {
        console.error(
          "Recommendation error:",
          error
        );

        setRecommendationsError(
          "Unable to load similar properties."
        );

      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [id]);


  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="property-details-page">
        <h1>Loading property...</h1>
      </div>
    );
  }


  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="property-details-page">

        <h1>Property Details</h1>

        <p>{error}</p>

        <Link to="/properties">
          ← Back to Properties
        </Link>

      </div>
    );
  }


  // =========================
  // PROPERTY NOT FOUND
  // =========================

  if (!property) {
    return (
      <div className="property-details-page">

        <h1>Property not found</h1>

        <Link to="/properties">
          ← Back to Properties
        </Link>

      </div>
    );
  }


  // =========================
  // BOOKMARK
  // =========================

  const handleBookmark = async () => {
    setBookmarkLoading(true);

    try {

      if (bookmarked) {

        const listResponse = await api.get(
          "/bookmarks/list/"
        );

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

        await api.delete(
          `/bookmarks/remove/${bookmark.id}/`
        );

        setBookmarked(false);

        setMessage(
          "Property removed from bookmarks."
        );

      } else {

        await api.post(
          "/bookmarks/add/",
          {
            property_id: property.id,
          }
        );

        setBookmarked(true);

        setMessage(
          "Property bookmarked successfully."
        );
      }

    } catch (err) {

      console.error(
        "Bookmark error:",
        err
      );

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


  // =========================
  // INQUIRY
  // =========================

  const handleInquiry = async (e) => {

    e.preventDefault();

    if (!inquiryMessage.trim()) {
      return;
    }

    try {

      await api.post(
        "/inquiries/create/",
        {
          property: property.id,
          message: inquiryMessage,
        }
      );

      setMessage(
        "Inquiry sent successfully!"
      );

      setInquiryMessage("");

    } catch (error) {

      console.error(
        "Inquiry error:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
        "Unable to send inquiry."
      );
    }
  };


  // =========================
  // UI
  // =========================

  return (
    <div className="property-details-page">

      <div className="property-details-container">


        {/* ========================= */}
        {/* PROPERTY HEADER */}
        {/* ========================= */}

        <div className="property-details-header">

          <h1>{property.title}</h1>

          <p className="property-price">
            ₹ {property.price}
          </p>

          <p>
            {property.city}, {property.state}
          </p>

        </div>


        {/* ========================= */}
        {/* PROPERTY IMAGE */}
        {/* ========================= */}

        {property.image && (
          <img
            src={property.image}
            alt={property.title}
            className="property-details-image"
          />
        )}


        {/* ========================= */}
        {/* PROPERTY FEATURES */}
        {/* ========================= */}

        <div className="property-features">

          <div className="feature-card">

            <strong>
              Bedrooms
            </strong>

            <span>
              {property.bedrooms}
            </span>

          </div>


          <div className="feature-card">

            <strong>
              Bathrooms
            </strong>

            <span>
              {property.bathrooms}
            </span>

          </div>


          <div className="feature-card">

            <strong>
              Area
            </strong>

            <span>
              {property.area_sqft} sq.ft
            </span>

          </div>

        </div>


        {/* ========================= */}
        {/* DESCRIPTION */}
        {/* ========================= */}

        <section className="property-description">

          <h2>
            Description
          </h2>

          <p>
            {property.description}
          </p>

        </section>


        {/* ========================= */}
        {/* USER ACTIONS ONLY */}
        {/* ========================= */}

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


            {/* INQUIRY */}

            <section className="inquiry-section">

              <h2>
                Interested in this property?
              </h2>

              <form onSubmit={handleInquiry}>

                <label>
                  Your Message
                </label>

                <textarea
                  value={inquiryMessage}
                  onChange={(e) =>
                    setInquiryMessage(
                      e.target.value
                    )
                  }
                  placeholder="Ask about this property, schedule a visit, negotiate the price, etc."
                  rows="5"
                  required
                />

                <button
                  type="submit"
                  className="inquiry-button"
                >
                  Send Inquiry
                </button>

              </form>

            </section>

          </>
        )}


        {/* ========================= */}
        {/* AGENT MESSAGE */}
        {/* ========================= */}

        {isAuthenticated && isAgent && (

          <div className="agent-property-message">

            <h3>
              Agent Property View
            </h3>

            <p>
              You are viewing this property as an
              agent. Bookmarking and sending inquiries
              are available only to buyers.
            </p>

          </div>

        )}


        {/* ========================= */}
        {/* NOT LOGGED IN */}
        {/* ========================= */}

        {!isAuthenticated && (

          <div className="login-property-message">

            <p>
              Want to bookmark this property or send
              an inquiry?
            </p>

            <Link to="/login">
              Login to continue
            </Link>

          </div>

        )}


        {/* ========================= */}
        {/* SUCCESS / ERROR MESSAGE */}
        {/* ========================= */}

        {message && (

          <p className="property-message">
            {message}
          </p>

        )}


        {/* ========================= */}
        {/* ML RECOMMENDATIONS */}
        {/* ========================= */}

        <section className="recommendations-section">

          <h2>
            Similar Properties
          </h2>


          {/* LOADING */}

          {recommendationsLoading && (

            <p className="recommendations-loading">
              Finding similar properties...
            </p>

          )}


          {/* ERROR */}

          {recommendationsError && (

            <p className="recommendation-error">
              {recommendationsError}
            </p>

          )}


          {/* NO RESULTS */}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length === 0 && (

              <p className="no-recommendations">
                No similar properties found.
              </p>

          )}


          {/* RECOMMENDATION CARDS */}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length > 0 && (

              <div className="recommendations-grid">

                {recommendations.map(
                  (recommendedProperty) => (

                    <div
                      className="recommendation-card"
                      key={recommendedProperty.id}
                    >


                      {/* IMAGE */}

                      {recommendedProperty.image ? (

                        <img
                          src={recommendedProperty.image}
                          alt={recommendedProperty.title}
                          className="recommendation-image"
                        />

                      ) : (

                        <div className="recommendation-no-image">
                          No Image
                        </div>

                      )}


                      {/* CONTENT */}

                      <div className="recommendation-content">

                        <h3>
                          {recommendedProperty.title}
                        </h3>


                        <p className="recommendation-price">
                          ₹ {recommendedProperty.price}
                        </p>


                        <p className="recommendation-location">
                          {recommendedProperty.city},{" "}
                          {recommendedProperty.state}
                        </p>


                        {/* FEATURES */}

                        <div className="recommendation-features">

                          <span>
                            {recommendedProperty.bedrooms}
                            {" "}Bedrooms
                          </span>

                          <span>
                            {recommendedProperty.bathrooms}
                            {" "}Bathrooms
                          </span>

                          <span>
                            {recommendedProperty.area_sqft}
                            {" "}sq.ft
                          </span>

                        </div>


                        {/* SIMILARITY SCORE */}

                        {recommendedProperty.similarity_score !==
                          undefined && (

                          <p className="recommendation-score">
                            Similarity:{" "}
                            {(
                              recommendedProperty.similarity_score *
                              100
                            ).toFixed(1)}
                            %
                          </p>

                        )}


                        {/* VIEW BUTTON */}

                        <Link
                          to={`/properties/${recommendedProperty.id}`}
                          className="view-recommendation-button"
                        >
                          View Property
                        </Link>

                      </div>

                    </div>

                  )
                )}

              </div>

          )}

        </section>


        {/* ========================= */}
        {/* PROPERTY REVIEWS */}
        {/* ========================= */}

        <PropertyReviews propertyId={property.id} />


        {/* ========================= */}
        {/* BACK TO PROPERTIES */}
        {/* ========================= */}

        <div className="property-back">

          <Link to="/properties">
            ← Back to Properties
          </Link>

        </div>

      </div>

    </div>
  );
}

export default PropertyDetails;
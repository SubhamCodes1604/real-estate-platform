import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Inquiries.css";

function Inquiries() {
  const { user } = useAuth();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAgent = user?.role === "AGENT";

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const endpoint = isAgent
          ? "/inquiries/received/"
          : "/inquiries/my/";

        const response = await api.get(endpoint);

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setInquiries(data);
      } catch (err) {
        console.error("Inquiries error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load inquiries."
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInquiries();
    }
  }, [user, isAgent]);

  const pageTitle = isAgent
    ? "Received Inquiries"
    : "My Inquiries";

  const pageDescription = isAgent
    ? "View inquiries received for your properties."
    : "View the inquiries you have sent about properties.";

  if (loading) {
    return (
      <div className="inquiries-page">
        <div className="inquiries-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
        </div>
        <div className="inquiries-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div className="inquiries-skeleton-card" key={i}>
              <div className="skeleton-line skeleton-line-medium"></div>
              <div className="skeleton-line skeleton-line-long"></div>
              <div className="skeleton-line skeleton-line-short"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inquiries-page">
        <div className="inquiries-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
        </div>
        <div className="inquiries-error-state">
          <h3>Unable to load inquiries</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiries-page">
      <div className="inquiries-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageDescription}</p>
        </div>

        {!isAgent && (
          <Link
            to="/properties"
            className="inquiries-browse-button"
          >
            Browse Properties
          </Link>
        )}
      </div>

      {inquiries.length === 0 ? (
        <div className="inquiries-empty">
          <h3>
            {isAgent ? "No inquiries received" : "No inquiries yet"}
          </h3>
          <p>
            {isAgent
              ? "No one has sent an inquiry about your properties yet."
              : "You haven't sent any property inquiries yet."}
          </p>
          {!isAgent && (
            <Link to="/properties" className="inquiries-empty-button">
              Browse Properties
            </Link>
          )}
        </div>
      ) : (
        <div className="inquiries-list">
          {inquiries.map((inquiry) => (
            <div
              className="inquiry-card"
              key={inquiry.id}
            >
              <div className="inquiry-card-header">
                <h3>
                  {inquiry.property_details?.title ||
                    `Property #${inquiry.property}`}
                </h3>

                <span className="inquiry-date">
                  {new Date(
                    inquiry.created_at
                  ).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {isAgent && (
                <div className="inquiry-buyer">
                  <span className="inquiry-buyer-label">From</span>
                  <span className="inquiry-buyer-name">
                    {inquiry.buyer_username ||
                      `User #${inquiry.buyer}`}
                  </span>
                </div>
              )}

              <div className="inquiry-message">
                <span className="inquiry-message-label">
                  {isAgent ? "Buyer's Message" : "Your Message"}
                </span>
                <p>{inquiry.message}</p>
              </div>

              {inquiry.property_details && (
                <Link
                  to={`/properties/${inquiry.property_details.id}`}
                  className="inquiry-property-link"
                >
                  View Property →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Inquiries;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./ReceivedInquiries.css";

function ReceivedInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceivedInquiries = async () => {
      try {
        const response = await api.get(
          "/inquiries/received/"
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setInquiries(data);
      } catch (err) {
        console.error("Received inquiries error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load received inquiries."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedInquiries();
  }, []);

  if (loading) {
    return (
      <div className="received-inquiries-page">
        <div className="received-inquiries-header">
          <h1>Received Inquiries</h1>
          <p>View inquiries received for your properties.</p>
        </div>
        <div className="received-inquiries-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div className="received-inquiries-skeleton-card" key={i}>
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
      <div className="received-inquiries-page">
        <div className="received-inquiries-header">
          <h1>Received Inquiries</h1>
          <p>View inquiries received for your properties.</p>
        </div>
        <div className="received-inquiries-error-state">
          <h3>Unable to load inquiries</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="received-inquiries-page">
      <div className="received-inquiries-header">
        <h1>Received Inquiries</h1>
        <p>View inquiries received for your properties.</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="received-inquiries-empty">
          <h3>No inquiries yet</h3>
          <p>You haven't received any inquiries for your properties.</p>
        </div>
      ) : (
        <div className="received-inquiries-list">
          {inquiries.map((inquiry) => (
            <div
              className="received-inquiry-card"
              key={inquiry.id}
            >
              <div className="received-inquiry-header">
                <h3>
                  {inquiry.property_details?.title ||
                    `Property #${inquiry.property}`}
                </h3>

                <span className="received-inquiry-date">
                  {new Date(
                    inquiry.created_at
                  ).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="received-inquiry-buyer">
                <span className="received-inquiry-buyer-label">From</span>
                <span className="received-inquiry-buyer-name">
                  {inquiry.buyer_username ||
                    `User #${inquiry.buyer}`}
                </span>
              </div>

              <div className="received-inquiry-message">
                <span className="received-inquiry-message-label">
                  Buyer's Message
                </span>
                <p>{inquiry.message}</p>
              </div>

              {inquiry.property_details && (
                <Link
                  to={`/properties/${inquiry.property_details.id}`}
                  className="received-inquiry-property-link"
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

export default ReceivedInquiries;

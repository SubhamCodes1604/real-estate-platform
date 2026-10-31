import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./ReceivedInquiries.css";

function ReceivedInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [responseDrafts, setResponseDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [responseErrors, setResponseErrors] = useState({});
  const [successId, setSuccessId] = useState(null);

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

  const handleResponseChange = (inquiryId, value) => {
    setResponseDrafts((prev) => ({
      ...prev,
      [inquiryId]: value,
    }));

    setResponseErrors((prev) => ({
      ...prev,
      [inquiryId]: null,
    }));
    setSuccessId(null);
  };

  const handleRespond = async (inquiryId) => {
    const draft = responseDrafts[inquiryId];

    if (!draft || !draft.trim()) {
      setResponseErrors((prev) => ({
        ...prev,
        [inquiryId]: "Response cannot be empty.",
      }));
      return;
    }

    setSubmittingId(inquiryId);
    setResponseErrors((prev) => ({
      ...prev,
      [inquiryId]: null,
    }));

    try {
      const response = await api.patch(
        `/inquiries/${inquiryId}/respond/`,
        { response: draft }
      );

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? response.data : inq
        )
      );

      setResponseDrafts((prev) => ({
        ...prev,
        [inquiryId]: "",
      }));

      setSuccessId(inquiryId);
    } catch (err) {
      setResponseErrors((prev) => ({
        ...prev,
        [inquiryId]:
          err.response?.data?.response ||
          err.response?.data?.detail ||
          "Unable to submit response.",
      }));
    } finally {
      setSubmittingId(null);
    }
  };

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

              <div className="inquiry-response-section">
                <span className="received-inquiry-message-label">
                  Your Response
                </span>

                {inquiry.is_answered ? (
                  <div className="inquiry-response-display">
                    <p>{inquiry.response}</p>
                    {inquiry.responded_at && (
                      <span className="inquiry-response-timestamp">
                        Responded on{" "}
                        {new Date(
                          inquiry.responded_at
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="inquiry-response-pending">
                    No response yet.
                  </p>
                )}

                <textarea
                  className="inquiry-response-textarea"
                  placeholder="Type your response to this buyer..."
                  value={responseDrafts[inquiry.id] || ""}
                  onChange={(e) =>
                    handleResponseChange(inquiry.id, e.target.value)
                  }
                  rows={3}
                />

                {responseErrors[inquiry.id] && (
                  <p className="inquiry-response-error">
                    {responseErrors[inquiry.id]}
                  </p>
                )}

                {successId === inquiry.id && (
                  <p className="inquiry-response-success">
                    Response saved successfully.
                  </p>
                )}

                <button
                  className="inquiry-response-submit"
                  disabled={submittingId === inquiry.id}
                  onClick={() => handleRespond(inquiry.id)}
                >
                  {submittingId === inquiry.id
                    ? "Saving..."
                    : inquiry.is_answered
                    ? "Update Response"
                    : "Send Response"}
                </button>
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

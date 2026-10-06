import { useEffect, useState } from "react";
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

      } catch (error) {
        console.error(
          "Received inquiries error:",
          error
        );

        setError(
          error.response?.data?.detail ||
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
        <h1>Received Inquiries</h1>
        <p>Loading inquiries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="received-inquiries-page">
        <h1>Received Inquiries</h1>

        <p className="received-inquiries-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="received-inquiries-page">

      <div className="received-inquiries-header">
        <div>
          <h1>Received Inquiries</h1>

          <p>
            View inquiries received for your properties.
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="empty-received-inquiries">

          <h2>No inquiries yet</h2>

          <p>
            You haven't received any inquiries
            for your properties.
          </p>

        </div>
      ) : (
        <div className="received-inquiries-list">

          {inquiries.map((inquiry) => (
            <div
              className="received-inquiry-card"
              key={inquiry.id}
            >

              <div className="received-inquiry-header">

                <h2>
                  Property #{inquiry.property}
                </h2>

                <span>
                  {new Date(
                    inquiry.created_at
                  ).toLocaleDateString()}
                </span>

              </div>

              <p>
                <strong>From:</strong>{" "}
                Buyer #{inquiry.buyer}
              </p>

              <div className="buyer-message">

                <strong>
                  Buyer's Message
                </strong>

                <p>
                  {inquiry.message}
                </p>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default ReceivedInquiries;
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

      } catch (error) {
        console.error(
          "Inquiries error:",
          error
        );

        setError(
          error.response?.data?.detail ||
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
        <h1>{pageTitle}</h1>
        <p>Loading inquiries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inquiries-page">
        <h1>{pageTitle}</h1>

        <p className="inquiries-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="inquiries-page">

      <div className="inquiries-header">

        <div>
          <h1>{pageTitle}</h1>

          <p>
            {pageDescription}
          </p>
        </div>

        {!isAgent && (
          <Link
            to="/properties"
            className="browse-properties-button"
          >
            Browse Properties
          </Link>
        )}

      </div>

      {inquiries.length === 0 ? (
        <div className="empty-inquiries">

          <h2>
            {isAgent
              ? "No inquiries received"
              : "No inquiries yet"}
          </h2>

          <p>
            {isAgent
              ? "No one has sent an inquiry about your properties yet."
              : "You haven't sent any property inquiries yet."}
          </p>

          {!isAgent && (
            <Link to="/properties">
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

                <h2>
                  {inquiry.property_details?.title ||
                  `Property #${inquiry.property}`}
                </h2>

                <span className="inquiry-date">
                  {new Date(
                    inquiry.created_at
                  ).toLocaleDateString()}
                </span>

              </div>

              {isAgent && (
                <div className="inquiry-buyer">
                  <strong>
                    From:
                  </strong>{" "}
                  {inquiry.buyer_username ||
                    `User #${inquiry.buyer}`}
                </div>
              )}

              <div className="inquiry-message">

                <strong>
                  {isAgent
                    ? "Buyer's Message"
                    : "Your Message"}
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

export default Inquiries;
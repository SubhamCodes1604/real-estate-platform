import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AgentDashboard.css";

function AgentDashboard() {
  const { user } = useAuth();

  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAgentDashboard = async () => {
      try {
        const propertiesResponse = await api.get(
          "/properties/my-properties/"
        );

        const inquiriesResponse = await api.get(
          "/inquiries/received/"
        );

        const propertiesData = Array.isArray(
          propertiesResponse.data
        )
          ? propertiesResponse.data
          : propertiesResponse.data.results || [];

        const inquiriesData = Array.isArray(
          inquiriesResponse.data
        )
          ? inquiriesResponse.data
          : inquiriesResponse.data.results || [];

        setProperties(propertiesData);
        setInquiries(inquiriesData);

      } catch (error) {
        console.error(
          "Agent dashboard error:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load agent dashboard."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchAgentDashboard();
  }, []);

  const approvedProperties = properties.filter(
    (property) => property.is_approved
  );

  const pendingProperties = properties.filter(
    (property) => !property.is_approved
  );

  if (loading) {
    return (
      <div className="agent-dashboard-page">
        <div className="agent-dashboard-container">
          <h1>Agent Dashboard</h1>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-dashboard-page">
        <div className="agent-dashboard-container">
          <h1>Agent Dashboard</h1>

          <div className="agent-dashboard-error">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-dashboard-page">

      <div className="agent-dashboard-container">

        {/* HEADER */}

        <div className="agent-dashboard-header">

          <div>
            <h1>
              Welcome, {user?.username}
            </h1>

            <p>
              Manage your properties and customer
              inquiries from one place.
            </p>
          </div>

          <Link
            to="/properties/create"
            className="agent-add-button"
          >
            + Add Property
          </Link>

        </div>


        {/* STATISTICS */}

        <div className="agent-stats-grid">

          <div className="agent-stat-card">
            <span className="agent-stat-label">
              My Properties
            </span>

            <strong>
              {properties.length}
            </strong>

            <Link to="/my-properties">
              Manage Properties →
            </Link>
          </div>


          <div className="agent-stat-card">
            <span className="agent-stat-label">
              Approved Properties
            </span>

            <strong>
              {approvedProperties.length}
            </strong>

            <p>
              Currently approved listings
            </p>
          </div>


          <div className="agent-stat-card">
            <span className="agent-stat-label">
              Pending Approval
            </span>

            <strong>
              {pendingProperties.length}
            </strong>

            <p>
              Waiting for admin approval
            </p>
          </div>


          <div className="agent-stat-card">
            <span className="agent-stat-label">
              Received Inquiries
            </span>

            <strong>
              {inquiries.length}
            </strong>

            <Link to="/received-inquiries">
              View Inquiries →
            </Link>
          </div>

        </div>


        {/* QUICK ACTIONS */}

        <section className="agent-section">

          <h2>Quick Actions</h2>

          <div className="agent-actions">

            <Link
              to="/properties/create"
              className="agent-action-card"
            >
              <h3>Add Property</h3>

              <p>
                Create and submit a new property
                listing.
              </p>
            </Link>


            <Link
              to="/my-properties"
              className="agent-action-card"
            >
              <h3>My Properties</h3>

              <p>
                View and manage all your listings.
              </p>
            </Link>


            <Link
              to="/received-inquiries"
              className="agent-action-card"
            >
              <h3>Received Inquiries</h3>

              <p>
                See questions and messages from
                interested buyers.
              </p>
            </Link>

          </div>

        </section>


        {/* RECENT PROPERTIES */}

        <section className="agent-section">

          <div className="agent-section-header">

            <div>
              <h2>Recent Properties</h2>

              <p>
                Your latest property listings.
              </p>
            </div>

            <Link to="/my-properties">
              View All
            </Link>

          </div>


          {properties.length === 0 ? (

            <div className="agent-empty">

              <h3>
                No Properties Yet
              </h3>

              <p>
                You haven't added any properties.
              </p>

              <Link to="/properties/create">
                Add Your First Property
              </Link>

            </div>

          ) : (

            <div className="agent-property-list">

              {properties.slice(0, 3).map(
                (property) => (

                  <div
                    className="agent-property-card"
                    key={property.id}
                  >

                    {property.image && (
                      <img
                        src={property.image}
                        alt={property.title}
                      />
                    )}


                    <div className="agent-property-content">

                      <div>

                        <h3>
                          {property.title}
                        </h3>

                        <p className="agent-property-price">
                          ₹ {property.price}
                        </p>

                        <p className="agent-property-location">
                          {property.city},{" "}
                          {property.state}
                        </p>

                      </div>


                      <span
                        className={
                          property.is_approved
                            ? "agent-status approved"
                            : "agent-status pending"
                        }
                      >
                        {property.is_approved
                          ? "Approved"
                          : "Pending Approval"}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}

export default AgentDashboard;
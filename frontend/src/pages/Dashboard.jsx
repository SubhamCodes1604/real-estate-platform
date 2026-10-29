import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import "./Dashboard.css";

const formatPrice = (price) => {
  const num = Number(price);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
  return `₹ ${num.toLocaleString("en-IN")}`;
};

function Dashboard() {
  const { user } = useAuth();

  const userRole = user?.role;

  const isUser = userRole === "USER";
  const isAdmin = userRole === "ADMIN";
  const isAgent = userRole === "AGENT";

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(isAdmin);
  const [statsError, setStatsError] = useState("");

  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(isAdmin);
  const [pendingError, setPendingError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(isUser);
  const [recommendationsError, setRecommendationsError] =
    useState("");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchDashboardStats = async () => {
      try {
        setStatsError("");

        const response = await api.get(
          "/dashboard/stats/"
        );

        setStats(response.data);
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        setStatsError(
          error.response?.data?.detail ||
          "Unable to load dashboard statistics."
        );
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchPendingProperties = async () => {
      try {
        setPendingError("");

        const response = await api.get(
          "/properties/pending/"
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setPendingProperties(data);
      } catch (error) {
        console.error(
          "Pending properties error:",
          error
        );

        setPendingError(
          error.response?.data?.detail ||
          "Unable to load pending properties."
        );
      } finally {
        setPendingLoading(false);
      }
    };

    fetchDashboardStats();
    fetchPendingProperties();
  }, [isAdmin]);

  const handleApproveProperty = async (propertyId) => {
    setActionLoadingId(propertyId);

    try {
      await api.patch(
        `/properties/approve/${propertyId}/`
      );

      setPendingProperties((current) =>
        current.filter(
          (prop) => prop.id !== propertyId
        )
      );

      setStats((currentStats) => {
        if (!currentStats) return currentStats;
        return {
          ...currentStats,
          approved_properties:
            currentStats.approved_properties + 1,
        };
      });
    } catch (error) {
      console.error(
        "Approve property error:",
        error
      );

      setPendingError(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          "Unable to approve property."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectProperty = async (propertyId) => {
    setActionLoadingId(propertyId);

    try {
      await api.patch(
        `/properties/reject/${propertyId}/`
      );

      setPendingProperties((current) =>
        current.filter(
          (prop) => prop.id !== propertyId
        )
      );
    } catch (error) {
      console.error(
        "Reject property error:",
        error
      );

      setPendingError(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          "Unable to reject property."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (!isUser) return;

    const fetchPersonalizedRecommendations =
      async () => {
        try {
          setRecommendationsError("");

          const response = await api.get(
            "/properties/recommendations/ml/personalized/"
          );

          const data = Array.isArray(response.data)
            ? response.data
            : response.data.recommendations || [];

          setRecommendations(data);
        } catch (error) {
          console.error(
            "Personalized recommendation error:",
            error
          );

          setRecommendationsError(
            error.response?.data?.detail ||
            "Unable to load personalized recommendations."
          );
        } finally {
          setRecommendationsLoading(false);
        }
      };

    fetchPersonalizedRecommendations();
  }, [isUser]);

  if (isAdmin) {
    if (statsLoading) {
      return (
        <div className="dashboard-page">
          <div className="dashboard-skeleton-header"></div>
          <div className="dashboard-stats-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                className="dashboard-stat-skeleton"
                key={i}
              >
                <div className="skeleton-line skeleton-line-short"></div>
                <div className="skeleton-line skeleton-line-tall"></div>
                <div className="skeleton-line skeleton-line-medium"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (statsError) {
      return (
        <div className="dashboard-page">
          <h1>Dashboard</h1>
          <div className="dashboard-error-state">
            <h3>Unable to load dashboard</h3>
            <p>{statsError}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Platform overview and statistics.</p>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total Properties</span>
            <strong>{stats.total_properties}</strong>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Approved Properties</span>
            <strong>{stats.approved_properties}</strong>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Featured Properties</span>
            <strong>{stats.featured_properties}</strong>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total Users</span>
            <strong>{stats.total_users}</strong>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total Reviews</span>
            <strong>{stats.total_reviews}</strong>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total Bookmarks</span>
            <strong>{stats.total_bookmarks}</strong>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total Inquiries</span>
            <strong>{stats.total_inquiries}</strong>
          </div>
        </div>

        {/* ========================= */}
        {/* PENDING PROPERTIES */}
        {/* ========================= */}

        <section className="dashboard-pending-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Properties Awaiting Approval</h2>
              <p>
                Review and approve or reject newly
                listed properties.
              </p>
            </div>
          </div>

          {pendingLoading && (
            <div className="dashboard-loading">
              <div className="dashboard-card-skeleton-grid">
                {[1, 2, 3].map((i) => (
                  <div
                    className="dashboard-card-skeleton"
                    key={i}
                  >
                    <div className="skeleton-image"></div>
                    <div className="skeleton-body">
                      <div className="skeleton-line skeleton-line-medium"></div>
                      <div className="skeleton-line skeleton-line-short"></div>
                      <div className="skeleton-line skeleton-line-long"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingError && (
            <div className="dashboard-error-state">
              <h3>Unable to load pending properties</h3>
              <p>{pendingError}</p>
            </div>
          )}

          {!pendingLoading &&
            !pendingError &&
            pendingProperties.length === 0 && (
              <div className="dashboard-empty-state">
                <h3>No pending properties</h3>
                <p>
                  All properties have been reviewed.
                </p>
              </div>
            )}

          {!pendingLoading &&
            !pendingError &&
            pendingProperties.length > 0 && (
              <div className="dashboard-pending-list">
                {pendingProperties.map((prop) => (
                  <div
                    className="dashboard-pending-card"
                    key={prop.id}
                  >
                    <div className="dashboard-pending-image-wrap">
                      {prop.image ? (
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="dashboard-pending-image"
                        />
                      ) : (
                        <div className="dashboard-pending-no-image">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="dashboard-pending-content">
                      <div className="dashboard-pending-top">
                        <h3>{prop.title}</h3>
                        <span className="dashboard-pending-status pending">
                          Pending
                        </span>
                      </div>

                      <p className="dashboard-pending-price">
                        {formatPrice(prop.price)}
                      </p>

                      <p className="dashboard-pending-location">
                        {prop.city}, {prop.state}
                      </p>

                      <div className="dashboard-pending-features">
                        <span><strong>{prop.bedrooms}</strong> Beds</span>
                        <span><strong>{prop.bathrooms}</strong> Baths</span>
                        <span><strong>{Number(prop.area_sqft).toLocaleString()}</strong> sq.ft</span>
                      </div>

                      <div className="dashboard-pending-actions">
                        <Link
                          to={`/properties/${prop.id}`}
                          className="dashboard-pending-view"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          className="dashboard-pending-approve"
                          onClick={() =>
                            handleApproveProperty(prop.id)
                          }
                          disabled={actionLoadingId === prop.id}
                        >
                          {actionLoadingId === prop.id
                            ? "Processing..."
                            : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="dashboard-pending-reject"
                          onClick={() =>
                            handleRejectProperty(prop.id)
                          }
                          disabled={actionLoadingId === prop.id}
                        >
                          {actionLoadingId === prop.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      </div>
    );
  }

  if (isAgent) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Agent Dashboard</h1>
          <p>
            Manage your properties and received
            inquiries from your agent dashboard.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link
            to="/my-properties"
            className="dashboard-action-button"
          >
            My Properties
          </Link>
          <Link
            to="/received-inquiries"
            className="dashboard-action-button dashboard-action-button-secondary"
          >
            Received Inquiries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <p>
          Discover properties recommended for you
          based on your interests.
        </p>
      </div>

      <section className="dashboard-recommendations">
        <div className="dashboard-section-header">
          <div>
            <h2>Recommended For You</h2>
            <p>
              Personalized property recommendations
              based on your saved properties.
            </p>
          </div>
        </div>

        {recommendationsLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-card-skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div
                  className="dashboard-card-skeleton"
                  key={i}
                >
                  <div className="skeleton-image"></div>
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-line-medium"></div>
                    <div className="skeleton-line skeleton-line-short"></div>
                    <div className="skeleton-line skeleton-line-long"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendationsError && (
          <div className="dashboard-error-state">
            <h3>Recommendations unavailable</h3>
            <p>{recommendationsError}</p>
          </div>
        )}

        {!recommendationsLoading &&
          !recommendationsError &&
          recommendations.length === 0 && (
            <div className="dashboard-empty-state">
              <h3>No personalized recommendations yet</h3>
              <p>
                Bookmark some properties to help us
                understand your preferences and generate
                personalized recommendations.
              </p>
              <Link
                to="/properties"
                className="dashboard-primary-button"
              >
                Browse Properties
              </Link>
            </div>
          )}

        {!recommendationsLoading &&
          !recommendationsError &&
          recommendations.length > 0 && (
            <div className="dashboard-recommendations-grid">
              {recommendations.map((rec) => {
                const propertyData = rec.id
                  ? {
                      id: rec.id,
                      title: rec.title,
                      price: rec.price,
                      city: rec.city,
                      state: rec.state,
                      property_type: rec.property_type,
                      bedrooms: rec.bedrooms,
                      bathrooms: rec.bathrooms,
                      area_sqft: rec.area_sqft,
                      image: rec.image,
                      is_featured: rec.is_featured,
                    }
                  : null;

                return propertyData ? (
                  <div
                    key={rec.id}
                    className="dashboard-recommendation-wrapper"
                  >
                    {rec.similarity_score !== undefined && (
                      <div className="dashboard-match-score">
                        Match:{" "}
                        {(
                          rec.similarity_score * 100
                        ).toFixed(1)}
                        %
                      </div>
                    )}
                    <PropertyCard property={propertyData} />
                  </div>
                ) : null;
              })}
            </div>
          )}
      </section>
    </div>
  );
}

export default Dashboard;

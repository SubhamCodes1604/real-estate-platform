import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // =========================
  // PERSONALIZED ML
  // =========================

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(true);
  const [recommendationsError, setRecommendationsError] =
    useState("");

  const userRole = user?.role;

  const isUser = userRole === "USER";
  const isAdmin = userRole === "ADMIN";
  const isAgent = userRole === "AGENT";


  // =========================
  // ADMIN DASHBOARD STATS
  // =========================

  useEffect(() => {
    if (!isAdmin) {
      setStatsLoading(false);
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);
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

    fetchDashboardStats();
  }, [isAdmin]);


  // =========================
  // PERSONALIZED ML
  // =========================

  useEffect(() => {
    if (!isUser) {
      setRecommendationsLoading(false);
      return;
    }

    const fetchPersonalizedRecommendations =
      async () => {

        try {
          setRecommendationsLoading(true);
          setRecommendationsError("");

          const response = await api.get(
            "/properties/recommendations/ml/personalized/"
          );

          console.log(
            "Personalized recommendation response:",
            response.data
          );

          /*
            Backend response is expected to be:

            {
              "recommendations": [...]
            }

            If the backend directly returns an array,
            that is also handled.
          */

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


  // =========================
  // ADMIN VIEW
  // =========================

  if (isAdmin) {

    if (statsLoading) {
      return (
        <div className="dashboard-page">

          <h1>Dashboard</h1>

          <p>
            Loading dashboard...
          </p>

        </div>
      );
    }


    if (statsError) {
      return (
        <div className="dashboard-page">

          <h1>Dashboard</h1>

          <p>
            {statsError}
          </p>

        </div>
      );
    }


    return (
      <div className="dashboard-page">

        <h1>
          Dashboard
        </h1>

        <div className="dashboard-stats">

          <div className="stat-card">
            <h3>Total Properties</h3>
            <p>{stats.total_properties}</p>
          </div>

          <div className="stat-card">
            <h3>Approved Properties</h3>
            <p>{stats.approved_properties}</p>
          </div>

          <div className="stat-card">
            <h3>Featured Properties</h3>
            <p>{stats.featured_properties}</p>
          </div>

          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{stats.total_users}</p>
          </div>

          <div className="stat-card">
            <h3>Total Reviews</h3>
            <p>{stats.total_reviews}</p>
          </div>

          <div className="stat-card">
            <h3>Total Bookmarks</h3>
            <p>{stats.total_bookmarks}</p>
          </div>

          <div className="stat-card">
            <h3>Total Inquiries</h3>
            <p>{stats.total_inquiries}</p>
          </div>

        </div>

      </div>
    );
  }


  // =========================
  // AGENT VIEW
  // =========================

  if (isAgent) {

    return (
      <div className="dashboard-page">

        <h1>
          Agent Dashboard
        </h1>

        <p>
          Manage your properties and received
          inquiries from your agent dashboard.
        </p>

        <div className="dashboard-actions">

          <Link
            to="/my-properties"
            className="dashboard-action-button"
          >
            My Properties
          </Link>

          <Link
            to="/received-inquiries"
            className="dashboard-action-button"
          >
            Received Inquiries
          </Link>

        </div>

      </div>
    );
  }


  // =========================
  // USER DASHBOARD
  // =========================

  return (
    <div className="dashboard-page">

      <div className="user-dashboard-header">

        <h1>
          Welcome, {user?.username}
        </h1>

        <p>
          Discover properties recommended for you
          based on your interests.
        </p>

      </div>


      {/* ========================= */}
      {/* PERSONALIZED RECOMMENDATIONS */}
      {/* ========================= */}

      <section className="personalized-recommendations">

        <div className="recommendations-header">

          <h2>
            Recommended For You
          </h2>

          <p>
            Personalized property recommendations
            based on your saved properties.
          </p>

        </div>


        {/* LOADING */}

        {recommendationsLoading && (

          <p className="recommendations-loading">
            Finding properties for you...
          </p>

        )}


        {/* ERROR */}

        {recommendationsError && (

          <p className="recommendation-error">
            {recommendationsError}
          </p>

        )}


        {/* NO RECOMMENDATIONS */}

        {!recommendationsLoading &&
          !recommendationsError &&
          recommendations.length === 0 && (

            <div className="no-recommendations">

              <h3>
                No personalized recommendations yet
              </h3>

              <p>
                Bookmark some properties to help us
                understand your preferences and generate
                personalized recommendations.
              </p>

              <Link
                to="/properties"
                className="browse-properties-button"
              >
                Browse Properties
              </Link>

            </div>

        )}


        {/* RECOMMENDATION CARDS */}

        {!recommendationsLoading &&
          !recommendationsError &&
          recommendations.length > 0 && (

            <div className="personalized-grid">

              {recommendations.map(
                (recommendedProperty) => (

                  <div
                    className="personalized-card"
                    key={recommendedProperty.id}
                  >

                    {/* IMAGE */}

                    {recommendedProperty.image ? (

                      <img
                        src={recommendedProperty.image}
                        alt={recommendedProperty.title}
                        className="personalized-image"
                      />

                    ) : (

                      <div className="personalized-no-image">
                        No Image
                      </div>

                    )}


                    {/* CONTENT */}

                    <div className="personalized-content">

                      <h3>
                        {recommendedProperty.title}
                      </h3>


                      <p className="personalized-price">
                        ₹ {recommendedProperty.price}
                      </p>


                      <p className="personalized-location">
                        {recommendedProperty.city},{" "}
                        {recommendedProperty.state}
                      </p>


                      {/* FEATURES */}

                      <div className="personalized-features">

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

                        <p className="personalized-score">

                          Match:
                          {" "}
                          {(
                            recommendedProperty.similarity_score *
                            100
                          ).toFixed(1)}
                          %

                        </p>

                      )}


                      {/* VIEW PROPERTY */}

                      <Link
                        to={`/properties/${recommendedProperty.id}`}
                        className="view-personalized-button"
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

    </div>
  );
}

export default Dashboard;
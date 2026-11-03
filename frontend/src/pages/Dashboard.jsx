import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [bookmarksError, setBookmarksError] = useState("");

  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState("");

  const [myQuestions, setMyQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState("");

  const [removingBookmarkId, setRemovingBookmarkId] = useState(null);

  const userRole = user?.role;
  const isUser = userRole === "USER";
  const isAdmin = userRole === "ADMIN";
  const isAgent = userRole === "AGENT";

  useEffect(() => {
    if (!isUser) return;

    const fetchBookmarks = async () => {
      try {
        setBookmarksError("");
        const response = await api.get("/bookmarks/list/");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setBookmarks(data);
      } catch (err) {
        setBookmarksError(
          err.response?.data?.detail || "Unable to load bookmarks."
        );
      } finally {
        setBookmarksLoading(false);
      }
    };

    const fetchInquiries = async () => {
      try {
        setInquiriesError("");
        const response = await api.get("/inquiries/my/");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setInquiries(data);
      } catch (err) {
        setInquiriesError(
          err.response?.data?.detail || "Unable to load inquiries."
        );
      } finally {
        setInquiriesLoading(false);
      }
    };

    const fetchMyQuestions = async () => {
      if (!user?.id) {
        setQuestionsLoading(false);
        return;
      }
      try {
        setQuestionsError("");
        const response = await api.get("/community/questions/", {
          params: { author: user.id },
        });
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setMyQuestions(data);
      } catch {
        setQuestionsError("Unable to load your community activity.");
      } finally {
        setQuestionsLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        setRecsError("");
        const response = await api.get(
          "/properties/recommendations/ml/personalized/"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.recommendations || [];
        setRecommendations(data);
      } catch {
        setRecsError("Unable to load personalized recommendations.");
      } finally {
        setRecsLoading(false);
      }
    };

    fetchBookmarks();
    fetchInquiries();
    fetchMyQuestions();
    fetchRecommendations();
  }, [isUser, user?.id]);

  // =========================
  // ADMIN DASHBOARD
  // =========================

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(isAdmin);
  const [statsError, setStatsError] = useState("");
  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(isAdmin);
  const [pendingError, setPendingError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats/");
        setStats(response.data);
      } catch (err) {
        setStatsError(
          err.response?.data?.detail || "Unable to load dashboard statistics."
        );
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchPending = async () => {
      try {
        const response = await api.get("/properties/pending/");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setPendingProperties(data);
      } catch (err) {
        setPendingError(
          err.response?.data?.detail || "Unable to load pending properties."
        );
      } finally {
        setPendingLoading(false);
      }
    };

    fetchStats();
    fetchPending();
  }, [isAdmin]);

  const handleApproveProperty = async (propertyId) => {
    setActionLoadingId(propertyId);
    try {
      await api.patch(`/properties/approve/${propertyId}/`);
      setPendingProperties((current) =>
        current.filter((p) => p.id !== propertyId)
      );
      setStats((s) =>
        s ? { ...s, approved_properties: s.approved_properties + 1 } : s
      );
    } catch (err) {
      setPendingError(
        err.response?.data?.error || "Unable to approve property."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectProperty = async (propertyId) => {
    setActionLoadingId(propertyId);
    try {
      await api.patch(`/properties/reject/${propertyId}/`);
      setPendingProperties((current) =>
        current.filter((p) => p.id !== propertyId)
      );
    } catch (err) {
      setPendingError(
        err.response?.data?.error || "Unable to reject property."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================
  // ADMIN RENDER
  // =========================

  if (isAdmin) {
    if (statsLoading) {
      return (
        <div className="dashboard-page">
          <div className="dashboard-skeleton-header"></div>
          <div className="dashboard-stats-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="dashboard-stat-skeleton" key={i}>
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
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
          </div>
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
            <span className="dashboard-stat-label">Approved</span>
            <strong>{stats.approved_properties}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Featured</span>
            <strong>{stats.featured_properties}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total Users</span>
            <strong>{stats.total_users}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Reviews</span>
            <strong>{stats.total_reviews}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Bookmarks</span>
            <strong>{stats.total_bookmarks}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Inquiries</span>
            <strong>{stats.total_inquiries}</strong>
          </div>
        </div>

        <section className="dashboard-pending-section">
          <div className="dashboard-section-header">
            <h2>Properties Awaiting Approval</h2>
            <p>Review and approve or reject newly listed properties.</p>
          </div>

          {pendingLoading && (
            <div className="dashboard-card-skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div className="dashboard-card-skeleton" key={i}>
                  <div className="skeleton-image"></div>
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-line-medium"></div>
                    <div className="skeleton-line skeleton-line-short"></div>
                    <div className="skeleton-line skeleton-line-long"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingError && (
            <div className="dashboard-error-state">
              <h3>Unable to load pending properties</h3>
              <p>{pendingError}</p>
            </div>
          )}

          {!pendingLoading && !pendingError && pendingProperties.length === 0 && (
            <div className="dashboard-empty-state">
              <h3>No pending properties</h3>
              <p>All properties have been reviewed.</p>
            </div>
          )}

          {!pendingLoading && !pendingError && pendingProperties.length > 0 && (
            <div className="dashboard-pending-list">
              {pendingProperties.map((prop) => (
                <div className="dashboard-pending-card" key={prop.id}>
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
                      <Link to={`/properties/${prop.id}`} className="dashboard-pending-view">
                        View Details
                      </Link>
                      <button
                        type="button"
                        className="dashboard-pending-approve"
                        onClick={() => handleApproveProperty(prop.id)}
                        disabled={actionLoadingId === prop.id}
                      >
                        {actionLoadingId === prop.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="dashboard-pending-reject"
                        onClick={() => handleRejectProperty(prop.id)}
                        disabled={actionLoadingId === prop.id}
                      >
                        {actionLoadingId === prop.id ? "Processing..." : "Reject"}
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

  // =========================
  // AGENT DASHBOARD
  // =========================

  if (isAgent) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Agent Dashboard</h1>
          <p>Manage your properties and received inquiries.</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/my-properties" className="dashboard-action-button">
            My Properties
          </Link>
          <Link to="/received-inquiries" className="dashboard-action-button dashboard-action-button-secondary">
            Received Inquiries
          </Link>
          <Link to="/bulk-upload" className="dashboard-action-button">
            Bulk Upload
          </Link>
          <Link to="/properties/create" className="dashboard-action-button dashboard-action-button-secondary">
            Create Listing
          </Link>
        </div>
      </div>
    );
  }

  // =========================
  // USER DASHBOARD
  // =========================

  const answeredInquiries = inquiries.filter((i) => i.is_answered).length;

  const handleRemoveBookmark = async (bookmarkId) => {
    setRemovingBookmarkId(bookmarkId);
    try {
      await api.delete(`/bookmarks/remove/${bookmarkId}/`);
      setBookmarks((current) =>
        current.filter((b) => b.id !== bookmarkId)
      );
    } catch {
      setBookmarksError("Unable to remove bookmark.");
    } finally {
      setRemovingBookmarkId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarItems = [
    { id: "overview", label: "Overview" },
    { id: "bookmarks", label: "My Bookmarks", count: bookmarks.length },
    { id: "inquiries", label: "My Inquiries", count: inquiries.length },
    { id: "community", label: "My Community Activity", count: myQuestions.length },
    { id: "profile", label: "Profile" },
  ];

  const renderOverview = () => (
    <div className="dashboard-user-overview">
      <div className="dashboard-welcome-card">
        <div className="dashboard-welcome-avatar">
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="dashboard-welcome-text">
          <h2>Welcome back, {user?.username}</h2>
          <p>Here's a summary of your activity on RealEstate AI.</p>
        </div>
      </div>

      <div className="dashboard-user-stats-grid">
        <div className="dashboard-user-stat-card">
          <span className="dashboard-user-stat-icon">★</span>
          <strong>{bookmarks.length}</strong>
          <span className="dashboard-user-stat-label">Bookmarked Properties</span>
        </div>
        <div className="dashboard-user-stat-card">
          <span className="dashboard-user-stat-icon">✉</span>
          <strong>{inquiries.length}</strong>
          <span className="dashboard-user-stat-label">Property Inquiries</span>
        </div>
        <div className="dashboard-user-stat-card">
          <span className="dashboard-user-stat-icon">?</span>
          <strong>{myQuestions.length}</strong>
          <span className="dashboard-user-stat-label">Questions Posted</span>
        </div>
        <div className="dashboard-user-stat-card">
          <span className="dashboard-user-stat-icon">✓</span>
          <strong>{answeredInquiries}</strong>
          <span className="dashboard-user-stat-label">Answered Inquiries</span>
        </div>
      </div>

      <div className="dashboard-quick-actions">
        <h3>Quick Actions</h3>
        <div className="dashboard-quick-actions-grid">
          <Link to="/properties" className="dashboard-quick-action">
            Browse Properties
          </Link>
          <Link to="/questions" className="dashboard-quick-action">
            Ask a Question
          </Link>
          <Link to="/bookmarks" className="dashboard-quick-action">
            View All Bookmarks
          </Link>
          <Link to="/inquiries" className="dashboard-quick-action">
            View All Inquiries
          </Link>
        </div>
      </div>

      <div className="dashboard-recommendations">
        <div className="dashboard-section-header">
          <h2>Recommended For You</h2>
          <p>Personalized recommendations based on your bookmarked properties.</p>
        </div>

        {recsLoading && (
          <div className="dashboard-card-skeleton-grid">
            {[1, 2, 3].map((i) => (
              <div className="dashboard-card-skeleton" key={i}>
                <div className="skeleton-image"></div>
                <div className="skeleton-body">
                  <div className="skeleton-line skeleton-line-medium"></div>
                  <div className="skeleton-line skeleton-line-short"></div>
                  <div className="skeleton-line skeleton-line-long"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {recsError && (
          <div className="dashboard-error-state">
            <h3>Recommendations unavailable</h3>
            <p>{recsError}</p>
          </div>
        )}

        {!recsLoading && !recsError && recommendations.length === 0 && (
          <div className="dashboard-empty-state">
            <h3>No personalized recommendations yet</h3>
            <p>Bookmark some properties to help us understand your preferences.</p>
            <Link to="/properties" className="dashboard-primary-button">
              Browse Properties
            </Link>
          </div>
        )}

        {!recsLoading && !recsError && recommendations.length > 0 && (
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
                <div key={rec.id} className="dashboard-recommendation-wrapper">
                  {rec.similarity_score !== undefined && (
                    <div className="dashboard-match-score">
                      Match: {(rec.similarity_score * 100).toFixed(1)}%
                    </div>
                  )}
                  <PropertyCard property={propertyData} />
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderBookmarks = () => {
    if (bookmarksLoading) {
      return (
        <div className="dashboard-card-skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div className="dashboard-card-skeleton" key={i}>
              <div className="skeleton-image"></div>
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-line-medium"></div>
                <div className="skeleton-line skeleton-line-short"></div>
                <div className="skeleton-line skeleton-line-long"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (bookmarksError) {
      return (
        <div className="dashboard-error-state">
          <h3>Unable to load bookmarks</h3>
          <p>{bookmarksError}</p>
        </div>
      );
    }

    if (bookmarks.length === 0) {
      return (
        <div className="dashboard-empty-state">
          <h3>No bookmarks yet</h3>
          <p>You haven't bookmarked any properties yet.</p>
          <Link to="/properties" className="dashboard-primary-button">
            Browse Properties
          </Link>
        </div>
      );
    }

    return (
      <div className="dashboard-bookmarks-grid">
        {bookmarks.map((bookmark) => {
          const property = bookmark.property;
          if (!property) return null;
          return (
            <div className="dashboard-bookmark-wrapper" key={bookmark.id}>
              <PropertyCard property={property} />
              <button
                className="dashboard-bookmark-remove"
                onClick={() => handleRemoveBookmark(bookmark.id)}
                disabled={removingBookmarkId === bookmark.id}
              >
                {removingBookmarkId === bookmark.id
                  ? "Removing..."
                  : "Remove Bookmark"}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderInquiries = () => {
    if (inquiriesLoading) {
      return (
        <div className="inquiries-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div className="inquiries-skeleton-card" key={i}>
              <div className="skeleton-line skeleton-line-medium"></div>
              <div className="skeleton-line skeleton-line-long"></div>
              <div className="skeleton-line skeleton-line-short"></div>
            </div>
          ))}
        </div>
      );
    }

    if (inquiriesError) {
      return (
        <div className="dashboard-error-state">
          <h3>Unable to load inquiries</h3>
          <p>{inquiriesError}</p>
        </div>
      );
    }

    if (inquiries.length === 0) {
      return (
        <div className="dashboard-empty-state">
          <h3>No inquiries yet</h3>
          <p>You haven't sent any property inquiries yet.</p>
          <Link to="/properties" className="dashboard-primary-button">
            Browse Properties
          </Link>
        </div>
      );
    }

    return (
      <div className="inquiries-list">
        {inquiries.map((inquiry) => (
          <div className="inquiry-card" key={inquiry.id}>
            <div className="inquiry-card-header">
              <h3>
                {inquiry.property_details?.title ||
                  `Property #${inquiry.property}`}
              </h3>
              <span className="inquiry-date">
                {formatDate(inquiry.created_at)}
              </span>
            </div>
            <div className="inquiry-message">
              <span className="inquiry-message-label">Your Message</span>
              <p>{inquiry.message}</p>
            </div>
            <div className="inquiry-response-section">
              <span className="inquiry-message-label">Agent's Response</span>
              {inquiry.is_answered ? (
                <div className="inquiry-response-display">
                  <p>{inquiry.response}</p>
                  {inquiry.responded_at && (
                    <span className="inquiry-response-timestamp">
                      Responded on {formatDate(inquiry.responded_at)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="inquiry-response-pending">
                  Pending — waiting for agent response.
                </p>
              )}
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
    );
  };

  const renderCommunity = () => {
    if (questionsLoading) {
      return (
        <div className="inquiries-skeleton-list">
          {[1, 2].map((i) => (
            <div className="inquiries-skeleton-card" key={i}>
              <div className="skeleton-line skeleton-line-medium"></div>
              <div className="skeleton-line skeleton-line-long"></div>
              <div className="skeleton-line skeleton-line-short"></div>
            </div>
          ))}
        </div>
      );
    }

    if (questionsError) {
      return (
        <div className="dashboard-error-state">
          <h3>Unable to load community activity</h3>
          <p>{questionsError}</p>
        </div>
      );
    }

    if (myQuestions.length === 0) {
      return (
        <div className="dashboard-empty-state">
          <h3>No community activity yet</h3>
          <p>You haven't posted any questions in the community yet.</p>
          <Link to="/questions" className="dashboard-primary-button">
            Browse Q&A
          </Link>
        </div>
      );
    }

    return (
      <div className="questions-list">
        {myQuestions.map((question) => (
          <Link
            to={`/questions/${question.id}`}
            className="question-card"
            key={question.id}
          >
            <div className="question-card-top">
              <h2>{question.title}</h2>
              <span className="question-date">
                {formatDate(question.created_at)}
              </span>
            </div>
            {question.body && (
              <p className="question-excerpt">
                {question.body.length > 160
                  ? question.body.slice(0, 160) + "..."
                  : question.body}
              </p>
            )}
            <div className="question-meta">
              {question.answers_count !== undefined && (
                <span>
                  {question.answers_count} answer
                  {question.answers_count === 1 ? "" : "s"}
                </span>
              )}
              {question.has_accepted_answer && (
                <span className="accepted-badge">Answered</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderProfile = () => (
    <div className="dashboard-profile-section">
      <div className="dashboard-profile-card">
        <div className="dashboard-profile-avatar">
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="dashboard-profile-info">
          <h2>{user?.username}</h2>
          <p className="dashboard-profile-role">{userRole}</p>
        </div>
      </div>

      <div className="dashboard-profile-details">
        <div className="dashboard-profile-row">
          <span className="dashboard-profile-label">Username</span>
          <span className="dashboard-profile-value">{user?.username}</span>
        </div>
        {user?.email && (
          <div className="dashboard-profile-row">
            <span className="dashboard-profile-label">Email</span>
            <span className="dashboard-profile-value">{user?.email}</span>
          </div>
        )}
        {user?.first_name && (
          <div className="dashboard-profile-row">
            <span className="dashboard-profile-label">First Name</span>
            <span className="dashboard-profile-value">{user?.first_name}</span>
          </div>
        )}
        {user?.last_name && (
          <div className="dashboard-profile-row">
            <span className="dashboard-profile-label">Last Name</span>
            <span className="dashboard-profile-value">{user?.last_name}</span>
          </div>
        )}
        <div className="dashboard-profile-row">
          <span className="dashboard-profile-label">Role</span>
          <span className="dashboard-profile-value">{userRole}</span>
        </div>
      </div>

      <button className="dashboard-logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );

  const sectionTitles = {
    overview: { title: "Dashboard Overview", subtitle: "Your activity at a glance" },
    bookmarks: { title: "My Bookmarks", subtitle: "Properties you've saved for later" },
    inquiries: { title: "My Inquiries", subtitle: "Inquiries you've sent about properties" },
    community: { title: "My Community Activity", subtitle: "Questions you've posted in the community" },
    profile: { title: "Profile Management", subtitle: "Your account information" },
  };

  const currentTitle = sectionTitles[activeSection] || sectionTitles.overview;

  return (
    <div className="dashboard-user-page">
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="dashboard-sidebar-header">
          <span className="dashboard-sidebar-logo">RealEstate AI</span>
        </div>
        <nav className="dashboard-sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`dashboard-sidebar-item${
                activeSection === item.id ? " active" : ""
              }`}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="dashboard-sidebar-badge">{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <button className="dashboard-sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <button
            className="dashboard-mobile-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="dashboard-topbar-title">
            <h1>{currentTitle.title}</h1>
            <p>{currentTitle.subtitle}</p>
          </div>
        </div>

        <div className="dashboard-content">
          {activeSection === "overview" && renderOverview()}
          {activeSection === "bookmarks" && renderBookmarks()}
          {activeSection === "inquiries" && renderInquiries()}
          {activeSection === "community" && renderCommunity()}
          {activeSection === "profile" && renderProfile()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

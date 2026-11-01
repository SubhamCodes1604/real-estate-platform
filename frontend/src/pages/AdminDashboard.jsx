import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

const formatPrice = (price) => {
  const num = Number(price);
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  return num.toLocaleString("en-IN");
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [allProperties, setAllProperties] = useState([]);
  const [allPropertiesLoading, setAllPropertiesLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userActionLoadingId, setUserActionLoadingId] = useState(null);
  const [userSuccess, setUserSuccess] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats/");
        setStats(response.data);
      } catch (err) {
        setStatsError(
          err.response?.data?.detail || "Unable to load statistics."
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

    const fetchAllProperties = async () => {
      try {
        const response = await api.get("/properties/all/");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setAllProperties(data);
      } catch {
        setAllProperties([]);
      } finally {
        setAllPropertiesLoading(false);
      }
    };

    fetchStats();
    fetchPending();
    fetchAllProperties();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const params = new URLSearchParams();
        if (userSearch.trim()) params.append("search", userSearch.trim());
        if (userRoleFilter) params.append("role", userRoleFilter);
        const response = await api.get(
          `/accounts/admin/users/?${params.toString()}`
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setUsers(data);
        setUsersError("");
      } catch (err) {
        setUsersError(
          err.response?.data?.detail || "Unable to load users."
        );
      } finally {
        setUsersLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearch, userRoleFilter]);

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/properties/approve/${id}/`);
      setPendingProperties((prev) => prev.filter((p) => p.id !== id));
      if (stats) {
        setStats({ ...stats, approved_properties: stats.approved_properties + 1 });
      }
    } catch {
      setPendingError("Unable to approve property.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/properties/reject/${id}/`);
      setPendingProperties((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setPendingError("Unable to reject property.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    setUserActionLoadingId(userId);
    setUserSuccess("");
    try {
      const response = await api.patch(
        `/accounts/admin/users/${userId}/status/`,
        { is_active: !currentActive }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: response.data.is_active } : u
        )
      );
      setUserSuccess(
        `User ${response.data.is_active ? "activated" : "deactivated"} successfully.`
      );
    } catch (err) {
      setUsersError(
        err.response?.data?.detail || "Unable to update user status."
      );
    } finally {
      setUserActionLoadingId(null);
    }
  };

  if (statsLoading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-skeleton-header"></div>
        <div className="admin-stats-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="admin-stat-skeleton" key={i}>
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
      <div className="admin-dashboard-page">
        <h1>Admin Dashboard</h1>
        <div className="admin-error-state">
          <h3>Unable to load dashboard</h3>
          <p>{statsError}</p>
        </div>
      </div>
    );
  }

  const agentsCount = users.filter((u) => u.role === "AGENT").length;
  const pendingCount = stats.total_properties - stats.approved_properties;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview, user management, and property approvals.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Users</span>
          <strong>{stats.total_users}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Agents</span>
          <strong>{agentsCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Properties</span>
          <strong>{stats.total_properties}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Approved</span>
          <strong>{stats.approved_properties}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Featured</span>
          <strong>{stats.featured_properties}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Reviews</span>
          <strong>{stats.total_reviews}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Bookmarks</span>
          <strong>{stats.total_bookmarks}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Inquiries</span>
          <strong>{stats.total_inquiries}</strong>
        </div>
      </div>

      {/* ========================= */}
      {/* USER MANAGEMENT */}
      {/* ========================= */}

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>User Management</h2>
            <p>Search, filter, and manage user accounts.</p>
          </div>
        </div>

        <div className="admin-user-filters">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="admin-user-search"
          />
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="admin-user-role-filter"
          >
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="AGENT">Agents</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {userSuccess && (
          <div className="admin-user-success">
            <p>{userSuccess}</p>
          </div>
        )}

        {usersLoading ? (
          <p className="admin-loading-text">Loading users...</p>
        ) : usersError ? (
          <div className="admin-error-state">
            <p>{usersError}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No users found</h3>
            <p>No users match your search criteria.</p>
          </div>
        ) : (
          <div className="admin-property-table-wrap">
            <table className="admin-property-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email || "—"}</td>
                    <td>
                      <span className={`admin-user-role-badge ${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status ${u.is_active ? "approved" : "pending"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-user-toggle ${u.is_active ? "admin-user-deactivate" : "admin-user-activate"}`}
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                        disabled={userActionLoadingId === u.id}
                      >
                        {userActionLoadingId === u.id
                          ? "..."
                          : u.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* PENDING PROPERTIES */}
      {/* ========================= */}

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>Properties Awaiting Approval</h2>
            <p>Review and approve or reject newly listed properties.</p>
          </div>
        </div>

        {pendingLoading ? (
          <p className="admin-loading-text">Loading pending properties...</p>
        ) : pendingError ? (
          <div className="admin-error-state">
            <p>{pendingError}</p>
          </div>
        ) : pendingProperties.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No pending properties</h3>
            <p>All properties have been reviewed.</p>
          </div>
        ) : (
          <div className="admin-pending-list">
            {pendingProperties.map((prop) => (
              <div className="admin-pending-card" key={prop.id}>
                <div className="admin-pending-image-wrap">
                  {prop.image ? (
                    <img src={prop.image} alt={prop.title} className="admin-pending-image" />
                  ) : (
                    <div className="admin-pending-no-image">No Image</div>
                  )}
                </div>
                <div className="admin-pending-content">
                  <div className="admin-pending-top">
                    <h3>{prop.title}</h3>
                    <span className="admin-pending-status pending">Pending</span>
                  </div>
                  <p className="admin-pending-price">{formatPrice(prop.price)}</p>
                  <p className="admin-pending-location">{prop.city}, {prop.state}</p>
                  <div className="admin-pending-features">
                    <span><strong>{prop.bedrooms}</strong> Beds</span>
                    <span><strong>{prop.bathrooms}</strong> Baths</span>
                    <span><strong>{Number(prop.area_sqft).toLocaleString()}</strong> sq.ft</span>
                  </div>
                  <div className="admin-pending-actions">
                    <Link to={`/properties/${prop.id}`} className="admin-pending-view">View Details</Link>
                    <button type="button" className="admin-pending-approve"
                      onClick={() => handleApprove(prop.id)} disabled={actionLoadingId === prop.id}>
                      {actionLoadingId === prop.id ? "..." : "Approve"}
                    </button>
                    <button type="button" className="admin-pending-reject"
                      onClick={() => handleReject(prop.id)} disabled={actionLoadingId === prop.id}>
                      {actionLoadingId === prop.id ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* ALL PROPERTIES */}
      {/* ========================= */}

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>All Properties</h2>
            <p>Complete property listing on the platform.</p>
          </div>
        </div>

        {allPropertiesLoading ? (
          <p className="admin-loading-text">Loading properties...</p>
        ) : allProperties.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No properties</h3>
            <p>No properties have been listed yet.</p>
          </div>
        ) : (
          <div className="admin-property-table-wrap">
            <table className="admin-property-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>City</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allProperties.map((prop) => (
                  <tr key={prop.id}>
                    <td>{prop.title}</td>
                    <td>{prop.city}</td>
                    <td>{formatPrice(prop.price)}</td>
                    <td>{prop.property_type}</td>
                    <td>
                      <span className={`admin-status ${prop.is_approved ? "approved" : "pending"}`}>
                        {prop.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td><Link to={`/properties/${prop.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;

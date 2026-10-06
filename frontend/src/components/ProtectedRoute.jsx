import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  // Wait until authentication is completely initialized
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // User is not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role only when allowedRoles is explicitly provided
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    console.log("ProtectedRoute role mismatch:", {
      userRole: user.role,
      allowedRoles,
    });

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
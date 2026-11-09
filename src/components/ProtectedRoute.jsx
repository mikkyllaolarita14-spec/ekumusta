import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Wraps routes that require authentication and optionally role-based access.
 *
 * Props:
 *   children   - The route element to render
 *   allowedRoles - Array of roles allowed (e.g., ["student", "admin", "guidance"])
 *                  If omitted, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while restoring session
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but role not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <div className="access-denied-card">
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <p className="access-denied-sub">
            Redirecting you to your dashboard...
          </p>
        </div>
        <Navigate to={getDashboardPath(user.role)} replace />
      </div>
    );
  }

  return children;
}

// ─── Helper ──────────────────────────────────────────────────────────────────
export function getDashboardPath(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "admin":
    case "guidance":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}

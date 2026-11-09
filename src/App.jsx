
import { HashRouter as Router, Link, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute, { getDashboardPath } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentCheckins from "./pages/StudentCheckins";
import StudentAiSupport from "./pages/StudentAiSupport";
import StudentMessages from "./pages/StudentMessages";
import StudentResources from "./pages/StudentResources";
import StudentNotifications from "./pages/StudentNotifications";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminStudentDetail from "./pages/AdminStudentDetail";
import AdminStudentEdit from "./pages/AdminStudentEdit";
import AdminCheckins from "./pages/AdminCheckins";
import AdminJournals from "./pages/AdminJournals";
import AdminCaseDetail from "./pages/AdminCaseDetail";
import AdminAlertSettings from "./pages/AdminAlertSettings";
import AdminCases from "./pages/AdminCases";
import AdminAlerts from "./pages/AdminAlerts";
import AdminMessages from "./pages/AdminMessages";
import AdminResources from "./pages/AdminResources";
import AdminReports from "./pages/AdminReports";
import AdminStaff from "./pages/AdminStaff";
import AdminNotifications from "./pages/AdminNotifications";
import AdminProfile from "./pages/AdminProfile";
import AdminSettings from "./pages/AdminSettings";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminRoster from "./pages/AdminRoster";

// ─── Home Page ───────────────────────────────────────────────────────────────
function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

// ─── 404 Not Found ───────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "48px",
              margin: "0 0 8px",
              color: "var(--ek-text-primary)",
            }}
          >
            404
          </h1>
          <h2 className="auth-card-title">Page Not Found</h2>
          <p className="auth-card-description">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link to="/" className="auth-btn auth-btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Profile (any authenticated user) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/checkins"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentCheckins />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ai-support"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentAiSupport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/messages"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/resources"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentNotifications />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminStudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminStudentEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/checkins"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminCheckins />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/journals"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminJournals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/checkins/thresholds"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminAlertSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminCaseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminCases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminAnnouncements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roster"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminRoster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["admin", "guidance"]}>
            <AdminAuditLogs />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

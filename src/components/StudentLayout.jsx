import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMessages, getNotifications } from "../store/database";
import { ConfirmDialog } from "./ui";
import Icon from "./Icon";
import Logo from "./Logo";

/**
 * StudentLayout — application shell for student accounts.
 * Mirrors AdminLayout (same CSS shell classes) with a student-scoped
 * navigation: Dashboard, Check-ins, Messages, Resources, Notifications,
 * and Profile. Admin routes are never exposed here.
 */
const NAV_ITEMS = [
  { path: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/student/checkins", label: "My Check-ins", icon: "checkins" },
  { path: "/student/ai-support", label: "AI Support", icon: "sparkles" },
  { path: "/student/messages", label: "Messages", icon: "message", badge: "unreadMessages" },
  { path: "/student/resources", label: "Support Resources", icon: "resources" },
  { path: "/student/notifications", label: "Notifications", icon: "bell", badge: "unreadNotifications" },
  { path: "/profile", label: "My Profile", icon: "user" },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const firstName = user?.displayName?.split(" ")[0] || user?.name?.split(" ")[0] || "Student";

  const unreadMessages = getMessages(user?.id).filter(
    (m) => m.recipientId === user?.id && !m.isRead
  ).length;
  const unreadNotifications = getNotifications(user?.id).filter(
    (n) => !n.isRead && n.type !== "alert" && n.type !== "case"
  ).length;
  const badgeCounts = {
    unreadMessages,
    unreadNotifications,
  };

  return (
    <div className={`admin-layout ${sidebarOpen ? "" : "admin-layout-collapsed"}`}>
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "admin-sidebar-open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <Logo size={36} className="admin-sidebar-logo-img" />
            <div className="admin-sidebar-brand-text">
              <span className="admin-sidebar-title">e-Kumusta</span>
              <span className="admin-sidebar-subtitle">Student Portal</span>
            </div>
          </div>
          <button
            className="admin-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Student navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/student/dashboard" &&
                location.pathname.startsWith(item.path));
            const count = item.badge ? badgeCounts[item.badge] : 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? "admin-nav-item-active" : ""}`}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon name={item.icon} size={18} />
                <span className="admin-nav-label">{item.label}</span>
                {count > 0 && (
                  <span className="admin-nav-badge" aria-label={`${count} unread`}>
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item admin-nav-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <Icon name="logout" size={18} />
            <span className="admin-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay ─────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <Icon name="menu" size={20} />
            </button>
            <button
              className="admin-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Icon name="chevronLeft" size={20} />
            </button>
            <div className="admin-header-greeting">
              <h1>Hello, {firstName}</h1>
              <p>Your wellness space — take it one day at a time.</p>
            </div>
          </div>
          <div className="admin-header-right">
            <Link to="/student/notifications" className="admin-header-icon-btn" title="Notifications">
              <Icon name="bell" size={20} />
              {unreadNotifications > 0 && (
                <span className="admin-header-dot" aria-label={`${unreadNotifications} unread notifications`} />
              )}
            </Link>
            <Link to="/profile" className="admin-header-profile">
              <div className="admin-avatar">
                {(user?.displayName || user?.name || "S").charAt(0)}
              </div>
              <div className="admin-header-profile-info">
                <span className="admin-header-profile-name">
                  {user?.displayName || user?.name}
                </span>
                <span className="admin-header-profile-role">Student</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>

      <ConfirmDialog
        open={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}

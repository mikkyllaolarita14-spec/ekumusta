import { useEffect, useMemo, useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { getNotifications } from "../store/database";

import { ConfirmDialog } from "./ui";

import Icon from "./Icon";

import Logo from "./Logo";

/*
|--------------------------------------------------------------------------
| Admin Navigation
|--------------------------------------------------------------------------
|
| Flat navigation list.
| System Settings is visible to admins only.
| Logout is rendered separately in the sidebar footer.
|
*/

const NAV_ITEMS = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },

  {
    path: "/admin/students",
    label: "Students",
    icon: "students",
  },

  {
    path: "/admin/staff",
    label: "User Management",
    icon: "staff",
  },

  {
    path: "/admin/checkins",
    label: "Check-ins Live",
    icon: "checkins",
  },

  {
    path: "/admin/journals",
    label: "Journals",
    icon: "journal",
  },

  {
    path: "/admin/alerts",
    label: "Alerts",
    icon: "alert",
  },

  {
    path: "/admin/cases",
    label: "Cases",
    icon: "cases",
  },

  {
    path: "/admin/messages",
    label: "Messages",
    icon: "message",
  },

  {
    path: "/admin/announcements",
    label: "Announcements",
    icon: "megaphone",
  },

  {
    path: "/admin/resources",
    label: "Resources",
    icon: "resources",
  },

  {
    path: "/admin/reports",
    label: "Reports & Analytics",
    icon: "reports",
  },

  {
    path: "/admin/settings",
    label: "System Settings",
    icon: "settings",
    adminOnly: true,
  },

  {
    path: "/admin/profile",
    label: "My Profile",
    icon: "user",
  },
];

export default function AdminLayout({ children }) {
  const {
    user,
    logout,
  } = useAuth();

  const location = useLocation();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Close mobile menu whenever route changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      // Close the confirmation modal.
      setShowLogoutModal(false);

      // Wait for Laravel logout.
      await logout();

      // Redirect only after logout finishes.
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "ADMIN LOGOUT ERROR:",
        error
      );

      // Even if the backend request fails,
      // the AuthContext clears the local session.
      navigate("/login", {
        replace: true,
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const isAdmin =
    user?.role === "admin";

  const unreadNotifications =
    getNotifications().filter(
      (n) => !n.isRead
    ).length;

  const roleLabel = isAdmin
    ? "Administrator"
    : "Guidance Staff";

  const firstName =
    user?.displayName?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    "Admin";

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter(
      (item) =>
        !item.adminOnly || isAdmin
    );
  }, [isAdmin]);

  return (
    <div
      className={`admin-layout ${
        sidebarOpen
          ? ""
          : "admin-layout-collapsed"
      }`}
    >
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`admin-sidebar ${
          mobileMenuOpen
            ? "admin-sidebar-open"
            : ""
        }`}
      >
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <Logo
              size={36}
              className="admin-sidebar-logo-img"
            />

            <div className="admin-sidebar-brand-text">
              <span className="admin-sidebar-title">
                e-Kumusta
              </span>

              <span className="admin-sidebar-subtitle">
                {roleLabel} Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="Close menu"
          >
            <Icon
              name="close"
              size={20}
            />
          </button>
        </div>

        <nav
          className="admin-sidebar-nav"
          aria-label="Main navigation"
        >
          {visibleNavItems.map((item) => {
            const isActive =
              location.pathname ===
                item.path ||
              (item.path !==
                "/admin/dashboard" &&
                location.pathname.startsWith(
                  item.path
                ));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${
                  isActive
                    ? "admin-nav-item-active"
                    : ""
                }`}
                title={item.label}
                aria-current={
                  isActive
                    ? "page"
                    : undefined
                }
              >
                <Icon
                  name={item.icon}
                  size={18}
                />

                <span className="admin-nav-label">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ==================================================
            LOGOUT
        ================================================== */}

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-item admin-nav-logout"
            onClick={() =>
              setShowLogoutModal(true)
            }
            disabled={loggingOut}
          >
            <Icon
              name="logout"
              size={18}
            />

            <span className="admin-nav-label">
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </span>
          </button>
        </div>
      </aside>

      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileMenuOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* ======================================================
          MAIN
      ====================================================== */}

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              aria-label="Toggle menu"
              aria-expanded={
                mobileMenuOpen
              }
            >
              <Icon
                name="menu"
                size={20}
              />
            </button>

            <button
              type="button"
              className="admin-sidebar-toggle"
              onClick={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }
              aria-label="Toggle sidebar"
            >
              <Icon
                name="chevronLeft"
                size={20}
              />
            </button>

            <div className="admin-header-greeting">
              <h1>
                {getGreeting()}, {firstName}
              </h1>

              <p>
                Here's today's student wellness
                overview.
              </p>
            </div>
          </div>

          <div className="admin-header-right">
            <Link
              to="/admin/notifications"
              className="admin-header-icon-btn"
              title="Notifications"
            >
              <Icon
                name="bell"
                size={20}
              />

              {unreadNotifications > 0 && (
                <span
                  className="admin-header-dot"
                  aria-label={`${unreadNotifications} unread notifications`}
                />
              )}
            </Link>

            <Link
              to="/admin/profile"
              className="admin-header-profile"
            >
              <div className="admin-avatar">
                {(
                  user?.displayName ||
                  user?.name ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="admin-header-profile-info">
                <span className="admin-header-profile-name">
                  {user?.displayName ||
                    user?.name ||
                    "Admin"}
                </span>

                <span className="admin-header-profile-role">
                  {roleLabel}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>

      {/* ======================================================
          LOGOUT MODAL
      ====================================================== */}

      <ConfirmDialog
        open={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel={
          loggingOut
            ? "Logging out..."
            : "Log out"
        }
        danger
        onConfirm={handleLogout}
        onCancel={() => {
          if (!loggingOut) {
            setShowLogoutModal(false);
          }
        }}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Greeting
|--------------------------------------------------------------------------
*/

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}
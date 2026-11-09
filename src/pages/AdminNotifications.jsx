import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../store/database";
import { EmptyState } from "../components/ui";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";

/** Notification type → icon name + semantic tone. */
const TYPE_META = {
  alert: { icon: "alert", tone: "danger" },
  case: { icon: "cases", tone: "warning" },
  message: { icon: "message", tone: "info" },
  system: { icon: "settings", tone: "neutral" },
};

/** Type‑based navigation targets for the View button. */
const VIEW_ROUTES = {
  alert: "/admin/alerts",
  case: "/admin/cases",
  message: "/admin/messages",
  system: null,
};

/** Show a helpful message for system notifications that have no direct route. */
const SYSTEM_VIEW_MESSAGE = "System updates are system‑wide; no detailed view available.";

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(getNotifications());
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const refresh = useCallback(() => setNotifications(getNotifications()), []);

  const handleMarkRead = useCallback(async (id) => {
    setLoading(true);
    try {
      markNotificationRead(id);
      refresh();
      setSuccessMessage("Marked as read.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to mark as read. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setLoading(true);
    try {
      markAllNotificationsRead();
      refresh();
      setSuccessMessage("All notifications marked as read.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to mark all as read. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  const renderItem = (notif) => {
    const meta = TYPE_META[notif.type] || { icon: "bell", tone: "neutral" };
    return (
      <div
        key={notif.id}
        className={`admin-notification-item ${!notif.isRead ? "admin-notification-unread" : ""}`}
      >
        <div className={`admin-notification-icon ek-notif-icon-${meta.tone}`}>
          <Icon name={meta.icon} size={18} />
        </div>
        <div className="admin-notification-content">
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
          <span className="admin-notification-time">
            {new Date(notif.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="admin-notification-actions">
          {!notif.isRead && (
            <button
              className="admin-btn admin-btn-sm admin-btn-outline"
              onClick={() => handleMarkRead(notif.id)}
            >
              Mark Read
            </button>
          )}
          {(
            <button
              className="admin-btn admin-btn-sm admin-btn-outline"
              onClick={() => {
                const route = VIEW_ROUTES[notif.type];
                if (route) {
                  navigate(route);
                  // Also mark as read after navigating
                  handleMarkRead(notif.id);
                } else if (notif.type === "system") {
                  alert(SYSTEM_VIEW_MESSAGE);
                } else {
                  alert("Details not available for this notification type.");
                }
              }}
            >
              View
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Notifications</h2>
          <p>Stay updated with system alerts and activities.</p>
        </div>
        {unread.length > 0 && (
          <button
            className="admin-btn admin-btn-outline"
            onClick={handleMarkAllRead}
          >
            Mark All as Read ({unread.length})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          message="You're all caught up. New alerts and updates will appear here."
        />
      ) : (
        <>
          {unread.length > 0 && (
            <section aria-labelledby="admin-notif-unread">
              <h3 id="admin-notif-unread" className="admin-section-title">
                Unread ({unread.length})
              </h3>
              <div className="admin-notifications-list">{unread.map(renderItem)}</div>
            </section>
          )}
          {read.length > 0 && (
            <section aria-labelledby="admin-notif-read">
              <h3 id="admin-notif-read" className="admin-section-title">
                Earlier
              </h3>
              <div className="admin-notifications-list">{read.map(renderItem)}</div>
            </section>
          )}
        </>
      )}
    </AdminLayout>
  );
}
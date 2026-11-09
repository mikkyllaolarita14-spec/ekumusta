import { useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../store/database";
import { EmptyState } from "../components/ui";
import Icon from "../components/Icon";

/**
 * Student notifications.
 * Privacy filter: admin-workflow notifications (type "alert"/"case")
 * describe other students' mental-health concerns and are NEVER shown
 * to student accounts. Only student-relevant categories are rendered.
 */
const STUDENT_VISIBLE_TYPES = ["message", "announcement", "system"];

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() =>
    getNotifications(user?.id).filter(
      (n) => STUDENT_VISIBLE_TYPES.includes(n.type) || !n.type
    )
  );

  const refresh = () =>
    setNotifications(
      getNotifications(user?.id).filter(
        (n) => STUDENT_VISIBLE_TYPES.includes(n.type) || !n.type
      )
    );

  const handleMarkRead = (id) => {
    markNotificationRead(id);
    refresh();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    refresh();
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  const typeIcon = { message: "message", announcement: "megaphone", system: "settings" };

  const renderItem = (notif) => (
    <div
      key={notif.id}
      className={`admin-notification-item ${!notif.isRead ? "admin-notification-unread" : ""}`}
    >
      <div className="admin-notification-icon">
        <Icon name={typeIcon[notif.type] || "bell"} size={18} />
      </div>
      <div className="admin-notification-content">
        <h4>{notif.title}</h4>
        <p>{notif.message}</p>
        <span className="admin-notification-time">
          {new Date(notif.createdAt).toLocaleString()}
        </span>
      </div>
      {!notif.isRead ? (
        <button
          className="admin-btn admin-btn-sm admin-btn-outline"
          onClick={() => handleMarkRead(notif.id)}
        >
          Mark Read
        </button>
      ) : (
        notif.link && (
          <Link to={notif.link} className="admin-btn admin-btn-sm admin-btn-outline">
            View
          </Link>
        )
      )}
    </div>
  );

  return (
    <StudentLayout>
      <div className="admin-page-header">
        <div>
          <h2>Notifications</h2>
          <p>Updates from the Guidance Office and the system.</p>
        </div>
        {unread.length > 0 && (
          <button className="admin-btn admin-btn-outline" onClick={handleMarkAllRead}>
            Mark All as Read ({unread.length})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          message="You're all caught up. New messages and announcements will appear here."
        />
      ) : (
        <>
          {unread.length > 0 && (
            <section aria-labelledby="student-notif-unread">
              <h3 id="student-notif-unread" className="admin-section-title">
                Unread ({unread.length})
              </h3>
              <div className="admin-notifications-list">{unread.map(renderItem)}</div>
            </section>
          )}
          {read.length > 0 && (
            <section aria-labelledby="student-notif-read">
              <h3 id="student-notif-read" className="admin-section-title">
                Earlier
              </h3>
              <div className="admin-notifications-list">{read.map(renderItem)}</div>
            </section>
          )}
        </>
      )}
    </StudentLayout>
  );
}

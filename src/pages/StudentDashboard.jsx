import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentLayout from "../components/StudentLayout";
import {
  getCheckInsByStudent,
  getMessages,
  getAllResources,
  getNotifications,
} from "../store/database";
import { Badge, EmptyState } from "../components/ui";
import { MOOD } from "../components/statusMaps";
import Icon from "../components/Icon";

/** Student dashboard — calm, simple overview with only real, supported data. */
export default function StudentDashboard() {
  const { user } = useAuth();

  const checkIns = getCheckInsByStudent(user?.studentId || "").sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );
  const messages = getMessages(user?.id || "").sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const resources = getAllResources().filter((r) => r.isActive);
  const notifications = getNotifications(user?.id).filter(
    (n) => n.type !== "alert" && n.type !== "case"
  );

  const latestCheckIn = checkIns[0];
  const unreadMessages = messages.filter(
    (m) => m.recipientId === user?.id && !m.isRead
  ).length;
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // Check-ins in the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  const weekCheckIns = checkIns.filter(
    (c) => new Date(c.completedAt) >= weekAgo
  ).length;

  // Simple profile completeness (contact fields only — nothing invented)
  const profileFields = [user?.phone, user?.address];
  const profileFilled = profileFields.filter(Boolean).length;
  const profileComplete = Math.round(
    ((profileFilled + 2) / (profileFields.length + 2)) * 100
  ); // name + email always present

  const firstName = user?.displayName?.split(" ")[0] || user?.name?.split(" ")[0] || "there";

  return (
    <StudentLayout>
      {/* Welcome */}
      <div className="admin-page-header">
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>
            This is your private wellness space. Everything here is
            confidential and protected.
          </p>
        </div>
      </div>

      {/* Wellness summary */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <Icon name="checkins" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{checkIns.length}</span>
            <span className="admin-stat-label">Total Check-ins</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <Icon name="clock" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{weekCheckIns}</span>
            <span className="admin-stat-label">This Week</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber">
            <Icon name="heart" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">
              {latestCheckIn
                ? MOOD[latestCheckIn.mood]?.label || latestCheckIn.mood
                : "—"}
            </span>
            <span className="admin-stat-label">Latest Mood</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-red">
            <Icon name="message" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{unreadMessages}</span>
            <span className="admin-stat-label">Unread Messages</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        {/* Recommended next steps — all real routes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Here for You</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-quick-actions">
              <Link to="/student/checkins" className="admin-quick-action">
                <Icon name="checkins" size={20} />
                <span>Review My Check-ins</span>
              </Link>
              <Link to="/student/messages" className="admin-quick-action">
                <Icon name="message" size={20} />
                <span>Message Guidance Office</span>
              </Link>
              <Link to="/student/resources" className="admin-quick-action">
                <Icon name="resources" size={20} />
                <span>Browse Support Resources</span>
              </Link>
              <Link to="/profile" className="admin-quick-action">
                <Icon name="user" size={20} />
                <span>Update My Profile</span>
              </Link>
            </div>
            {profileComplete < 100 && (
              <p className="ek-profile-nudge">
                <Icon name="user" size={14} />
                Your profile is {profileComplete}% complete — add your contact
                details in{" "}
                <Link to="/profile">My Profile</Link> so the Guidance Office
                can reach you when needed.
              </p>
            )}
          </div>
        </div>

        {/* Recent messages */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Messages</h3>
            <Link to="/student/messages" className="admin-card-link">
              View All
            </Link>
          </div>
          <div className="admin-card-body">
            {messages.length > 0 ? (
              <div className="admin-activity-list">
                {messages.slice(0, 3).map((msg) => (
                  <Link
                    key={msg.id}
                    to="/student/messages"
                    className="admin-activity-item"
                  >
                    <div className="admin-activity-dot" />
                    <div className="admin-activity-info">
                      <span className="admin-activity-action">
                        {msg.senderId === user?.id
                          ? `You: ${msg.subject}`
                          : msg.subject}
                      </span>
                      <span className="admin-activity-details">
                        {msg.senderId === user?.id
                          ? `To ${msg.recipientName}`
                          : `From ${msg.senderName}`}
                      </span>
                    </div>
                    {!msg.isRead && msg.recipientId === user?.id && (
                      <Badge tone="danger">New</Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No messages yet"
                message="Conversations with the Guidance Office will appear here."
              />
            )}
          </div>
        </div>

        {/* Available resources */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Support Resources</h3>
            <Link to="/student/resources" className="admin-card-link">
              View All
            </Link>
          </div>
          <div className="admin-card-body">
            {resources.length > 0 ? (
              <div className="admin-activity-list">
                {resources.slice(0, 3).map((r) => (
                  <Link
                    key={r.id}
                    to="/student/resources"
                    className="admin-activity-item"
                  >
                    <div className="admin-activity-dot" />
                    <div className="admin-activity-info">
                      <span className="admin-activity-action">{r.title}</span>
                      <span className="admin-activity-details">
                        {r.description}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No resources yet"
                message="The Guidance Office will publish support materials here."
              />
            )}
          </div>
        </div>

        {/* Notifications summary */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Notifications</h3>
            <Link to="/student/notifications" className="admin-card-link">
              View All
            </Link>
          </div>
          <div className="admin-card-body">
            {notifications.length > 0 ? (
              <div className="admin-activity-list">
                {notifications.slice(0, 3).map((n) => (
                  <Link
                    key={n.id}
                    to="/student/notifications"
                    className="admin-activity-item"
                  >
                    <div className="admin-activity-dot" />
                    <div className="admin-activity-info">
                      <span className="admin-activity-action">{n.title}</span>
                      <span className="admin-activity-details">{n.message}</span>
                    </div>
                    {!n.isRead && <Badge tone="danger">New</Badge>}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="You're all caught up"
                message="New announcements and updates will appear here."
              />
            )}
          </div>
        </div>

        {/* Crisis support — always visible, always real */}
        <div className="admin-card admin-card-wide ek-crisis-card">
          <div className="admin-card-header">
            <h3>
              <Icon name="phone" size={18} /> Crisis Support — Available 24/7
            </h3>
          </div>
          <div className="admin-card-body">
            <div className="ek-crisis-grid">
              <div className="ek-crisis-item">
                <span className="ek-crisis-label">National Crisis Hotline</span>
                <span className="ek-crisis-number">0917-899-USAP (8727)</span>
              </div>
              <div className="ek-crisis-item">
                <span className="ek-crisis-label">DOH Crisis Hotline</span>
                <span className="ek-crisis-number">(02) 8604-9087</span>
              </div>
              <div className="ek-crisis-item">
                <span className="ek-crisis-label">Guidance Office</span>
                <span className="ek-crisis-number">(02) 8888-0000</span>
              </div>
            </div>
            <p className="dashboard-crisis-note">
              If you or someone you know is in immediate danger, please call
              emergency services right away. You are not alone.
            </p>
          </div>
        </div>
      </div>

      {/* Screen-reader summary of unread counts */}
      <span className="ek-sr-only" role="status">
        {unreadNotifications > 0
          ? `You have ${unreadNotifications} unread notifications.`
          : "You have no unread notifications."}
      </span>
    </StudentLayout>
  );
}

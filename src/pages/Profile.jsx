import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
} from "../store/database";
import { changePassword } from "../api/auth";

const TABS = {
  VIEW: "view",
  EDIT: "edit",
  PREFERENCES: "preferences",
  SECURITY: "security",
};

// ─── Profile Page ────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS.VIEW);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    notificationPrefs: {
      checkInReminder: true,
      checkInTime: "08:00",
      messageAlerts: true,
      announcementAlerts: true,
      emailNotifications: false,
    },
    privacySettings: {
      shareMoodWithGuidance: true,
      shareCheckInHistory: false,
      showOnlineStatus: true,
      allowAnonymousFeedback: true,
    },
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (user?.id) {
      const prefs = getUserPreferences(user.id);
      if (prefs) {
        setPreferences(prefs);
      }
    }
  }, [user?.id]);

  // Pre-fill edit form when switching to edit tab
  useEffect(() => {
    if (activeTab === TABS.EDIT && user) {
      setEditForm({
        displayName: user.displayName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setError("");
      setSuccess("");
    }
  }, [activeTab, user]);

  // ── Handle Profile Update ──────────────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editForm.displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    if (!editForm.email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSaving(true);

    try {
      await new Promise((r) => setTimeout(r, 400));

      const result = updateUserProfile(user.id, editForm);

      if (result.success) {
        refreshUser();
        setSuccess("Profile updated successfully!");
        setActiveTab(TABS.VIEW);
      } else {
        switch (result.error) {
          case "INVALID_EMAIL":
            setError("Please enter a valid email address.");
            break;
          case "EMAIL_TAKEN":
            setError("This email is already associated with another account.");
            break;
          default:
            setError("Something went wrong. Please try again.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handle Preferences Save ────────────────────────────────────────────
  const handlePreferencesSave = async () => {
    setError("");
    setSuccess("");
    setIsSavingPrefs(true);

    try {
      await new Promise((r) => setTimeout(r, 400));

      const notifResult = updateUserPreferences(
        user.id,
        "notificationPrefs",
        preferences.notificationPrefs
      );
      const privacyResult = updateUserPreferences(
        user.id,
        "privacySettings",
        preferences.privacySettings
      );

      if (notifResult.success && privacyResult.success) {
        refreshUser();
        setSuccess("Preferences saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to save preferences. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // ── Handle Change Password ────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordForm.current_password.trim()) {
      setError("Current password is required.");
      return;
    }
    if (!passwordForm.new_password.trim()) {
      setError("New password is required.");
      return;
    }
    if (!passwordForm.new_password_confirmation.trim()) {
      setError("Password confirmation is required.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setError("New passwords do not match.");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      });

      if (result.success) {
        setSuccess("Password changed successfully!");
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(result.message || "Failed to change password. Please try again.");
      }
    } catch (err) {
      if (err?.response?.status === 422) {
        const data = err.response.data;
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError[0]) {
            setError(firstError[0]);
            return;
          }
        }
        setError(data?.message || "Validation failed. Please check your inputs.");
        return;
      }
      if (err?.response?.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (!err?.response) {
        setError("Unable to connect to the server. Please try again.");
        return;
      }
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Toggle preference ──────────────────────────────────────────────────
  const togglePref = (section, key) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
  };

  const setTimePref = (time) => {
    setPreferences((prev) => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        checkInTime: time,
      },
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  const roleLabel =
    user.role === "student"
      ? "Student"
      : user.role === "guidance"
      ? "Guidance Staff"
      : "Administrator";

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <button
            className="dashboard-back-btn"
            onClick={() =>
              navigate(
                user.role === "student"
                  ? "/student/dashboard"
                  : "/admin/dashboard",
                { replace: true }
              )
            }
            title="Back to dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="dashboard-logo-small">e-Kumusta</div>
        </div>
        <nav className="dashboard-header-right">
          <div className="dashboard-user-menu">
            <div className="dashboard-avatar">
              {user.displayName?.charAt(0) || user.name?.charAt(0) || "U"}
            </div>
            <div className="dashboard-user-info">
              <span className="dashboard-user-name">
                {user.displayName || user.name}
              </span>
              <span className="dashboard-user-role">{roleLabel}</span>
            </div>
            <button
              className="dashboard-logout-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M6 16H3a1 1 0 01-1-1V3a1 1 0 011-1h3M12.5 13l3.5-4-3.5-4M16 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-container">
          {/* Page Title */}
          <div className="profile-page-header">
            <h1>My Profile</h1>
            <p>Manage your personal information and preferences.</p>
          </div>

          {/* Tabs */}
          <div className="profile-tabs" role="tablist">
            <button
              className={`profile-tab ${activeTab === TABS.VIEW ? "profile-tab-active" : ""}`}
              onClick={() => {
                setActiveTab(TABS.VIEW);
                setError("");
                setSuccess("");
              }}
              role="tab"
              aria-selected={activeTab === TABS.VIEW}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              View Profile
            </button>
            <button
              className={`profile-tab ${activeTab === TABS.EDIT ? "profile-tab-active" : ""}`}
              onClick={() => {
                setActiveTab(TABS.EDIT);
                setError("");
                setSuccess("");
              }}
              role="tab"
              aria-selected={activeTab === TABS.EDIT}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M11.5 1.5a2.121 2.121 0 013 3L5 14l-4 1 1-4L11.5 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit Profile
            </button>
            <button
              className={`profile-tab ${activeTab === TABS.PREFERENCES ? "profile-tab-active" : ""}`}
              onClick={() => {
                setActiveTab(TABS.PREFERENCES);
                setError("");
                setSuccess("");
              }}
              role="tab"
              aria-selected={activeTab === TABS.PREFERENCES}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Preferences
            </button>
            <button
              className={`profile-tab ${activeTab === TABS.SECURITY ? "profile-tab-active" : ""}`}
              onClick={() => {
                setActiveTab(TABS.SECURITY);
                setError("");
                setSuccess("");
              }}
              role="tab"
              aria-selected={activeTab === TABS.SECURITY}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="7" width="12" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7V4a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Change Password
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="profile-alert profile-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 5v4M9 11.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="profile-alert profile-alert-success" role="status">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* ── Tab: View Profile ──────────────────────────────────────── */}
          {activeTab === TABS.VIEW && (
            <div className="profile-card">
              {/* Avatar & Name */}
              <div className="profile-card-header">
                <div className="profile-avatar-large">
                  {user.displayName?.charAt(0) || user.name?.charAt(0) || "U"}
                </div>
                <div className="profile-card-identity">
                  <h2>{user.displayName || user.name}</h2>
                  <span className="profile-role-badge">{roleLabel}</span>
                  {user.position && (
                    <span className="profile-position">{user.position}</span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="profile-info-grid">
                {/* Personal Information */}
                <div className="profile-info-section">
                  <h3>Personal Information</h3>
                  <div className="profile-info-list">
                    <div className="profile-info-row">
                      <span className="profile-info-label">Full Name</span>
                      <span className="profile-info-value">{user.name}</span>
                    </div>
                    {user.studentId && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Student ID</span>
                        <span className="profile-info-value profile-info-mono">
                          {user.studentId}
                        </span>
                      </div>
                    )}
                    {user.accountId && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Account ID</span>
                        <span className="profile-info-value profile-info-mono">
                          {user.accountId}
                        </span>
                      </div>
                    )}
                    <div className="profile-info-row">
                      <span className="profile-info-label">Display Name</span>
                      <span className="profile-info-value">
                        {user.displayName || user.name}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Email</span>
                      <span className="profile-info-value">{user.email}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Phone</span>
                      <span className="profile-info-value">
                        {user.phone || (
                          <span className="profile-info-empty">Not set</span>
                        )}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Address</span>
                      <span className="profile-info-value">
                        {user.address || (
                          <span className="profile-info-empty">Not set</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Information (students only) */}
                {user.role === "student" && (
                  <div className="profile-info-section">
                    <h3>Academic Information</h3>
                    <div className="profile-info-list">
                      <div className="profile-info-row">
                        <span className="profile-info-label">Course</span>
                        <span className="profile-info-value">
                          {user.course}
                        </span>
                      </div>
                      <div className="profile-info-row">
                        <span className="profile-info-label">Year Level</span>
                        <span className="profile-info-value">
                          {user.grade || "—"}
                        </span>
                      </div>
                      <div className="profile-info-row">
                        <span className="profile-info-label">Block</span>
                        <span className="profile-info-value">
                          {user.section || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Information */}
                <div className="profile-info-section">
                  <h3>Account Information</h3>
                  <div className="profile-info-list">
                    <div className="profile-info-row">
                      <span className="profile-info-label">Role</span>
                      <span className="profile-info-value">{roleLabel}</span>
                    </div>
                    {user.position && (
                      <div className="profile-info-row">
                        <span className="profile-info-label">Position</span>
                        <span className="profile-info-value">
                          {user.position}
                        </span>
                      </div>
                    )}
                    <div className="profile-info-row">
                      <span className="profile-info-label">Account Status</span>
                      <span className="profile-info-value">
                        <span className={`profile-status ${user.isActive ? "profile-status-active" : "profile-status-inactive"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Member Since</span>
                      <span className="profile-info-value">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Last Login</span>
                      <span className="profile-info-value">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-card-footer">
                <button
                  className="profile-btn profile-btn-primary"
                  onClick={() => setActiveTab(TABS.EDIT)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Edit Profile ──────────────────────────────────────── */}
          {activeTab === TABS.EDIT && (
            <div className="profile-card">
              <div className="profile-card-intro">
                <h3>Edit Your Information</h3>
                <p>
                  Update your contact details and display name. Some fields
                  (Student ID, Course) are managed by the school and cannot be
                  changed here.
                </p>
              </div>

              <form onSubmit={handleProfileUpdate} noValidate>
                {/* Display Name */}
                <div className="profile-field">
                  <label htmlFor="profile-display-name" className="profile-label">
                    Display Name
                  </label>
                  <input
                    id="profile-display-name"
                    type="text"
                    className="profile-input"
                    value={editForm.displayName}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="How you want to be called"
                    disabled={isSaving}
                  />
                  <p className="profile-field-hint">
                    This is the name shown to others in the system.
                  </p>
                </div>

                {/* Email */}
                <div className="profile-field">
                  <label htmlFor="profile-email" className="profile-label">
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className="profile-input"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="your.email@school.edu"
                    disabled={isSaving}
                  />
                  <p className="profile-field-hint">
                    Used for notifications and account recovery.
                  </p>
                </div>

                {/* Phone */}
                <div className="profile-field">
                  <label htmlFor="profile-phone" className="profile-label">
                    Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="profile-input"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="e.g. +63 917 123 4567"
                    disabled={isSaving}
                  />
                  <p className="profile-field-hint">
                    Optional. For emergency contact purposes.
                  </p>
                </div>

                {/* Address */}
                <div className="profile-field">
                  <label htmlFor="profile-address" className="profile-label">
                    Address
                  </label>
                  <textarea
                    id="profile-address"
                    className="profile-textarea"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="Your home address"
                    rows={3}
                    disabled={isSaving}
                  />
                  <p className="profile-field-hint">
                    Optional. For emergency contact purposes.
                  </p>
                </div>

                {/* Read-only fields info */}
                {user.role === "student" && (
                  <div className="profile-readonly-notice">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 5v3M8 10.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>
                      Student ID, Course, and Year Level are managed by the
                      school administration and cannot be edited here.
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-btn profile-btn-secondary"
                    onClick={() => setActiveTab(TABS.VIEW)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-btn profile-btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="profile-btn-spinner" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tab: Preferences ───────────────────────────────────────── */}
          {activeTab === TABS.PREFERENCES && (
            <div className="profile-preferences">
              {/* Notification Preferences */}
              <div className="profile-card">
                <div className="profile-card-intro">
                  <h3>Notification Preferences</h3>
                  <p>
                    Control how and when you receive notifications from
                    e-Kumusta.
                  </p>
                </div>

                <div className="profile-pref-list">
                  {/* Check-in Reminder */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Daily Check-In Reminder</h4>
                      <p>
                        Receive a daily reminder to complete your mental health
                        check-in.
                      </p>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.notificationPrefs.checkInReminder
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("notificationPrefs", "checkInReminder")}
                      role="switch"
                      aria-checked={preferences.notificationPrefs.checkInReminder}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>

                  {/* Check-in Time */}
                  {preferences.notificationPrefs.checkInReminder && (
                    <div className="profile-pref-row profile-pref-row-nested">
                      <div className="profile-pref-info">
                        <h4>Reminder Time</h4>
                        <p>Choose when you'd like to be reminded.</p>
                      </div>
                      <input
                        type="time"
                        className="profile-time-input"
                        value={preferences.notificationPrefs.checkInTime}
                        onChange={(e) => setTimePref(e.target.value)}
                        disabled={isSavingPrefs}
                      />
                    </div>
                  )}

                  {/* Message Alerts */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Message Alerts</h4>
                      <p>
                        Get notified when the Guidance Office sends you a
                        message.
                      </p>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.notificationPrefs.messageAlerts
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("notificationPrefs", "messageAlerts")}
                      role="switch"
                      aria-checked={preferences.notificationPrefs.messageAlerts}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>

                  {/* Announcement Alerts */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Announcement Alerts</h4>
                      <p>
                        Get notified about school-wide announcements and
                        updates.
                      </p>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.notificationPrefs.announcementAlerts
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("notificationPrefs", "announcementAlerts")}
                      role="switch"
                      aria-checked={preferences.notificationPrefs.announcementAlerts}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>

                  {/* Email Notifications */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Email Notifications</h4>
                      <p>
                        Receive important notifications via email in addition to
                        in-app alerts.
                      </p>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.notificationPrefs.emailNotifications
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("notificationPrefs", "emailNotifications")}
                      role="switch"
                      aria-checked={preferences.notificationPrefs.emailNotifications}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="profile-card">
                <div className="profile-card-intro">
                  <h3>Privacy Settings</h3>
                  <p>
                    Control who can see your check-in data and how it's used.
                    Your privacy and trust are important to us.
                  </p>
                </div>

                <div className="profile-pref-list">
                  {/* Share Mood with Guidance */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Share Mood with Guidance Office</h4>
                      <p>
                        Allow the Guidance Office to view your mood check-in
                        responses so they can provide better support when needed.
                      </p>
                      <span className="profile-pref-explain">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M7 4v.5M7 6v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        When enabled, authorized guidance staff can see your
                        mood entries to identify students who may need extra
                        support. This data is kept confidential and only
                        accessed by licensed counselors.
                      </span>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.privacySettings.shareMoodWithGuidance
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("privacySettings", "shareMoodWithGuidance")}
                      role="switch"
                      aria-checked={preferences.privacySettings.shareMoodWithGuidance}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>

                  {/* Share Check-in History */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Share Check-In History</h4>
                      <p>
                        Allow the Guidance Office to view your full check-in
                        history for trend analysis and case management.
                      </p>
                      <span className="profile-pref-explain">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M7 4v.5M7 6v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        When enabled, guidance staff can review your past
                        check-ins to understand patterns and provide
                        personalized support. Your data is never shared outside
                        the Guidance Office.
                      </span>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.privacySettings.shareCheckInHistory
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("privacySettings", "shareCheckInHistory")}
                      role="switch"
                      aria-checked={preferences.privacySettings.shareCheckInHistory}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>

                  {/* Show Online Status */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Show Online Status</h4>
                      <p>
                        Let others see when you're currently using e-Kumusta.
                      </p>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.privacySettings.showOnlineStatus
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("privacySettings", "showOnlineStatus")}
                      role="switch"
                      aria-checked={preferences.privacySettings.showOnlineStatus}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>

                  {/* Allow Anonymous Feedback */}
                  <div className="profile-pref-row">
                    <div className="profile-pref-info">
                      <h4>Allow Anonymous Feedback</h4>
                      <p>
                        Allow the system to include your anonymized check-in
                        data in school-wide wellness analytics. Your identity is
                        never revealed.
                      </p>
                      <span className="profile-pref-explain">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M7 4v.5M7 6v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        This helps the school understand overall student
                        wellness trends. Your data is aggregated and fully
                        anonymized — no individual can be identified from the
                        analytics.
                      </span>
                    </div>
                    <button
                      className={`profile-toggle ${
                        preferences.privacySettings.allowAnonymousFeedback
                          ? "profile-toggle-on"
                          : ""
                      }`}
                      onClick={() => togglePref("privacySettings", "allowAnonymousFeedback")}
                      role="switch"
                      aria-checked={preferences.privacySettings.allowAnonymousFeedback}
                      disabled={isSavingPrefs}
                    >
                      <span className="profile-toggle-knob" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Preferences */}
              <div className="profile-actions profile-actions-center">
                <button
                  className="profile-btn profile-btn-primary"
                  onClick={handlePreferencesSave}
                  disabled={isSavingPrefs}
                >
                  {isSavingPrefs ? (
                    <>
                      <span className="profile-btn-spinner" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Change Password ────────────────────────────────────── */}
          {activeTab === TABS.SECURITY && (
            <div className="profile-card">
              <div className="profile-card-intro">
                <h3>Change Password</h3>
                <p>
                  Update your account password. Make sure to use a strong password.
                </p>
              </div>

              <form onSubmit={handleChangePassword} noValidate>
                {/* Current Password */}
                <div className="profile-field">
                  <label htmlFor="current-password" className="profile-label">
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      className="profile-input"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm((f) => ({
                          ...f,
                          current_password: e.target.value,
                        }))
                      }
                      placeholder="Enter your current password"
                      disabled={isChangingPassword}
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                      }}
                      disabled={isChangingPassword}
                    >
                      {showCurrentPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M2.5 2.5L17.5 17.5M8.232 8.232a3 3 0 104.243 4.243M6.47 6.47C4.815 7.627 3.492 9.17 2.5 10.833c1.667 3.333 5.833 6.667 9.167 6.667 1.177 0 2.31-.207 3.377-.555M12.955 12.955c.309-.16.598-.35.866-.555 1.667-1.388 3.053-3.195 3.679-5.367-1.667-3.333-5.833-6.667-9.167-6.667-.588 0-1.164.052-1.722.148" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M1.667 10S4.167 3.333 10 3.333 18.333 10 18.333 10 15.833 16.667 10 16.667 1.667 10 1.667 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="profile-field">
                  <label htmlFor="new-password" className="profile-label">
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      className="profile-input"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm((f) => ({
                          ...f,
                          new_password: e.target.value,
                        }))
                      }
                      placeholder="Enter your new password (min 6 characters)"
                      disabled={isChangingPassword}
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                      }}
                      disabled={isChangingPassword}
                    >
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M2.5 2.5L17.5 17.5M8.232 8.232a3 3 0 104.243 4.243M6.47 6.47C4.815 7.627 3.492 9.17 2.5 10.833c1.667 3.333 5.833 6.667 9.167 6.667 1.177 0 2.31-.207 3.377-.555M12.955 12.955c.309-.16.598-.35.866-.555 1.667-1.388 3.053-3.195 3.679-5.367-1.667-3.333-5.833-6.667-9.167-6.667-.588 0-1.164.052-1.722.148" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M1.667 10S4.167 3.333 10 3.333 18.333 10 18.333 10 15.833 16.667 10 16.667 1.667 10 1.667 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="profile-field">
                  <label htmlFor="confirm-password" className="profile-label">
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="profile-input"
                      value={passwordForm.new_password_confirmation}
                      onChange={(e) =>
                        setPasswordForm((f) => ({
                          ...f,
                          new_password_confirmation: e.target.value,
                        }))
                      }
                      placeholder="Confirm your new password"
                      disabled={isChangingPassword}
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                      }}
                      disabled={isChangingPassword}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M2.5 2.5L17.5 17.5M8.232 8.232a3 3 0 104.243 4.243M6.47 6.47C4.815 7.627 3.492 9.17 2.5 10.833c1.667 3.333 5.833 6.667 9.167 6.667 1.177 0 2.31-.207 3.377-.555M12.955 12.955c.309-.16.598-.35.866-.555 1.667-1.388 3.053-3.195 3.679-5.367-1.667-3.333-5.833-6.667-9.167-6.667-.588 0-1.164.052-1.722.148" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M1.667 10S4.167 3.333 10 3.333 18.333 10 18.333 10 15.833 16.667 10 16.667 1.667 10 1.667 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-btn profile-btn-secondary"
                    onClick={() => {
                      setPasswordForm({
                        current_password: "",
                        new_password: "",
                        new_password_confirmation: "",
                      });
                      setError("");
                      setSuccess("");
                      setShowCurrentPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    disabled={isChangingPassword}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="profile-btn profile-btn-primary"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="profile-btn-spinner" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

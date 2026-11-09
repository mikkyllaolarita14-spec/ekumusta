import { useEffect, useState } from "react";

import AdminLayout from "../components/AdminLayout";

import { useAuth } from "../context/AuthContext";

import {
  getAdminProfile,
  updateAdminProfile,
} from "../api/profile";

import { changePassword } from "../api/auth";

export default function AdminProfile() {
  const {
    user,
    setProfileUser,
  } = useAuth();

  const [profile, setProfile] = useState(null);

  const [isEditing, setIsEditing] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getAdminProfile();

      console.log(
        "ADMIN PROFILE RESPONSE:",
        result
      );

      if (!result.success) {
        setError(
          result.message ||
            "Unable to load profile."
        );
        return;
      }

      const loadedUser =
        result.user;

      setProfile(
        loadedUser
      );

      setFormData({
        name:
          loadedUser.name || "",

        email:
          loadedUser.email || "",

        phone:
          loadedUser.phone || "",

        address:
          loadedUser.address || "",
      });
    } catch (err) {
      console.error(
        "ADMIN PROFILE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load profile from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim()
    ) {
      setError(
        "Name and email are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result =
        await updateAdminProfile({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone:
            formData.phone.trim(),
          address:
            formData.address.trim(),
        });

      if (!result.success) {
        setError(
          result.message ||
            "Failed to update profile."
        );
        return;
      }

      const updatedUser =
        result.user;

      setProfile(
        updatedUser
      );

      setFormData({
        name:
          updatedUser.name || "",

        email:
          updatedUser.email || "",

        phone:
          updatedUser.phone || "",

        address:
          updatedUser.address || "",
      });

      /*
       * Update AuthContext/session
       * using the newly returned user.
       */
      if (setProfileUser) {
        setProfileUser(
          updatedUser
        );
      }

      setIsEditing(false);

      setMessage(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "UPDATE PROFILE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL EDITING
  // ==========================================================

  const handleCancel = () => {
    const current =
      profile || user;

    setFormData({
      name:
        current?.name || "",

      email:
        current?.email || "",

      phone:
        current?.phone || "",

      address:
        current?.address || "",
    });

    setIsEditing(false);

    setError("");

    setMessage("");
  };

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

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

    try {
      setChangingPassword(true);
      const result = await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      });

      if (result.success) {
        setMessage("Password changed successfully.");
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setError(result.message || "Failed to change password.");
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
        setError(data?.message || "Validation failed.");
        return;
      }
      if (err?.response?.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (!err?.response) {
        setError("Unable to connect to the server.");
        return;
      }
      setError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setChangingPassword(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>My Profile</h2>

            <p>
              Loading account information...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const currentUser =
    profile || user;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>My Profile</h2>

          <p>
            View and manage your account
            information.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => {
              setIsEditing(true);
              setError("");
              setMessage("");
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className="admin-alert admin-alert-success">
          {message}
        </div>
      )}

      {error && (
        <div
          className="admin-alert admin-alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-body">

          {/* ==================================================
              PROFILE HEADER
          ================================================== */}

          <div className="admin-profile-header">
            <div className="admin-avatar admin-avatar-lg">
              {(
                currentUser?.name ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h3>
                {currentUser?.name ||
                  "Admin"}
              </h3>

              <span
                className={`admin-badge ${
                  currentUser?.role ===
                  "admin"
                    ? "admin-badge-primary"
                    : "admin-badge-info"
                }`}
              >
                {currentUser?.role ===
                "admin"
                  ? "Administrator"
                  : "Guidance Staff"}
              </span>

              {currentUser?.position && (
                <p className="admin-profile-position">
                  {currentUser.position}
                </p>
              )}
            </div>
          </div>

          {/* ==================================================
              PROFILE INFORMATION
          ================================================== */}

          <div className="admin-info-grid">

            {/* ACCOUNT ID */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Account ID
              </span>

              <span className="admin-info-value admin-mono">
                {currentUser?.accountId ||
                  "—"}
              </span>
            </div>

            {/* NAME */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Name
              </span>

              {isEditing ? (
                <input
                  type="text"
                  value={
                    formData.name
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                />
              ) : (
                <span className="admin-info-value">
                  {currentUser?.name ||
                    "—"}
                </span>
              )}
            </div>

            {/* EMAIL */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Email
              </span>

              {isEditing ? (
                <input
                  type="email"
                  value={
                    formData.email
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                />
              ) : (
                <span className="admin-info-value">
                  {currentUser?.email ||
                    "—"}
                </span>
              )}
            </div>

            {/* PHONE */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Phone
              </span>

              {isEditing ? (
                <input
                  type="text"
                  value={
                    formData.phone
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Enter phone number"
                />
              ) : (
                <span className="admin-info-value">
                  {currentUser?.phone ||
                    "Not set"}
                </span>
              )}
            </div>

            {/* ADDRESS */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Address
              </span>

              {isEditing ? (
                <input
                  type="text"
                  value={
                    formData.address
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Enter address"
                />
              ) : (
                <span className="admin-info-value">
                  {currentUser?.address ||
                    "Not set"}
                </span>
              )}
            </div>

            {/* ACCOUNT STATUS */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Account Status
              </span>

              <span
                className={`admin-badge ${
                  currentUser?.isActive
                    ? "admin-badge-success"
                    : "admin-badge-warning"
                }`}
              >
                {currentUser?.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            {/* LAST LOGIN */}

            <div className="admin-info-item">
              <span className="admin-info-label">
                Last Login
              </span>

              <span className="admin-info-value">
                {currentUser?.lastLogin
                  ? new Date(
                      currentUser.lastLogin
                    ).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          {isEditing && (
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          CHANGE PASSWORD
      ================================================== */}

      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card-header">
          <h3>Change Password</h3>
          <p>Update your account password</p>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleChangePassword} noValidate>
            <div className="admin-form-group">
              <label className="admin-form-label">Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="admin-input"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      current_password: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  disabled={changingPassword}
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
                  disabled={changingPassword}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="admin-input"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                  placeholder="Enter new password (min 6 characters)"
                  disabled={changingPassword}
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
                  disabled={changingPassword}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="admin-input"
                  value={passwordForm.new_password_confirmation}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password_confirmation: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  disabled={changingPassword}
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
                  disabled={changingPassword}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => {
                  setPasswordForm({
                    current_password: "",
                    new_password: "",
                    new_password_confirmation: "",
                  });
                  setError("");
                  setMessage("");
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
                disabled={changingPassword}
              >
                Clear
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={changingPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from "react";

import AdminLayout from "../components/AdminLayout";

import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  deleteAdminAnnouncement,
} from "../api/announcements";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState({
      title: "",
      content: "",
      isPublished: false,
    });

  // Internal UI state uses the camelCase `isPublished` so the
  // checkbox, publish/unpublish button labels, and status badge
  // keep working unchanged. Only the wire format sent to the API
  // is snake_case (`is_published`) to match the Laravel validator.

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [successMsg, setSuccessMsg] =
    useState("");

  // ==========================================================
  // LOAD ANNOUNCEMENTS
  // ==========================================================

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAdminAnnouncements();

      console.log(
        "ADMIN ANNOUNCEMENTS RESPONSE:",
        data
      );

      if (data.success) {
        const loaded = data.announcements || [];
        console.log(
          "Loaded announcements count:",
          loaded.length,
          "First:",
          loaded[0]
        );

        setAnnouncements(loaded);

        if (data.summary) {
          console.log(
            "ADMIN ANNOUNCEMENTS SUMMARY:",
            data.summary
          );
        }
      } else {
        const backendMessage =
          data?.message ||
          data?.error ||
          "Failed to load announcements from the server.";

        console.error(
          "ADMIN ANNOUNCEMENTS BACKEND ERROR:",
          backendMessage
        );

        setError(
          backendMessage ||
            "Failed to load announcements."
        );

        setAnnouncements([]);
      }
    } catch (err) {
      console.error(
        "ADMIN ANNOUNCEMENTS ERROR:",
        err
      );

      const networkMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Unable to load announcements from the server.";

      console.error("Failed to load admin announcements:", networkMessage);

      setError(
        networkMessage ||
          "Unable to load announcements."
      );

      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // ==========================================================
  // OPEN CREATE FORM
  // ==========================================================

  const handleCreate = () => {
    setForm({
      title: "",
      content: "",
      isPublished: false,
    });

    setEditingId(null);
    setError("");
    setSuccessMsg("");
    setShowForm(true);
  };

  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  const handleEdit = (announcement) => {
    setForm({
      title: announcement.title || "",
      content: announcement.content || "",
      isPublished: !!announcement.isPublished,
    });

    setEditingId(announcement.id);

    setError("");
    setSuccessMsg("");

    setShowForm(true);
  };

  // ==========================================================
  // FORM INPUT
  // ==========================================================

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.content.trim()
    ) {
      setError(
        "Please enter both a title and content."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      if (editingId) {
        const result =
          await updateAdminAnnouncement(
            editingId,
            {
              title: form.title.trim(),
              content: form.content.trim(),
              is_published:
                form.isPublished,
            }
          );

        if (!result.success) {
          setError(
            result.message ||
              "Unable to update announcement."
          );
          return;
        }

        setSuccessMsg(
          "Announcement updated successfully."
        );
      } else {
        const result =
          await createAdminAnnouncement({
            title: form.title.trim(),
            content: form.content.trim(),
            is_published:
              form.isPublished,
          });

        console.log(
          "CREATE ANNOUNCEMENT RESULT:",
          result
        );

        if (!result.success) {
          setError(
            result.message ||
              "Unable to create announcement."
          );
          return;
        }

        setSuccessMsg(
          "Announcement created successfully."
        );
      }

      setShowForm(false);

      setEditingId(null);

      setForm({
        title: "",
        content: "",
        isPublished: false,
      });

      await loadAnnouncements();

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.error(
        "SAVE ANNOUNCEMENT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to save announcement."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccessMsg("");

      const result =
        await deleteAdminAnnouncement(id);

      if (!result.success) {
        setError(
          result.message ||
            "Unable to delete announcement."
        );
        return;
      }

      setSuccessMsg(
        "Announcement deleted successfully."
      );

      await loadAnnouncements();

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.error(
        "DELETE ANNOUNCEMENT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete announcement."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // TOGGLE PUBLISH
  // ==========================================================

  const handleTogglePublish = async (
    announcement
  ) => {
    try {
      setError("");
      setSuccessMsg("");

      const result =
        await updateAdminAnnouncement(
          announcement.id,
          {
            is_published:
              !announcement.isPublished,
          }
        );

      if (!result.success) {
        setError(
          result.message ||
            "Unable to update publication status."
        );
        return;
      }

      setSuccessMsg(
        result.announcement?.isPublished
          ? "Announcement published successfully."
          : "Announcement unpublished successfully."
      );

      await loadAnnouncements();

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.error(
        "TOGGLE ANNOUNCEMENT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to update publication status."
      );
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
            <h2>Announcements</h2>
            <p>
              Loading announcements...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Announcements</h2>

          <p>
            Publish wellness announcements visible
            to students.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleCreate}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
              />
            </svg>

            New Announcement
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="admin-alert admin-alert-success">
          {successMsg}
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

      {/* =====================================================
          CREATE / EDIT FORM
      ===================================================== */}

      {showForm && (
        <div className="admin-card ek-form-card">
          <div className="admin-card-header">
            <h3>
              {editingId
                ? "Edit Announcement"
                : "New Announcement"}
            </h3>
          </div>

          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label className="admin-label">
                  Title
                </label>

                <input
                  type="text"
                  className="admin-input"
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={(e) =>
                    updateForm(
                      "title",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Content
                </label>

                <textarea
                  className="admin-textarea"
                  placeholder="Write your announcement content..."
                  value={form.content}
                  onChange={(e) =>
                    updateForm(
                      "content",
                      e.target.value
                    )
                  }
                  rows={5}
                  required
                />
              </div>

              <div className="admin-field">
                <label className="admin-label admin-label-inline">
                  <input
                    type="checkbox"
                    checked={
                      form.isPublished
                    }
                    onChange={(e) =>
                      updateForm(
                        "isPublished",
                        e.target.checked
                      )
                    }
                    className="ek-checkbox"
                  />

                  Publish immediately
                  
                  {!form.isPublished
                    ? "Leave unchecked to save as Draft"
                    : "Checked = publish now"}
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ANNOUNCEMENTS LIST
      ===================================================== */}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>
            All Announcements (
            {announcements.length})
          </h3>
        </div>

        <div className="admin-card-body">
          {announcements.length === 0 ? (
            <div className="admin-empty-state">
              {loading ? (
                <p>
                  Loading announcements...
                </p>
              ) : error ? (
                <p>
                  {error}
                </p>
              ) : (
                <p>
                  No announcements yet, published
                  or draft. Create one to get
                  started.
                </p>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Author</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {announcements.map(
                    (announcement) => (
                      <tr
                        key={announcement.id}
                      >
                        <td>
                          <div className="admin-user-name">
                            {
                              announcement.title
                            }
                          </div>

                          <div className="admin-user-email ek-cell-truncate">
                            {
                              announcement.content
                            }
                          </div>
                        </td>

                        <td>
                          <span
                            className={`admin-badge ${
                              announcement.isPublished
                                ? "admin-badge-success"
                                : "admin-badge-warning"
                            }`}
                          >
                            {announcement.isPublished
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>

                        <td>
                          {announcement.authorName ||
                            "Admin"}
                        </td>

                        <td className="admin-text-muted">
                          {announcement.createdAt
                            ? new Date(
                                announcement.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>
                          <div className="admin-header-actions">
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              onClick={() =>
                                handleEdit(
                                  announcement
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              onClick={() =>
                                handleTogglePublish(
                                  announcement
                                )
                              }
                            >
                              {announcement.isPublished
                                ? "Unpublish (save as draft)"
                                : "Publish"}
                            </button>

                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-danger-outline"
                              onClick={() =>
                                handleDelete(
                                  announcement.id
                                )
                              }
                              disabled={
                                deletingId ===
                                announcement.id
                              }
                            >
                              {deletingId ===
                              announcement.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
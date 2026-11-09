import { useCallback, useEffect, useRef, useState } from "react";

import AdminLayout from "../components/AdminLayout";

import {
  getAdminResources,
  createAdminResource,
  updateAdminResource,
  deleteAdminResource,
  toggleAdminResourceArchive,
} from "../api/resources";

import { useAuth } from "../context/AuthContext";

import { ConfirmDialog, EmptyState, SearchBox, Spinner } from "../components/ui";

export default function AdminResources() {
  const { user } = useAuth();

  const [resources, setResources] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [editingResource, setEditingResource] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    content: "",
  });

  // ==========================================================
  // SERVER-SIDE SEARCH + FILTERS
  // ==========================================================

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("");

  // Backend hides archived resources unless includeArchived=1.
  // "all" and "archived" both pass includeArchived; "archived" is
  // narrowed client-side to isActive === false.
  const [status, setStatus] = useState("all");

  // ==========================================================

  // Initial page load (spinner for the whole page).
  const [loading, setLoading] = useState(true);

  // Background refresh after a filter change.
  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const categories = {
    General: "General",
    "Mental Health": "Mental Health",
    "Stress Management": "Stress Management",
    "Study Tips": "Study Tips",
    "Sleep Hygiene": "Sleep Hygiene",
  };

  // ==========================================================
  // LOAD RESOURCES (GET /api/admin/resources?search=&category=)
  //
  // All setState calls happen after the first await so changing
  // filters never causes synchronous cascading renders.
  // ==========================================================

  const loadResources = useCallback(async () => {
    try {
      const params = {};

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      if (category) {
        params.category = category;
      }

      if (status !== "active") {
        params.includeArchived = 1;
      }

      const data = await getAdminResources(params);

      if (data.success) {
        let list = data.resources || [];

        if (status === "archived") {
          list = list.filter((resource) => !resource.isActive);
        }

        setResources(list);
      } else {
        setError(data.message || "Failed to load resources.");
      }
    } catch (err) {
      console.error("ADMIN RESOURCES ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load resources from the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category, status]);

  // Debounced load: runs immediately on mount, then 400ms after any
  // filter change (search typing, category, status) to avoid a request
  // on every keystroke.
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const delay = initialLoadRef.current ? 0 : 400;

    initialLoadRef.current = false;

    const debounceId = setTimeout(() => {
      loadResources();
    }, delay);

    return () => clearTimeout(debounceId);
  }, [loadResources]);

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "General",
      content: "",
      steps: [],
      reflection: "",
    });

    setEditingResource(null);
  };

  // ==========================================================
  // CREATE
  // ==========================================================

  const handleCreate = () => {
    resetForm();

    setShowForm(true);

    setError("");
    setSuccessMessage("");
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (resource) => {
    setEditingResource(resource);

    setFormData({
      title: resource.title || "",
      description: resource.description || "",
      category: resource.category || "General",
      content: resource.content || "",
    });

    setShowForm(true);

    setError("");
    setSuccessMessage("");
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Please enter a title.";
    }

    if (formData.title.trim().length > 255) {
      return "Title must be 255 characters or fewer.";
    }

    if (!formData.category || !categories[formData.category]) {
      return "Please select a valid category.";
    }

    if (!formData.content.trim()) {
      return "Please enter content.";
    }

    return "";
  };

  // ==========================================================
  // SAVE (POST / PUT)
  // ==========================================================

  const handleSave = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        content: formData.content.trim(),
        };

      const result = editingResource
        ? await updateAdminResource(editingResource.id, payload)
        : await createAdminResource(payload);

      if (!result.success) {
        setError(result.message || "Unable to save resource.");
        return;
      }

      setSuccessMessage(
        editingResource
          ? "Resource updated successfully."
          : "Resource created successfully."
      );

      setShowForm(false);

      resetForm();

      setRefreshing(true);

      await loadResources();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("SAVE RESOURCE ERROR:", err);

      setError(extractApiError(err, "Unable to save resource."));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // ARCHIVE / UNARCHIVE (PATCH)
  // ==========================================================

  const handleArchive = (resource) => {
    setConfirmAction({
      type: "archive",
      resource,
    });
  };

  const confirmArchive = async () => {
    const resource = confirmAction?.resource;

    if (!resource || processingId) {
      return;
    }

    setConfirmAction(null);

    try {
      setProcessingId(resource.id);

      setError("");
      setSuccessMessage("");

      const result = await toggleAdminResourceArchive(resource.id);

      if (!result.success) {
        setError(result.message || "Unable to update resource status.");
        return;
      }

      setSuccessMessage(
        result.message || "Resource status updated successfully."
      );

      setRefreshing(true);

      await loadResources();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("ARCHIVE RESOURCE ERROR:", err);

      setError(extractApiError(err, "Unable to update resource status."));
    } finally {
      setProcessingId(null);
    }
  };

  // ==========================================================
  // DELETE (DELETE, with confirmation)
  // ==========================================================

  const handleDelete = (resource) => {
    setConfirmAction({
      type: "delete",
      resource,
    });
  };

  const confirmDelete = async () => {
    const resource = confirmAction?.resource;

    if (!resource || deletingId) {
      return;
    }

    setConfirmAction(null);

    try {
      setDeletingId(resource.id);

      setError("");
      setSuccessMessage("");

      const result = await deleteAdminResource(resource.id);

      if (!result.success) {
        setError(result.message || "Unable to delete resource.");
        return;
      }

      setSuccessMessage(result.message || "Resource deleted successfully.");

      // Close the edit form if the deleted resource was being edited.
      if (editingResource?.id === resource.id) {
        setShowForm(false);
        resetForm();
      }

      setRefreshing(true);

      await loadResources();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("DELETE RESOURCE ERROR:", err);

      setError(extractApiError(err, "Unable to delete resource."));
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // CONFIRM DIALOG
  // ==========================================================

  const confirmIsDelete = confirmAction?.type === "delete";

  const confirmResource = confirmAction?.resource;

  const handleConfirmCancel = () => {
    // Don't dismiss while a request is in flight.
    if (deletingId || processingId) {
      return;
    }

    setConfirmAction(null);
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Resources & Support</h2>

            <p>
              <Spinner label="Loading resources..." />
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const isFiltering = Boolean(search.trim() || category || status !== "all");

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Resources & Support</h2>

          <p>
            Manage wellness resources and support materials for students.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleCreate}
          >
            Add Resource
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="admin-alert admin-alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT FORM
      ===================================================== */}

      {showForm && (
        <div className="admin-card ek-form-card">
          <div className="admin-card-header">
            <h3>
              {editingResource ? "Edit Resource" : "Add New Resource"}
            </h3>
          </div>

          <div className="admin-card-body">
            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-label">
                  Title <span aria-hidden="true">*</span>
                </label>

                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Resource title..."
                  maxLength={255}
                  disabled={saving}
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Category <span aria-hidden="true">*</span>
                </label>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className="admin-input"
                  disabled={saving}
                >
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Description
              </label>

              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="admin-input"
                placeholder="Brief description..."
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Content <span aria-hidden="true">*</span>
              </label>

              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: e.target.value,
                  })
                }
                className="admin-textarea"
                placeholder="Resource content..."
                rows={5}
                disabled={saving}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setError("");
                }}
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
                  : editingResource
                  ? "Update Resource"
                  : "Create Resource"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SEARCH + FILTERS
      ===================================================== */}

      <div className="admin-filters">
        <SearchBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          label="Search resources"
        />

        <select
          className="admin-filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All</option>

          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="admin-filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="archived">Archived only</option>
        </select>
      </div>

      {/* =====================================================
          RESOURCE CARDS
      ===================================================== */}

      <div
        className="admin-resources-grid"
        style={refreshing ? { opacity: 0.6, pointerEvents: "none" } : undefined}
      >
        {resources.length === 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState
              kind={isFiltering ? "results" : "data"}
              title={
                isFiltering
                  ? "No matching resources"
                  : "No resources yet"
              }
              message={
                isFiltering
                  ? "No resources match your search or filters."
                  : "Add a resource to make it available to students."
              }
              action={
                isFiltering
                  ? undefined
                  : (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={handleCreate}
                    >
                      Add Resource
                    </button>
                  )
              }
            />
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.id}
              className={`admin-resource-card ${resource.isActive ? "" : "admin-resource-archived"}`}
            >
              <div className="admin-resource-header">
                <span className="admin-badge admin-badge-info">
                  {categories[resource.category] || resource.category}
                </span>

                <span
                  className={`admin-badge ${resource.isActive ? "admin-badge-success" : "admin-badge-warning"}`
                }
                >
                  {resource.isActive ? "Active" : "Archived"}
                </span>
              </div>

              <h4>{resource.title}</h4>

              <p>{resource.description}</p>

              <div className="admin-resource-content">
                {resource.content}
              </div>

              <div className="admin-resource-meta">
                <span>By: {resource.author || user?.name || "Admin"}</span>

                <span>
                  Updated:{" "}
                  {resource.updatedAt
                    ? new Date(resource.updatedAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              <div className="admin-resource-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-sm admin-btn-outline"
                  onClick={() => handleEdit(resource)}
                  disabled={deletingId === resource.id}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-sm admin-btn-outline"
                  onClick={() => handleArchive(resource)}
                  disabled={processingId === resource.id}
                >
                  {processingId === resource.id
                    ? "Saving..."
                    : resource.isActive
                    ? "Archive"
                    : "Unarchive"}
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  onClick={() => handleDelete(resource)}
                  disabled={deletingId === resource.id}
                >
                  {deletingId === resource.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          CONFIRM DIALOG (delete / archive / unarchive)
      ===================================================== */}

      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmIsDelete ? "Delete Resource" : "Archive Resource"}
          message={
            confirmIsDelete
              ? `Are you sure you want to permanently delete "${confirmResource?.title || ""}"? This action cannot be undone.`
              : confirmResource?.isActive
              ? `Are you sure you want to archive "${confirmResource?.title || ""}"? It will be hidden from students.`
              : `Are you sure you want to unarchive "${confirmResource?.title || ""}"? It will be visible to students again.`
          }
          confirmLabel={
            confirmIsDelete
              ? deletingId
                ? "Deleting..."
                : "Delete"
              : processingId
              ? "Saving..."
              : confirmResource?.isActive
              ? "Archive"
              : "Unarchive"
          }
          danger={confirmIsDelete}
          onConfirm={confirmIsDelete ? confirmDelete : confirmArchive}
          onCancel={handleConfirmCancel}
        />
      )}
    </AdminLayout>
  );
}

// ============================================================
// API ERROR EXTRACTION
// ============================================================
//
// Laravel returns validation errors (422) as { errors: { field: [...] } },
// not-found (404) and server errors (500) as { message }.

function extractApiError(err, fallback) {
  const response = err?.response;

  if (!response) {
    return "Unable to connect to the server. Please make sure the Laravel backend is running.";
  }

  const validationErrors = response.data?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const firstFieldMessages = Object.values(validationErrors)
      .flat()
      .filter(Boolean);

    if (firstFieldMessages.length > 0) {
      return firstFieldMessages.join(" ");
    }
  }

  return response.data?.message || fallback;
}
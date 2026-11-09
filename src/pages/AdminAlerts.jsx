import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";

import { getAdminAlerts, getAdminAlert } from "../api/alerts";

import { Badge } from "../components/ui";

import { ALERT_SEVERITY, ALERT_STATUS, CASE_STATUS } from "../components/statusMaps";

export default function AdminAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminAlerts();

      if (data.success) {
        const sortedAlerts = [...(data.alerts || [])].sort(
          (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
        );

        setAlerts(sortedAlerts);
      } else {
        setError(data.message || "Failed to load alerts.");
      }
    } catch (err) {
      console.error("ADMIN ALERTS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load alerts from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filtered = useMemo(() => {
    let result = [...alerts];

    if (search.trim()) {
      const q = search.toLowerCase().trim();

      result = result.filter((a) =>
        [
          a.alertId,
          a.studentName,
          a.title,
          a.alertType,
          a.detail,
          a.description,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    if (severityFilter !== "all") {
      result = result.filter((a) => a.severity === severityFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result;
  }, [alerts, search, severityFilter, statusFilter]);

  const severityConfig = ALERT_SEVERITY;

  // Alerts and cases use the same status vocabulary and stay connected.
  const statusConfig = {
    open: CASE_STATUS.open || ALERT_STATUS.open,
    in_progress: CASE_STATUS.in_progress || ALERT_STATUS.in_progress,
    resolved: CASE_STATUS.resolved || ALERT_STATUS.resolved,
    closed: CASE_STATUS.closed || ALERT_STATUS.closed,
  };

  const handleViewAlert = async (alertItem) => {
    setShowModal(true);
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedAlert(null);

    try {
      const data = await getAdminAlert(alertItem.id);
      if (data.success && data.alert) {
        setSelectedAlert(data.alert);
      } else {
        // Fallback to list item data if show endpoint not available
        setSelectedAlert(alertItem);
        if (data.message) {
          setDetailsError(data.message);
        }
      }
    } catch (err) {
      console.error("GET ALERT DETAILS ERROR:", err);
      setSelectedAlert(alertItem);
      setDetailsError(
        err?.response?.data?.message ||
          "Unable to load full alert details. Showing available information."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAlert(null);
    setDetailsError("");
  };

  const handleViewRelatedCase = () => {
    const caseId = selectedAlert?.caseId || selectedAlert?.relatedCaseId || selectedAlert?.case?.id;
    if (caseId) {
      closeModal();
      navigate(`/admin/cases/${caseId}`);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      const date = new Date(value);
      return date.toLocaleString();
    } catch (e) {
      return value;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Alerts & Flags</h2>
            <p>Loading wellness alerts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Alerts & Flags</h2>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={loadAlerts}
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  const relatedCaseId =
    selectedAlert?.caseId || selectedAlert?.relatedCaseId || selectedAlert?.case?.id || null;

  const checkInInfo =
    selectedAlert?.relatedCheckIn || selectedAlert?.checkIn || null;
  const journalInfo = selectedAlert?.relatedJournal || selectedAlert?.journal || null;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Alerts & Flags</h2>
          <p>Monitor and respond to student wellness alerts.</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            placeholder="Search alerts..."
            aria-label="Search alerts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Severity</option>

          {Object.entries(severityConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Status</option>

          {Object.entries(statusConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Student</th>
              <th>Severity</th>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((alertItem) => {
                const sev =
                  severityConfig[alertItem.severity] || {
                    tone: "info",
                    label: alertItem.severity,
                  };

                return (
                  <tr key={alertItem.id}>
                    <td className="admin-mono">{alertItem.alertId}</td>

                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar admin-user-avatar-sm">
                          {alertItem.studentName?.charAt(0)?.toUpperCase() || "?"}
                        </div>

                        <span className="admin-user-name">
                          {alertItem.studentName || "Unknown Student"}
                        </span>
                      </div>
                    </td>                    <td>
                      <Badge
                        tone={sev.tone}
                        style={
                          alertItem.severity === "urgent"
                            ? { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }
                            : alertItem.severity === "high"
                            ? { background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" }
                            : alertItem.severity === "medium"
                            ? { background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }
                            : alertItem.severity === "low"
                            ? { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }
                            : {}
                        }
                      >
                        {sev.label}
                      </Badge>
                    </td>

                    <td>{alertItem.title || alertItem.alertType}</td>

                    <td>
                      <Badge tone={statusConfig[alertItem.status]?.tone || ALERT_STATUS[alertItem.status]?.tone || "info"}>
                        {statusConfig[alertItem.status]?.label || ALERT_STATUS[alertItem.status]?.label || alertItem.status}
                      </Badge>
                    </td>

                    <td>
                      {alertItem.createdAt || alertItem.date
                        ? new Date(
                            alertItem.createdAt || alertItem.date
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-outline"
                        onClick={() => handleViewAlert(alertItem)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="admin-empty-cell">
                  No alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, width: "90%" }}
          >
            <div className="admin-modal-header">
              <h3>Alert Details</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              {detailsLoading && (
                <p style={{ margin: 0 }}>Loading alert details...</p>
              )}

              {!detailsLoading && selectedAlert && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {detailsError && (
                    <div className="admin-alert admin-alert-warning">
                      {detailsError}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Alert ID</div>
                      <div style={{ fontWeight: 600 }}>
                        {selectedAlert.alertId ||
                          `ALERT-${String(selectedAlert.id).padStart(3, "0")}`}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Student Name</div>
                      <div style={{ fontWeight: 600 }}>
                        {selectedAlert.studentName ||
                          selectedAlert.student?.name ||
                          "Unknown Student"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Alert Type</div>
                      <div style={{ fontWeight: 600 }}>
                        {selectedAlert.alertType || selectedAlert.title || "Wellness Alert"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Severity</div>
                      <div>
                        <Badge
                          tone={
                            (severityConfig[selectedAlert.severity] || {}).tone ||
                            "info"
                          }
                          style={
                            selectedAlert.severity === "urgent"
                              ? { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }
                              : selectedAlert.severity === "high"
                              ? { background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" }
                              : selectedAlert.severity === "medium"
                              ? { background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }
                              : selectedAlert.severity === "low"
                              ? { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }
                              : {}
                          }
                        >
                          {(severityConfig[selectedAlert.severity] || {}).label ||
                            selectedAlert.severity}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Date and Time</div>
                      <div style={{ fontWeight: 600 }}>
                        {formatDateTime(
                          selectedAlert.dateTime ||
                            selectedAlert.createdAt ||
                            selectedAlert.date
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Current Alert Status</div>
                      <div>
                        <Badge
                          tone={statusConfig[selectedAlert.status]?.tone || ALERT_STATUS[selectedAlert.status]?.tone || "info"}
                        >
                          {statusConfig[selectedAlert.status]?.label || ALERT_STATUS[selectedAlert.status]?.label || selectedAlert.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Related Case ID</div>
                      <div style={{ fontWeight: 600 }}>
                        {relatedCaseId ? `CASE-${String(relatedCaseId).padStart(3, "0")}` : "—"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      Alert Description
                    </div>
                    <div
                      style={{
                        padding: 10,
                        background: "var(--admin-bg)",
                        borderRadius: 8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedAlert.description || selectedAlert.detail || "—"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      Related Student Check-in or Journal information
                    </div>
                    {checkInInfo ? (
                      <div
                        style={{
                          padding: 10,
                          background: "var(--admin-bg)",
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div>
                          <strong>Check-in</strong>{" "}
                          {checkInInfo.check_in_date
                            ? `(${new Date(checkInInfo.check_in_date).toLocaleDateString()})`
                            : ""}
                        </div>
                        <div>
                          Mood: {checkInInfo.mood_label || checkInInfo.mood_value || "—"}{" "}
                          {checkInInfo.mood_value ? `(${checkInInfo.mood_value}/5)` : ""}
                        </div>
                        <div>
                          Stress: {checkInInfo.stress_text || checkInInfo.stress_label || "—"}{" "}
                          {checkInInfo.stress_value ? `(${checkInInfo.stress_value})` : ""}
                        </div>
                        {Array.isArray(checkInInfo.tags) && checkInInfo.tags.length > 0 && (
                          <div>Tags: {checkInInfo.tags.join(", ")}</div>
                        )}
                        {checkInInfo.note && <div>Note: {checkInInfo.note}</div>}
                      </div>
                    ) : journalInfo ? (
                      <div
                        style={{
                          padding: 10,
                          background: "var(--admin-bg)",
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div>
                          <strong>Journal</strong>{" "}
                          {journalInfo.created_at
                            ? `(${new Date(journalInfo.created_at).toLocaleString()})`
                            : ""}
                        </div>
                        {journalInfo.title && <div>Title: {journalInfo.title}</div>}
                        {journalInfo.content && (
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {journalInfo.content}
                          </div>
                        )}
                        {journalInfo.mood_label && (
                          <div>Mood: {journalInfo.mood_label}</div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: 10,
                          background: "var(--admin-bg)",
                          borderRadius: 8,
                        }}
                      >
                        No related check-in or journal information available.
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      Related Case
                    </div>
                    {relatedCaseId ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleViewRelatedCase}
                      >
                        View Related Case
                      </button>
                    ) : (
                      <div>No case linked yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

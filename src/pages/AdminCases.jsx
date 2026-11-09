import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import { Badge } from "../components/ui";
import { CASE_STATUS, PRIORITY } from "../components/statusMaps";
import {
  getAdminCases,
  addAdminCaseNote,
  updateAdminCaseStatus,
} from "../api/cases";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function AdminCases() {
  const navigate = useNavigate();

  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [openNotes, setOpenNotes] = useState({});
  const [noteDrafts, setNoteDrafts] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});

  const loadCases = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setError("");
      const data = await getAdminCases();
      if (data.success) {
        setAllCases(data.cases || []);
      } else {
        setError(data.message || "Failed to load cases.");
      }
    } catch (err) {
      console.error("ADMIN CASES ERROR:", err);
      setError(
        err?.response?.data?.message || "Unable to load cases from the server."
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const statusLabels = {
    open: "Open",
    in_progress: "In Progress",
    follow_up: "Follow-up",
    resolved: "Resolved",
    closed: "Closed",
  };

  const priorityLabels = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const filtered = useMemo(() => {
    let result = [...allCases];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((c) =>
        [
          c.caseNumber,
          c.studentName,
          c.title,
          c.description,
          c.assignedTo,
          c.assignedToLabel,
          c.sourceAlert?.alertId,
          c.sourceAlert?.title,
        ].some((value) => String(value || "").toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((c) => c.priority === priorityFilter);
    }
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return result;
  }, [allCases, search, statusFilter, priorityFilter]);

  const setCaseLoading = (key, val) => setActionLoading((s) => ({ ...s, [key]: val }));
  const setCaseError = (id, msg) => setActionError((s) => ({ ...s, [id]: msg || "" }));
  const updateCaseLocal = (caseId, patch) => {
    setAllCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, ...patch } : c)));
  };

  const handleAddNote = async (caseId) => {
    const text = (noteDrafts[caseId] || "").trim();
    if (!text) return;
    setCaseLoading(`note-${caseId}`, true);
    setCaseError(caseId, "");
    try {
      const data = await addAdminCaseNote(caseId, text);
      if (data.success && data.note) {
        setAllCases((prev) =>
          prev.map((c) =>
            c.id === caseId ? { ...c, notes: [data.note, ...(c.notes || [])] } : c
          )
        );
        setNoteDrafts((s) => ({ ...s, [caseId]: "" }));
        setOpenNotes((s) => ({ ...s, [caseId]: true }));
      } else {
        setCaseError(caseId, data.message || "Failed to add note.");
      }
    } catch (err) {
      console.error("ADD NOTE ERROR:", err);
      setCaseError(caseId, err?.response?.data?.message || "Unable to add note.");
    } finally {
      setCaseLoading(`note-${caseId}`, false);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    if (!newStatus) return;
    setCaseLoading(`status-${caseId}`, true);
    setCaseError(caseId, "");
    try {
      const data = await updateAdminCaseStatus(caseId, newStatus);
      if (data.success) {
        updateCaseLocal(caseId, { status: newStatus });
      } else {
        setCaseError(caseId, data.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      setCaseError(caseId, err?.response?.data?.message || "Unable to update case status.");
    } finally {
      setCaseLoading(`status-${caseId}`, false);
    }
  };

  const toggleNotes = (caseId) => setOpenNotes((s) => ({ ...s, [caseId]: !s[caseId] }));

  const assignedLabel = (c) => {
    if (c.assignedToLabel && c.assignedToLabel !== "Unassigned") return c.assignedToLabel;
    if (c.assignedTo && c.assignedTo !== "Unassigned") {
      const role = c.assignedToRole || "Admin (Guidance Counselor)";
      return `${c.assignedTo} (${role})`;
    }
    return "Admin (Guidance Counselor)";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Cases</h2>
            <p>Loading student support cases...</p>
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
            <h2>Cases</h2>
            <p>{error}</p>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => loadCases()}>
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Cases</h2>
          <p>Manage and track student support cases.</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-filter-select">
          <option value="all">All Status</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="admin-filter-select">
          <option value="all">All Priority</option>
          {Object.entries(priorityLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="admin-cases-grid">
        {filtered.length > 0 ? (
          filtered.map((c) => {
            const isSelected = selectedCaseId === c.id;
            const notesOpen = !!openNotes[c.id];
            const savingNote = !!actionLoading[`note-${c.id}`];
            const savingStatus = !!actionLoading[`status-${c.id}`];
            const cErr = actionError[c.id];

            return (
              <div
                key={c.id}
                className={`admin-case-card ${isSelected ? "admin-case-card-selected" : ""}`}
                onClick={() => setSelectedCaseId(isSelected ? null : c.id)}
              >
                <div className="admin-case-card-header">
                  <span className="admin-case-number">{c.caseNumber}</span>
                  <div className="admin-case-badges">
                    <Badge tone={CASE_STATUS[c.status]?.tone || "info"} dot>
                      {statusLabels[c.status] || c.status}
                    </Badge>
                    <Badge tone={PRIORITY[c.priority]?.tone || "info"} dot>
                      {PRIORITY[c.priority]?.label || c.priority}
                    </Badge>
                  </div>
                </div>

                <h4 className="admin-case-card-title">{c.title}</h4>
                <p className="admin-case-card-student">{c.studentName}</p>
                <p className="admin-case-card-desc">{c.description}</p>

                {c.sourceAlert && (
                  <div className="admin-case-card-followup" title={c.sourceAlert.detail || ""}>
                    Related alert: {c.sourceAlert.alertId || `ALERT-${c.sourceFlagId}`} — {c.sourceAlert.title}
                  </div>
                )}

                <div className="admin-case-card-meta">
                  <span>Assigned to: {assignedLabel(c)}</span>
                  <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</span>
                </div>

                {c.followUpDate && (
                  <div className="admin-case-card-followup">
                    Follow-up: {new Date(c.followUpDate).toLocaleDateString()}
                  </div>
                )}

                <div
                  className="admin-header-actions"
                  style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {c.studentId ? (
                    <Link to={`/admin/students/${c.studentId}`} className="admin-btn admin-btn-sm admin-btn-outline">
                      View Student Profile
                    </Link>
                  ) : null}

                  <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => navigate(`/admin/cases/${c.id}`)}>
                    View Case Details
                  </button>

                  <select
                    className="admin-filter-select admin-btn-sm"
                    value={STATUSES.includes(c.status) ? c.status : "open"}
                    disabled={savingStatus}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    aria-label="Update case status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    disabled={savingStatus || c.status === "resolved"}
                    onClick={() => handleStatusChange(c.id, "resolved")}
                  >
                    Resolve Case
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    disabled={savingStatus || c.status === "closed"}
                    onClick={() => handleStatusChange(c.id, "closed")}
                  >
                    Close Case
                  </button>
                </div>

                {cErr ? (
                  <p style={{ color: "var(--ek-danger, #c0392b)", marginTop: 8, fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
                    {cErr}
                  </p>
                ) : null}

                {isSelected && (
                  <div className="admin-case-card-details" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-outline"
                      style={{ width: "100%", justifyContent: "space-between", display: "flex", alignItems: "center" }}
                      onClick={() => toggleNotes(c.id)}
                      aria-expanded={notesOpen}
                    >
                      <span>Notes ({(c.notes || []).length})</span>
                      <span>{notesOpen ? "Hide" : "Show"}</span>
                    </button>

                    {notesOpen && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ marginBottom: 10 }}>
                          <textarea
                            className="admin-input"
                            rows={3}
                            placeholder="Add a note (saved permanently, newest first)..."
                            value={noteDrafts[c.id] || ""}
                            onChange={(e) => setNoteDrafts((s) => ({ ...s, [c.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            style={{ marginTop: 6 }}
                            disabled={savingNote || !(noteDrafts[c.id] || "").trim()}
                            onClick={() => handleAddNote(c.id)}
                          >
                            {savingNote ? "Saving..." : "Add Note"}
                          </button>
                        </div>

                        {c.notes && c.notes.length > 0 ? (
                          <div className="admin-case-notes">
                            {c.notes.map((note) => (
                              <div key={note.id} className="admin-case-note">
                                <div className="admin-case-note-header">
                                  <span className="admin-case-note-author">
                                    {note.author}{note.authorRole ? ` (${note.authorRole})` : ""}
                                  </span>
                                  <span className="admin-case-note-time">
                                    {note.createdAt || note.created_at
                                      ? new Date(note.createdAt || note.created_at).toLocaleString()
                                      : "—"}
                                  </span>
                                </div>
                                <p>{note.text || note.note}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="admin-empty-text">No notes yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="admin-empty-state">
            <p>No cases found matching your criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

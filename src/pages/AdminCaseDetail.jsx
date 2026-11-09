import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { addCaseNote, getCaseDetail, updateCaseStatus } from "../api/checkins";
import { Badge } from "../components/ui";
import Icon from "../components/Icon";

/**
 * Case Details view (module 14): full check-in history + individual mood
 * trend + notes + status management for one flagged student. Light
 * polling keeps notes/status fresh if another counselor edits first.
 */
const POLL_MS = 20000;

const STATUS_TONE = { open: "warning", in_progress: "info", resolved: "success", closed: "neutral", follow_up: "warning" };
const SEVERITY_TONE = { high: "danger", medium: "warning", low: "info" };

export default function AdminCaseDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const result = await getCaseDetail(id);
        setData(result);
        setError("");
      } catch (err) {
        setError(err?.response?.data?.message || "Couldn't load this case.");
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await addCaseNote(id, noteText.trim());
      setNoteText("");
      await load(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't add the note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleStatus = async (status) => {
    setStatusSaving(true);
    try {
      await updateCaseStatus(id, status);
      await load(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't update status.");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <AdminLayout>
        <div className="admin-page-header"><div><h2>Case Details</h2><p>Loading…</p></div></div>
      </AdminLayout>
    );
  }

  if (error && !data) {
    return (
      <AdminLayout>
        <div className="admin-page-header"><div><h2>Case Details</h2><p>{error}</p></div></div>
      </AdminLayout>
    );
  }

  const c = data?.case;

  // Guard: if case data is missing, show a friendly not-found state
  if (!c) {
    return (
      <AdminLayout>
        <div className="admin-page-header"><div><h2>Case Details</h2><p>Case not found.</p></div></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>
            {c.case_number}{" "}
            <Badge tone={STATUS_TONE[c.status] || "info"} dot>{c.status.replace("_", " ")}</Badge>
          </h2>
          <p>{c.title} · Priority: {c.priority}</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/checkins" className="admin-btn admin-btn-outline">
            <Icon name="chevronLeft" size={16} />
            Back to dashboard
          </Link>
        </div>
      </div>

      {error && <p className="ek-form-error" role="alert">{error}</p>}

      <div className="admin-dashboard-grid">
        {/* Student + flags */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>Student</h3></div>
          <div className="admin-card-body">
            {(() => {
              const student = c.student || c.student_info || data.student || data.student_info || {};
              const studentName = student.name || student.full_name || student.student_name || c.studentName || c.student_name || "—";
              const studentId = student.student_id || student.studentId || student.id_number || c.student_id || c.studentId || null;
              const grade = student.grade || student.grade_level || student.year_level || c.grade || c.grade_level || "—";
              const section = student.section || student.block || student.section_name || c.section || c.section_name || "—";
              const email = student.email || c.email || "";
              const course = student.course || student.program || student.course_program || c.course || c.program || null;
              
              if (!studentName || studentName === "—") {
                return <p className="admin-empty-text">Student information unavailable.</p>;
              }
              
              return (
                <>
                  <p className="ek-case-student-name">{studentName}</p>
                  <p className="ek-case-student-meta">
                    {course ? `${course} · ` : ""}
                    {grade} · {section}
                    {email ? ` · ${email}` : ""}
                    {studentId ? ` · ID ${studentId}` : ""}
                  </p>
                </>
              );
            })()}
            {c.description && <p className="ek-case-desc">{c.description}</p>}

            <h4 className="ek-case-sub">Active flags</h4>
            {(c.flags || []).length === 0 ? (
              <p className="admin-empty-text">No flags on this case.</p>
            ) : (
              <div className="ek-flag-list">
                {(c.flags || []).map((f) => (
                  <div key={f.id} className="ek-flag-item ek-flag-item-static">
                    <Badge tone={SEVERITY_TONE[f.severity] || "info"} dot>{f.severity}</Badge>
                    <div className="ek-flag-info">
                      <span className="ek-flag-detail">{f.detail}</span>
                      <span className="ek-flag-meta">{new Date(f.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h4 className="ek-case-sub">Assigned to</h4>
            <p className="ek-case-student-meta" style={{ marginBottom: 8 }}>
              {c.assignedToLabel || c.assignedToName || c.assignedTo || "Admin (Guidance Counselor)"}
            </p>

            {c.sourceAlert ? (
              <>
                <h4 className="ek-case-sub">Related alert</h4>
                <p className="ek-case-student-meta" style={{ marginBottom: 8 }}>
                  <strong>{c.sourceAlert.alertId || `ALERT-${c.source_flag_id}`}</strong>
                  {" — "}
                  {c.sourceAlert.title || "Wellness Alert"}
                  {c.sourceAlert.severity ? ` (${c.sourceAlert.severity})` : ""}
                  {c.sourceAlert.status ? ` · ${c.sourceAlert.status}` : ""}
                </p>
                {c.sourceAlert.detail ? <p className="ek-case-desc">{c.sourceAlert.detail}</p> : null}
              </>
            ) : null}

            <h4 className="ek-case-sub">Case status</h4>
            <div className="ek-case-status-row" style={{ flexWrap: "wrap", gap: 8 }}>
              {["open", "in_progress", "resolved", "closed"].map((s) => (
                <button
                  key={s}
                  className={`admin-btn ${c.status === s ? "admin-btn-primary" : "admin-btn-outline"}`}
                  disabled={statusSaving || c.status === s}
                  onClick={() => handleStatus(s)}
                >
                  {s === "resolved" ? "Resolve Case" : s === "closed" ? "Close Case" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>Case Notes</h3></div>
          <div className="admin-card-body">
            <div className="ek-case-notes">
              {(c.notes || []).length === 0 ? (
                <p className="admin-empty-text">No notes yet — add the first one below.</p>
              ) : (
                (c.notes || []).map((n) => (
                  <div key={n.id} className="ek-case-note">
                    <div className="ek-case-note-head">
                      <strong>
                        {n.author}
                        {n.authorRole || n.author_role ? ` (${n.authorRole || n.author_role})` : ""}
                      </strong>
                      <span>{new Date(n.created_at || n.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{n.note}</p>
                  </div>
                ))
              )}
            </div>
            <textarea
              rows={3}
              className="admin-input"
              placeholder="Add a case note (visible to guidance staff only)…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button
              className="admin-btn admin-btn-primary"
              style={{ marginTop: 10 }}
              disabled={savingNote || !noteText.trim()}
              onClick={handleAddNote}
            >
              {savingNote ? "Saving…" : "Add note"}
            </button>
          </div>
        </div>

        {/* Individual trend */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header"><h3>Individual Mood Trend</h3></div>
          <div className="admin-card-body">
            {(data.trend || []).length > 1 ? (
              <MiniTrend trend={data.trend || []} />
            ) : (
              <p className="admin-empty-text">Not enough history for a trend yet.</p>
            )}
          </div>
        </div>

        {/* Full check-in history */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header"><h3>Check-in History</h3></div>
          <div className="admin-card-body">
            {(data.history || []).length === 0 ? (
              <p className="admin-empty-text">No check-ins recorded.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Date</th><th>Mood</th><th>Stress</th><th>Tags</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {(data.history || []).map((h) => (
                      <tr key={h.date}>
                        <td>{new Date(h.date + "T00:00:00").toLocaleDateString()}</td>
                        <td><Badge tone={moodTone(h.mood_value)} dot>{h.mood_label}</Badge></td>
                        <td>{h.stress_text}</td>
                        <td>{h.tags?.length ? h.tags.join(", ") : "—"}</td>
                        <td className="admin-text-truncate" title={h.note}>{h.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function moodTone(v) {
  if (v >= 4) return "success";
  if (v === 3) return "info";
  if (v === 2) return "warning";
  return "danger";
}

function MiniTrend({ trend }) {
  const w = 640, h = 200, pad = 30;
  const x = (i) => pad + (i * (w - pad * 2)) / Math.max(trend.length - 1, 1);
  const y = (v) => h - pad - ((v - 1) / 4) * (h - pad * 2);
  const path = (k) => trend.map((t, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(t[k])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ek-checkin-chart" role="img" aria-label="Student mood trend">
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} className="ek-chart-grid" />
          <text x={pad - 8} y={y(v) + 4} textAnchor="end" className="ek-chart-label">{v}</text>
        </g>
      ))}
      {trend.map((t, i) =>
        i % Math.ceil(trend.length / 7) === 0 || i === trend.length - 1 ? (
          <text key={t.date} x={x(i)} y={h - 8} textAnchor="middle" className="ek-chart-label">{t.date}</text>
        ) : null
      )}
      <path d={path("stress")} className="ek-chart-line ek-chart-line-stress" />
      <path d={path("mood")} className="ek-chart-line ek-chart-line-mood" />
      {trend.map((t, i) => (
        <g key={t.date + i}>
          <circle cx={x(i)} cy={y(t.mood)} r={3.5} className="ek-chart-dot ek-chart-dot-mood" />
          <circle cx={x(i)} cy={y(t.stress)} r={3.5} className="ek-chart-dot ek-chart-dot-stress" />
        </g>
      ))}
    </svg>
  );
}

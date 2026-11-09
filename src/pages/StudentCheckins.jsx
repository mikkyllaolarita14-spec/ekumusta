import { useCallback, useEffect, useState } from "react";
import StudentLayout from "../components/StudentLayout";
import { useAuth } from "../context/AuthContext";
import {
  getCheckInMeta,
  getMyCheckIns,
  submitCheckIn,
  updateTodayCheckIn,
} from "../api/checkins";
import { Badge, EmptyState } from "../components/ui";
import Icon from "../components/Icon";

/**
 * Module 3 — Daily Check-In (Student side)
 * Tap-based form → confirmation screen → personal history, streak and
 * mood trend. One check-in per day; same-day edits allowed. All data
 * comes from the Laravel API scoped to the logged-in student.
 */

const EMPTY_FORM = { mood_value: 0, stress_label: 0, note: "", tags: [] };

export default function StudentCheckins() {
  const { user } = useAuth();

  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [editingToday, setEditingToday] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const load = useCallback(async () => {
    try {
      const [metaData, myData] = await Promise.all([
        getCheckInMeta(user?.id),
        getMyCheckIns(user?.id),
      ]);
      setMeta(metaData);
      setData(myData);
      setIsDemo(Boolean(metaData?._demo || myData?._demo));
      setError("");
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Your session has expired — please sign in again.");
      } else {
        setError(
          err?.response?.data?.message ||
            "Couldn't load your check-ins. Is the backend running?"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const todayEntry = data?.check_ins?.find(
    (c) => c.date === new Date().toISOString().slice(0, 10)
  );

  const openForm = () => {
    if (todayEntry) {
      setForm({
        mood_value: todayEntry.mood_value,
        stress_label: todayEntry.stress_label_value,
        note: todayEntry.note || "",
        tags: todayEntry.tags || [],
      });
      setEditingToday(true);
    } else {
      setForm(EMPTY_FORM);
      setEditingToday(false);
    }
    setConfirmation(null);
    setShowForm(true);
  };

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : f.tags.length >= 3
          ? f.tags
          : [...f.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    if (!form.mood_value || !form.stress_label) return;
    setSubmitting(true);
    setError("");
    try {
      const result = editingToday
        ? await updateTodayCheckIn(form, user?.id)
        : await submitCheckIn(form, user?.id);

      setConfirmation(result.confirmation);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingToday(false);
      await load();
    } catch (err) {
      if (err?.response?.status === 409 || err?.isConflict) {
        setError("You've already checked in today — tap 'Edit today's entry' instead.");
      } else {
        setError(err?.response?.data?.message || "Couldn't save your check-in.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="admin-page-header">
          <div>
            <h2>My Check-ins</h2>
            <p>Loading your wellness space…</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  /* ── Confirmation screen ─────────────────────────────────────────────── */
  if (confirmation) {
    return (
      <StudentLayout>
        <div className="ek-checkin-confirm">
          <div className="ek-checkin-confirm-card">
            <div className="ek-checkin-confirm-icon">
              <Icon name="check" size={42} />
            </div>
            <h2>You're all set!</h2>
            <p className="ek-checkin-confirm-msg">{confirmation}</p>
            <div className="ek-checkin-confirm-actions">
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => setConfirmation(null)}
              >
                See my history
              </button>
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => {
                  setConfirmation(null);
                  openForm();
                }}
              >
                Edit today's entry
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const moods = meta?.moods || [];
  const stressLabels = meta?.stressLabels || [];
  const tags = meta?.tags || [];
  const stats = data?.stats || {};
  const trend = data?.trend || [];

  return (
    <StudentLayout>
      <div className="admin-page-header">
        <div>
          <h2>My Check-ins</h2>
          <p>A private record of your daily wellness check-ins.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openForm}>
            <Icon name="checkins" size={16} />
            {todayEntry ? "Edit today's entry" : "Check in now"}
          </button>
        </div>
      </div>

      {error && <p className="ek-form-error" role="alert">{error}</p>}

      {isDemo && (
        <div className="ek-demo-banner" role="status">
          <Icon name="shield" size={15} />
          <span>
            Demo mode — the backend isn't reachable, so check-ins are saved
            locally in this browser. Start the Laravel server to sync for real.
          </span>
        </div>
      )}

      {/* ── Check-in form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="admin-card ek-checkin-form">
          <h3 className="ek-checkin-form-title">
            {editingToday ? "Edit today's check-in" : "How are you today?"}
          </h3>

          {/* Mood */}
          <div className="ek-checkin-field">
            <label className="admin-label">Mood</label>
            <div className="ek-checkin-moods">
              {moods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`ek-checkin-mood ${form.mood_value === m.value ? "ek-checkin-mood-active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, mood_value: m.value }))}
                  aria-pressed={form.mood_value === m.value}
                >
                  <span className="ek-checkin-mood-emoji">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div className="ek-checkin-field">
            <label className="admin-label">Stress level</label>
            <div className="ek-checkin-stress">
              {stressLabels.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`ek-checkin-stress-btn ${form.stress_label === s.value ? "ek-checkin-stress-active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, stress_label: s.value }))}
                  aria-pressed={form.stress_label === s.value}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="ek-checkin-field">
            <label className="admin-label">
              What's this about? <span className="ek-checkin-optional">(optional, up to 3)</span>
            </label>
            <div className="ek-checkin-tags">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`ek-checkin-tag ${form.tags.includes(tag) ? "ek-checkin-tag-active" : ""}`}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={form.tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="ek-checkin-field">
            <label className="admin-label" htmlFor="ek-checkin-note">
              Anything on your mind? <span className="ek-checkin-optional">(optional)</span>
            </label>
            <textarea
              id="ek-checkin-note"
              rows={3}
              maxLength={meta?.maxNoteLength || 300}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="A sentence or two is plenty…"
              className="admin-input"
            />
            <span className="ek-checkin-count">
              {(form.note || "").length}/{meta?.maxNoteLength || 300}
            </span>
          </div>

          <div className="admin-modal-actions">
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              disabled={!form.mood_value || !form.stress_label || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving…" : editingToday ? "Save changes" : "Submit check-in"}
            </button>
          </div>
        </div>
      )}

      {/* ── Stats + trend ───────────────────────────────────────────────── */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <Icon name="checkins" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats.total ?? 0}</span>
            <span className="admin-stat-label">Total Check-ins</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <Icon name="star" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">🔥 {data?.streak ?? 0}</span>
            <span className="admin-stat-label">Day Streak</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber">
            <Icon name="heart" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats.avg_mood ?? "—"}</span>
            <span className="admin-stat-label">Avg Mood (of 5)</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-red">
            <Icon name="smile" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats.this_week ?? 0}</span>
            <span className="admin-stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Mood trend chart (inline SVG) */}
      {trend.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Mood Trend — last {trend.length} check-ins</h3>
          </div>
          <div className="admin-card-body">
            <TrendChart trend={trend} />
          </div>
        </div>
      )}

      {/* ── History table ───────────────────────────────────────────────── */}
      {!data?.check_ins?.length ? (
        <EmptyState
          title="No check-ins yet"
          message="Your wellness check-in history will appear here once you start checking in. It is visible only to you and authorized guidance staff."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Mood</th>
                <th scope="col">Stress</th>
                <th scope="col">Tags</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {data.check_ins.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {new Date(entry.date + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td>
                    <Badge tone={moodTone(entry.mood_value)} dot>
                      {entry.mood_label}
                    </Badge>
                  </td>
                  <td>{entry.stress_text}</td>
                  <td>
                    {entry.tags.length ? (
                      <span className="ek-checkin-row-tags">{entry.tags.join(", ")}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="admin-text-truncate" title={entry.note}>
                    {entry.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StudentLayout>
  );
}

function moodTone(value) {
  if (value >= 4) return "success";
  if (value === 3) return "info";
  if (value === 2) return "warning";
  return "danger";
}

/** Small dependency-free SVG line chart for mood/stress. */
function TrendChart({ trend }) {
  const w = 640;
  const h = 200;
  const pad = 30;

  if (trend.length === 1) {
    return (
      <p className="admin-empty-text">
        One check-in so far — keep going to see your trend line.
      </p>
    );
  }

  const x = (i) => pad + (i * (w - pad * 2)) / (trend.length - 1);
  const y = (v) => h - pad - ((v - 1) / 4) * (h - pad * 2);

  const line = (key) =>
    trend.map((t, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(t[key])}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="ek-checkin-chart"
      role="img"
      aria-label="Mood and stress trend chart"
    >
      {/* gridlines 1..5 */}
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} className="ek-chart-grid" />
          <text x={pad - 8} y={y(v) + 4} textAnchor="end" className="ek-chart-label">
            {v}
          </text>
        </g>
      ))}

      {/* x labels */}
      {trend.map((t, i) =>
        i % Math.ceil(trend.length / 7) === 0 || i === trend.length - 1 ? (
          <text key={t.date} x={x(i)} y={h - 8} textAnchor="middle" className="ek-chart-label">
            {t.date}
          </text>
        ) : null
      )}

      <path d={line("mood")} className="ek-chart-line ek-chart-line-mood" />
      <path d={line("stress")} className="ek-chart-line ek-chart-line-stress" />

      {trend.map((t, i) => (
        <g key={t.date + i}>
          <circle cx={x(i)} cy={y(t.mood)} r={3.5} className="ek-chart-dot ek-chart-dot-mood" />
          <circle cx={x(i)} cy={y(t.stress)} r={3.5} className="ek-chart-dot ek-chart-dot-stress" />
        </g>
      ))}
    </svg>
  );
}

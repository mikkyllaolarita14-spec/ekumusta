import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getAdminDashboard, getAdminFilters, getAdminCheckIns } from "../api/checkins";
import usePolling from "../hooks/usePolling";
import { Badge } from "../components/ui";
import Icon from "../components/Icon";

/**
 * Modules 5/13/14 — Live Check-In Dashboard (Admin side).
 * Polls /api/admin/dashboard every 15s (spec fallback strategy), so new
 * check-ins, auto-flags, and notifications appear without a manual
 * refresh. Clicking a flagged item opens its Case Details view.
 */
const POLL_MS = 15000;

const SEVERITY_TONE = { high: "danger", medium: "warning", low: "info" };
const MOOD_TONE = { 5: "success", 4: "success", 3: "info", 2: "warning", 1: "danger" };
const STRESS_TONE = { 1: "success", 2: "warning", 3: "danger" };
const MOOD_LABELS = { 5: "Great", 4: "Good", 3: "Okay", 2: "Low", 1: "Struggling" };
const STRESS_LABELS = { 1: "Low", 2: "Medium", 3: "High" };
const RULE_LABELS = {
  consecutive_high_stress: "High stress streak",
  sharp_mood_drop: "Sharp mood drop",
  tag_low_mood: "Tag + low mood",
};

export default function AdminCheckins() {
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [range, setRange] = useState("14"); // days

  // Filters list is static-ish; fetch once.
  const filtersState = usePolling(getAdminFilters, 60000);

  const fetcher = useMemo(
    () => () => getAdminDashboard({ grade, section }),
    [grade, section]
  );

  const { data, loading, error, lastUpdated, refresh } = usePolling(
    fetcher,
    POLL_MS,
    [grade, section]
  );

  // Recent individual check-ins share the dashboard's polling cadence and
  // grade/section filters, but hit the dedicated admin endpoint.
  const checkInsFetcher = useMemo(
    () => () => getAdminCheckIns({ grade, section }),
    [grade, section]
  );
  const checkInsState = usePolling(checkInsFetcher, POLL_MS, [grade, section]);
  const checkIns = checkInsState.data?.check_ins || [];

  const summary = data?.summary || {};
  const flagged = data?.flagged || [];
  const trend = (data?.trend || []).slice(-parseInt(range, 10));
  const moods = data?.mood_breakdown || {};

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Check-ins — Live Dashboard</h2>
          <p>
            Auto-refreshes every {POLL_MS / 1000}s
            {lastUpdated
              ? ` · last updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : ""}
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => refresh()}
            disabled={loading}
          >
            <Icon name="clock" size={16} />
            Refresh now
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select value={grade} onChange={(e) => { setGrade(e.target.value); }} className="admin-filter-select" aria-label="Filter by year level">
          <option value="">All Year Levels</option>
          {(filtersState.data?.grades || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={section} onChange={(e) => { setSection(e.target.value); }} className="admin-filter-select" aria-label="Filter by block">
          <option value="">All Blocks</option>
          {(filtersState.data?.sections || []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="admin-filter-select" aria-label="Trend range">
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {error && (
        <p className="ek-form-error" role="alert">
          Live updates paused — is the backend running? Retrying automatically…
        </p>
      )}

      {/* Summary cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <Icon name="checkins" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">
              {summary.today_checkins ?? "—"} / {summary.student_count ?? "—"}
            </span>
            <span className="admin-stat-label">
              Today's Check-ins {summary.checkin_rate != null ? `(${summary.checkin_rate}%)` : ""}
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <Icon name="smile" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.avg_mood ?? "—"}</span>
            <span className="admin-stat-label">Avg Mood (of 5)</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber">
            <Icon name="cases" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.open_cases ?? "—"}</span>
            <span className="admin-stat-label">Open Cases</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-red">
            <Icon name="alert" size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.new_flags ?? "—"}</span>
            <span className="admin-stat-label">New Flags</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        {/* Mood trend */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header">
            <h3>Mood &amp; Stress Trend (school-wide average)</h3>
            <Link to="/admin/reports" className="admin-card-link">Reports</Link>           </div>
          <div className="admin-card-body admin-card-body-chart">
            {trend.length > 1 ? (
              <AdminTrendChart trend={trend} />
            ) : (
              <p className="admin-empty-text">
                {loading ? "Loading trend…" : "Not enough data yet — trends appear as students check in."}
              </p>
            )}
          </div>
        </div>

        {/* Recent individual student check-ins */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header">
            <h3>Recent Student Check-Ins</h3>
            <span className="admin-card-link ek-live-dot-wrap">
              <span className="ek-live-dot" aria-hidden="true" /> live
            </span>
          </div>
          <div className="admin-card-body">
            {checkInsState.error && (
              <p className="ek-form-error" role="alert">
                Couldn't load recent check-ins — is the backend running? Retrying automatically…
              </p>
            )}
            {checkInsState.loading && !checkIns.length ? (
              <p className="admin-empty-text">Loading recent check-ins…</p>
            ) : !checkIns.length ? (
              <p className="admin-empty-text">
                No student check-ins yet. Check-ins appear here the moment students submit them.
              </p>
            ) : (
              <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="admin-table ek-checkins-table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Student</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>Mood</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>Stress</th>
                      <th className="ek-col-message" style={{ padding: '10px 12px' }}>Message</th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>Date</th>
                      <th style={{ padding: '10px 12px', width: '80px' }}>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkIns.map((c) => {
                      // Use exact colors from palette
                      const getMoodColor = (val) => {
                        if (val >= 4) return { bg: '#659B7B20', color: '#659B7B', border: '#659B7B' };
                        if (val === 3) return { bg: '#E6A34E20', color: '#E6A34E', border: '#E6A34E' };
                        if (val === 2) return { bg: '#E67E0020', color: '#E67E00', border: '#E67E00' };
                        return { bg: '#C7352B20', color: '#C7352B', border: '#C7352B' };
                      };
                      const getStressColor = (label) => {
                        if (label === 1) return { bg: '#659B7B20', color: '#659B7B', border: '#659B7B' };
                        if (label === 2) return { bg: '#E6A34E20', color: '#E6A34E', border: '#E6A34E' };
                        return { bg: '#C7352B20', color: '#C7352B', border: '#C7352B' };
                      };
                      const mc = getMoodColor(c.mood_value);
                      const sc = getStressColor(c.stress_label);
                      return (
                        <tr key={c.id} style={{ height: '56px' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 500 }}>{c.student?.name || "Unknown"}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ek-text-secondary)', marginTop: '2px' }}>
                              {c.student?.student_id ? `ID: ${c.student.student_id}` : ""}
                              {c.student?.student_id && c.student?.section ? " · " : ""}
                              {c.student?.grade || ""}
                              {c.student?.grade && c.student?.section ? " · " : ""}
                              {c.student?.section || ""}
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', background: mc.bg, color: mc.color, border: `1px solid ${mc.border}40`, fontSize: '12px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: mc.color }}></span>
                              {c.mood_label || MOOD_LABELS[c.mood_value] || "—"}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}40`, fontSize: '12px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.color }}></span>
                              {c.stress_text || STRESS_LABELS[c.stress_label] || "—"}
                            </span>
                          </td>
                          <td className="ek-col-message" style={{ padding: '8px 12px', maxWidth: '200px' }}>
                            {c.note ? (
                              <div style={{ wordBreak: 'break-word', fontSize: '13px' }} title={c.note}>
                                {c.note.length > 60 ? c.note.substring(0, 60) + '...' : c.note}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--ek-text-secondary)' }}>—</span>
                            )}
                            {(c.tags || []).length > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--ek-text-secondary)', marginTop: '2px' }}>
                                {c.tags.join(", ")}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontSize: '12px' }}>
                              {new Date(c.created_at || c.date).toLocaleDateString(undefined, {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </div>
                            {c.created_at && (
                              <div style={{ fontSize: '11px', color: 'var(--ek-text-secondary)' }}>
                                {new Date(c.created_at).toLocaleTimeString([], {
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {c.flag ? (
                              <Badge tone={SEVERITY_TONE[c.flag.severity] || "info"} dot>
                                {c.flag.severity}
                              </Badge>
                            ) : (
                              <span style={{ color: 'var(--ek-text-secondary)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Flagged students — live list */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header">
            <h3>
              Flagged Students
              {summary.new_flags > 0 && (
                <span className="ek-live-badge" title="New flags since you last looked">
                  {summary.new_flags} new
                </span>
              )}
            </h3>
            <span className="admin-card-link ek-live-dot-wrap">
              <span className="ek-live-dot" aria-hidden="true" /> live
            </span>
          </div>
          <div className="admin-card-body">
            {flagged.length === 0 ? (
              <p className="admin-empty-text">
                No active flags. New flags appear here automatically the moment a check-in trips a rule.
              </p>
            ) : (
              <div className="ek-flag-list">
                {flagged.map((f) => (
                  <Link key={f.id} to={`/admin/cases/${f.case_id}`} className="ek-flag-item">
                    <Badge tone={SEVERITY_TONE[f.severity] || "info"} dot>
                      {f.severity}
                    </Badge>
                    <div className="ek-flag-info">
                      <span className="ek-flag-student">{f.student?.name}</span>
                      <span className="ek-flag-detail">{f.detail}</span>
                      <span className="ek-flag-meta">
                        {RULE_LABELS[f.rule] || f.rule} · {f.student?.grade || "—"} · {f.student?.section || "—"} ·{" "}
                        {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Icon name="chevronRight" size={16} className="ek-flag-arrow" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

/* Today's mood distribution bars. */
function MoodMix({ moods, total }) {
  const rows = [
    { key: 5, label: "Great", cls: "admin-wellness-positive" },
    { key: 4, label: "Good", cls: "admin-wellness-positive" },
    { key: 3, label: "Okay", cls: "admin-wellness-neutral" },
    { key: 2, label: "Low", cls: "admin-wellness-attention" },
    { key: 1, label: "Struggling", cls: "admin-wellness-concern" },
  ];

  if (!total) {
    return <p className="admin-empty-text">No check-ins today yet.</p>;
  }

  return (
    <div className="admin-wellness-chart">
      {rows.map((r) => {
        const count = moods[r.key] || 0;
        return (
          <div key={r.key} className="admin-wellness-item">
            <div className="admin-wellness-bar-wrap">
              <div className={`admin-wellness-bar ${r.cls}`} style={{ width: `${(count / total) * 100}%` }} />
            </div>
            <div className="admin-wellness-info">
              <span className="admin-wellness-label">{r.label}</span>
              <span className="admin-wellness-count">{count}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Dependency-free SVG trend chart for school-wide averages. */
function AdminTrendChart({ trend }) {
  const ring = 32;
  const plotPad = 6;

  const labelFont = 9;
  const scoreLabelPad = 4;
  const dateLabelPad = 3;
  const barHeight = 6;
  const dotR = 3;
  const dotStroke = 1.5;

  const titlePad = ring + 4;
  const topPad = titlePad + 8;
  const bottomPad = dateLabelPad + 6 + barHeight;
  const leftPad = (labelFont + 4) * 2 + 2 * scoreLabelPad + dotR;
  const rightPad = leftPad;
  const xMax = 1200;
  const yMax = topPad + 120;

  const w = Math.max(400, xMax + leftPad + rightPad);
  const h = Math.max(220, yMax + bottomPad);

  const plotW = w - leftPad - rightPad;
  const plotH = h - topPad - bottomPad;

  const n = Math.max(2, trend.length);

  const x = (i) => i === 0 ? 0 : i === trend.length - 1 ? plotW : (i * plotW) / (n - 1);
  const y = (v) => topPad + plotH - ((Number(v) - 1) / 4) * plotH;

  const line = (key) =>
    trend.map((t, i) => `${i === 0 ? "M" : "L"}${leftPad + x(i)},${y(Number(t[key]))}`).join(" ");  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: 'auto' }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="School-wide mood and stress trend"
    >
      <text
        x={leftPad + titlePad}
        y={topPad - topPad / 2}
        fontSize={labelFont}
        fontWeight="600"
        fill="var(--ek-text-secondary)"
      >
        School-wide trend ({trend.length} day{trend.length === 1 ? "" : "s"})      </text>

      <line
        x1={leftPad}
        y1={topPad}
        x2={w - rightPad}
        y2={topPad}
        stroke="var(--ek-border)"
        strokeWidth="1"
      />
      <line
        x1={leftPad}
        y1={topPad}
        x2={leftPad}
        y2={h - bottomPad}
        stroke="var(--ek-border)"
        strokeWidth="1"
      />
      <rect
        x={leftPad}
        y={topPad}
        width={plotW}
        height={plotH}
        fill="transparent"
      />

      <g fill="none" stroke="var(--ek-border)" strokeWidth="1" strokeDasharray="2 2">
        <line x1={leftPad} y1={topPad} x2={w - rightPad} y2={topPad + plotH} />
        <line x1={w - rightPad} y1={topPad} x2={leftPad} y2={topPad + plotH} />
      </g>

      {[1, 2, 3, 4, 5].map((v) => {
        const yy = y(v);
        const label = String(v);
        const labelW = (labelFont + 2 * scoreLabelPad) * label.length;
        return (
          <g key={v}>
            <line
              x1={leftPad}
              y1={yy}
              x2={w - rightPad}
              y2={yy}
              stroke="var(--ek-border)"
              strokeWidth="1"
              opacity="0.45"
            />
            <text
              x={leftPad - scoreLabelPad}
              y={yy + labelFont / 3}
              textAnchor="end"
              fontSize={labelFont}
              fill="var(--ek-text-secondary)"
              fontWeight="600"
            >
              {label}
            </text>
            <text
              x={w - rightPad + scoreLabelPad}
              y={yy + labelFont / 3}
              textAnchor="start"
              fontSize={labelFont}
              fill="var(--ek-text-secondary)"
              opacity="0.85"
            >
              {v >= 4 ? "High" : v === 3 ? "Mid" : "Low"}
            </text>
          </g>
        );
      })}

      {trend.map((t, i) => {
        const step = trend.length <= 7 ? 1 : Math.max(1, Math.ceil(trend.length / 7));
        const show = i % step === 0 || i === trend.length - 1;
        return (
          <text
            key={t.date}
            x={leftPad + x(i)}
            y={h - bottomPad + dateLabelPad + barHeight - 1}
            textAnchor="middle"
            fontSize={labelFont}
            fill="var(--ek-text-secondary)"
          >
            {show ? t.date : ""}
          </text>
        );
      })}

      <path d={line("avg_stress")} stroke="#dc2626" strokeWidth="2" fill="none" strokeDasharray="6 3" />
      <path d={line("avg_mood")} stroke="#22c55e" strokeWidth="2" fill="none" />

      {trend.map((t, i) => (
        <g key={t.date + i}>
          <circle
            cx={leftPad + x(i)}
            cy={y(Number(t.avg_mood))}
            r={dotR}
            fill="#22c55e"
            stroke="white"
            strokeWidth={dotStroke}
          >
            <title>{`${t.date}: Average Mood ${Number(t.avg_mood).toFixed(2)}`}</title>
          </circle>
          <circle
            cx={leftPad + x(i)}
            cy={y(Number(t.avg_stress))}
            r={dotR}
            fill="#dc2626"
            stroke="white"
            strokeWidth={dotStroke}
          >
            <title>{`${t.date}: Average Stress ${Number(t.avg_stress).toFixed(2)}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

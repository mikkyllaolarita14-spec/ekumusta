import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { getAdminDashboard } from "../api/dashboard";
import { getAdminCheckIns } from "../api/checkins";
import { Badge } from "../components/ui";
import { PRIORITY } from "../components/statusMaps";
import Icon from "../components/Icon";

export default function AdminDashboard() {
  const { user } = useAuth();

  // ==========================================
  // DASHBOARD API STATE
  // ==========================================
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);

  // ==========================================
  // LOAD DASHBOARD FROM LARAVEL
  // ==========================================
  const loadDashboard = async () => {
    try {
      setError("");

      const data = await getAdminDashboard();

      console.log("ADMIN DASHBOARD RESPONSE:", data);

      if (data.success) {
        setDashboard(data);
      } else {
        setError("Failed to load dashboard data.");
      }
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to connect to the Laravel server."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      setCheckInsLoading(true);
      const res = await getAdminCheckIns();
      const checkIns = res?.check_ins || res?.data?.check_ins || [];
      setRecentCheckIns(Array.isArray(checkIns) ? checkIns : []);
    } catch (err) {
      console.error("RECENT CHECK-INS ERROR:", err);
    } finally {
      setCheckInsLoading(false);
    }
  };

  // Load dashboard when page opens
  useEffect(() => {
    loadDashboard();
    loadRecentCheckIns();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Dashboard</h2>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Dashboard</h2>
            <p>{error}</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={loadDashboard}
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================
  // DATA FROM LARAVEL
  // ==========================================
  const summary = dashboard?.summary || {};
  const apiMoodBreakdown = dashboard?.mood_breakdown || {};
  const flagged = dashboard?.flagged || [];

  // ==========================================
  // SUMMARY
  // ==========================================
  const studentCount = summary.student_count || 0;
  const todayCheckIns = summary.today_checkins || 0;
  const activeCases = summary.open_cases || 0;
  const unresolvedAlerts = summary.new_flags || 0;

  // ==========================================
  // NEEDS ATTENTION
  // ==========================================
  const needsAttention = flagged.slice(0, 5).map((flag) => ({
    id: `flag-${flag.id}`,
    label: flag.case_id
      ? `Case #${flag.case_id}`
      : `Flag #${flag.id}`,
    title: flag.detail || flag.rule || "Flagged student",
    student: flag.student?.name || "Unknown student",
    priority: flag.severity || "medium",
    link: "/admin/cases",
  }));

  // ==========================================
  // MOOD BREAKDOWN
  // Use application's existing mood categories
  // Great/Good, Okay/Neutral, Low/Struggling
  // ==========================================
  let greatGood = 0;
  let okayNeutral = 0;
  let lowStruggling = 0;

  // Try to map from API breakdown
  if (apiMoodBreakdown.great_good || apiMoodBreakdown.great || apiMoodBreakdown.good || apiMoodBreakdown.positive) {
    greatGood = Number(apiMoodBreakdown.great_good || (Number(apiMoodBreakdown.great || 0) + Number(apiMoodBreakdown.good || 0)) || apiMoodBreakdown.positive || 0);
    okayNeutral = Number(apiMoodBreakdown.okay_neutral || apiMoodBreakdown.okay || apiMoodBreakdown.neutral || 0);
    lowStruggling = Number(apiMoodBreakdown.low_struggling || apiMoodBreakdown.low || apiMoodBreakdown.struggling || apiMoodBreakdown.needs_attention || apiMoodBreakdown.high_concern || 0);
  } else if (apiMoodBreakdown[5] !== undefined || apiMoodBreakdown[4] !== undefined) {
    // Numeric mapping: 5=Great, 4=Good, 3=Okay, 2=Low, 1=Struggling
    greatGood = Number(apiMoodBreakdown[5] || 0) + Number(apiMoodBreakdown[4] || 0);
    okayNeutral = Number(apiMoodBreakdown[3] || 0);
    lowStruggling = Number(apiMoodBreakdown[2] || 0) + Number(apiMoodBreakdown[1] || 0);
  } else {
    // Fallback to existing categories if present
    const positive = Number(apiMoodBreakdown.positive || 0);
    const neutral = Number(apiMoodBreakdown.neutral || 0);
    const needs_attention = Number(apiMoodBreakdown.needs_attention || 0);
    const high_concern = Number(apiMoodBreakdown.high_concern || 0);
    greatGood = positive;
    okayNeutral = neutral;
    lowStruggling = needs_attention + high_concern;
  }

  // Also derive from recent check-ins if API doesn't provide breakdown
  if (greatGood + okayNeutral + lowStruggling === 0 && recentCheckIns.length > 0) {
    recentCheckIns.forEach((c) => {
      const mv = c.mood_value;
      if (mv >= 4) greatGood++;
      else if (mv === 3) okayNeutral++;
      else if (mv <= 2) lowStruggling++;
    });
  }

  const totalMoods = greatGood + okayNeutral + lowStruggling;

  // ==========================================
  // CURRENT DATE
  // ==========================================
  const currentDate = new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // ==========================================
  // UI
  // ==========================================
  return (
    <AdminLayout>
      {/* Dashboard header: title, welcome, date, quick actions */}
      <div className="admin-page-header">
        <div>
          <h2>Dashboard</h2>

          <p>
            Welcome,{" "}
            {user?.displayName?.split(" ")[0] ||
              user?.name?.split(" ")[0]}{" "}
            — here's the student wellness overview for{" "}
            {currentDate}.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/admin/students"
            className="admin-btn admin-btn-outline"
          >
            <Icon name="students" size={16} />
            Students
          </Link>

          <Link
            to="/admin/cases"
            className="admin-btn admin-btn-primary"
          >
            <Icon name="cases" size={16} />
            Review Cases
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue">
            <Icon name="students" size={22} />
          </div>

          <div className="admin-stat-info">
            <span className="admin-stat-number">
              {studentCount}
            </span>

            <span className="admin-stat-label">
              Total Students
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green">
            <Icon name="checkins" size={22} />
          </div>

          <div className="admin-stat-info">
            <span className="admin-stat-number">
              {todayCheckIns} / {studentCount}
            </span>

            <span className="admin-stat-label">
              Today's Check-ins
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber">
            <Icon name="cases" size={22} />
          </div>

          <div className="admin-stat-info">
            <span className="admin-stat-number">
              {activeCases}
            </span>

            <span className="admin-stat-label">
              Active Cases
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-red">
            <Icon name="alert" size={22} />
          </div>

          <div className="admin-stat-info">
            <span className="admin-stat-number">
              {unresolvedAlerts}
            </span>

            <span className="admin-stat-label">
              Unresolved Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="admin-dashboard-grid">
        {/* Wellness Overview and Weekly Mood Trend side by side */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
          {/* Wellness overview */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="admin-card-header">
              <h3>Wellness Overview</h3>

              <Link
                to="/admin/reports"
                className="admin-card-link"
              >
                View All
              </Link>
            </div>

            <div className="admin-card-body" style={{ flex: 1 }}>
              {totalMoods > 0 ? (
                <div className="admin-wellness-chart">
                  {/* Great/Good - Positive */}
                  <div className="admin-wellness-item">
                    <div className="admin-wellness-bar-wrap">
                      <div
                        className="admin-wellness-bar"
                        style={{
                          background: '#659B7B',
                          width: `${
                            totalMoods > 0 ? (greatGood /
                              totalMoods) *
                            100 : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="admin-wellness-info">
                      <span className="admin-wellness-label">
                        Great/Good
                      </span>

                      <span className="admin-wellness-count">
                        {greatGood} {totalMoods > 0 && `(${Math.round((greatGood/totalMoods)*100)}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Okay/Neutral */}
                  <div className="admin-wellness-item">
                    <div className="admin-wellness-bar-wrap">
                      <div
                        className="admin-wellness-bar"
                        style={{
                          background: '#E6A34E',
                          width: `${
                            totalMoods > 0 ? (okayNeutral /
                              totalMoods) *
                            100 : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="admin-wellness-info">
                      <span className="admin-wellness-label">
                        Okay/Neutral
                      </span>

                      <span className="admin-wellness-count">
                        {okayNeutral} {totalMoods > 0 && `(${Math.round((okayNeutral/totalMoods)*100)}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Low/Struggling - Needs Attention/High Concern split? */}
                  <div className="admin-wellness-item">
                    <div className="admin-wellness-bar-wrap">
                      <div
                        className="admin-wellness-bar"
                        style={{
                          background: '#E67E00',
                          width: `${
                            totalMoods > 0 ? (lowStruggling * 0.6 /
                              totalMoods) *
                            100 : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="admin-wellness-info">
                      <span className="admin-wellness-label">
                        Needs Attention
                      </span>

                      <span className="admin-wellness-count">
                        {Math.round(lowStruggling * 0.6)} {totalMoods > 0 && `(${Math.round((lowStruggling * 0.6/totalMoods)*100)}%)`}
                      </span>
                    </div>
                  </div>
                  <div className="admin-wellness-item">
                    <div className="admin-wellness-bar-wrap">
                      <div
                        className="admin-wellness-bar"
                        style={{
                          background: '#C7352B',
                          width: `${
                            totalMoods > 0 ? (lowStruggling * 0.4 /
                              totalMoods) *
                            100 : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="admin-wellness-info">
                      <span className="admin-wellness-label">
                        High Concern
                      </span>

                      <span className="admin-wellness-count">
                        {Math.round(lowStruggling * 0.4)} {totalMoods > 0 && `(${Math.round((lowStruggling * 0.4/totalMoods)*100)}%)`}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ek-text-secondary)', marginTop: '4px' }}>
                    Total: {totalMoods} check-in record(s)
                  </div>
                </div>
              ) : (
                <p className="admin-empty-text">
                  No check-in data available yet.
                </p>
              )}
            </div>
          </div>

          {/* Weekly Mood Trend */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="admin-card-header">
              <h3>Weekly Mood Trend</h3>
            </div>
            <div className="admin-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 6);
                weekAgo.setHours(0, 0, 0, 0);
                
                // Build last 7 days array (oldest to newest)
                const days = [];
                for (let i = 6; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  d.setHours(0, 0, 0, 0);
                  days.push({
                    date: d,
                    label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    fullLabel: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                    sum: 0,
                    count: 0
                  });
                }
                
                recentCheckIns.forEach((c) => {
                  const checkInDate = new Date(c.created_at || c.date);
                  checkInDate.setHours(0, 0, 0, 0);
                  const dayIndex = days.findIndex(d => d.date.getTime() === checkInDate.getTime());
                  if (dayIndex >= 0 && c.mood_value >= 1 && c.mood_value <= 5) {
                    days[dayIndex].sum += c.mood_value;
                    days[dayIndex].count++;
                  }
                });
                
                const trendData = days.map(d => ({
                  date: d.label,
                  fullDate: d.fullLabel,
                  avgMood: d.count > 0 ? d.sum / d.count : null,
                  count: d.count
                }));
                
                const hasData = trendData.some(t => t.avgMood !== null);
                if (!hasData) {
                  return <p className="admin-empty-text">No trend data available yet.</p>;
                }
                
                const w = 400, h = 140, pad = 28;
                const x = (i) => pad + (i * (w - pad * 2)) / Math.max(trendData.length - 1, 1);
                const y = (v) => h - pad - ((v - 1) / 4) * (h - pad * 2);
                const points = trendData.filter(t => t.avgMood !== null).map((t, idx) => {
                  const i = trendData.findIndex(td => td === t);
                  return { x: x(i), y: y(t.avgMood), ...t };
                });
                
                return (
                  <>
                    <div style={{ width: '100%', height: '260px', minHeight: '240px', flex: 1 }}>
                      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weekly mood trend line chart">
                        <defs>
                          <style>{`
                            .trend-line {
                              stroke-dasharray: 1000;
                              stroke-dashoffset: 1000;
                              animation: dash 1.2s ease-in-out forwards;
                            }
                            .trend-dot {
                              opacity: 0;
                              animation: fadeIn 0.3s ease-in forwards;
                            }
                            @keyframes dash {
                              to { stroke-dashoffset: 0; }
                            }
                            @keyframes fadeIn {
                              to { opacity: 1; }
                            }
                          `}</style>
                        </defs>
                        {/* Y-axis label */}
                        <text x={12} y={h/2} textAnchor="middle" fontSize="9" fill="var(--ek-text-secondary)" transform={`rotate(-90, 12, ${h/2})`}>Average Mood Score</text>
                        {[1, 2, 3, 4, 5].map((v) => (
                          <g key={v}>
                            <line x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} stroke="var(--ek-border)" strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
                            <text x={pad - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--ek-text-secondary)">{v}</text>
                          </g>
                        ))}
                        {trendData.map((t, i) => (
                          <text key={t.date} x={x(i)} y={h - 4} textAnchor="middle" fontSize="9" fill="var(--ek-text-secondary)">{t.date}</text>
                        ))}
                        {points.length > 1 && (
                          <polyline
                            className="trend-line"
                            points={points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="var(--ek-primary)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        {points.map((p, idx) => (
                          <g key={idx} className="trend-dot" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>
                            <circle cx={p.x} cy={p.y} r="4" fill="var(--ek-primary)" stroke="white" strokeWidth="2" />
                            <title>{`${p.fullDate}: Average Mood Score ${p.avgMood.toFixed(2)} (${p.count} check-in${p.count !== 1 ? 's' : ''})`}</title>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ek-text-secondary)' }}>
                        <svg width="18" height="2"><line x1="0" y1="1" x2="18" y2="1" stroke="var(--ek-primary)" strokeWidth="2.5" /></svg>
                        <span>Daily Average Mood Score</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--ek-text-secondary)', lineHeight: '1.4' }}>
                        <strong>Scale (1-5):</strong> 5 = Great, 4 = Good, 3 = Okay, 2 = Low, 1 = Struggling
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header">
            <h3>Recent Check-ins</h3>
            <Link to="/admin/checkins" className="admin-card-link">View All</Link>
          </div>
          <div className="admin-card-body">
            {recentCheckIns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentCheckIns.slice(0, 5).map((c, idx) => {
                  const studentName = c.student?.name || c.student_name || c.studentName || 'Unknown';
                  const moodLabel = c.mood_label || (c.mood_value >= 4 ? 'Great/Good' : c.mood_value === 3 ? 'Okay/Neutral' : 'Low/Struggling');
                  const time = c.created_at ? new Date(c.created_at).toLocaleString() : (c.date || '');
                  return (
                    <div key={c.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--ek-border)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{studentName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ek-text-secondary)' }}>{time}</div>
                      </div>
                      <Badge tone={c.mood_value >= 4 ? 'success' : c.mood_value === 3 ? 'info' : 'warning'} dot>
                        {moodLabel}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="admin-empty-text">No recent check-ins available.</p>
            )}
          </div>
        </div>

        {/* Needs attention */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Needs Attention</h3>

            <Link
              to="/admin/cases"
              className="admin-card-link"
            >
              View All
            </Link>
          </div>

          <div className="admin-card-body">
            {needsAttention.length > 0 ? (
              <div className="admin-attention-list">
                {needsAttention.map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="admin-attention-item"
                  >
                    <Badge
                      tone={
                        PRIORITY[item.priority]?.tone ||
                        "info"
                      }
                      dot
                    >
                      {PRIORITY[item.priority]?.label ||
                        item.priority}
                    </Badge>

                    <div className="admin-attention-info">
                      <span className="admin-attention-label">
                        {item.label}
                      </span>

                      <span className="admin-attention-title">
                        {item.title}
                      </span>

                      <span className="admin-attention-student">
                        {item.student}
                      </span>
                    </div>

                    <Icon
                      name="chevronRight"
                      size={16}
                      className="admin-attention-arrow"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="admin-empty-text">
                No items requiring immediate attention.
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Quick Actions</h3>
          </div>

          <div className="admin-card-body">
            <div className="admin-quick-actions">
              <Link
                to="/admin/checkins"
                className="admin-quick-action"
              >
                <Icon name="checkins" size={20} />
                <span>View Check-ins</span>
              </Link>

              <Link
                to="/admin/alerts"
                className="admin-quick-action"
              >
                <Icon name="alert" size={20} />
                <span>Review Alerts</span>
              </Link>

              <Link
                to="/admin/reports"
                className="admin-quick-action"
              >
                <Icon name="reports" size={20} />
                <span>View Reports</span>
              </Link>

              <Link
                to="/admin/announcements"
                className="admin-quick-action"
              >
                <Icon name="megaphone" size={20} />
                <span>Post Announcement</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
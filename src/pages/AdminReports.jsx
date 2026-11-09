import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";
import { getAdminReports } from "../api/reports";

const DEFAULT_SUMMARY = {
  totalStudents: 0,
  activatedStudents: 0,
  todayCheckIns: 0,
  checkInRate: 0,
  activeCases: 0,
};
const DEFAULT_MOOD = {
  positive: 0,
  neutral: 0,
  needs_attention: 0,
  high_concern: 0,
};
const DEFAULT_CASE_STATS = {
  open: 0,
  in_progress: 0,
  follow_up: 0,
  resolved: 0,
  closed: 0,
};
const DEFAULT_CASE_PRIORITY = { urgent: 0, high: 0, medium: 0, low: 0 };
const DEFAULT_ALERT_STATS = { new: 0, in_progress: 0, reviewed: 0, resolved: 0 };
const DEFAULT_ALERT_SEVERITY = { urgent: 0, high: 0, medium: 0, low: 0 };

const formatLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function BarItem({ label, count, total, className = "" }) {
  const percentage = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  return (
    <div className="admin-report-bar-item">
      <div className="admin-report-bar-label">
        <span>{label}</span>
        <span>
          {count} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="admin-report-bar-track">
        <div
          className={`admin-report-bar ${className}`.trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-number">{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function ReportCard({ title, children, wide = false, actions = null }) {
  return (
    <section className={`admin-card${wide ? " admin-card-wide" : ""}`}>
      <div className="admin-card-header">
        <h3>{title}</h3>
        {actions ? <div className="admin-card-header-actions">{actions}</div> : null}
      </div>
      <div className="admin-card-body">{children}</div>
    </section>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const badgeClass =
    normalized === "approved"
      ? "admin-badge admin-badge-success"
      : normalized === "pending"
        ? "admin-badge admin-badge-warning"
        : "admin-badge admin-badge-danger";
  return <span className={badgeClass}>{formatLabel(normalized)}</span>;
}

function ReportThoughtItem({ thought, onAction, actionLoadingId }) {
  const thoughtText = String(thought?.text || "");
  const adminAction = String(thought?.admin_action || "none").toLowerCase();
  const isPending = adminAction === "none";
  const displayStatus = isPending ? "pending" : adminAction;
  const isBusy = actionLoadingId === thought.id;

  return (
    <article className="admin-report-row">
      <div className="admin-report-row-main">
        <div className="admin-report-row-meta">
          <span className="admin-report-row-id">#{thought.id}</span>
          <span className="admin-report-row-student">{thought.name || "Unknown"}</span>
          <StatusBadge status={displayStatus} />
          <span className="admin-report-row-date">{thought.created_at || "—"}</span>
        </div>
        <p className="admin-report-row-text">
          {thoughtText
            ? `${thoughtText.slice(0, 140)}${thoughtText.length > 140 ? "..." : ""}`
            : "No content provided."}
        </p>
        {thought.admin_notes ? (
          <p className="admin-report-row-note">
            <strong>Report reason:</strong> {thought.admin_notes}
          </p>
        ) : null}
      </div>
      {isPending ? (
        <div className="admin-report-row-actions">
          <button
            type="button"
            className="admin-btn admin-btn-success admin-btn-sm"
            disabled={isBusy}
            onClick={() => onAction(thought.id, "approved")}
          >
            {isBusy ? "..." : "Approve"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-warning admin-btn-sm"
            disabled={isBusy}
            onClick={() => onAction(thought.id, "rejected")}
          >
            {isBusy ? "..." : "Reject"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ReportStatusSection({ title, items, onAction, actionLoadingId, emptyText }) {
  return (
    <section className="admin-report-section">
      <h4 className="admin-report-section-title">
        {title} <span className="admin-report-section-count">{items.length}</span>
      </h4>
      {items.length ? (
        <div className="admin-report-list">
          {items.map((thought) => (
            <ReportThoughtItem
              key={thought.id}
              thought={thought}
              onAction={onAction}
              actionLoadingId={actionLoadingId}
            />
          ))}
        </div>
      ) : (
        <p className="admin-empty-text admin-report-empty">{emptyText}</p>
      )}
    </section>
  );
}

export default function AdminReports() {
  const [mainTab, setMainTab] = useState("analytics");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("overview");
  const [activeReportTab, setActiveReportTab] = useState("pending");
  const [data, setData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminReports();
      if (result?.success) {
        setData(result);
      } else {
        setError(result?.message || "Failed to load reports.");
      }
    } catch (err) {
      console.error("ADMIN REPORTS ERROR:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load reports from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsError("");
      const response = await api.get("/admin/reported-thoughts");
      const result = response?.data;
      if (result?.success) {
        setAnalyticsData(Array.isArray(result.thoughts) ? result.thoughts : []);
      } else {
        setAnalyticsError(result?.message || "Failed to load reported thoughts.");
      }
    } catch (err) {
      console.error("ADMIN ANALYTICS ERROR:", err);
      setAnalyticsError(
        err?.response?.data?.message ||
          "Unable to load reported thoughts from the server."
      );
    }
  }, []);

  useEffect(() => {
    loadReports();
    loadAnalytics();
  }, [loadReports, loadAnalytics]);

  const handleAdminAction = async (thoughtId, action) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this thought as ${action}?`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(thoughtId);
      setAnalyticsError("");
      const response = await api.patch(
        `/admin/reported-thoughts/${thoughtId}/admin-action`,
        { action }
      );
      const result = response?.data;

      if (result?.success) {
        await loadAnalytics();
      } else {
        setAnalyticsError(
          result?.message || `Failed to mark thought as ${action}.`
        );
      }
    } catch (err) {
      console.error("ADMIN ACTION ERROR:", err);
      setAnalyticsError(
        err?.response?.data?.message ||
          `Unable to mark thought as ${action} from the server.`
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const summary = { ...DEFAULT_SUMMARY, ...(data?.summary || {}) };
  const moodBreakdown = { ...DEFAULT_MOOD, ...(data?.moodBreakdown || {}) };
  const caseStats = { ...DEFAULT_CASE_STATS, ...(data?.caseStats || {}) };
  const casePriority = { ...DEFAULT_CASE_PRIORITY, ...(data?.casePriority || {}) };
  const alertStats = { ...DEFAULT_ALERT_STATS, ...(data?.alertStats || {}) };
  const alertSeverity = { ...DEFAULT_ALERT_SEVERITY, ...(data?.alertSeverity || {}) };
  const courseDistribution = data?.courseDistribution || {};

  const totalMood = Object.values(moodBreakdown).reduce(
    (total, value) => total + asNumber(value),
    0
  );
  const totalCases = Object.values(caseStats).reduce(
    (total, value) => total + asNumber(value),
    0
  );
  const totalAlerts = Object.values(alertStats).reduce(
    (total, value) => total + asNumber(value),
    0
  );
  const totalCasePriority = Object.values(casePriority).reduce(
    (total, value) => total + asNumber(value),
    0
  );
  const totalAlertSeverity = Object.values(alertSeverity).reduce(
    (total, value) => total + asNumber(value),
    0
  );

  const sortedCourses = useMemo(
    () =>
      Object.entries(courseDistribution).sort(
        (a, b) => asNumber(b[1]) - asNumber(a[1])
      ),
    [courseDistribution]
  );

  const groupedReports = useMemo(() => {
    const pending = [];
    const approved = [];
    const rejected = [];
    for (const thought of analyticsData) {
      const action = String(thought?.admin_action || "none").toLowerCase();
      if (action === "none") pending.push(thought);
      else if (action === "approved") approved.push(thought);
      else rejected.push(thought); // rejected, deleted, or other resolved states
    }
    return { pending, approved, rejected };
  }, [analyticsData]);

  const reportTabs = [
    { key: "pending", label: "Pending", items: groupedReports.pending },
    { key: "approved", label: "Approved", items: groupedReports.approved },
    { key: "rejected", label: "Rejected", items: groupedReports.rejected },
  ];
  const activeReport =
    reportTabs.find((tab) => tab.key === activeReportTab) || reportTabs[0];

  const analyticsTabs = [
    { key: "overview", label: "Overview" },
    { key: "checkins", label: "Check-ins" },
    { key: "cases", label: "Cases" },
    { key: "alerts", label: "Alerts" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Reports &amp; Analytics</h2>
            <p>Loading report data...</p>
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
            <h2>Reports &amp; Analytics</h2>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={loadReports}
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Reports &amp; Analytics</h2>
          <p>View aggregate data and analytics for student wellness.</p>
        </div>
      </div>

      <div
        className="admin-tabs admin-tabs-main"
        role="tablist"
        aria-label="Main report navigation"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "analytics"}
          className={`admin-tab admin-tab-main ${mainTab === "analytics" ? "admin-tab-active" : ""}`}
          onClick={() => setMainTab("analytics")}
        >
          Analytics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "reports"}
          className={`admin-tab admin-tab-main ${mainTab === "reports" ? "admin-tab-active" : ""}`}
          onClick={() => setMainTab("reports")}
        >
          Reports
        </button>
      </div>

      {mainTab === "analytics" && (
        <div className="admin-analytics-layout">
          <nav
            className="admin-analytics-nav"
            role="tablist"
            aria-label="Analytics sections"
            aria-orientation="vertical"
          >
            {analyticsTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeAnalyticsTab === tab.key}
                className={`admin-analytics-nav-item ${
                  activeAnalyticsTab === tab.key ? "admin-analytics-nav-item-active" : ""
                }`}
                onClick={() => setActiveAnalyticsTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="admin-analytics-content">
            {activeAnalyticsTab === "overview" && (
            <div className="admin-reports-grid">
              <div className="admin-stats-row">
                <StatCard label="Total Students" value={asNumber(summary.totalStudents)} />
                <StatCard label="Activated" value={asNumber(summary.activatedStudents)} />
                <StatCard label="Check-in Rate" value={`${asNumber(summary.checkInRate)}%`} />
                <StatCard label="Active Cases" value={asNumber(summary.activeCases)} />
              </div>

              <ReportCard title="Course Distribution">
                {sortedCourses.length ? (
                  sortedCourses.map(([course, rawCount]) => {
                    const count = asNumber(rawCount);
                    const percentage =
                      asNumber(summary.totalStudents) > 0
                        ? (count / asNumber(summary.totalStudents)) * 100
                        : 0;
                    return (
                      <div className="admin-report-bar-item" key={course}>
                        <div className="admin-report-bar-label">
                          <span>{course}</span>
                          <span>{count}</span>
                        </div>
                        <div className="admin-report-bar-track">
                          <div
                            className="admin-report-bar"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="admin-empty-text">No course distribution data available.</p>
                )}
              </ReportCard>

              <ReportCard title="Cases by Priority">
                {Object.entries(casePriority).map(([priority, rawCount]) => (
                  <BarItem
                    key={priority}
                    label={formatLabel(priority)}
                    count={asNumber(rawCount)}
                    total={totalCasePriority}
                  />
                ))}
              </ReportCard>
            </div>
          )}

          {activeAnalyticsTab === "checkins" && (
            <div className="admin-reports-grid">
              <ReportCard title="Mood Distribution" wide>
                {Object.entries(moodBreakdown).map(([mood, rawCount]) => (
                  <BarItem
                    key={mood}
                    label={formatLabel(mood)}
                    count={asNumber(rawCount)}
                    total={totalMood}
                  />
                ))}
              </ReportCard>
            </div>
          )}

          {activeAnalyticsTab === "cases" && (
            <div className="admin-reports-grid">
              <ReportCard title="Cases by Status">
                {Object.entries(caseStats).map(([status, rawCount]) => (
                  <BarItem
                    key={status}
                    label={formatLabel(status)}
                    count={asNumber(rawCount)}
                    total={totalCases}
                  />
                ))}
              </ReportCard>
              <ReportCard title="Cases by Priority">
                {Object.entries(casePriority).map(([priority, rawCount]) => (
                  <BarItem
                    key={priority}
                    label={formatLabel(priority)}
                    count={asNumber(rawCount)}
                    total={totalCasePriority}
                  />
                ))}
              </ReportCard>
            </div>
          )}

          {activeAnalyticsTab === "alerts" && (
            <div className="admin-reports-grid">
              <ReportCard title="Alerts by Status">
                {Object.entries(alertStats).map(([status, rawCount]) => (
                  <BarItem
                    key={status}
                    label={formatLabel(status)}
                    count={asNumber(rawCount)}
                    total={totalAlerts}
                  />
                ))}
              </ReportCard>
              <ReportCard title="Alerts by Severity">
                {Object.entries(alertSeverity).map(([severity, rawCount]) => (
                  <BarItem
                    key={severity}
                    label={formatLabel(severity)}
                    count={asNumber(rawCount)}
                    total={totalAlertSeverity}
                  />
                ))}
              </ReportCard>
            </div>
          )}
          </div>
        </div>
      )}

      {mainTab === "reports" && (
        <ReportCard
          title="User Reports"
          actions={
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={loadAnalytics}
            >
              Refresh
            </button>
          }
        >
          {analyticsError ? (
            <div className="admin-error-message" role="alert">
              {analyticsError}
            </div>
          ) : null}

          <div className="admin-reports-layout">
            <nav
              className="admin-analytics-nav admin-reports-nav"
              role="tablist"
              aria-label="Report status"
              aria-orientation="vertical"
            >
              {reportTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeReportTab === tab.key}
                  className={`admin-analytics-nav-item ${
                    activeReportTab === tab.key ? "admin-analytics-nav-item-active" : ""
                  }`}
                  onClick={() => setActiveReportTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className="admin-report-section-count">
                    {tab.items.length}
                  </span>
                </button>
              ))}
            </nav>

            <div className="admin-analytics-content">
              <ReportStatusSection
                title={`${activeReport.label} Reports`}
                items={activeReport.items}
                onAction={handleAdminAction}
                actionLoadingId={actionLoadingId}
                emptyText={`No ${activeReport.label.toLowerCase()} reports.`}
              />
            </div>
          </div>
        </ReportCard>
      )}
    </AdminLayout>
  );
}

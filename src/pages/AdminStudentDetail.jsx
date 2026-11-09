import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import AdminLayout from "../components/AdminLayout";
import { getAdminStudentDetail } from "../api/students";

import { Badge } from "../components/ui";

import {
  MOOD,
  CASE_STATUS,
  ALERT_SEVERITY,
  ALERT_STATUS,
} from "../components/statusMaps";

export default function AdminStudentDetail() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [cases, setCases] = useState([]);
  const [studentAlerts, setStudentAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminStudentDetail(id);

        console.log("ADMIN STUDENT DETAIL RESPONSE:", data);

        if (!data.success) {
          setError(data.message || "Student not found.");
          return;
        }

        setStudent(data.student || null);
        setCheckIns(data.checkIns || []);
        setCases(data.cases || []);
        setStudentAlerts(data.alerts || []);
      } catch (err) {
        console.error("ADMIN STUDENT DETAIL ERROR:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load student information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Student Profile</h2>
            <p>Loading student information...</p>
          </div>

          <Link
            to="/admin/students"
            className="admin-btn admin-btn-outline"
          >
            ← Back to Students
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (error || !student) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Student Not Found</h2>
            <p>
              {error ||
                "The requested student could not be found."}
            </p>
          </div>

          <Link
            to="/admin/students"
            className="admin-btn admin-btn-outline"
          >
            ← Back to Students
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Student Profile</h2>
          <p>
            View student information, check-ins, and case history.
          </p>
        </div>

        <Link
          to="/admin/students"
          className="admin-btn admin-btn-outline"
        >
          ← Back to Students
        </Link>
      </div>

      <div className="admin-detail-grid">
        {/* Basic Information */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Basic Information</h3>
          </div>

          <div className="admin-card-body">
            <div className="admin-profile-header">
              <div className="admin-avatar admin-avatar-lg">
                {student.name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              <div>
                <h3 className="admin-profile-name">
                  {student.name}
                </h3>

                <span
                  className={`admin-badge ${
                    student.isOnline
                      ? "admin-badge-success"
                      : "admin-badge-warning"
                  }`}
                >
                  {student.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="admin-info-grid">
              <div className="admin-info-item">
                <span className="admin-info-label">
                  Student ID
                </span>

                <span className="admin-info-value admin-mono">
                  {student.studentId || "—"}
                </span>
              </div>

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Email
                </span>

                <span className="admin-info-value">
                  {student.email || "—"}
                </span>
              </div>

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Course
                </span>

                <span className="admin-info-value">
                  {student.course || "—"}
                </span>
              </div>

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Year Level
                </span>

                <span className="admin-info-value">
                  {student.grade || "—"}
                </span>
              </div>

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Block
                </span>

                <span className="admin-info-value">
                  {student.section || "—"}
                </span>
              </div>

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Last Login
                </span>

                <span className="admin-info-value">
                  {student.lastLogin
                    ? new Date(
                        student.lastLogin
                      ).toLocaleString()
                    : "Not available"}
                </span>
              </div>

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Account Created
                </span>

                <span className="admin-info-value">
                  {student.createdAt
                    ? new Date(
                        student.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Cases */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Active Cases</h3>

            <Link
              to="/admin/cases"
              className="admin-card-link"
            >
              View All
            </Link>
          </div>

          <div className="admin-card-body">
            {cases.filter(
              (c) =>
                c.status !== "resolved" &&
                c.status !== "closed"
            ).length > 0 ? (
              <div className="admin-case-list">
                {cases
                  .filter(
                    (c) =>
                      c.status !== "resolved" &&
                      c.status !== "closed"
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      className="admin-case-item"
                    >
                      <div className="admin-case-header">
                        <span className="admin-case-number">
                          {c.caseNumber}
                        </span>

                        <Badge
                          tone={
                            CASE_STATUS[c.status]?.tone ||
                            "info"
                          }
                          dot
                        >
                          {CASE_STATUS[c.status]?.label ||
                            c.status}
                        </Badge>
                      </div>

                      <p className="admin-case-title">
                        {c.title}
                      </p>

                      <p className="admin-case-meta">
                        Assigned to:{" "}
                        {c.assignedTo || "Unassigned"}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="admin-empty-text">
                No active cases.
              </p>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Alerts</h3>
          </div>

          <div className="admin-card-body">
            {studentAlerts.length > 0 ? (
              <div className="admin-alert-list">
                {studentAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="admin-alert-item"
                  >
                    <Badge
                      tone={
                        ALERT_SEVERITY[a.severity]?.tone ||
                        "info"
                      }
                      dot
                    >
                      {ALERT_SEVERITY[a.severity]?.label ||
                        a.severity}
                    </Badge>

                    <div className="admin-alert-info">
                      <span className="admin-alert-title">
                        {a.title}
                      </span>

                      <span className="admin-alert-meta">
                        {a.alertId} ·{" "}
                        {a.createdAt
                          ? new Date(
                              a.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    <Badge
                      tone={
                        ALERT_STATUS[a.status]?.tone ||
                        "info"
                      }
                      dot
                    >
                      {ALERT_STATUS[a.status]?.label ||
                        a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-empty-text">
                No alerts for this student.
              </p>
            )}
          </div>
        </div>

        {/* Check-in History */}
        <div className="admin-card admin-card-wide">
          <div className="admin-card-header">
            <h3>Check-in History</h3>

            <Link
              to="/admin/checkins"
              className="admin-card-link"
            >
              View All
            </Link>
          </div>

          <div className="admin-card-body">
            {checkIns.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Mood</th>
                      <th>Stress Level</th>
                      <th>Sleep Quality</th>
                      <th>Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {checkIns.map((checkIn) => {
                      const mood = MOOD[
                        checkIn.mood
                      ] || {
                        tone: "info",
                        label: checkIn.mood,
                      };

                      return (
                        <tr key={checkIn.id}>
                          <td>
                            {checkIn.completedAt
                              ? new Date(
                                  checkIn.completedAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td>
                            {checkIn.completedAt
                              ? new Date(
                                  checkIn.completedAt
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "—"}
                          </td>

                          <td>
                            <Badge
                              tone={mood.tone}
                              dot
                            >
                              {mood.label}
                            </Badge>
                          </td>

                          <td>
                            <span className="admin-stress-indicator">
                              {Array.from(
                                { length: 5 },
                                (_, i) => (
                                  <span
                                    key={i}
                                    className={`admin-stress-dot ${
                                      i <
                                      checkIn.stressLevel
                                        ? "admin-stress-active"
                                        : ""
                                    }`}
                                  />
                                )
                              )}
                            </span>
                          </td>

                          <td>
                            {checkIn.sleepQuality || "—"}
                          </td>

                          <td className="admin-text-truncate">
                            {checkIn.checkInText || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty-text">
                No check-in records found.
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
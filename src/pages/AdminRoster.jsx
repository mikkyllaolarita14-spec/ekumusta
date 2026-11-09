import { useState, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { getAllUsers, importRoster } from "../store/database";

export default function AdminRoster() {
  const [students, setStudents] = useState(
    getAllUsers().filter((u) => u.role === "student")
  );
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const refresh = useCallback(() => {
    setStudents(getAllUsers().filter((u) => u.role === "student"));
  }, []);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleImport = () => {
    if (!importText.trim()) return;

    try {
      const lines = importText.trim().split("\n");
      const records = lines.slice(1).map((line) => {
        const [studentId, firstName, lastName, email, course, yearLevel] = line.split(",").map((s) => s.trim());
        return {
          studentId,
          firstName,
          lastName,
          email: email || "",
          course: course || "",
          yearLevel: parseInt(yearLevel) || 1,
        };
      });

      const result = importRoster(records);
      setImportResult(result);
      refresh();
      setImportText("");
      setTimeout(() => setImportResult(null), 5000);
    } catch {
      setImportResult({ error: "Invalid CSV format. Please check your data." });
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Roster Management</h2>
          <p>Import and manage the official student roster.</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => {
              const csv = "StudentID,FirstName,LastName,Email,Course,YearLevel\n2025-001,Juan,Dela Cruz,juan@school.edu,BS Computer Science,2";
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "roster-template.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Template
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowImport(!showImport)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Roster
          </button>
        </div>
      </div>

      {importResult && (
        <div
          className={`admin-alert ${importResult.error ? "admin-alert-error" : "admin-alert-success"}`}
          role={importResult.error ? "alert" : "status"}
        >
          {importResult.error
            ? importResult.error
            : `Import complete: ${importResult.imported} students imported, ${importResult.skipped} duplicates skipped.`}
        </div>
      )}

      {showImport && (
        <div className="admin-card ek-form-card">
          <div className="admin-card-header">
            <h3>Import Student Roster</h3>
          </div>
          <div className="admin-card-body">
            <p className="ek-form-hint">
              Paste CSV data below. Format: StudentID,FirstName,LastName,Email,Course,YearLevel
            </p>
            <div className="admin-field">
              <textarea
                className="admin-textarea admin-textarea-mono"
                placeholder={"StudentID,FirstName,LastName,Email,Course,YearLevel\n2025-001,Juan,Dela Cruz,juan@school.edu,BS Computer Science,2"}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
              />
            </div>
            <div className="admin-form-actions">
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => { setShowImport(false); setImportText(""); }}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Import Students
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Student Roster ({students.length} students)</h3>
        </div>
        <div className="admin-card-body">
          <div className="admin-filters">
            <div className="admin-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="admin-search-input"
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Year Level</th>
                  <th>Status</th>
                  <th>Activated</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((student) => (
                    <tr key={student.id}>
                      <td className="admin-mono">{student.studentId}</td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar admin-user-avatar-sm">
                            {student.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="admin-user-name">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-text-muted">{student.email}</td>
                      <td>{student.course || "—"}</td>
                      <td>{student.yearLevel || "—"}</td>
                      <td>
                        <span className={`admin-badge ${student.isActive ? "admin-badge-success" : "admin-badge-danger"}`}>
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${student.isActivated ? "admin-badge-success" : "admin-badge-warning"}`}>
                          {student.isActivated ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="admin-empty-cell">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="admin-pagination-info">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="admin-pagination-btns">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`admin-btn admin-btn-sm ${page === currentPage ? "admin-btn-primary" : "admin-btn-outline"}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

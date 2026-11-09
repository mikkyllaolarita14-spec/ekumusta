import { useState, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import { getAuditLogs } from "../store/database";

const ITEMS_PER_PAGE = 20;

export default function AdminAuditLogs() {
  const allLogs = getAuditLogs().sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const actions = [...new Set(allLogs.map((l) => l.action))].sort();

  const filtered = useMemo(() => {
    let result = [...allLogs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q)
      );
    }
    if (actionFilter !== "all") {
      result = result.filter((l) => l.action === actionFilter);
    }
    return result;
  }, [allLogs, search, actionFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Audit Logs</h2>
          <p>Track system activities and administrative actions.</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="admin-search-input"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
          className="admin-filter-select"
        >
          <option value="all">All Actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((log) => (
                <tr key={log.id}>
                  <td className="admin-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="admin-mono">{log.userId}</td>
                  <td>
                    <span className="admin-badge admin-badge-info">{log.action}</span>
                  </td>
                  <td className="admin-text-truncate">{log.details}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="admin-empty-cell">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="admin-pagination-btns">
            <button className="admin-btn admin-btn-sm admin-btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button key={page} className={`admin-btn admin-btn-sm ${page === currentPage ? "admin-btn-primary" : "admin-btn-outline"}`} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button className="admin-btn admin-btn-sm admin-btn-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

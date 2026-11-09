import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../components/AdminLayout";

import {
  getAdminJournals,
} from "../api/journals";

// =============================================================
// MOOD LABEL → BADGE COLOR CLASS
// Red = Struggling, Yellow = Okay, Green = Good/Great,
// Orange = Low (without a confirmed high-risk flag).
// Risk is handled separately via the backend `risk` field.
// =============================================================

const moodBadgeClass = {
  Great: "admin-journal-mood-badge admin-journal-mood-green",
  Good: "admin-journal-mood-badge admin-journal-mood-green",
  Okay: "admin-journal-mood-badge admin-journal-mood-yellow",
  Low: "admin-journal-mood-badge admin-journal-mood-orange",
  Struggling: "admin-journal-mood-badge admin-journal-mood-red",
};

const moodOptions = [
  "Great",
  "Good",
  "Okay",
  "Low",
  "Struggling",
];

// =============================================================
// STRESS LABEL → BADGE COLOR CLASS
// =============================================================

const stressBadgeClass = {
  Low: "admin-stress-badge admin-stress-badge-low",
  Medium: "admin-stress-badge admin-stress-badge-medium",
  High: "admin-stress-badge admin-stress-badge-high",
};

// =============================================================
// DATE/TIME FORMATTING
// =============================================================

const formatDate = (iso) => {
  if (!iso) return "Unknown date";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

const formatTime = (iso) => {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
};

// =============================================================
// SEARCH HELPER
// =============================================================

function searchMatches(journal, searchText) {
  return (
    journal.studentName
      ?.toLowerCase()
      .includes(searchText) ||
    journal.studentId
      ?.toLowerCase()
      .includes(searchText) ||
    journal.title
      ?.toLowerCase()
      .includes(searchText) ||
    journal.content
      ?.toLowerCase()
      .includes(searchText)
  );
}

// =============================================================
// VIEW DETAILS MODAL COMPONENT
// =============================================================

const JournalDetailsModal = ({ journal, onClose }) => {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal admin-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3>Journal Details</h3>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close journal details"
          >
            ×
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-modal-section">
            <h4>Student</h4>
            <p>
              <strong>Name:</strong> {journal.studentName || "Unknown Student"}
            </p>
            <p>
              <strong>Student ID:</strong>{" "}{journal.studentId || "N/A"}
            </p>
            {journal.studentCourse && (
              <p>
                <strong>Course:</strong> {journal.studentCourse}
              </p>
            )}
            {journal.studentYearLevel && (
              <p>
                <strong>Year Level:</strong> {journal.studentYearLevel}
              </p>
            )}
          </div>

          <div className="admin-modal-section">
            <h4>Journal Entry</h4>
            <p className="admin-journal-full-content">{journal.content}</p>
          </div>

          <div className="admin-modal-section">
            <h4>Mood & Stress</h4>
            <div className="admin-modal-mood-stress">
              <span
                className={
                  moodBadgeClass[journal.mood] ||
                  "admin-journal-mood-badge"
                }
              >
                <span className="admin-journal-mood-dot" />
                {journal.mood}
              </span>

              <span
  className={
    stressBadgeClass[journal.stressLabel] ||
    "admin-stress-badge"
  }
>
  Stress: {journal.stressLabel}
</span>
            </div>
          </div>

          <div className="admin-modal-section">
            <h4>Date & Time</h4>
            <p>
              <strong>Date:</strong> {formatDate(journal.createdAt)}
            </p>
            <p>
              <strong>Time:</strong> {formatTime(journal.createdAt)}
            </p>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// ADMIN JOURNALS PAGE
// =============================================================

export default function AdminJournals() {
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [stressFilter, setStressFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortDir, setSortDir] = useState("desc");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);const [currentJournal, setCurrentJournal] = useState(null);

  const openDetails = (journal) => {
    setCurrentJournal(journal);
    setModalOpen(true);
  };

  const closeDetails = () => {
    setModalOpen(false);
    setCurrentJournal(null);
  };

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadJournals = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminJournals({
        search: debouncedSearch.trim(),
        mood: moodFilter,
        stress: stressFilter,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        sort_by: sortBy,
        sort_dir: sortDir,
        per_page: 20,
      });

      if (data.success) {
        setJournals(data.journals || []);
      } else {
        setError(
          data.message || "Unable to load journal entries."
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to connect to the journal server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, [
    debouncedSearch,
    moodFilter,
    stressFilter,
    sortBy,
    sortDir,
    dateStart,
    dateEnd,
  ]);

  // --- SUMMARY COUNTS (respecting applied filters) ---
  const summaryCounts = useMemo(() => {
    let total = journals.length;
    let great = 0;
    let good = 0;
    let struggling = 0;
    let highStress = 0;

    const moodValues = { Great: 5, Good: 4, Okay: 3, Low: 2, Struggling: 1 };
    const stressValues = { Low: 1, Medium: 2, High: 3 };

    for (const journal of journals) {
      const moodVal = journal.moodValue ?? 0;
      const stressVal = journal.stressValue ?? 0;

      if (moodVal === moodValues.Great) great++;
      if (moodVal === moodValues.Good) good++;
      if (moodVal === moodValues.Struggling) struggling++;
      if (stressVal === stressValues.High) highStress++;
    }

    return { total, great, good, struggling, highStress };
  }, [journals]);

  // --- APPLIED FILTERS DISPLAY ---
  const appliedFilters = useMemo(() => {
    const filters = [];
    if (search.trim() !== "") {
      filters.push(`Search: "${search}"`);
    }
    if (moodFilter !== "all") {
      filters.push(`Mood: ${moodFilter}`);
    }
    if (stressFilter !== "all") {
      filters.push(`Stress: ${stressFilter}`);
    }
    if (dateStart) {
      filters.push(`Date from: ${dateStart}`);
    }
    if (dateEnd) {
      filters.push(`Date to: ${dateEnd}`);
    }
    if (sortBy !== "newest") {
      filters.push(`Sort: ${sortBy} ${sortDir}`);
    }
    return filters;
  }, [search, moodFilter, stressFilter, sortBy, sortDir, dateStart, dateEnd]);

  // --- PAGINATION STATE ---
  const totalEntries = useMemo(
    () => (journals.length > 0 ? journals.length : 0),
    [journals]
  );
  const perPage = 20;
  const totalPages = Math.ceil(totalEntries / perPage);
  const currentPage = 1; // API handles pagination, we show first page locally
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const pagedJournals = journals.slice(startIndex, endIndex);

  // --- PAGE INFO ---
  const pageInfo = useMemo(() => {
    if (totalEntries > 0) {
      return `Showing ${
        startIndex > 0 ? startIndex + 1 : 1
      }-${endIndex > totalEntries ? totalEntries : endIndex} of ${totalEntries} entries`;
    }
    return "No entries";
  }, [totalEntries, startIndex, endIndex]);

  // --- RESPONSIVE CLASS HELPERS ---
  const cardClass = "admin-journal-item";
  const headerClass = "admin-journal-header";
  const studentClass = "admin-journal-student";
  const badgesClass = "admin-journal-badges";
  const contentClass = "admin-journal-content";
  const footerClass = "admin-journal-footer";

  // --- PAGE ---
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Student Journals</h2>
            <p>View and manage student journal entries.</p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-journals-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="admin-journal-item admin-journal-skeleton"
                >
                  <div className="admin-journal-header">
                    <div>
                      <div className="admin-skeleton-line admin-skeleton-title" />
                      <div className="admin-skeleton-line admin-skeleton-sub" />
                    </div>
                    <div className="admin-skeleton-line admin-skeleton-badge" />
                    <div className="admin-skeleton-line admin-skeleton-text" />
                    <div className="admin-skeleton-line admin-skeleton-text short" />
                    <div className="admin-skeleton-line admin-skeleton-date" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Student Journals</h2>
            <p>View and manage student journal entries.</p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-journal-empty admin-journal-empty-error">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <p>{error}</p>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={loadJournals}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // --- NO ENTRIES ---
  if (journals.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Student Journals</h2>
            <p>View and manage student journal entries.</p>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-journal-empty">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>

              <p className="admin-journal-empty-title">
                {summaryCounts.total === 0
                  ? "No journal entries yet"
                  : "No journals match your filters"}
              </p>

              <p className="admin-journal-empty-sub">
                {summaryCounts.total === 0
                  ? "Student check-in notes will appear here."
                  : "Try a different search term or filter."}
              </p>

              {appliedFilters.length > 0 && (
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setSearch("");
                    setMoodFilter("all");
                    setStressFilter("all");
                    setDateStart("");
                    setDateEnd("");
                    setSortBy("newest");
                    setSortDir("desc");
                  }}
                  aria-label="Reset all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // --- MAIN JOURNALS LIST ---
  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Student Journals</h2>
          <p>View and manage student journal entries.</p>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="admin-filters admin-journal-filters">
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
            placeholder="Search journals, students, or IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
            aria-label="Search journals"
          />

          {search && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Mood Filter ---
        All Moods, Great, Good, Okay, Low, Struggling ---
        -------*/}
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
          className="admin-filter-select"
          aria-label="Filter by mood"
        >
          <option value="all">All Moods</option>
          {moodOptions.map((mood) => (
            <option key={mood} value={mood}>
              {mood}
            </option>
          ))}
        </select>

        {/* Stress Filter ---
        All Stress Levels, Low, Moderate, High ---
        -------*/}
        <select
          value={stressFilter}
          onChange={(e) => setStressFilter(e.target.value)}
          className="admin-filter-select"
          aria-label="Filter by stress"
        >
          <option value="all">All Stress Levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

     
      <div className="admin-journal-filters" style={{ display: "flex", gap: "var(--ek-space-sm)", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="admin-label-inline" style={{ fontSize: "0.875rem", color: "#666" }}>From</label>
          <input
            type="date"
            value={dateStart || ""}
            max={dateEnd || undefined}
            onChange={(e) => {
              const value = e.target.value;
              if (value && dateEnd && value > dateEnd) {
                return; // Prevent start date from being later than end date
              }
              setDateStart(value);
            }}
            className="admin-filter-input"
            aria-label="Date from"
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="admin-label-inline" style={{ fontSize: "0.875rem", color: "#666" }}>To</label>
          <input
            type="date"
            value={dateEnd || ""}
            min={dateStart || undefined}
            onChange={(e) => {
              const value = e.target.value;
              if (value && dateStart && value < dateStart) {
                return; // Prevent end date from being earlier than start date
              }
              setDateEnd(value);
            }}
            className="admin-filter-input"
            aria-label="Date to"
          />
        </div>
      </div>

{/* Sort Direction - hidden for now */}
<input
  type="hidden"
  value={sortDir}
  readOnly
/>
      </div>

      {/* =====================================================
          RESULT COUNT / PAGE INFO
      ===================================================== */}

      <p className="admin-journal-count">
        {summaryCounts.total} {summaryCounts.total === 1 ? "entry" : "entries"} {appliedFilters.length > 0 ? " matching" : ""}
      </p>

      <p className="admin-journal-page-info">{pageInfo}</p>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-journal-empty admin-journal-empty-error">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <p>{error}</p>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={loadJournals}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          JOURNALS
      ===================================================== */}

      {!error && (
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-journals-list">
              {pagedJournals.map((journal) => (
                <article
                  key={journal.id}
                  className="admin-journal-item"
                >
                  <div className="admin-journal-header">
                    <div className="admin-journal-student">
                      <h3>
                        {journal.studentName || "Unknown Student"}
                      </h3>

                      {journal.studentId && (
                        <span className="admin-journal-student-id">
                          STUDENT {journal.studentId}
                        </span>
                      )}
                    </div>

                    <div className="admin-journal-badges">
                      {journal.mood && (
                        <span
                          className={
                            moodBadgeClass[journal.mood] ||
                            "admin-journal-mood-badge"
                          }
                        >
                          <span className="admin-journal-mood-dot" />
                          {journal.mood}
                        </span>
                      )}

                      {journal.stressLabel && (
                        <span className="admin-stress-badge">
                          Stress:{" "}{journal.stressLabel}
                        </span>
                      )}

                      {journal.risk && (
                        <span
                          className="admin-journal-risk-badge"
                          title={
                            journal.risk.detail ||
                            `Flag: ${journal.risk.rule} (severity: ${journal.risk.severity})`
                          }
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>

                          At Risk
                        </span>
                      )}
                    </div>
                  </div>

                  {journal.content && (
                    <div className="admin-journal-content">
                      {journal.content.length > 200 ? (
                        <>
                          <p>
                            {journal.content.substring(0, 200)}...
                          </p>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline view-details-btn"
                            onClick={() => openDetails(journal)}
                            aria-label="View details for journal entry"
                          >
                            View Details
                          </button>
                        </>
                      ) : (
                        <p className="admin-journal-full-text">
                          {journal.content}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="admin-journal-footer">
                    <span className="admin-journal-date">
                      {formatDate(journal.createdAt)}
                      {formatTime(journal.createdAt)
                        ? ` · ${formatTime(journal.createdAt)}`
                        : ""}
                    </span>

                    {journal.stressLabel && (
                      <span className="admin-journal-stress">
                        Stress:{" "}{journal.stressLabel}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
      {modalOpen && currentJournal && (
        <JournalDetailsModal journal={currentJournal} onClose={closeDetails} />
      )}
    </AdminLayout>
  );
}


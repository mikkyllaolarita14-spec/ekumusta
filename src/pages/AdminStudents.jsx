import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Badge } from "../components/ui";
import AddStudentModal from "../components/AddStudentModal";

import {
  getAdminStudents,
  deleteAdminStudent,
} from "../api/students";

const ITEMS_PER_PAGE = 10;

export default function AdminStudents() {
  // =========================================================
  // STUDENT DATA
  // =========================================================

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FILTERS
  // =========================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [courseFilter, setCourseFilter] =
    useState("all");

  // =========================================================
  // SORT
  // =========================================================

  const [sortField, setSortField] =
    useState("studentId");

  const [sortDir, setSortDir] =
    useState("asc");

  // =========================================================
  // PAGINATION
  // =========================================================

  const [currentPage, setCurrentPage] =
    useState(1);

  // =========================================================
  // DELETE
  // =========================================================

  const [studentToDelete, setStudentToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState("");

  // =========================================================
  // ADD STUDENT
  // =========================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminStudents();

      console.log(
        "ADMIN STUDENTS RESPONSE:",
        data
      );

      if (data?.success) {
        setStudents(data.students || []);
        setCourses(data.courses || []);
      } else {
        setError(
          data?.message ||
            "Failed to load students."
        );
      }
    } catch (err) {
      console.error(
        "ADMIN STUDENTS ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load students from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadStudents();
  }, []);

  // =========================================================
  // IMPORTANT:
  // DATABASE ID
  //
  // This is ALWAYS available:
  // student.id
  //
  // Student ID may be NULL:
  // student.studentId
  // =========================================================

  const getDatabaseId = (student) => {
    if (
      student?.id === null ||
      student?.id === undefined
    ) {
      return "";
    }

    return String(student.id);
  };

  // =========================================================
  // STUDENT ID DISPLAY ONLY
  //
  // This is NOT used for delete anymore.
  // =========================================================

  const getDisplayStudentId = (student) => {
    const value =
      student?.studentId ??
      student?.student_id;

    if (
      value === null ||
      value === undefined ||
      String(value).trim() === "" ||
      String(value).trim().toLowerCase() === "null"
    ) {
      return "";
    }

    return String(value).trim();
  };

  // =========================================================
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal = (student) => {
    setDeleteError("");
    setStudentToDelete(student);
  };

  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const closeDeleteModal = () => {
    if (deleting) return;

    setStudentToDelete(null);
    setDeleteError("");
  };

  // =========================================================
  // CONFIRM DELETE
  //
  // USE DATABASE ID
  // NOT student_id
  // =========================================================

  const confirmDelete = async () => {
    if (
      !studentToDelete ||
      deleting
    ) {
      return;
    }

    const databaseId =
      getDatabaseId(studentToDelete);

    if (!databaseId) {
      setDeleteError(
        "Unable to identify this student record."
      );

      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      console.log(
        "DELETING STUDENT DATABASE ID:",
        databaseId
      );

      const result =
        await deleteAdminStudent(
          databaseId
        );

      console.log(
        "DELETE STUDENT RESPONSE:",
        result
      );

      if (result?.success) {
        setStudentToDelete(null);

        await loadStudents();
      } else {
        setDeleteError(
          result?.message ||
            "Failed to delete the student."
        );
      }
    } catch (err) {
      console.error(
        "ADMIN DELETE STUDENT ERROR:",
        err
      );

      setDeleteError(
        err?.response?.data?.message ||
          "Unable to delete the student. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // FILTER + SORT
  // =========================================================

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // -------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------

    if (search.trim()) {
      const q = search
        .toLowerCase()
        .trim();

      result = result.filter(
        (student) => {
          const studentId =
            getDisplayStudentId(student);

          return [
            studentId,
            student.name,
            student.email,
            student.course,
            student.grade,
            student.section,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(q)
          );
        }
      );
    }

    // -------------------------------------------------------
    // STATUS
    // -------------------------------------------------------

    if (statusFilter === "online") {
      result = result.filter(
        (student) =>
          Boolean(student.isOnline)
      );
    }

    if (statusFilter === "offline") {
      result = result.filter(
        (student) =>
          !student.isOnline
      );
    }

    // -------------------------------------------------------
    // COURSE
    // -------------------------------------------------------

    if (courseFilter !== "all") {
      result = result.filter(
        (student) =>
          student.course ===
          courseFilter
      );
    }

    // -------------------------------------------------------
    // SORT
    // -------------------------------------------------------

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Student ID null-safe sorting
      if (
        sortField === "studentId"
      ) {
        valA =
          getDisplayStudentId(a);

        valB =
          getDisplayStudentId(b);
      }

      if (
        valA === null ||
        valA === undefined
      ) {
        valA = "";
      }

      if (
        valB === null ||
        valB === undefined
      ) {
        valB = "";
      }

      if (
        typeof valA === "string"
      ) {
        valA =
          valA.toLowerCase();
      }

      if (
        typeof valB === "string"
      ) {
        valB =
          valB.toLowerCase();
      }

      if (valA < valB) {
        return sortDir === "asc"
          ? -1
          : 1;
      }

      if (valA > valB) {
        return sortDir === "asc"
          ? 1
          : -1;
      }

      return 0;
    });

    return result;
  }, [
    students,
    search,
    statusFilter,
    courseFilter,
    sortField,
    sortDir,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(
    filteredStudents.length /
      ITEMS_PER_PAGE
  );

  const paginatedStudents =
    filteredStudents.slice(
      (currentPage - 1) *
        ITEMS_PER_PAGE,
      currentPage *
        ITEMS_PER_PAGE
    );

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }

    if (
      totalPages === 0 &&
      currentPage !== 1
    ) {
      setCurrentPage(1);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // =========================================================
  // SORT HANDLER
  // =========================================================

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((current) =>
        current === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortDir("asc");
    }

    setCurrentPage(1);
  };

  // =========================================================
  // SORT ICON
  // =========================================================

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <span className="admin-sort-icon">
          ↕
        </span>
      );
    }

    return (
      <span className="admin-sort-icon admin-sort-active">
        {sortDir === "asc"
          ? "↑"
          : "↓"}
      </span>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Students</h2>

            <p>
              Loading student accounts...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Students</h2>

            <p>{error}</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={loadStudents}
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <AdminLayout>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="admin-page-header">
        <div>
          <h2>Students</h2>

          <p>
            Manage and monitor student accounts
            and wellness data.
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="admin-filters">
        {/* SEARCH */}

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
            <circle
              cx="11"
              cy="11"
              r="8"
            />

            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            />
          </svg>

          <input
            type="text"
            placeholder="Search by ID, name, email, or course..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setCurrentPage(1);
            }}
            className="admin-search-input"
          />
        </div>

        {/* STATUS */}

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target.value
            );

            setCurrentPage(1);
          }}
          className="admin-filter-select"
        >
          <option value="all">
            All Status
          </option>

          <option value="online">
            Online
          </option>

          <option value="offline">
            Offline
          </option>
        </select>

        {/* COURSE */}

        <select
          value={courseFilter}
          onChange={(event) => {
            setCourseFilter(
              event.target.value
            );

            setCurrentPage(1);
          }}
          className="admin-filter-select"
        >
          <option value="all">
            All Courses
          </option>

          {courses.map(
            (course) => (
              <option
                key={course}
                value={course}
              >
                {course}
              </option>
            )
          )}
        </select>

        {/* ADD STUDENT */}

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() =>
            setShowAddModal(true)
          }
        >
          + Add Student
        </button>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th
                onClick={() =>
                  handleSort(
                    "studentId"
                  )
                }
                className="admin-sortable"
              >
                Student ID{" "}
                <SortIcon field="studentId" />
              </th>

              <th
                onClick={() =>
                  handleSort("name")
                }
                className="admin-sortable"
              >
                Name{" "}
                <SortIcon field="name" />
              </th>

              <th>
                Course
              </th>

              <th>
                Year Level
              </th>

              <th
                onClick={() =>
                  handleSort(
                    "isOnline"
                  )
                }
                className="admin-sortable"
              >
                Status{" "}
                <SortIcon field="isOnline" />
              </th>

              <th>
                Last Check-in
              </th>

              <th>
                Active Cases
              </th>

              <th>
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedStudents.length >
            0 ? (
              paginatedStudents.map(
                (student) => {
                  // IMPORTANT:
                  // Database ID is used for actions.
                  const databaseId =
                    getDatabaseId(
                      student
                    );

                  // Student ID is display-only.
                  const displayStudentId =
                    getDisplayStudentId(
                      student
                    );

                  return (
                    <tr
                      key={
                        student.id
                      }
                    >
                      {/* =================================
                          STUDENT ID
                      ================================= */}

                      <td className="admin-mono">
                        {displayStudentId ||
                          "—"}
                      </td>

                      {/* =================================
                          NAME
                      ================================= */}

                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar admin-user-avatar-sm">
                            {student.name
                              ?.charAt(
                                0
                              )
                              ?.toUpperCase() ||
                              "?"}
                          </div>

                          <div>
                            <div className="admin-user-name">
                              {
                                student.name
                              }
                            </div>

                            <div className="admin-user-email">
                              {
                                student.email
                              }
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* =================================
                          COURSE
                      ================================= */}

                      <td>
                        {
                          student.course ||
                          "—"
                        }
                      </td>

                      {/* =================================
                          YEAR LEVEL
                      ================================= */}

                      <td>
                        {
                          student.yearLevel ||
                            student.grade ||
                            "—"
                        }
                      </td>

                      {/* =================================
                          STATUS
                      ================================= */}

                      <td>
                        <Badge
                          tone={
                            student.isOnline
                              ? "success"
                              : "neutral"
                          }
                          dot
                        >
                          {student.isOnline
                            ? "Online"
                            : "Offline"}
                        </Badge>
                      </td>

                      {/* =================================
                          LAST CHECK-IN
                      ================================= */}

                      <td>
                        {student.lastCheckIn ? (
                          new Date(
                            student.lastCheckIn
                          ).toLocaleDateString()
                        ) : (
                          <span className="admin-text-muted">
                            No check-ins
                          </span>
                        )}
                      </td>

                      {/* =================================
                          ACTIVE CASES
                      ================================= */}

                      <td>
                        {student.activeCases >
                        0 ? (
                          <span className="admin-badge admin-badge-info">
                            {
                              student.activeCases
                            }
                          </span>
                        ) : (
                          <span className="admin-text-muted">
                            0
                          </span>
                        )}
                      </td>

                      {/* =================================
                          ACTIONS
                      ================================= */}

                      <td>
                        <div className="admin-header-actions">
                          {/* VIEW
                              Use database ID */}
                          <Link
                            to={`/admin/students/${databaseId}`}
                            className="admin-btn admin-btn-sm admin-btn-outline"
                          >
                            View
                          </Link>

                          {/* EDIT
                              Use database ID */}
                          <Link
                            to={`/admin/students/${databaseId}/edit`}
                            className="admin-btn admin-btn-sm admin-btn-outline"
                          >
                            Edit
                          </Link>

                          {/* DELETE
                              Use database ID */}
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger-outline"
                            onClick={() =>
                              openDeleteModal(
                                student
                              )
                            }
                            disabled={
                              !databaseId
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="admin-empty-cell"
                >
                  No students found matching
                  your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            Showing{" "}
            {(currentPage - 1) *
              ITEMS_PER_PAGE +
              1}
            –
            {Math.min(
              currentPage *
                ITEMS_PER_PAGE,
              filteredStudents.length
            )}{" "}
            of{" "}
            {
              filteredStudents.length
            }
          </span>

          <div className="admin-pagination-btns">
            <button
              className="admin-btn admin-btn-sm admin-btn-outline"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    current - 1
                )
              }
            >
              Previous
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) =>
                index + 1
            ).map((page) => (
              <button
                key={page}
                className={`admin-btn admin-btn-sm ${
                  page ===
                  currentPage
                    ? "admin-btn-primary"
                    : "admin-btn-outline"
                }`}
                onClick={() =>
                  setCurrentPage(
                    page
                  )
                }
              >
                {page}
              </button>
            ))}

            <button
              className="admin-btn admin-btn-sm admin-btn-outline"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    current + 1
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD STUDENT MODAL
      ===================================================== */}

      {showAddModal && (
        <AddStudentModal
          onClose={() =>
            setShowAddModal(
              false
            )
          }
          onRegistered={async () => {
            setShowAddModal(
              false
            );

            await loadStudents();

            setCurrentPage(1);
          }}
        />
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

      {studentToDelete && (
        <div
          className="admin-modal-overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="admin-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete Student?"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3>
              Delete Student?
            </h3>

            <p>
              Are you sure you want to
              delete this student?
            </p>

            <div className="admin-info-grid">
              {/* NAME */}

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Name
                </span>

                <span className="admin-info-value">
                  {
                    studentToDelete.name ||
                    "—"
                  }
                </span>
              </div>

              {/* STUDENT ID */}

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Student ID
                </span>

                <span className="admin-info-value admin-mono">
                  {getDisplayStudentId(
                    studentToDelete
                  ) || "No Student ID on record"}
                </span>
              </div>

              {/* DATABASE ID */}

              <div className="admin-info-item">
                <span className="admin-info-label">
                  Record ID
                </span>

                <span className="admin-info-value admin-mono">
                  {
                    getDatabaseId(
                      studentToDelete
                    ) || "—"
                  }
                </span>
              </div>
            </div>

            {deleteError && (
              <div
                className="admin-alert admin-alert-error"
                role="alert"
              >
                {deleteError}
              </div>
            )}

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={
                  closeDeleteModal
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={
                  confirmDelete
                }
                disabled={
                  deleting ||
                  !getDatabaseId(
                    studentToDelete
                  )
                }
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
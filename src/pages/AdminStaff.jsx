import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import Icon from "../components/Icon";
import {
  getAdminStaffUsers,
  createManagedUser,
  updateAdminUser,
  deleteAdminUser,
} from "../api/staff";
import {
  updateAdminStudent,
  deleteAdminStudent,
} from "../api/students";
import { getSchoolStructure } from "../api/settings";
import { Badge, SearchBox, EmptyState, ConfirmDialog } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const PER_PAGE = 10;

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.errors?.email?.[0] ||
    err?.response?.data?.errors?.student_id?.[0] ||
    err?.response?.data?.errors?.name?.[0] ||
    err?.response?.data?.errors?.password?.[0] ||
    fallback
  );
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(14);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 1e9);
  }
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function Pagination({ currentPage, totalItems, perPage, onPageChange, disabled }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  if (totalItems <= perPage) return null;
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="admin-pagination-btns">
        <button
          type="button"
          className="admin-btn admin-btn-sm admin-btn-outline"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            className={`admin-btn admin-btn-sm ${
              page === currentPage ? "admin-btn-primary" : "admin-btn-outline"
            }`}
            onClick={() => onPageChange(page)}
            disabled={disabled}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="admin-btn admin-btn-sm admin-btn-outline"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const emptyAddForm = {
  accountType: "",
  name: "",
  email: "",
  studentId: "",
  course: "",
  yearLevel: "",
  block: "",
  password: "",
  confirmPassword: "",
};

export default function AdminStaff() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    totalAdmins: 0,
    totalStudents: 0,
    onlineUsers: 0,
  });
  const [schoolStructure, setSchoolStructure] = useState({
    yearLevels: [],
    blocks: [],
    courses: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminPage, setAdminPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addErrors, setAddErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    studentId: "",
    course: "",
    yearLevel: "",
    block: "",
  });

  const [deletingStudent, setDeletingStudent] = useState(null);
  const [showStudentDeleteConfirm, setShowStudentDeleteConfirm] = useState(false);

  const [adminDeleteTarget, setAdminDeleteTarget] = useState(null);
  const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false);
  const [adminDeletePassword, setAdminDeletePassword] = useState("");
  const [adminDeleteError, setAdminDeleteError] = useState("");

  const loadSchoolStructure = useCallback(async () => {
    try {
      const data = await getSchoolStructure();
      if (data?.success && data?.schoolStructure) {
        setSchoolStructure({
          yearLevels: data.schoolStructure.yearLevels || [],
          blocks: data.schoolStructure.blocks || [],
          courses: data.schoolStructure.courses || [],
        });
      }
    } catch (err) {
      console.error("SCHOOL STRUCTURE LOAD ERROR:", err);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        search: search.trim() || undefined,
        account_type: accountTypeFilter !== "all" ? accountTypeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      };
      const data = await getAdminStaffUsers(params);

      if (!data.success) {
        setError(data.message || "Failed to load user accounts.");
        return;
      }

      const adminList = (data.admins || data.staff || []).filter(
        (u) => u.role === "admin"
      );
      const studentList = data.students || data.legacyStudents || [];
      setAdmins(adminList);
      setStudents(studentList);

      if (data.summary) {
        setSummary({
          totalAdmins: data.summary.totalAdmins ?? adminList.length,
          totalStudents: data.summary.totalStudents ?? studentList.length,
          onlineUsers: data.summary.onlineUsers ?? 0,
        });
      } else {
        const all = [...adminList, ...studentList];
        setSummary({
          totalAdmins: adminList.length,
          totalStudents: studentList.length,
          onlineUsers: all.filter((u) => u.isOnline).length,
        });
      }
    } catch (err) {
      console.error("USER MANAGEMENT LOAD ERROR:", err);
      setError(getErrorMessage(err, "Unable to load user accounts from the server."));
    } finally {
      setLoading(false);
    }
  }, [search, accountTypeFilter, statusFilter]);

  useEffect(() => {
    loadSchoolStructure();
  }, [loadSchoolStructure]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setAdminPage(1);
    setStudentPage(1);
  }, [search, accountTypeFilter, statusFilter]);

  const hasActiveFilters =
    search.trim() !== "" || accountTypeFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setAccountTypeFilter("all");
    setStatusFilter("all");
  };

  const showAdmins = accountTypeFilter === "all" || accountTypeFilter === "admin";
  const showStudents = accountTypeFilter === "all" || accountTypeFilter === "student";

  const pagedAdmins = useMemo(() => {
    const start = (adminPage - 1) * PER_PAGE;
    return admins.slice(start, start + PER_PAGE);
  }, [admins, adminPage]);

  const pagedStudents = useMemo(() => {
    const start = (studentPage - 1) * PER_PAGE;
    return students.slice(start, start + PER_PAGE);
  }, [students, studentPage]);

  const openAddModal = () => {
    setAddForm(emptyAddForm);
    setAddErrors({});
    setShowAddModal(true);
    setError("");
    setSuccessMessage("");
    if (!schoolStructure.courses.length && !schoolStructure.yearLevels.length) {
      loadSchoolStructure();
    }
  };

  const validateAddForm = () => {
    const errs = {};
    if (!addForm.accountType) errs.accountType = "Account type is required.";
    if (!addForm.name.trim()) errs.name = "Full name is required.";
    if (!addForm.email.trim()) errs.email = "Email address is required.";
    if (!addForm.password) errs.password = "Password is required.";
    else if (addForm.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (addForm.password !== addForm.confirmPassword) {
      errs.confirmPassword = "Password confirmation does not match.";
    }

    if (addForm.accountType === "student") {
      if (!addForm.studentId.trim()) errs.studentId = "Student ID is required.";
      if (!addForm.course) errs.course = "Course is required.";
      if (!addForm.yearLevel) errs.yearLevel = "Year level is required.";
      if (!addForm.block) errs.block = "Block / Section is required.";
    }

    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAddUser = async () => {
    if (saving) return;
    if (!validateAddForm()) return;

    try {
      setSaving(true);
      setError("");
      setAddErrors({});

      const payload =
        addForm.accountType === "admin"
          ? {
              account_type: "admin",
              name: addForm.name.trim(),
              email: addForm.email.trim(),
              password: addForm.password,
              password_confirmation: addForm.confirmPassword,
            }
          : {
              account_type: "student",
              name: addForm.name.trim(),
              student_id: addForm.studentId.trim(),
              email: addForm.email.trim(),
              course: addForm.course,
              year_level: addForm.yearLevel,
              block: addForm.block,
              password: addForm.password,
              password_confirmation: addForm.confirmPassword,
            };

      const result = await createManagedUser(payload);
      if (!result?.success) {
        setError(result?.message || "Failed to create account.");
        if (result?.errors) setAddErrors(result.errors);
        return;
      }

      setShowAddModal(false);
      setAddForm(emptyAddForm);
      setSuccessMessage(
        addForm.accountType === "admin"
          ? "Administrator account created successfully."
          : "Student account created successfully."
      );
      await loadUsers();
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      const data = err?.response?.data;
      setError(getErrorMessage(err, "Failed to create account."));
      if (data?.errors) setAddErrors(data.errors);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      studentId: user.studentId || "",
      course: user.course || "",
      yearLevel: user.yearLevel || user.year_level || "",
      block: user.section || user.block || "",
    });
    setShowEditModal(true);
    setError("");
    setSuccessMessage("");
    if (user.role === "student") loadSchoolStructure();
  };

  const handleSaveEdit = async () => {
    if (!editingUser || saving) return;
    try {
      setSaving(true);
      setError("");

      let result;
      if (editingUser.role === "student") {
        result = await updateAdminStudent(editingUser.id, {
          studentId: editForm.studentId,
          name: editForm.name,
          email: editForm.email,
          course: editForm.course,
          yearLevel: editForm.yearLevel,
          section: editForm.block,
        });
      } else {
        result = await updateAdminUser(editingUser.id, {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
        });
      }

      if (!result?.success) {
        setError(result?.message || "Failed to update account.");
        return;
      }

      setSuccessMessage(
        editingUser.role === "admin"
          ? "Admin account updated successfully."
          : "Student account updated successfully."
      );
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update account."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user) => {
    setError("");
    setSuccessMessage("");

    if (user.role === "admin") {
      if (Number(currentUser?.id) === Number(user.id)) {
        setError("You cannot delete your own account.");
        return;
      }
      if (summary.totalAdmins <= 1) {
        setError("Cannot delete the last remaining administrator account.");
        return;
      }
      setAdminDeleteTarget(user);
      setAdminDeletePassword("");
      setAdminDeleteError("");
      setShowAdminDeleteModal(true);
      return;
    }

    setDeletingStudent(user);
    setShowStudentDeleteConfirm(true);
  };

  const closeAdminDeleteModal = () => {
    if (saving) return;
    setShowAdminDeleteModal(false);
    setAdminDeleteTarget(null);
    setAdminDeletePassword("");
    setAdminDeleteError("");
  };

  const confirmAdminDelete = async () => {
    if (!adminDeleteTarget || saving) return;
    if (!adminDeletePassword) {
      setAdminDeleteError("Please enter your password to confirm deletion.");
      return;
    }
    try {
      setSaving(true);
      setAdminDeleteError("");
      setError("");
      const result = await deleteAdminUser(adminDeleteTarget.id, adminDeletePassword);
      if (!result?.success) {
        setAdminDeleteError(result?.message || "Failed to delete admin account.");
        return;
      }
      setSuccessMessage("Admin account deleted successfully.");
      closeAdminDeleteModal();
      await loadUsers();
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      setAdminDeleteError(getErrorMessage(err, "Failed to delete admin account."));
    } finally {
      setSaving(false);
    }
  };

  const confirmStudentDelete = async () => {
    if (!deletingStudent || saving) return;
    try {
      setSaving(true);
      setError("");
      const result = await deleteAdminStudent(deletingStudent.id);
      if (!result?.success) {
        setError(result?.message || "Failed to delete student account.");
        return;
      }
      setSuccessMessage("Student account deleted successfully.");
      setShowStudentDeleteConfirm(false);
      setDeletingStudent(null);
      await loadUsers();
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete student account."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>User Management</h2>
            <p>Loading administrator and student accounts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !admins.length && !students.length && !summary.totalAdmins && !summary.totalStudents) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>User Management</h2>
            <p>{error}</p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={loadUsers}>
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  const courseOptions = schoolStructure.courses || [];
  const yearLevelOptions = schoolStructure.yearLevels || [];
  const blockOptions = schoolStructure.blocks || [];

  return (
    <AdminLayout>
      <div className="admin-page-header" style={{ alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2>User Management</h2>
          <p>Manage administrator and student accounts.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={openAddModal}
          disabled={saving}
          style={{ marginLeft: "auto", whiteSpace: "nowrap" }}
        >
          + Add User
        </button>
      </div>

      {successMessage && (
        <div className="admin-alert admin-alert-success" role="status">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-stats-row admin-stats-row-3">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-blue"><Icon name="staff" size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.totalAdmins}</span>
            <span className="admin-stat-label">Total Admins</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-green"><Icon name="students" size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.totalStudents}</span>
            <span className="admin-stat-label">Total Students</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-amber"><Icon name="user" size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{summary.onlineUsers}</span>
            <span className="admin-stat-label">Online Users</span>
          </div>
        </div>
      </div>

      <div
        className="admin-filters"
        style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}
      >
        <div style={{ flex: "1 1 280px", minWidth: "220px" }}>
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, account ID, email, or course…"
            label="Search accounts"
          />
        </div>
        <select
          className="admin-select"
          value={accountTypeFilter}
          onChange={(e) => setAccountTypeFilter(e.target.value)}
          aria-label="Filter by account type"
          style={{ flex: "0 1 180px", minWidth: "170px" }}
        >
          <option value="all">All Accounts</option>
          <option value="admin">Admin Accounts</option>
          <option value="student">Student Accounts</option>
        </select>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by account status"
          style={{ flex: "0 1 160px", minWidth: "150px" }}
        >
          <option value="all">All Statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={resetFilters}
            style={{ minHeight: "42px" }}
          >
            Reset
          </button>
        )}
      </div>

      {showAdmins && (
        <div className="admin-section">
          <h3 className="admin-section-title">Admin Accounts ({admins.length})</h3>
          {admins.length > 0 ? (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Account ID</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAdmins.map((member) => {
                      const isSelf = Number(currentUser?.id) === Number(member.id);
                      const isLastAdmin = summary.totalAdmins <= 1;
                      const disableDelete = isSelf || isLastAdmin || saving;
                      return (
                        <tr key={`admin-${member.id}`}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar admin-user-avatar-sm">
                                {member.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <span className="admin-user-name">{member.name}</span>
                            </div>
                          </td>
                          <td className="admin-mono">{member.accountId || "—"}</td>
                          <td>{member.email || "—"}</td>
                          <td><Badge tone="primary">Administrator</Badge></td>
                          <td>
                            <Badge tone={member.isOnline ? "success" : "neutral"} dot>
                              {member.isOnline ? "Online" : "Offline"}
                            </Badge>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
                              <button
                                type="button"
                                onClick={() => handleEdit(member)}
                                title="Edit administrator account"
                                aria-label={`Edit ${member.name || "administrator"} account`}
                                disabled={saving}
                                className="admin-btn-icon"
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "32px", minHeight: "32px", background: "transparent", border: "none", color: "#2563eb", cursor: saving ? "not-allowed" : "pointer", padding: "6px" }}
                              >
                                <Icon name="edit" size={16} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn-icon"
                                onClick={() => handleDelete(member)}
                                title={isSelf ? "You cannot delete your own account" : isLastAdmin ? "Cannot delete the last administrator" : "Delete administrator account"}
                                aria-label={`Delete ${member.name || "administrator"} account`}
                                disabled={disableDelete}
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "32px", minHeight: "32px", background: "transparent", border: "none", color: "#dc2626", cursor: disableDelete ? "not-allowed" : "pointer", padding: "6px", opacity: disableDelete ? 0.45 : 1 }}
                              >
                                <Icon name="trash" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={adminPage}
                totalItems={admins.length}
                perPage={PER_PAGE}
                onPageChange={setAdminPage}
                disabled={saving}
              />
            </>
          ) : (
            <EmptyState kind={hasActiveFilters ? "results" : "data"} title="No admin accounts found" />
          )}
        </div>
      )}

      {showStudents && (
        <div className="admin-section">
          <h3 className="admin-section-title">Student Accounts ({students.length})</h3>
          {students.length > 0 ? (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Student ID</th>
                      <th scope="col">Email</th>
                      <th scope="col">Course</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStudents.map((student) => (
                      <tr key={`student-${student.id}`}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar admin-user-avatar-sm">
                              {student.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="admin-user-name">{student.name}</span>
                          </div>
                        </td>
                        <td className="admin-mono">{student.studentId || "—"}</td>
                        <td>{student.email || "—"}</td>
                        <td>{student.course || "—"}</td>
                        <td>
                          <Badge tone={student.isOnline ? "success" : "neutral"} dot>
                            {student.isOnline ? "Online" : "Offline"}
                          </Badge>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
                            <Link
                              to={`/admin/students/${student.id}`}
                              className="admin-btn-icon"
                              title="View student account"
                              aria-label={`View ${student.name || "student"} account`}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "32px", minHeight: "32px", color: "#2563eb", padding: "6px" }}
                            >
                              <Icon name="eye" size={16} />
                            </Link>
                            <button
                              type="button"
                              className="admin-btn-icon"
                              onClick={() => handleEdit(student)}
                              title="Edit student account"
                              aria-label={`Edit ${student.name || "student"} account`}
                              disabled={saving}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "32px", minHeight: "32px", background: "transparent", border: "none", color: "#2563eb", cursor: saving ? "not-allowed" : "pointer", padding: "6px" }}
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              type="button"
                              className="admin-btn-icon"
                              onClick={() => handleDelete(student)}
                              title="Delete student account"
                              aria-label={`Delete ${student.name || "student"} account`}
                              disabled={saving}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "32px", minHeight: "32px", background: "transparent", border: "none", color: "#dc2626", cursor: saving ? "not-allowed" : "pointer", padding: "6px", opacity: saving ? 0.6 : 1 }}
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={studentPage}
                totalItems={students.length}
                perPage={PER_PAGE}
                onPageChange={setStudentPage}
                disabled={saving}
              />
            </>
          ) : (
            <EmptyState kind={hasActiveFilters ? "results" : "data"} title="No student accounts found" />
          )}
        </div>
      )}

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => !saving && setShowAddModal(false)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
          >
            <div className="admin-modal-header">
              <h3 id="add-user-title">Add User</h3>
              <button type="button" onClick={() => !saving && setShowAddModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }} aria-label="Close" disabled={saving}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-field">
                <label className="admin-label" htmlFor="add-account-type">Account Type *</label>
                <select
                  id="add-account-type"
                  className="admin-select admin-input"
                  value={addForm.accountType}
                  onChange={(e) => setAddForm({ ...addForm, accountType: e.target.value })}
                  disabled={saving}
                >
                  <option value="">Select account type</option>
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
                {addErrors.account_type && <div className="form-error">{addErrors.account_type}</div>}
              </div>

              {addForm.accountType && (
                <>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="add-name">Full Name *</label>
                    <input id="add-name" type="text" className="admin-input" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} disabled={saving} />
                    {(addErrors.name || addErrors["name"]) && <div className="form-error">{addErrors.name || addErrors["name"]}</div>}
                  </div>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="add-email">Email Address *</label>
                    <input id="add-email" type="email" className="admin-input" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} disabled={saving} />
                    {addErrors.email && <div className="form-error">{Array.isArray(addErrors.email) ? addErrors.email[0] : addErrors.email}</div>}
                  </div>

                  {addForm.accountType === "admin" && (
                    <>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="add-admin-id">Account ID</label>
                        <input id="add-admin-id" type="text" className="admin-input" value="Auto-generated after creation" disabled readOnly />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="add-role">Role</label>
                        <input id="add-role" type="text" className="admin-input" value="Administrator" disabled readOnly />
                      </div>
                    </>
                  )}

                  {addForm.accountType === "student" && (
                    <>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="add-student-id">Student ID *</label>
                        <input id="add-student-id" type="text" className="admin-input" value={addForm.studentId} onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })} disabled={saving} />
                        {addErrors.student_id && <div className="form-error">{Array.isArray(addErrors.student_id) ? addErrors.student_id[0] : addErrors.student_id}</div>}
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="add-course">Course *</label>
                        <select id="add-course" className="admin-select admin-input" value={addForm.course} onChange={(e) => setAddForm({ ...addForm, course: e.target.value })} disabled={saving}>
                          <option value="">Select course</option>
                          {courseOptions.map((c) => (
                            <option key={c.id ?? c.name} value={c.name}>{c.name}{c.abbreviation ? ` (${c.abbreviation})` : ""}</option>
                          ))}
                        </select>
                        {addErrors.course && <div className="form-error">{Array.isArray(addErrors.course) ? addErrors.course[0] : addErrors.course}</div>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div className="admin-field">
                          <label className="admin-label" htmlFor="add-year">Year Level *</label>
                          <select id="add-year" className="admin-select admin-input" value={addForm.yearLevel} onChange={(e) => setAddForm({ ...addForm, yearLevel: e.target.value })} disabled={saving}>
                            <option value="">Select year level</option>
                            {yearLevelOptions.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          {addErrors.year_level && <div className="form-error">{Array.isArray(addErrors.year_level) ? addErrors.year_level[0] : addErrors.year_level}</div>}
                        </div>
                        <div className="admin-field">
                          <label className="admin-label" htmlFor="add-block">Block / Section *</label>
                          <select id="add-block" className="admin-select admin-input" value={addForm.block} onChange={(e) => setAddForm({ ...addForm, block: e.target.value })} disabled={saving}>
                            <option value="">Select block</option>
                            {blockOptions.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          {addErrors.block && <div className="form-error">{Array.isArray(addErrors.block) ? addErrors.block[0] : addErrors.block}</div>}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="admin-field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <label className="admin-label" htmlFor="add-password">Password *</label>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-outline"
                        onClick={() => {
                          const p = generateTempPassword();
                          setAddForm((f) => ({ ...f, password: p, confirmPassword: p }));
                        }}
                        disabled={saving}
                      >
                        Generate temporary password
                      </button>
                    </div>
                    <input id="add-password" type="text" autoComplete="new-password" className="admin-input" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} disabled={saving} />
                    {addErrors.password && <div className="form-error">{Array.isArray(addErrors.password) ? addErrors.password[0] : addErrors.password}</div>}
                  </div>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="add-confirm-password">Confirm Password *</label>
                    <input id="add-confirm-password" type="password" autoComplete="new-password" className="admin-input" value={addForm.confirmPassword} onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })} disabled={saving} />
                    {addErrors.confirmPassword && <div className="form-error">{addErrors.confirmPassword}</div>}
                  </div>
                </>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowAddModal(false)} disabled={saving}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={submitAddUser} disabled={saving || !addForm.accountType}>
                {saving ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="admin-modal-overlay" onClick={() => !saving && setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }} role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
            <div className="admin-modal-header">
              <h3 id="edit-user-title">{editingUser.role === "admin" ? "Edit Admin Account" : "Edit Student Account"}</h3>
              <button type="button" onClick={() => !saving && setShowEditModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }} aria-label="Close" disabled={saving}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-field">
                <label className="admin-label" htmlFor="edit-name">Name *</label>
                <input id="edit-name" type="text" className="admin-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} disabled={saving} />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="edit-email">Email *</label>
                <input id="edit-email" type="email" className="admin-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} disabled={saving} />
              </div>

              {editingUser.role === "admin" && (
                <>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="edit-role">Role</label>
                    <input id="edit-role" type="text" className="admin-input" value="Administrator" disabled readOnly />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="edit-phone">Phone</label>
                    <input id="edit-phone" type="text" className="admin-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} disabled={saving} />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="edit-address">Address</label>
                    <input id="edit-address" type="text" className="admin-input" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} disabled={saving} />
                  </div>
                </>
              )}

              {editingUser.role === "student" && (
                <>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="edit-student-id">Student ID</label>
                    <input id="edit-student-id" type="text" className="admin-input" value={editForm.studentId} onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })} disabled={saving} />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="edit-course">Course</label>
                    <select id="edit-course" className="admin-select admin-input" value={editForm.course} onChange={(e) => setEditForm({ ...editForm, course: e.target.value })} disabled={saving}>
                      <option value="">Select course</option>
                      {courseOptions.map((c) => (
                        <option key={c.id ?? c.name} value={c.name}>{c.name}{c.abbreviation ? ` (${c.abbreviation})` : ""}</option>
                      ))}
                      {editForm.course && !courseOptions.some((c) => c.name === editForm.course) && (
                        <option value={editForm.course}>{editForm.course}</option>
                      )}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="admin-field">
                      <label className="admin-label" htmlFor="edit-year">Year Level</label>
                      <select id="edit-year" className="admin-select admin-input" value={editForm.yearLevel} onChange={(e) => setEditForm({ ...editForm, yearLevel: e.target.value })} disabled={saving}>
                        <option value="">Select year level</option>
                        {yearLevelOptions.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                        {editForm.yearLevel && !yearLevelOptions.includes(editForm.yearLevel) && (
                          <option value={editForm.yearLevel}>{editForm.yearLevel}</option>
                        )}
                      </select>
                    </div>
                    <div className="admin-field">
                      <label className="admin-label" htmlFor="edit-block">Block / Section</label>
                      <select id="edit-block" className="admin-select admin-input" value={editForm.block} onChange={(e) => setEditForm({ ...editForm, block: e.target.value })} disabled={saving}>
                        <option value="">Select block</option>
                        {blockOptions.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        {editForm.block && !blockOptions.includes(editForm.block) && (
                          <option value={editForm.block}>{editForm.block}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowEditModal(false)} disabled={saving}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {showAdminDeleteModal && adminDeleteTarget && (
        <div className="admin-modal-overlay" onClick={closeAdminDeleteModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }} role="alertdialog" aria-modal="true" aria-labelledby="delete-admin-title" aria-describedby="delete-admin-desc">
            <div className="admin-modal-header">
              <h3 id="delete-admin-title">Delete Admin Account</h3>
              <button type="button" onClick={closeAdminDeleteModal} style={{ background: "transparent", border: "none", cursor: "pointer" }} aria-label="Close" disabled={saving}>×</button>
            </div>
            <div className="admin-modal-body">
              <p id="delete-admin-desc" style={{ marginTop: 0 }}>Are you sure you want to permanently delete this administrator account?</p>
              <p style={{ margin: "0 0 12px" }}>
                <strong>Name:</strong> {adminDeleteTarget.name || "—"}<br />
                <strong>Email:</strong> {adminDeleteTarget.email || "—"}
              </p>
              <p style={{ margin: "0 0 12px", color: "#b91c1c" }}>This action cannot be undone.</p>
              <div className="admin-field">
                <label className="admin-label" htmlFor="admin-delete-password">Enter your password to confirm *</label>
                <input
                  id="admin-delete-password"
                  type="password"
                  value={adminDeletePassword}
                  onChange={(e) => setAdminDeletePassword(e.target.value)}
                  className="admin-input"
                  autoComplete="current-password"
                  disabled={saving}
                  onKeyDown={(e) => { if (e.key === "Enter" && !saving) confirmAdminDelete(); }}
                />
              </div>
              {adminDeleteError && <div className="admin-alert admin-alert-error" role="alert">{adminDeleteError}</div>}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={closeAdminDeleteModal} disabled={saving}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={confirmAdminDelete} disabled={saving}>{saving ? "Deleting..." : "Delete Admin Account"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showStudentDeleteConfirm}
        title="Delete Student Account"
        message={deletingStudent ? `Are you sure you want to delete ${deletingStudent.name}? This action cannot be undone.` : ""}
        confirmLabel={saving ? "Deleting..." : "Delete"}
        danger
        onConfirm={confirmStudentDelete}
        onCancel={() => {
          if (!saving) {
            setShowStudentDeleteConfirm(false);
            setDeletingStudent(null);
          }
        }}
      />
    </AdminLayout>
  );
}

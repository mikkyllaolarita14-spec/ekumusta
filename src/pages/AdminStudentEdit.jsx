import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import {
  getAdminStudentDetail,
  updateAdminStudent,
} from "../api/students";
import { getSchoolStructure } from "../api/settings";
import {
  DEFAULT_YEAR_LEVELS,
  DEFAULT_BLOCKS,
  DEFAULT_COURSES,
  normalizeCourse,
  courseLabel,
} from "../utils/labels";

export default function AdminStudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentId: "",
    name: "",
    email: "",
    course: "",
    grade: "", // stores the selected Year Level value (internal field name kept for API compatibility)
    section: "", // stores the selected Block value (internal field name kept for API compatibility)
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [yearLevelChoices, setYearLevelChoices] = useState(DEFAULT_YEAR_LEVELS);
  const [blockChoices, setBlockChoices] = useState(DEFAULT_BLOCKS);
  const [courseChoices, setCourseChoices] = useState(DEFAULT_COURSES);

  // =========================================================
  // LOAD STUDENT FROM LARAVEL
  // =========================================================
  useEffect(() => {
    const loadStudent = async () => {
      // Guard: never send "null"/"undefined" to the API.
      if (
        !id ||
        id === "null" ||
        id === "undefined"
      ) {
        setError(
          "This student has no Student ID on record, so the profile cannot be loaded for editing."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getAdminStudentDetail(id);

        if (!data.success || !data.student) {
          setError(
            data.message || "Student not found."
          );
          return;
        }

        setForm({
          studentId: data.student.studentId || "",
          name: data.student.name || "",
          email: data.student.email || "",
          course: data.student.course || "",
          grade: data.student.grade || "",
          section: data.student.section || "",
        });
      } catch (err) {
        console.error(
          "ADMIN STUDENT EDIT LOAD ERROR:",
          err
        );

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

  // =========================================================
  // FORM HANDLERS
  // =========================================================
  const handleChange = (field) => (e) => {
    setForm((current) => ({
      ...current,
      [field]: e.target.value,
    }));
  };

  // Load the college Year Level / Block options from the school structure.
  useEffect(() => {
    let cancelled = false;

    getSchoolStructure()
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.schoolStructure) {
          if (data.schoolStructure.yearLevels?.length > 0) {
            setYearLevelChoices(data.schoolStructure.yearLevels);
          }
          if (data.schoolStructure.blocks?.length > 0) {
            setBlockChoices(data.schoolStructure.blocks);
          }
          if (Array.isArray(data.schoolStructure.courses)) {
            setCourseChoices(
              data.schoolStructure.courses.map(normalizeCourse)
            );
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("SCHOOL STRUCTURE LOAD ERROR:", err);
          // Defaults stay in place when the API is unreachable.
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    // -------------------------------------------------------
    // Client-side validation
    // -------------------------------------------------------
    const errors = {};

    if (!form.studentId.trim()) {
      errors.studentId =
        "Student ID is required.";
    }

    if (!form.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      errors.email =
        "Please enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError("");
    setSuccessMessage("");

    try {
      setSaving(true);

     const result = await updateAdminStudent(id, {
    studentId: form.studentId.trim(),
    name: form.name.trim(),
    email: form.email.trim(),
    course: form.course.trim(),
    yearLevel: form.grade.trim(),
    grade: form.grade.trim(),
    section: form.section.trim(),
});

      if (result.success) {
        setSuccessMessage(
          "Student updated successfully."
        );

        // If the Student ID changed, the old URL is
        // no longer valid — return to the list.
        setTimeout(() => {
          navigate("/admin/students");
        }, 900);
      } else {
        setError(
          result.message ||
            "Failed to update the student."
        );
      }
    } catch (err) {
      console.error(
        "ADMIN STUDENT UPDATE ERROR:",
        err
      );

      // Laravel validation errors (422)
      if (err?.response?.status === 422) {
        const laravelErrors =
          err.response.data?.errors || {};

        const mapped = {};

        Object.entries(laravelErrors).forEach(
          ([key, messages]) => {
            const field =
              key === "student_id"
                ? "studentId"
                : key === "year_level"
                  ? "yearLevel"
                  : key;

            mapped[field] = messages[0];
          }
        );

        setFieldErrors(mapped);
        setError(
          err.response.data?.message ||
            "Please check the highlighted fields."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "Unable to update the student. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Edit Student</h2>
            <p>
              Loading student information...
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

  // =========================================================
  // ERROR STATE
  // =========================================================
  if (error && !form.studentId) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Student Not Found</h2>
            <p>{error}</p>
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

  // =========================================================
  // UI
  // =========================================================
  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Edit Student</h2>
          <p>
            Update {form.name || "student"}'s
            account information.
          </p>
        </div>

        <Link
          to={
            form.studentId
              ? `/admin/students/${encodeURIComponent(
                  form.studentId
                )}`
              : "/admin/students"
          }
          className="admin-btn admin-btn-outline"
        >
          ← Back to Students
        </Link>
      </div>

      {successMessage && (
        <div
          className="admin-alert admin-alert-success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <div className="admin-card ek-form-card">
        <div className="admin-card-header">
          <h3>Student Information</h3>
        </div>

        <div className="admin-card-body">
          {error && (
            <div
              className="admin-alert admin-alert-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="admin-form-grid">
              {/* Student ID */}
              <div className="admin-field">
                <label
                  htmlFor="edit-student-id"
                  className="admin-label"
                >
                  Student ID *
                </label>

                <input
                  id="edit-student-id"
                  type="text"
                  className="admin-input"
                  placeholder="e.g. 2024-009"
                  value={form.studentId}
                  onChange={handleChange(
                    "studentId"
                  )}
                  disabled={saving}
                />

                {fieldErrors.studentId && (
                  <p className="ek-form-error">
                    {fieldErrors.studentId}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="admin-field">
                <label
                  htmlFor="edit-name"
                  className="admin-label"
                >
                  Full Name *
                </label>

                <input
                  id="edit-name"
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.name}
                  onChange={handleChange(
                    "name"
                  )}
                  disabled={saving}
                />

                {fieldErrors.name && (
                  <p className="ek-form-error">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="admin-field">
                <label
                  htmlFor="edit-email"
                  className="admin-label"
                >
                  Email Address *
                </label>

                <input
                  id="edit-email"
                  type="email"
                  className="admin-input"
                  placeholder="e.g. juan.delacruz@school.edu"
                  value={form.email}
                  onChange={handleChange(
                    "email"
                  )}
                  disabled={saving}
                />

                {fieldErrors.email && (
                  <p className="ek-form-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Course */}
              <div className="admin-field">
                <label
                  htmlFor="edit-course"
                  className="admin-label"
                >
                  Course
                </label>

                <select
                  id="edit-course"
                  className="admin-input"
                  value={form.course}
                  onChange={handleChange(
                    "course"
                  )}
                  disabled={saving}
                >
                  <option value="">
                    Not set
                  </option>

                  {(() => {
                    const normalizedChoices = courseChoices.map(normalizeCourse);
                    const hasCurrent =
                      !form.course ||
                      normalizedChoices.some(
                        (c) =>
                          (c.name || c.abbreviation) === form.course
                      );
                    return (
                      <>
                        {!hasCurrent && (
                          <option value={form.course}>
                            {form.course}
                          </option>
                        )}
                        {normalizedChoices.map((c) => {
                          const value = c.name || c.abbreviation;
                          return (
                            <option key={value || c.id} value={value}>
                              {courseLabel(c)}
                            </option>
                          );
                        })}
                      </>
                    );
                  })()}
                </select>

                {fieldErrors.course && (
                  <p className="ek-form-error">
                    {fieldErrors.course}
                  </p>
                )}
              </div>

              {/* Year Level */}
              <div className="admin-field">
                <label
                  htmlFor="edit-grade"
                  className="admin-label"
                >
                  Year Level
                </label>

                <select
                  id="edit-grade"
                  className="admin-input"
                  value={form.grade}
                  onChange={handleChange(
                    "grade"
                  )}
                  disabled={saving}
                >
                  <option value="">
                    Not set
                  </option>

                  {yearLevelChoices.map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  ))}
                </select>

                {fieldErrors.grade && (
                  <p className="ek-form-error">
                    {fieldErrors.grade}
                  </p>
                )}
              </div>

              {/* Block */}
              <div className="admin-field">
                <label
                  htmlFor="edit-section"
                  className="admin-label"
                >
                  Block
                </label>

                <select
                  id="edit-section"
                  className="admin-input"
                  value={form.section}
                  onChange={handleChange(
                    "section"
                  )}
                  disabled={saving}
                >
                  <option value="">
                    Not set
                  </option>

                  {blockChoices.map((block) => (
                    <option
                      key={block}
                      value={block}
                    >
                      {block}
                    </option>
                  ))}
                </select>

                {fieldErrors.section && (
                  <p className="ek-form-error">
                    {fieldErrors.section}
                  </p>
                )}
              </div>
            </div>

            <div className="admin-form-actions">
              <Link
                to="/admin/students"
                className="admin-btn admin-btn-outline"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

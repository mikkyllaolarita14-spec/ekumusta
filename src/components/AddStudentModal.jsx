import { useEffect, useState } from "react";
import { registerUser } from "../api/auth";
import { getSchoolStructure } from "../api/settings";

import {
  DEFAULT_YEAR_LEVELS,
  DEFAULT_BLOCKS,
  DEFAULT_COURSES,
  normalizeCourse,
  courseLabel,
} from "../utils/labels";

// =============================================================
// ADD STUDENT MODAL
// =============================================================

const EMPTY_FORM = {
  name: "",
  studentId: "",
  email: "",
  password: "",
  confirmPassword: "",
  course: "",
  grade: "",
  section: "",
};

export default function AddStudentModal({
  onClose,
  onRegistered,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  const [yearLevelChoices, setYearLevelChoices] =
    useState(DEFAULT_YEAR_LEVELS);

  const [blockChoices, setBlockChoices] =
    useState(DEFAULT_BLOCKS);

  const [courseChoices, setCourseChoices] =
    useState(DEFAULT_COURSES);

  // ===========================================================
  // CLOSE
  // ===========================================================

  const handleClose = () => {
    if (submitting || success) return;

    onClose?.();
  };

  // ===========================================================
  // ESCAPE KEY
  // ===========================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [submitting, success]);

  // ===========================================================
  // LOAD YEAR LEVELS AND BLOCKS
  // ===========================================================

  useEffect(() => {
    let cancelled = false;

    const loadSchoolStructure = async () => {
      try {
        const response = await getSchoolStructure();

        if (cancelled) return;

        if (
          response?.success &&
          response?.schoolStructure
        ) {
          const yearLevels =
            response.schoolStructure.yearLevels;

          const blocks =
            response.schoolStructure.blocks;

          const courses =
            response.schoolStructure.courses;

          if (
            Array.isArray(yearLevels) &&
            yearLevels.length > 0
          ) {
            setYearLevelChoices(yearLevels);
          }

          if (
            Array.isArray(blocks) &&
            blocks.length > 0
          ) {
            setBlockChoices(blocks);
          }

          if (Array.isArray(courses)) {
            setCourseChoices(courses.map(normalizeCourse));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "SCHOOL STRUCTURE LOAD ERROR:",
            err
          );

          setYearLevelChoices(DEFAULT_YEAR_LEVELS);
          setBlockChoices(DEFAULT_BLOCKS);
        }
      }
    };

    loadSchoolStructure();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===========================================================
  // HANDLE INPUT
  // ===========================================================

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const updated = { ...current };

      delete updated[field];

      return updated;
    });

    setError("");
  };

  // ===========================================================
  // CONVERT YEAR LEVEL TO NUMBER
  //
  // First Year  = 1
  // Second Year = 2
  // Third Year  = 3
  // Fourth Year = 4
  // ===========================================================

  const getYearLevelNumber = (yearLevel) => {
    switch (yearLevel) {
      case "First Year":
        return 1;

      case "Second Year":
        return 2;

      case "Third Year":
        return 3;

      case "Fourth Year":
        return 4;

      default:
        return null;
    }
  };

  // ===========================================================
  // VALIDATE FORM
  // ===========================================================

  const validate = () => {
    const errors = {};

    const name = form.name.trim();
    const studentId = form.studentId.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    const confirmPassword =
      form.confirmPassword.trim();

    // ---------------------------------------------------------
    // NAME
    // ---------------------------------------------------------

    if (!name) {
      errors.name =
        "Please enter the student's full name.";
    }

    // ---------------------------------------------------------
    // STUDENT ID
    // ---------------------------------------------------------

    if (!studentId) {
      errors.studentId =
        "Please enter the Student ID.";
    }

    // ---------------------------------------------------------
    // EMAIL
    // ---------------------------------------------------------

    if (!email) {
      errors.email =
        "Please enter the student's email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email =
        "Please enter a valid email address.";
    }

    // ---------------------------------------------------------
    // YEAR LEVEL
    // ---------------------------------------------------------

    if (!form.grade) {
      errors.grade =
        "Please select a Year Level.";
    } else if (
      !getYearLevelNumber(form.grade)
    ) {
      errors.grade =
        "Please select a valid Year Level.";
    }

    // ---------------------------------------------------------
    // BLOCK
    // ---------------------------------------------------------

    if (!form.section) {
      errors.section =
        "Please select a Block.";
    }

    // ---------------------------------------------------------
    // PASSWORD
    // ---------------------------------------------------------

    if (!password) {
      errors.password =
        "Please enter a password.";
    } else if (password.length < 6) {
      errors.password =
        "Password must be at least 6 characters long.";
    }

    // ---------------------------------------------------------
    // CONFIRM PASSWORD
    // ---------------------------------------------------------

    if (!confirmPassword) {
      errors.confirmPassword =
        "Please confirm the password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword =
        "Passwords do not match.";
    }

    return errors;
  };

  // ===========================================================
  // SUBMIT
  // ===========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || success) {
      return;
    }

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setError("");

    try {
      setSubmitting(true);

      const yearLevel =
        form.grade.trim();

      const block =
        form.section.trim();

      const yearLevelNumber =
        getYearLevelNumber(yearLevel);

      // =======================================================
      // IMPORTANT
      //
      // Laravel expects:
      //
      // student_id
      // year_level
      //
      // NOT:
      //
      // studentId
      // yearLevel
      // =======================================================

      const payload = {
        name: form.name.trim(),

        student_id:
          form.studentId.trim(),

        email:
          form.email.trim(),

        password:
          form.password.trim(),

        password_confirmation:
          form.confirmPassword.trim(),

        role: "student",

        course:
          form.course.trim() || null,

        year_level:
          yearLevelNumber,

        // Readable college year level
        grade:
          yearLevel,

        // Block 1, Block 2, etc.
        section:
          block,
      };

      console.log(
        "ADMIN ADD STUDENT PAYLOAD:",
        payload
      );

      const result =
        await registerUser(payload);

      console.log(
        "ADMIN ADD STUDENT RESPONSE:",
        result
      );

      // =======================================================
      // SUCCESS
      // =======================================================

      if (result?.success) {
        setSuccess(true);

        setTimeout(() => {
          onRegistered?.();
          onClose?.();
        }, 1200);

        return;
      }

      setError(
        result?.message ||
          "Registration failed. Please try again."
      );
    } catch (err) {
      console.error(
        "ADMIN ADD STUDENT ERROR:",
        err
      );

      const response =
        err?.response;

      // =======================================================
      // VALIDATION ERROR
      // =======================================================

      if (response?.status === 422) {
        const laravelErrors =
          response.data?.errors || {};

        const mappedErrors = {};

        Object.entries(
          laravelErrors
        ).forEach(([key, messages]) => {
          const firstMessage =
            Array.isArray(messages)
              ? messages[0]
              : String(messages);

          if (key === "student_id") {
            mappedErrors.studentId =
              "Student ID is already registered.";
          } else if (key === "email") {
            if (
              /taken|exists/i.test(
                firstMessage
              )
            ) {
              mappedErrors.email =
                "Email is already registered.";
            } else {
              mappedErrors.email =
                firstMessage;
            }
          } else if (key === "year_level") {
            mappedErrors.grade =
              firstMessage;
          } else if (key === "section") {
            mappedErrors.section =
              firstMessage;
          } else if (key === "name") {
            mappedErrors.name =
              firstMessage;
          } else if (key === "password") {
            mappedErrors.password =
              firstMessage;
          } else if (
            key === "password_confirmation"
          ) {
            mappedErrors.confirmPassword =
              firstMessage;
          } else {
            mappedErrors[key] =
              firstMessage;
          }
        });

        setFieldErrors(mappedErrors);

        setError(
          Object.keys(mappedErrors).length > 0
            ? "Please fix the highlighted fields and try again."
            : response.data?.message ||
                "Please check your information."
        );

        return;
      }

      // =======================================================
      // SERVER ERROR
      // =======================================================

      if (response?.status >= 500) {
        setError(
          response.data?.message ||
            "The server encountered an error. Please try again."
        );

        return;
      }

      // =======================================================
      // CONNECTION ERROR
      // =======================================================

      if (!response) {
        setError(
          "Unable to connect to the Laravel server. Please make sure the backend is running."
        );

        return;
      }

      setError(
        response.data?.message ||
          "Unable to register the student. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===========================================================
  // RENDER
  // ===========================================================

  return (
    <div
      className="admin-modal-overlay"
      onClick={handleClose}
    >
      <div
        className="admin-modal admin-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="admin-modal-header">
          <div>
            <h3 id="add-student-title">
              Add Student
            </h3>

            <p>
              Register a new student account.
            </p>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={handleClose}
            disabled={
              submitting || success
            }
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {success ? (
          <div
            className="admin-alert admin-alert-success"
            role="status"
          >
            Student registered successfully.
          </div>
        ) : (
          <>
            {/* =================================================
                ERROR
            ================================================= */}

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
              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div className="admin-field">
                <label
                  htmlFor="add-student-name"
                  className="admin-label"
                >
                  Full Name *
                </label>

                <input
                  id="add-student-name"
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.name}
                  onChange={handleChange("name")}
                  disabled={
                    submitting || success
                  }
                  autoFocus
                />

                {fieldErrors.name && (
                  <p className="ek-form-error">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* =================================================
                  STUDENT ID
              ================================================= */}

              <div className="admin-field">
                <label
                  htmlFor="add-student-id"
                  className="admin-label"
                >
                  Student ID *
                </label>

                <input
                  id="add-student-id"
                  type="text"
                  className="admin-input"
                  placeholder="e.g. 2026-001"
                  value={form.studentId}
                  onChange={handleChange(
                    "studentId"
                  )}
                  disabled={
                    submitting || success
                  }
                />

                {fieldErrors.studentId && (
                  <p className="ek-form-error">
                    {fieldErrors.studentId}
                  </p>
                )}
              </div>

              {/* =================================================
                  COURSE
              ================================================= */}

              <div className="admin-field">
                <label
                  htmlFor="add-student-course"
                  className="admin-label"
                >
                  Course
                </label>

                <select
                  id="add-student-course"
                  className="admin-input"
                  value={form.course}
                  onChange={handleChange(
                    "course"
                  )}
                  disabled={
                    submitting || success
                  }
                >
                  <option value="">
                    Select course
                  </option>

                  {courseChoices.map((c) => {
                    const normalized = normalizeCourse(c);
                    const value =
                      normalized.name || normalized.abbreviation;
                    return (
                      <option
                        key={value || normalized.id}
                        value={value}
                      >
                        {courseLabel(normalized)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* =================================================
                  YEAR LEVEL / BLOCK
              ================================================= */}

              <div className="admin-form-grid">
                {/* YEAR LEVEL */}

                <div className="admin-field">
                  <label
                    htmlFor="add-student-year-level"
                    className="admin-label"
                  >
                    Year Level *
                  </label>

                  <select
                    id="add-student-year-level"
                    className="admin-input"
                    value={form.grade}
                    onChange={handleChange(
                      "grade"
                    )}
                    disabled={
                      submitting || success
                    }
                  >
                    <option value="">
                      Select Year Level
                    </option>

                    {yearLevelChoices.map(
                      (level) => (
                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>
                      )
                    )}
                  </select>

                  {fieldErrors.grade && (
                    <p className="ek-form-error">
                      {fieldErrors.grade}
                    </p>
                  )}
                </div>

                {/* BLOCK */}

                <div className="admin-field">
                  <label
                    htmlFor="add-student-block"
                    className="admin-label"
                  >
                    Block *
                  </label>

                  <select
                    id="add-student-block"
                    className="admin-input"
                    value={form.section}
                    onChange={handleChange(
                      "section"
                    )}
                    disabled={
                      submitting || success
                    }
                  >
                    <option value="">
                      Select Block
                    </option>

                    {blockChoices.map(
                      (block) => (
                        <option
                          key={block}
                          value={block}
                        >
                          {block}
                        </option>
                      )
                    )}
                  </select>

                  {fieldErrors.section && (
                    <p className="ek-form-error">
                      {fieldErrors.section}
                    </p>
                  )}
                </div>
              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="admin-field">
                <label
                  htmlFor="add-student-email"
                  className="admin-label"
                >
                  Email Address *
                </label>

                <input
                  id="add-student-email"
                  type="email"
                  className="admin-input"
                  placeholder="e.g. juan@school.edu"
                  value={form.email}
                  onChange={handleChange("email")}
                  disabled={
                    submitting || success
                  }
                />

                {fieldErrors.email && (
                  <p className="ek-form-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="admin-field">
                <label
                  htmlFor="add-student-password"
                  className="admin-label"
                >
                  Password *
                </label>

                <div className="admin-field-relative">
                  <input
                    id="add-student-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    className="admin-input admin-input-with-toggle"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange(
                      "password"
                    )}
                    disabled={
                      submitting || success
                    }
                  />

                  <button
                    type="button"
                    className="admin-input-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={
                      submitting || success
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 2l14 14M7.2 7.2a3 3 0 004.1 4.1M4.5 5.6C2.8 6.8 1.5 9 1.5 9s2.3 4.5 7.5 4.5c1.3 0 2.5-.3 3.6-.8M13.5 12.4c1.2-1 2-2.4-2.5-3.4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1.5 9s2.3-4.5 7.5-4.5S16.5 9 16.5 9s-2.3 4.5-7.5 4.5S1.5 9 1.5 9z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />

                        <circle
                          cx="9"
                          cy="9"
                          r="2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {fieldErrors.password && (
                  <p className="ek-form-error">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              <div className="admin-field">
                <label
                  htmlFor="add-student-confirm-password"
                  className="admin-label"
                >
                  Confirm Password *
                </label>

                <input
                  id="add-student-confirm-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="admin-input"
                  placeholder="Re-enter the password"
                  value={
                    form.confirmPassword
                  }
                  onChange={handleChange(
                    "confirmPassword"
                  )}
                  disabled={
                    submitting || success
                  }
                />

                {fieldErrors.confirmPassword && (
                  <p className="ek-form-error">
                    {
                      fieldErrors.confirmPassword
                    }
                  </p>
                )}
              </div>

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={handleClose}
                  disabled={
                    submitting || success
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={
                    submitting || success
                  }
                >
                  {submitting
                    ? "Registering..."
                    : "Register Student"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
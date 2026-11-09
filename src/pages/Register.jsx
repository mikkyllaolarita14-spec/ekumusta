import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { registerUser } from "../api/auth";
import {
  getSchoolStructure,
} from "../api/settings";
import {
  DEFAULT_YEAR_LEVELS,
  DEFAULT_BLOCKS,
  DEFAULT_COURSES,
  normalizeCourse,
  courseLabel,
} from "../utils/labels";


export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [course, setCourse] = useState("");
  const [grade, setGrade] = useState(""); // stores the selected Year Level value (internal field name kept for API compatibility)
  const [section, setSection] = useState(""); // stores the selected Block value (internal field name kept for API compatibility)
  const [yearLevelChoices, setYearLevelChoices] = useState(DEFAULT_YEAR_LEVELS);
  const [blockChoices, setBlockChoices] = useState(DEFAULT_BLOCKS);
  const [courseChoices, setCourseChoices] = useState(DEFAULT_COURSES);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setShakeError(true);
      const timer = setTimeout(() => setShakeError(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load the college Year Level / Block / Course options from the school structure.
  useEffect(() => {
    let cancelled = false;

    getSchoolStructure()
      .then((data) => {
        if (cancelled) return;          if (data?.success && data.schoolStructure) {
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
    setError("");

    const trimmedName = fullName.trim();
    const trimmedId = studentId.trim();
    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    // Validation
    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }
    if (!trimmedId) {
      setError("Please enter your Student ID.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!course.trim()) {
      setError("Please select a course.");
      return;
    }
    if (!trimmedPass) {
      setError("Please enter a password.");
      return;
    }
    if (trimmedPass.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (trimmedPass !== trimmedConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

     try {
        const result = await registerUser({
            name: trimmedName,
            studentId: trimmedId,
            email: trimmedEmail,
            password: trimmedPass,
            password_confirmation: trimmedConfirm,
            role: "student",
            course: course.trim(),
            yearLevel: null,
            grade: grade.trim(),
            section: section.trim(),
        });

        if (result.success) {
            setSuccess(true);
        } else {
            setError(
                result.message || "Registration failed. Please try again."
            );
        }
    } catch (error) {
        const response = error?.response;

        if (response?.status === 422) {
            const errors = response.data?.errors;

            if (errors) {
                const firstError = Object.values(errors).flat()[0];
                setError(firstError || "Please check your information.");
            } else {
                setError(
                    response.data?.message ||
                    "Please check your information."
                );
            }
        } else {
            setError(
                "Unable to connect to the server. Please try again later."
            );
        }
    } finally {
        setIsSubmitting(false);
    }
};

  return (
    <AuthLayout showBackToHome>
      {/* ── Success View ──────────────────────────────────────────────── */}
      {success ? (
        <div className="auth-success">
          <div className="auth-success-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="24" cy="24" r="24" fill="#22c55e" opacity="0.1" />
              <circle cx="24" cy="24" r="18" fill="#22c55e" opacity="0.2" />
              <path
                d="M16 24l6 6 10-12"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="auth-card-title">Account Created</h2>
          <p className="auth-card-description">
            Your account has been successfully registered.
            <br />
            You can now log in to get started.
          </p>
          <button
            className="auth-btn auth-btn-primary"
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to Login
          </button>
          <div className="auth-links">
            <Link to="/login" className="auth-link">
              ← Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h2 className="auth-card-title">Create Account</h2>
          <p className="auth-card-description">
            Register to start your wellness check-ins.
          </p>

          {/* Error Message */}
          <div className={`auth-alert-wrapper ${shakeError ? "auth-shake" : ""}`}>
            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9 5v4M9 11.5v.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="reg-fullname" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="reg-fullname"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            {/* Student ID */}
            <div className="auth-field">
              <label htmlFor="reg-studentid" className="auth-label">
                Student ID
              </label>
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="9" y1="4" x2="9" y2="20" />
                </svg>
                <input
                  id="reg-studentid"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. 2024-001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Course */}
            <div className="auth-field">
              <label htmlFor="reg-course" className="auth-label">
                Course
              </label>
              <div className="auth-input-wrapper">
                <select
                  id="reg-course"
                  className="auth-input"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select your course</option>
                  {courseChoices.map((c) => {
                    const normalized = normalizeCourse(c);
                    const value = normalized.name || normalized.abbreviation;
                    return (
                      <option key={value || normalized.id} value={value}>
                        {courseLabel(normalized)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Year Level / Block */}
            <div className="auth-field">
              <div className="admin-form-grid" style={{ gap: "12px" }}>
                <div>
                  <label htmlFor="reg-grade" className="auth-label">
                    Year Level
                  </label>
                  <div className="auth-input-wrapper">
                    <select
                      id="reg-grade"
                      className="auth-input"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Not set</option>
                      {yearLevelChoices.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-section" className="auth-label">
                    Block
                  </label>
                  <div className="auth-input-wrapper">
                    <select
                      id="reg-section"
                      className="auth-input"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Not set</option>
                      {blockChoices.map((block) => (
                        <option key={block} value={block}>
                          {block}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4l-10 8L2 4" />
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  placeholder="e.g. juan.delacruz@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
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
                        d="M2 2l14 14M7.2 7.2a3 3 0 004.1 4.1M4.5 5.6C2.8 6.8 1.5 9 1.5 9s2.3 4.5 7.5 4.5c1.3 0 2.5-.3 3.6-.8M13.5 12.4c1.2-1 2-2.4 2.5-3.4-.7-1.5-2.3-3.5-5-3.5-.7 0-1.3.1-1.9.3"
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
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="reg-confirm-password" className="auth-label">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reg-confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="auth-field-hint auth-field-hint-error">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="auth-btn-spinner" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="auth-links">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../components/ProtectedRoute";
import { loginUser } from "../api/auth";
import AuthBranding from "../components/AuthBranding";

export default function Login() {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  const isLoading = isSubmitting || authLoading;

  // Page load entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setShakeError(true);
      const timer = setTimeout(() => setShakeError(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const trimmedEmail = identifier.trim();
  const trimmedPass = password.trim();

  if (!trimmedEmail) {
    setError("Please enter your email address.");
    return;
  }

  if (!trimmedPass) {
    setError("Please enter your password.");
    return;
  }

  setIsSubmitting(true);

  try {
    // Laravel login API
    const result = await login(trimmedEmail, trimmedPass);

    console.log("LOGIN RESPONSE:", result);

    if (result.success && result.user) {
      // Store authentication data for AuthContext / protected routes
      localStorage.setItem("user", JSON.stringify(result.user));

      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      setLoginSuccess(true);

      const dashboardPath = getDashboardPath(result.user.role);

      setTimeout(() => {
        navigate(dashboardPath, { replace: true });
      }, 600);
    } else {
      setError(
        result.message || "Invalid email or password. Please try again."
      );
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    const response = error?.response;

    if (response?.status === 422) {
      const validationErrors = response.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors).flat()[0];

        setError(
          firstError ||
            response.data?.message ||
            "Please check your login information."
        );
      } else {
        setError(
          response.data?.message ||
            "Please check your login information."
        );
      }
    } else if (response?.status === 401) {
      setError("Invalid email or password. Please try again.");
    } else if (!response) {
      setError(
        "Unable to connect to the server. Make sure the Laravel backend is running."
      );
    } else {
      setError(
        response.data?.message ||
          "Something went wrong. Please try again later."
      );
    }
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="login-page">
      {/* ── Left Branding Panel ──────────────────────────────────────── */}
      <AuthBranding visible={pageLoaded} />

      {/* ── Right Login Panel ────────────────────────────────────────── */}
      <div className={`login-panel ${pageLoaded ? "login-panel-visible" : ""}`}>
        <div className="login-panel-content">
          {/* Portal label */}
          <div className="login-portal-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Educator &amp; Staff Portal</span>
          </div>

          {/* Welcome heading */}
          <h2 className="login-welcome-title">Welcome back.</h2>
          <p className="login-welcome-description">
            Log in to view check-ins and manage student cases.
          </p>

          {/* Error Message with shake */}
          <div className={`login-alert-wrapper ${shakeError ? "login-shake" : ""}`}>
            {error && (
              <div className="login-alert" role="alert">
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Identifier Field */}
            <div className="login-field">
              <label htmlFor="login-identifier" className="login-label">
  Email address
</label>
              <div className="login-input-icon-wrapper">
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login-identifier"
                  type="text"
                  className="login-input login-input-animated"
                 placeholder="Enter your email address"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <div className="login-input-icon-wrapper">
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="login-input login-input-animated login-input-password"
                  placeholder="Enter your password or PIN"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={`login-toggle-password ${showPassword ? "login-toggle-visible" : ""}`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M2 2l14 14M7.2 7.2a3 3 0 004.1 4.1M4.5 5.6C2.8 6.8 1.5 9 1.5 9s2.3 4.5 7.5 4.5c1.3 0 2.5-.3 3.6-.8M13.5 12.4c1.2-1 2-2.4 2.5-3.4-.7-1.5-2.3-3.5-5-3.5-.7 0-1.3.1-1.9.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M1.5 9s2.3-4.5 7.5-4.5S16.5 9 16.5 9s-2.3 4.5-7.5 4.5S1.5 9 1.5 9z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options-row">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  className="login-checkbox-hidden"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className={`login-checkbox-custom ${rememberMe ? "login-checkbox-checked" : ""}`}>
                  {rememberMe && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="login-checkbox-text">Remember me</span>
              </label>
              <Link to="/forgot-password" className="login-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-submit-btn ${loginSuccess ? "login-submit-success" : ""}`}
              disabled={isLoading || loginSuccess}
            >
              {loginSuccess ? (
                <span className="login-success-content">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="login-success-check">
                    <path d="M4 10L8.5 14.5L16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Opening...</span>
                </span>
              ) : isSubmitting ? (
                <span className="login-loading-content">
                  <span className="login-loading-dots">
                    <span className="login-dot" />
                    <span className="login-dot" />
                    <span className="login-dot" />
                  </span>
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="login-btn-content">
                  Log in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-btn-arrow">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Role Information */}
          <div className="login-role-info">
            <div className="login-divider" />
            <p>Your role is determined by your account</p>
          </div>

          {/* Decorative check-in visual */}
          <div className="login-checkin-visual">
            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="login-checkin-icon">
              <circle cx="30" cy="20" r="4" fill="var(--ek-accent)" opacity="0.6" className="login-pulse-center" />
              <circle cx="15" cy="12" r="2.5" fill="var(--ek-primary)" opacity="0.4" />
              <circle cx="45" cy="12" r="2.5" fill="var(--ek-primary)" opacity="0.4" />
              <circle cx="15" cy="30" r="2.5" fill="var(--ek-primary)" opacity="0.3" />
              <circle cx="45" cy="30" r="2.5" fill="var(--ek-primary)" opacity="0.3" />
              <line x1="15" y1="12" x2="30" y2="20" stroke="var(--ek-primary)" strokeWidth="0.5" opacity="0.3" />
              <line x1="45" y1="12" x2="30" y2="20" stroke="var(--ek-primary)" strokeWidth="0.5" opacity="0.3" />
              <line x1="15" y1="30" x2="30" y2="20" stroke="var(--ek-primary)" strokeWidth="0.5" opacity="0.3" />
              <line x1="45" y1="30" x2="30" y2="20" stroke="var(--ek-primary)" strokeWidth="0.5" opacity="0.3" />
            </svg>
            <p className="login-checkin-text">One question. Every day.</p>
          </div>

          {/* Student Information Card */}
          <div className="login-student-info">
            <div className="login-student-info-icons">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <p>
              Students can check-in via the e-Kumusta mobile app or a dedicated
              student kiosk terminal.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

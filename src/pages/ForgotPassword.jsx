import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  forgotPassword,
  verifyOtp as apiVerifyOtp,
  resetPassword as apiResetPassword,
} from "../api/auth";
import AuthBranding from "../components/AuthBranding";
import "./ForgotPassword.css";

// ==========================================================
// COLORS (from Flutter design)
// ==========================================================

const COLORS = {
  navy: "#1F2B46",
  blue: "#3E6A9E",
  teal: "#62C3BE",
  background: "#EAF7F7",
  textDark: "#1F2937",
  textSecondary: "#64748B",
  border: "#D7E3E4",
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [resetToken, setResetToken] = useState(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Resend cooldown (seconds remaining before "Resend" becomes clickable)
  const RESEND_COOLDOWN = 60;
  const [resendSeconds, setResendSeconds] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Page load entrance animation (same as Login)
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================================
  // SNACKBAR (toast) — replaces Flutter's ScaffoldMessenger
  // ==========================================================

  const [snackbar, setSnackbar] = useState(null); // { message, success }

  useEffect(() => {
    if (!snackbar) return undefined;

    const timer = setTimeout(() => {
      setSnackbar(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [snackbar]);

  const showMessage = (message, success = false) => {
    setSnackbar({ message, success });
  };

  // ==========================================================
  // RESEND COOLDOWN TIMER
  // ==========================================================

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = setTimeout(() => {
      setResendSeconds((s) => s - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  // ==========================================================
  // SEND OTP
  // ==========================================================

  const sendOtp = async (e) => {
    e?.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showMessage("Please enter your email address.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      showMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(trimmedEmail);

      setIsLoading(false);
      setCurrentStep(1);
      setResendSeconds(RESEND_COOLDOWN);

      showMessage(
        "If the account exists, a verification code has been sent to your email.",
        true
      );
    } catch (err) {
      setIsLoading(false);
      showMessage(extractErrorMessage(err));
    }
  };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || isLoading) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showMessage("Please go back and enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(trimmedEmail);

      setResendSeconds(RESEND_COOLDOWN);
      setIsLoading(false);

      showMessage("A new verification code has been sent to your email.", true);
    } catch (err) {
      setIsLoading(false);
      showMessage(extractErrorMessage(err));
    }
  };

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (trimmedOtp.length !== 6) {
      showMessage("Please enter the 6-digit OTP.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiVerifyOtp(trimmedEmail, trimmedOtp);

      const token = result?.reset_token;

      if (!token || token.toString().trim() === "") {
        throw new Error(
          "Verification succeeded but no reset token was returned."
        );
      }

      setResetToken(token.toString());
      setIsLoading(false);
      setCurrentStep(2);
    } catch (err) {
      setIsLoading(false);
      showMessage(extractErrorMessage(err));
    }
  };

  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  const handleResetPassword = async (e) => {
    e?.preventDefault();

    const trimmedEmail = email.trim();

    if (!password) {
      showMessage("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      showMessage(
        "Your verification session has expired. Please request a new OTP."
      );
      return;
    }

    setIsLoading(true);

    try {
      await apiResetPassword(
        trimmedEmail,
        resetToken,
        password,
        confirmPassword
      );

      setIsLoading(false);

      showMessage("Password changed successfully.", true);

      // Small delay like the Flutter version, then go to login
      await new Promise((resolve) => setTimeout(resolve, 700));

      navigate("/login", { replace: true });
    } catch (err) {
      setIsLoading(false);
      showMessage(extractErrorMessage(err));
    }
  };

  // ==========================================================
  // ERROR MESSAGE EXTRACTOR
  // (mirrors Flutter's e.toString().replaceFirst('Exception: ', ''))
  // ==========================================================

  const extractErrorMessage = (err) => {
    // Laravel validation errors (422)
    if (err?.response?.data?.errors) {
      const firstField = Object.keys(err.response.data.errors)[0];

      if (firstField) {
        return err.response.data.errors[firstField][0];
      }
    }

    if (err?.response?.data?.message) {
      return err.response.data.message;
    }

    if (err?.message) {
      return err.message;
    }

    return "Something went wrong. Please try again.";
  };

  // ==========================================================
  // STEP INDICATOR PIECES
  // ==========================================================

  const stepCircle = (number, active) => (
    <div
      className={`fp-step-circle ${active ? "fp-step-circle-active" : ""}`}
    >
      {number}
    </div>
  );

  const stepLine = (active) => (
    <div className={`fp-step-line ${active ? "fp-step-line-active" : ""}`} />
  );

  // ==========================================================
  // INPUT ICONS (inline SVG — replaces Flutter icons)
  // ==========================================================

  const EmailIcon = () => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke={COLORS.blue} strokeWidth="1.8" />
      <path d="M3.5 7l8.5 6 8.5-6" stroke={COLORS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8.6-7 10-4-1.4-7-5.5-7-10V6l7-3z" stroke={COLORS.blue} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={COLORS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const LockIcon = () => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke={COLORS.blue} strokeWidth="1.8" />
      <path d="M8 10.5V8a4 4 0 118 0v2.5" stroke={COLORS.blue} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  const EyeIcon = ({ off }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"
        stroke={COLORS.textSecondary}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={COLORS.textSecondary} strokeWidth="1.8" />
      {off && (
        <path
          d="M4 4l16 16"
          stroke={COLORS.textSecondary}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );

  const ArrowIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2.2" />
      <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ResetIcon = () => (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="#fff" strokeWidth="1.9" />
      <path d="M8 10.5V8a4 4 0 118 0v2.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 14.5v2.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9.5 15.5l1.3 1.3H13.4L14.5 15.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
      <path d="M17.5 2.5a5.5 5.5 0 013.5 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
    </svg>
  );

  // ==========================================================
  // BUILD
  // ==========================================================

  return (
    <div className="login-page">
      {/* ── Snackbar / Toast ──────────────────────────────────── */}
      {snackbar && (
        <div
          className={`fp-snackbar ${snackbar.success ? "fp-snackbar-success" : ""}`}
          role="status"
        >
          {snackbar.message}
        </div>
      )}

      {/* ── Left Branding Panel (e-Kumusta design from Login) ─── */}
      <AuthBranding visible={pageLoaded} />

      {/* ── Right Panel: Forgot Password ──────────────────────── */}
      <div className={`login-panel ${pageLoaded ? "login-panel-visible" : ""}`}>
        <div className="login-panel-content fp-panel-content">
          <div className="fp-container">
        {/* ── Icon ────────────────────────────────────────────── */}
        <div className="fp-icon-badge">
          <ResetIcon />
        </div>

        {/* ── Title ───────────────────────────────────────────── */}
        <h1 className="fp-title">Forgot Password?</h1>

        <p className="fp-subtitle">
          {currentStep === 0 &&
            "Enter your email and we will send you a verification code."}
          {currentStep === 1 &&
            "Enter the 6-digit code sent to your email."}
          {currentStep === 2 &&
            "Create a new password for your account."}
        </p>

        {/* ── Card ────────────────────────────────────────────── */}
        <div className="fp-card">
          {/* Step indicator */}
          <div className="fp-step-row">
            {stepCircle("1", currentStep >= 0)}
            {stepLine(currentStep >= 1)}
            {stepCircle("2", currentStep >= 1)}
            {stepLine(currentStep >= 2)}
            {stepCircle("3", currentStep >= 2)}
          </div>

          {/* ── STEP 1: EMAIL ─────────────────────────────────── */}
          {currentStep === 0 && (
            <form className="fp-step-form" onSubmit={sendOtp} noValidate>
              <label className="fp-label" htmlFor="fp-email">
                Email Address
              </label>
              <div className="fp-input-wrapper">
                <span className="fp-input-icon">
                  <EmailIcon />
                </span>
                <input
                  id="fp-email"
                  type="email"
                  className="fp-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="fp-action-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="fp-spinner" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ───────────────────────────────────── */}
          {currentStep === 1 && (
            <form className="fp-step-form" onSubmit={handleVerifyOtp} noValidate>
              <label className="fp-label" htmlFor="fp-otp">
                Verification Code
              </label>
              <div className="fp-input-wrapper">
                <span className="fp-input-icon">
                  <ShieldIcon />
                </span>
                <input
                  id="fp-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="fp-input fp-input-otp"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <p className="fp-email-hint">{email.trim()}</p>

              <p className="fp-resend-row">
                Didn't receive a code?{" "}
                {resendSeconds > 0 ? (
                  <span className="fp-resend-timer">
                    Resend in {resendSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="fp-resend-link"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                )}
              </p>

              <button
                type="submit"
                className="fp-action-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="fp-spinner" />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <CheckCircleIcon />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 3: NEW PASSWORD ──────────────────────────── */}
          {currentStep === 2 && (
            <form
              className="fp-step-form"
              onSubmit={handleResetPassword}
              noValidate
            >
              <label className="fp-label" htmlFor="fp-password">
                New Password
              </label>
              <div className="fp-input-wrapper">
                <span className="fp-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="fp-password"
                  type={hidePassword ? "password" : "text"}
                  className="fp-input fp-input-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  className="fp-toggle-password"
                  onClick={() => setHidePassword(!hidePassword)}
                  aria-label={hidePassword ? "Show password" : "Hide password"}
                  disabled={isLoading}
                >
                  <EyeIcon off={hidePassword} />
                </button>
              </div>

              <label className="fp-label fp-label-gap" htmlFor="fp-confirm-password">
                Confirm Password
              </label>
              <div className="fp-input-wrapper">
                <span className="fp-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="fp-confirm-password"
                  type={hideConfirmPassword ? "password" : "text"}
                  className="fp-input fp-input-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="fp-toggle-password"
                  onClick={() =>
                    setHideConfirmPassword(!hideConfirmPassword)
                  }
                  aria-label={
                    hideConfirmPassword ? "Show password" : "Hide password"
                  }
                  disabled={isLoading}
                >
                  <EyeIcon off={hideConfirmPassword} />
                </button>
              </div>

              <button
                type="submit"
                className="fp-action-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="fp-spinner" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <CheckIcon />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ── Back to Login ───────────────────────────────────── */}
        <button
          className="fp-back-link"
          onClick={() => navigate("/login", { replace: true })}
          disabled={isLoading}
        >
          Back to Login
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}

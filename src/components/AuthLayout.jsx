import { Link } from "react-router-dom";
import Logo from "./Logo";

/**
 * AuthLayout
 * Consistent layout wrapper for authentication pages (login, activate, reset).
 * Provides branding, calm design, and centered content.
 */
export default function AuthLayout({ children, showBackToHome = false }) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Branding */}
        <div className="auth-branding">
          <div className="auth-logo">
            <Logo size={72} />
          </div>
          <h1 className="auth-title">e-Kumusta</h1>
          <p className="auth-subtitle">Your Wellness. Your Support.</p>
        </div>

        {/* Card */}
        <div className="auth-card">{children}</div>

        {/* Footer */}
        {showBackToHome && (
          <div className="auth-footer">
            <Link to="/" className="auth-link-secondary">
              ← Back to Home
            </Link>
          </div>
        )}

        <p className="auth-copyright">
          © {new Date().getFullYear()} e-Kumusta &middot; Student Mental Health
          Management System
        </p>
      </div>
    </div>
  );
}

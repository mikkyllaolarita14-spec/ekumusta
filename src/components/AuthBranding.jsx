import Logo from "./Logo";

/**
 * AuthBranding
 * The left-side branding panel shared by the auth pages
 * (Login, Forgot Password). Renders the animated navy panel
 * with the e-Kumusta brand content.
 */
export default function AuthBranding({ visible = true }) {
  return (
    <div className="login-branding">
      {/* Animated radial pulse rings */}
      <div className="login-branding-rings">
        <div className="login-ring login-ring-1" />
        <div className="login-ring login-ring-2" />
        <div className="login-ring login-ring-3" />
        <div className="login-ring login-ring-4" />
        <div className="login-ring-glow" />
      </div>

      {/* Connected check-in network visualization */}
      <svg
        className="login-network"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Connection lines */}
        <line x1="120" y1="180" x2="200" y2="140" stroke="rgba(224,164,88,0.15)" strokeWidth="1" className="login-network-line" />
        <line x1="200" y1="140" x2="280" y2="170" stroke="rgba(224,164,88,0.12)" strokeWidth="1" className="login-network-line" />
        <line x1="280" y1="170" x2="300" y2="240" stroke="rgba(224,164,88,0.10)" strokeWidth="1" className="login-network-line" />
        <line x1="120" y1="180" x2="150" y2="260" stroke="rgba(224,164,88,0.12)" strokeWidth="1" className="login-network-line" />
        <line x1="150" y1="260" x2="200" y2="300" stroke="rgba(224,164,88,0.10)" strokeWidth="1" className="login-network-line" />
        <line x1="200" y1="140" x2="180" y2="80" stroke="rgba(224,164,88,0.08)" strokeWidth="1" className="login-network-line" />
        <line x1="280" y1="170" x2="340" y2="120" stroke="rgba(224,164,88,0.08)" strokeWidth="1" className="login-network-line" />

        {/* Network nodes */}
        <circle cx="200" cy="200" r="6" fill="#E0A458" className="login-center-pulse" />
        <circle cx="200" cy="200" r="12" fill="none" stroke="rgba(224,164,88,0.2)" strokeWidth="1" className="login-center-ring" />

        <circle cx="120" cy="180" r="4" fill="rgba(224,164,88,0.6)" className="login-node login-node-1" />
        <circle cx="200" cy="140" r="3.5" fill="rgba(224,164,88,0.5)" className="login-node login-node-2" />
        <circle cx="280" cy="170" r="4" fill="rgba(224,164,88,0.6)" className="login-node login-node-3" />
        <circle cx="300" cy="240" r="3" fill="rgba(224,164,88,0.4)" className="login-node login-node-4" />
        <circle cx="150" cy="260" r="3.5" fill="rgba(224,164,88,0.5)" className="login-node login-node-5" />
        <circle cx="200" cy="300" r="3" fill="rgba(224,164,88,0.4)" className="login-node login-node-6" />
        <circle cx="180" cy="80" r="2.5" fill="rgba(224,164,88,0.35)" className="login-node login-node-7" />
        <circle cx="340" cy="120" r="2.5" fill="rgba(224,164,88,0.35)" className="login-node login-node-8" />
      </svg>

      {/* Floating micro-elements */}
      <div className="login-float login-float-1">✦</div>
      <div className="login-float login-float-2">·</div>
      <div className="login-float login-float-3">○</div>
      <div className="login-float login-float-4">✦</div>
      <div className="login-float login-float-5">·</div>
      <div className="login-float login-float-6">◦</div>

      {/* Branding content */}
      <div
        className={`login-branding-content ${
          visible ? "login-branding-visible" : ""
        }`}
      >
        <div className="login-brand-logo">
          <Logo size={110} />
        </div>
        <h1 className="login-brand-title">e-Kumusta</h1>
        <p className="login-brand-tagline">Kumusta ka?</p>
        <div className="login-gold-divider">
          <span className="login-gold-line" />
          <span className="login-gold-diamond">✦</span>
          <span className="login-gold-line" />
        </div>
        <p className="login-brand-description">
          A daily check-in system that helps schools notice, and act, before a
          quiet struggle becomes a crisis.
        </p>
        <p className="login-brand-subdescription">
          Isang tanong, araw-araw — one question, every day
        </p>
      </div>
    </div>
  );
}

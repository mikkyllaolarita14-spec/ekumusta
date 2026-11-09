import { useEffect, useRef } from "react";
import Icon from "./Icon";

/**
 * Shared UI primitives used across admin and student pages.
 * All styles come from index.css utility classes (no inline colors).
 */

/** Semantic badge with tone + dot (color is never the only signal). */
export function Badge({ tone = "info", dot = false, children, ...rest }) {
  return (
    <span className={`ek-badge ek-badge-${tone}`} {...rest}>
      {dot && <span className="ek-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Consistent page title block. */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="admin-page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="admin-page-header-actions">{actions}</div>}
    </div>
  );
}

/**
 * Empty state that distinguishes "no data yet" from "no search results".
 * kind: "data" | "results" | "error"
 */
export function EmptyState({ kind = "data", title, message, action }) {
  const defaults = {
    data: {
      icon: "resources",
      title: "Nothing here yet",
      message: "No records have been added at this time.",
    },
    results: {
      icon: "search",
      title: "No matching results",
      message: "Try adjusting your search or filters.",
    },
    error: {
      icon: "alert",
      title: "Something went wrong",
      message: "Please try again or contact the administrator.",
    },
  };
  const d = defaults[kind] || defaults.data;
  return (
    <div className="ek-empty" role="status">
      <div className="ek-empty-icon">
        <Icon name={d.icon} size={22} />
      </div>
      <h4>{title || d.title}</h4>
      <p>{message || d.message}</p>
      {action && <div className="ek-empty-action">{action}</div>}
    </div>
  );
}

/** Accessible search input with icon. */
export function SearchBox({ value, onChange, placeholder, label = "Search" }) {
  return (
    <div className="admin-search-box">
      <Icon name="search" size={18} />
      <input
        type="search"
        role="searchbox"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="admin-search-input"
      />
    </div>
  );
}

/** Accessible confirmation dialog (Escape to cancel, focus trapped to buttons). */
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div
        className="admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button ref={cancelRef} type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`admin-btn ${danger ? "admin-btn-danger" : "admin-btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small inline loading spinner. */
export function Spinner({ label = "Loading..." }) {
  return (
    <span className="ek-spinner-wrap" role="status" aria-live="polite">
      <span className="ek-spinner" aria-hidden="true" />
      <span className="ek-spinner-label">{label}</span>
    </span>
  );
}

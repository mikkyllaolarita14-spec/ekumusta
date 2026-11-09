/**
 * Central semantic status maps so every page renders the same
 * tone + label for check-in moods, case status/priority, alert
 * severity/status, and staff/student account status.
 * Tones map to .ek-badge-* classes in index.css.
 */

export const MOOD = {
  positive: { tone: "success", label: "Positive" },
  neutral: { tone: "info", label: "Neutral" },
  needs_attention: { tone: "warning", label: "Needs Attention" },
  high_concern: { tone: "danger", label: "High Concern" },
};

export const CASE_STATUS = {
  open: { tone: "primary", label: "Open" },
  in_progress: { tone: "info", label: "In Progress" },
  follow_up: { tone: "warning", label: "Follow-up" },
  resolved: { tone: "success", label: "Resolved" },
  closed: { tone: "neutral", label: "Closed" },
};

export const PRIORITY = {
  urgent: { tone: "danger", label: "Urgent" },
  high: { tone: "warning", label: "High" },
  medium: { tone: "warning", label: "Medium" },
  low: { tone: "success", label: "Low" },
};

export const ALERT_SEVERITY = {
  urgent: { tone: "danger", label: "Urgent" },
  high: { tone: "warning", label: "High" },
  medium: { tone: "warning", label: "Medium" },
  low: { tone: "success", label: "Low" },
};

// Alert statuses are the same as case statuses and stay connected to linked cases.
export const ALERT_STATUS = {
  open: { tone: "primary", label: "Open" },
  in_progress: { tone: "info", label: "In Progress" },
  resolved: { tone: "success", label: "Resolved" },
  closed: { tone: "neutral", label: "Closed" },
  follow_up: { tone: "warning", label: "Follow-up" },
  // Legacy/raw alert statuses (mapped to case-equivalent display)
  new: { tone: "primary", label: "Open" },
  acknowledged: { tone: "info", label: "In Progress" },
  reviewed: { tone: "info", label: "In Progress" },
};

export const RESOURCE_CATEGORY = {
  General: { label: "General" },
  "Mental Health": { label: "Mental Health" },
  "Stress Management": { label: "Stress Management" },
  "Study Tips": { label: "Study Tips" },
  "Sleep Hygiene": { label: "Sleep Hygiene" },
};

/** Map arbitrary status keys to badge tones (case-insensitive, hyphen/space safe). */
export function toneFor(key) {
  const k = String(key || "").toLowerCase().replace(/[\s-]+/g, "_");
  switch (k) {
    case "active":
    case "resolved":
    case "positive":
    case "published":
      return "success";
    case "pending":
    case "follow_up":
    case "warning":
    case "needs_attention":
      return "warning";
    case "new":
    case "urgent":
    case "high_concern":
    case "inactive":
    case "deactivated":
      return "danger";
    case "reviewed":
    case "open":
      return "primary";
    case "closed":
      return "neutral";
    default:
      return "info";
  }
}

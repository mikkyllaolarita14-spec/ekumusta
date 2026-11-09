import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getThresholds, updateThresholds } from "../api/checkins";
import Icon from "../components/Icon";

/**
 * Module 6.3 — Alert Thresholds.
 * Flagging rules are admin-configurable, never hardcoded. Guidance staff
 * can view; only admins can save changes (enforced server-side too).
 */
export default function AdminAlertSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getThresholds()
      .then((r) => setRows(r.thresholds))
      .catch(() => setError("Couldn't load thresholds. Is the backend running?"));
  }, []);

  const setValue = (id, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: String(value) } : r))
    );
    setDirty(true);
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = rows.map((r) => ({ key: r.key, value: r.type === "bool" ? (r.value === "1" || r.value === "true" ? 1 : 0) : r.value }));
      const result = await updateThresholds(payload);
      setRows(result.thresholds);
      setDirty(false);
      setMessage("Thresholds saved — flagging rules updated immediately.");
    } catch (err) {
      if (err?.response?.status === 403) {
        setError("Only admins can change thresholds.");
      } else {
        setError(err?.response?.data?.message || "Couldn't save thresholds.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Alert Thresholds</h2>
          <p>
            Configure when a check-in automatically raises a flag. Changes apply
            to the very next submission — no restart needed.
          </p>
        </div>
        <div className="admin-header-actions">
          {isAdmin && (
            <button
              className="admin-btn admin-btn-primary"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              <Icon name="check" size={16} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </div>

      {message && <p className="ek-save-ok" role="status">{message}</p>}
      {error && <p className="ek-form-error" role="alert">{error}</p>}
      {!isAdmin && (
        <p className="ek-ai-notice" style={{ marginBottom: 16 }}>
          <Icon name="shield" size={16} />
          <span>You're signed in as guidance staff — you can review the rules, but only an admin can change them.</span>
        </p>
      )}

      {!rows ? (
        <p className="admin-empty-text">{error || "Loading thresholds…"}</p>
      ) : (
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="ek-threshold-list">
              {rows.map((r) => (
                <div key={r.id} className="ek-threshold-row">
                  <div className="ek-threshold-label">
                    <strong>{r.label}</strong>
                    <code className="ek-threshold-key">{r.key}</code>
                  </div>
                  {r.type === "bool" ? (
                    <label className="ek-threshold-toggle">
                      <input
                        type="checkbox"
                        checked={r.value === "1" || r.value === "true"}
                        disabled={!isAdmin}
                        onChange={(e) => setValue(r.id, e.target.checked ? 1 : 0)}
                      />
                      <span>{r.value === "1" || r.value === "true" ? "Enabled" : "Disabled"}</span>
                    </label>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      className="admin-input ek-threshold-input"
                      value={r.value}
                      disabled={!isAdmin}
                      onChange={(e) => setValue(r.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

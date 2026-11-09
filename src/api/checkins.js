import api from "./axios";

/**
 * Check-in system API client (modules 3-6, 13-14).
 *
 * Primary path: Laravel API (token auth, server-side flagging).
 * Fallback path: if the backend is unreachable, student check-ins fall
 * back to a localStorage demo store with mirrored local flag rules so
 * the UI stays fully functional — flagged with a demo-mode banner.
 */

/* ── Demo-mode local store ───────────────────────────────────────────────── */

const DEMO_KEY = (userId) => `ekumusta_demo_checkins_${userId || "guest"}`;

const DEMO_MOODS = [
  { value: 5, label: "Great", emoji: "😄" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 2, label: "Low", emoji: "😕" },
  { value: 1, label: "Struggling", emoji: "😖" },
];

const DEMO_STRESS = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

const DEMO_TAGS = ["School", "Family", "Sleep", "Friends", "Health", "Other"];

function todayLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadDemo(userId) {
  try {
    const raw = localStorage.getItem(DEMO_KEY(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.checkIns)
      ? parsed
      : { checkIns: [], flags: [] };
  } catch {
    return { checkIns: [], flags: [] };
  }
}

function saveDemo(userId, store) {
  try {
    localStorage.setItem(DEMO_KEY(userId), JSON.stringify(store));
  } catch {
    /* storage unavailable */
  }
}

const STRESS_VALUE = { 3: 5, 2: 3, 1: 1 };

function moodLabel(v) {
  return DEMO_MOODS.find((m) => m.value === Number(v))?.label || "Okay";
}

function stressText(v) {
  return { 3: "High", 2: "Medium", 1: "Low" }[Number(v)] || "Low";
}

/** Mirror of the backend FlaggingService rules (for demo mode). */
function evaluateFlagsLocally(store, entry) {
  const flags = [];
  const mine = [...store.checkIns].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );

  // Rule 1: High stress 3 consecutive days.
  const last3 = mine.filter((c) => c.stress_label_value === 3).slice(-3);
  if (last3.length === 3) {
    const dates = last3.map((c) => new Date(c.date + "T00:00:00").getTime());
    const day = 86400000;
    if (dates[1] - dates[0] === day && dates[2] - dates[1] === day) {
      flags.push({
        rule: "consecutive_high_stress",
        severity: "high",
        detail: "High stress reported 3 consecutive days.",
      });
    }
  }

  // Rule 2: Sharp mood drop vs recent average.
  const prior = mine.filter((c) => c.date !== entry.date).slice(-7);
  if (prior.length >= 3) {
    const avg = prior.reduce((s, c) => s + c.mood_value, 0) / prior.length;
    const drop = avg - entry.mood_value;
    if (drop >= 2) {
      flags.push({
        rule: "sharp_mood_drop",
        severity: drop >= 3 ? "high" : "medium",
        detail: `Mood dropped to ${entry.mood_value}/5 vs ${avg.toFixed(1)} average.`,
      });
    }
  }

  // Rule 3: Risky tag + low mood.
  if (entry.mood_value <= 2) {
    const risky = (entry.tags || []).find((t) =>
      ["Family", "Health"].includes(t)
    );
    if (risky) {
      flags.push({
        rule: "tag_low_mood",
        severity: entry.mood_value <= 1 ? "high" : "medium",
        detail: `Low mood (${moodLabel(entry.mood_value)}) paired with "${risky}" tag.`,
      });
    }
  }

  return flags;
}

function demoConfirmation(entry, flagged) {
  if (flagged) {
    return "Thanks for being honest — that takes courage. The Guidance Office has been notified and someone may reach out. You're not alone.";
  }
  if (entry.mood_value >= 4) {
    return "Wonderful — thanks for checking in! Keep taking care of that glow.";
  }
  if (entry.mood_value === 3) {
    return "Thanks for checking in. Steady days count too — see you tomorrow!";
  }
  return "Thanks for being honest about a hard day. Small steps count, and tomorrow is a fresh start. You're not alone.";
}

function demoStats(checkIns) {
  const total = checkIns.length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  return {
    total,
    avg_mood: total
      ? Math.round((checkIns.reduce((s, c) => s + c.mood_value, 0) / total) * 10) / 10
      : null,
    avg_stress: total
      ? Math.round((checkIns.reduce((s, c) => s + c.stress_value, 0) / total) * 10) / 10
      : null,
    this_week: checkIns.filter((c) => new Date(c.date + "T00:00:00") >= weekAgo).length,
  };
}

function demoStreak(checkIns) {
  const dates = new Set(checkIns.map((c) => c.date));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const fmt = (d) => {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };

  if (!dates.has(fmt(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(fmt(cursor))) return 0;
  }

  let streak = 0;
  while (dates.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function serializeDemo(entry) {
  return {
    id: entry.id,
    date: entry.date,
    mood_value: entry.mood_value,
    mood_label: moodLabel(entry.mood_value),
    stress_value: entry.stress_value,
    stress_label_value: entry.stress_label_value,
    stress_text: stressText(entry.stress_label_value),
    note: entry.note,
    tags: entry.tags || [],
    created_at: entry.created_at,
  };
}

/* ── Public API (with graceful fallback) ─────────────────────────────────── */

/**
 * GET /check-ins/meta — scales, tags, today's entry. Falls back locally.
 */
export const getCheckInMeta = async (userId) => {
  try {
    const r = await api.get("/check-ins/meta");
    return r.data;
  } catch (err) {
    if (err?.response?.status === 401) throw err;
    console.warn("Check-ins: backend unreachable — demo mode.", err?.message);
    const store = loadDemo(userId);
    return {
      success: true,
      moods: DEMO_MOODS,
      stressLabels: DEMO_STRESS,
      tags: DEMO_TAGS,
      maxNoteLength: 300,
      today: store.checkIns.find((c) => c.date === todayLocal()) || null,
      _demo: true,
    };
  }
};

/**
 * GET /check-ins — own history with streak + trend. Falls back locally.
 */
export const getMyCheckIns = async (userId) => {
  try {
    const r = await api.get("/check-ins");
    return r.data;
  } catch (err) {
    if (err?.response?.status === 401) throw err;
    const store = loadDemo(userId);
    const sorted = [...store.checkIns].sort((a, b) => (a.date < b.date ? 1 : -1));
    return {
      success: true,
      streak: demoStreak(store.checkIns),
      stats: demoStats(store.checkIns),
      trend: sorted
        .slice(0, 14)
        .reverse()
        .map((c) => ({
          date: new Date(c.date + "T00:00:00").toLocaleDateString(undefined, {
            month: "short", day: "numeric",
          }),
          mood: c.mood_value,
          stress: c.stress_value,
        })),
      check_ins: sorted.map(serializeDemo),
      _demo: true,
    };
  }
};

/**
 * POST /check-ins — create today's check-in. Falls back to demo store.
 */
export const submitCheckIn = async (payload, userId) => {
  try {
    const r = await api.post("/check-ins", payload);
    return r.data;
  } catch (err) {
    if (err?.response?.status === 401) throw err;
    if (err?.response?.status === 409) throw err;

    const store = loadDemo(userId);
    const date = todayLocal();

    if (store.checkIns.some((c) => c.date === date)) {
      const conflict = new Error("ALREADY_CHECKED_IN");
      conflict.isConflict = true;
      throw conflict;
    }

    const entry = {
      id: `demo-${Date.now()}`,
      date,
      mood_value: payload.mood_value,
      stress_value: STRESS_VALUE[payload.stress_label] ?? 1,
      stress_label_value: payload.stress_label,
      note: payload.note || "",
      tags: payload.tags || [],
      created_at: new Date().toISOString(),
    };
    store.checkIns.push(entry);

    const flags = evaluateFlagsLocally(store, entry);
    flags.forEach((f) => store.flags.push({ ...f, date, created_at: entry.created_at }));
    saveDemo(userId, store);

    return {
      success: true,
      message: "Check-in saved (demo mode).",
      check_in: serializeDemo(entry),
      flag_count: flags.length,
      confirmation: demoConfirmation(entry, flags.length > 0),
      _demo: true,
    };
  }
};

/**
 * PUT /check-ins/today — same-day edit. Falls back to demo store.
 */
export const updateTodayCheckIn = async (payload, userId) => {
  try {
    const r = await api.put("/check-ins/today", payload);
    return r.data;
  } catch (err) {
    if (err?.response?.status === 401) throw err;

    const store = loadDemo(userId);
    const date = todayLocal();
    const entry = store.checkIns.find((c) => c.date === date);

    if (!entry) {
      const notFound = new Error("NOT_FOUND");
      notFound.isNotFound = true;
      throw notFound;
    }

    Object.assign(entry, {
      mood_value: payload.mood_value,
      stress_value: STRESS_VALUE[payload.stress_label] ?? 1,
      stress_label_value: payload.stress_label,
      note: payload.note || "",
      tags: payload.tags || [],
    });
    saveDemo(userId, store);

    const flags = evaluateFlagsLocally(store, entry);

    return {
      success: true,
      message: "Today's check-in updated (demo mode).",
      check_in: serializeDemo(entry),
      flag_count: flags.length,
      confirmation: demoConfirmation(entry, flags.length > 0),
      _demo: true,
    };
  }
};

/* ── Admin endpoints (no fallback — require the backend) ─────────────────── */

export const getAdminDashboard = (params = {}) =>
  api.get("/admin/dashboard", { params }).then((r) => r.data);

/**
 * GET /admin/check-ins — recent individual student check-ins
 * (student, mood, stress, note, tags, timestamp, flag status).
 * Accepts the same grade/section filters as the dashboard.
 */
export const getAdminCheckIns = (params = {}) =>
  api.get("/admin/check-ins", { params }).then((r) => r.data);

export const getAdminFilters = () =>
  api.get("/admin/filters").then((r) => r.data);

export const getCaseDetail = (caseId) =>
  api.get(`/admin/cases/${caseId}`).then((r) => r.data);

export const addCaseNote = (caseId, note) =>
  api.post(`/admin/cases/${caseId}/notes`, { note }).then((r) => r.data);

export const updateCaseStatus = (caseId, status) =>
  api.patch(`/admin/cases/${caseId}/status`, { status }).then((r) => r.data);

export const getThresholds = () =>
  api.get("/admin/thresholds").then((r) => r.data);

export const updateThresholds = (rows) =>
  api.patch("/admin/thresholds", rows).then((r) => r.data);

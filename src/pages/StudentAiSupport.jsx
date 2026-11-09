import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage, requestHumanSupport } from "../api/ai";
import { createAlert, createNotification } from "../store/database";
import Icon from "../components/Icon";

/**
 * Module 15 — AI Support Chat
 *
 * A supportive listener for everyday student stress — not a counselor and
 * not a replacement for the Guidance Office. The backend re-checks every
 * message for escalation triggers and returns `escalated` when a crisis
 * indicator (self-harm, abuse, or a request for a human) is detected,
 * even if the LLM call itself fails.
 *
 * On escalation this page:
 *   1. Shows the Crisis Hotlines panel (one-tap call) immediately.
 *   2. Flags the case for admin review via createAlert (mock store),
 *      even if the student never taps through.
 *   3. Actively encourages the Guidance Office ("Talk to an Admin").
 *
 * The transcript lives in sessionStorage only — never localStorage — so it
 * is cleared when the browser session ends.
 */

const CRISIS_LINES = [
  {
    label: "National Mental Health Crisis Hotline",
    number: "0917-899-USAP",
    tel: "09178998727",
    hours: "24/7",
  },
  {
    label: "Hopeline",
    number: "(02) 8804-HOPE",
    tel: "0288044673",
    hours: "24/7",
  },
  {
    label: "NCMH Crisis Hotline",
    number: "(02) 8925-4030",
    tel: "0289254030",
    hours: "24/7",
  },
  {
    label: "Guidance Office",
    number: "(02) 8888-0000",
    tel: "0288880000",
    hours: "8AM–5PM",
  },
];

const SUGGESTED_TOPICS = [
  "I'm stressed about schoolwork",
  "I can't focus lately",
  "I'm having trouble sleeping",
  "I feel overwhelmed",
];

const GREETING_FALLBACK =
  "Hi, I'm the AI Support chat here in e-Kumusta — I'm here to listen, not a counselor. " +
  "If you ever want to talk to a real person, you can tap \"Talk to an Admin\" anytime. " +
  "What's on your mind?";

const CONNECTION_FALLBACK =
  "Sorry — I'm having trouble connecting right now. If you need support, please tap " +
  "\"Talk to an Admin\" anytime, or use the crisis numbers shown on this page.";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSessionKey(userId) {
  return `ekumusta_ai_chat_${userId}`;
}

function loadTranscript(userId) {
  try {
    const raw = sessionStorage.getItem(getSessionKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveTranscript(userId, messages) {
  try {
    sessionStorage.setItem(getSessionKey(userId), JSON.stringify(messages));
  } catch {
    /* storage unavailable — chat still works in-memory */
  }
}

function clearTranscript(userId) {
  try {
    sessionStorage.removeItem(getSessionKey(userId));
  } catch {
    /* ignore */
  }
}

function buildCrisisPanel() {
  return {
    id: newId(),
    kind: "crisis",
    role: "system",
    text: "",
    createdAt: new Date().toISOString(),
  };
}

function buildFlaggedNotice() {
  return {
    id: newId(),
    kind: "flagged",
    role: "system",
    text: "This conversation has been flagged for review by the Guidance Office.",
    createdAt: new Date().toISOString(),
  };
}

const CATEGORY_LABELS = {
  self_harm: "possible self-harm or crisis indicator",
  abuse: "possible safety concern (abuse or feeling unsafe)",
  human_request: "student requested human support",
};

export default function StudentAiSupport() {
  const { user } = useAuth();
  const storageUserId = user?.id || "guest";

  const [messages, setMessages] = useState(() => {
    const saved = loadTranscript(storageUserId);
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: newId(),
        role: "assistant",
        kind: "chat",
        text: GREETING_FALLBACK,
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flaggedOnce, setFlaggedOnce] = useState(false);
  const scrollRef = useRef(null);

  // ── Autoscroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  // ── Persist transcript (session-only) ─────────────────────────────────────
  useEffect(() => {
    saveTranscript(storageUserId, messages);
  }, [messages, storageUserId]);

  // ── Flag the case for admin review (once per session) ────────────────────
  const flagForAdminReview = (category) => {
    if (flaggedOnce) return;
    setFlaggedOnce(true);

    const studentName = user?.displayName || user?.name || "Unknown student";

    createAlert({
      studentId: user?.studentId || user?.id,
      studentName,
      severity: category === "self_harm" ? "urgent" : "high",
      title: "AI Support conversation flagged",
      description:
        `AI Support escalation: ${CATEGORY_LABELS[category] || category}. ` +
        "Student was shown crisis hotlines and encouraged to contact the Guidance Office.",
      status: "new",
      assignedTo: "Dr. Mikkylla Olarita",
      assignedToId: "admin-001",
      source: "ai_support",
    });

    createNotification({
      type: "alert",
      title: `AI Support flag: ${studentName}`,
      message:
        "AI Support detected a possible crisis indicator. Please review as soon as possible.",
      link: "/admin/alerts",
    });
  };

  // ── One chat turn ─────────────────────────────────────────────────────────
  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    const userMessage = {
      id: newId(),
      role: "user",
      kind: "chat",
      text,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    // History excludes the message we're sending now.
    const history = nextMessages
      .filter((m) => m.kind === "chat")
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const result = await sendChatMessage(text, history);

      const replyText = result.success
        ? result.reply
        : result.fallback_reply || result.message || CONNECTION_FALLBACK;

      const turnMessages = [
        ...nextMessages,
        {
          id: newId(),
          role: "assistant",
          kind: "chat",
          text: replyText,
          createdAt: new Date().toISOString(),
        },
      ];

      // Escalate on ANY server-reported trigger — even when the LLM call
      // failed — so a student in crisis never gets a dead end.
      if (result.escalated) {
        turnMessages.push(buildCrisisPanel());
        turnMessages.push(buildFlaggedNotice());
        flagForAdminReview(result.escalated.category);
      }

      setMessages(turnMessages);
    } catch (err) {
      console.error("AI Support error:", err);

      const data = err?.response?.data;

      let fallback = data?.fallback_reply || CONNECTION_FALLBACK;
      if (err?.response?.status === 429) {
        fallback =
          "You've sent a lot of messages in a short time — let's pause for a moment. " +
          "If you need someone right away, tap \"Talk to an Admin\".";
      }

      const turnMessages = [
        ...nextMessages,
        {
          id: newId(),
          role: "assistant",
          kind: "chat",
          text: fallback,
          createdAt: new Date().toISOString(),
        },
      ];

      // The backend reports escalation even when the LLM call fails —
      // a student in crisis must never hit a dead end.
      if (data?.escalated) {
        turnMessages.push(buildCrisisPanel());
        turnMessages.push(buildFlaggedNotice());
        flagForAdminReview(data.escalated.category);
      }

      setMessages(turnMessages);
    } finally {
      setIsTyping(false);
    }
  };

  // ── "Talk to an Admin" ────────────────────────────────────────────────────
  const handleTalkToAdmin = async () => {
    try {
      await requestHumanSupport(
        "Student tapped 'Talk to an Admin' during an AI Support session."
      );
    } catch {
      // Even if the request fails, still show local guidance — the student
      // must never hit a dead end when seeking a human.
    }

    flagForAdminReview("human_request");

    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "assistant",
        kind: "chat",
        text: "Connecting you with the Guidance Office. You can also send them a direct message from the Messages page — they'll see it during office hours.",
        createdAt: new Date().toISOString(),
      },
      buildCrisisPanel(),
    ]);
  };

  // ── Clear chat ────────────────────────────────────────────────────────────
  const handleClear = () => {
    clearTranscript(storageUserId);
    setFlaggedOnce(false);
    setMessages([
      {
        id: newId(),
        role: "assistant",
        kind: "chat",
        text: GREETING_FALLBACK,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const lastFlaggedIndex = messages.reduce(
    (last, m, i) => (m.kind === "flagged" ? i : last),
    -1
  );

  return (
    <StudentLayout>
      <div className="admin-page-header">
        <div>
          <h2>AI Support</h2>
          <p>
            A supportive listener for everyday stress — not a counselor. For
            urgent concerns, the Guidance Office and crisis lines are below.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-outline" onClick={handleClear}>
            Clear chat
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleTalkToAdmin}
          >
            <Icon name="user" size={16} />
            Talk to an Admin
          </button>
        </div>
      </div>

      {/* ── Identity + confidentiality notice ─────────────────────────── */}
      <div className="ek-ai-notice">
        <Icon name="shield" size={16} />
        <span>
          I'm an AI companion — not a counselor, and not a replacement for the
          Guidance Office. Serious concerns may be shared with the Guidance
          Office to keep you safe.
        </span>
      </div>

      {/* ── Chat window ───────────────────────────────────────────────── */}
      <div className="admin-card ek-ai-card">
        <div className="ek-ai-messages" ref={scrollRef} aria-live="polite">
          {messages.map((m, i) => {
            if (m.kind === "crisis") {
              return (
                <div key={m.id} className="ek-ai-crisis-panel" role="alert">
                  <div className="ek-ai-crisis-header">
                    <Icon name="phone" size={18} />
                    <strong>Immediate support is available</strong>
                  </div>
                  <p className="ek-ai-crisis-sub">
                    If you're thinking about hurting yourself, or you don't feel
                    safe right now, please reach out — you won't be bothering
                    anyone.
                  </p>
                  <div className="ek-ai-crisis-grid">
                    {CRISIS_LINES.map((line) => (
                      <a
                        key={line.tel}
                        className="ek-ai-crisis-item"
                        href={`tel:${line.tel}`}
                      >
                        <span className="ek-ai-crisis-label">{line.label}</span>
                        <span className="ek-ai-crisis-number">
                          <Icon name="phone" size={14} /> {line.number}
                        </span>
                        <span className="ek-ai-crisis-hours">{line.hours}</span>
                      </a>
                    ))}
                  </div>
                  <div className="ek-ai-crisis-actions">
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={handleTalkToAdmin}
                    >
                      Talk to an Admin
                    </button>
                    <Link
                      to="/student/messages"
                      className="admin-btn admin-btn-outline"
                    >
                      Message Guidance
                    </Link>
                    <Link
                      to="/student/resources"
                      className="admin-btn admin-btn-outline"
                    >
                      Support Resources
                    </Link>
                  </div>
                </div>
              );
            }

            if (m.kind === "flagged") {
              // Show the flag notice once per escalation — skip older ones.
              if (i !== lastFlaggedIndex) return null;
              return (
                <div key={m.id} className="ek-ai-flagged" role="status">
                  <Icon name="shield" size={14} />
                  <span>{m.text}</span>
                </div>
              );
            }

            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`ek-ai-bubble-row ${isUser ? "ek-ai-row-user" : "ek-ai-row-ai"}`}
              >
                <div className={`ek-ai-bubble ${isUser ? "ek-ai-bubble-user" : "ek-ai-bubble-ai"}`}>
                  {m.text}
                </div>
                <span className="ek-ai-time">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div className="ek-ai-bubble-row ek-ai-row-ai">
              <div className="ek-ai-bubble ek-ai-bubble-ai ek-ai-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* ── Suggested topics (only at greeting) ──────────────────────── */}
        {messages.length === 1 && !isTyping && (
          <div className="ek-ai-suggestions">
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                className="ek-ai-chip"
                onClick={() => handleSend(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* ── Composer ─────────────────────────────────────────────────── */}
        <div className="ek-ai-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="What's on your mind?"
            aria-label="Message to AI Support"
            rows={2}
            maxLength={2000}
          />
          <button
            className="admin-btn admin-btn-primary ek-ai-send"
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}

import api from "./axios";

/**
 * Module 15 — AI Support API
 *
 * Primary path: Laravel proxy → Gemini (API key stays server-side).
 * Fallback path: if the backend is unreachable, not configured, or errors,
 * replies are generated locally from supportive templates so the chat
 * ALWAYS responds. Escalation (crisis) detection is mirrored locally so
 * safety behavior works even offline.
 */

/* ── Escalation keywords (mirrored from backend config/ai-support.php) ──── */
const ESCALATION_TRIGGERS = {
  self_harm: [
    "suicide", "suicidal", "kill myself", "killing myself", "end my life",
    "ending my life", "take my own life", "hurt myself", "hurting myself",
    "harm myself", "harming myself", "self harm", "self-harm", "cut myself",
    "cutting myself", "want to die", "wanna die", "better off dead",
    "don't want to live", "dont want to live", "want to disappear",
    "wanna disappear", "stop existing", "no reason to live",
    "can't go on", "cant go on", "give up on life",
    "magpakamatay", "gusto ko nang mamatay", "gusto ko na mamatay",
    "ayaw ko na mabuhay", "saktan ang sarili", "sinasaktan ko ang sarili",
    "gusto ko mawala", "wala nang kwenta ang buhay",
  ],
  abuse: [
    "being abused", "i am abused", "he hits me", "she hits me", "they hit me",
    "beaten up", "hurt by someone", "someone hurt me", "unsafe at home",
    "unsafe at school", "not safe at home", "not safe at school",
    "molested", "harassed", "rape", "raped", "domestic violence",
    "sinasaktan ako", "binubugbog ako", "ginahasa", "binabastos ako",
    "takot ako umuwi", "takot ako sa tatay", "takot ako sa nanay",
  ],
  human_request: [
    "talk to someone", "talk to a person", "talk to a real person",
    "talk to a counselor", "talk to the guidance office", "talk to guidance",
    "talk to admin", "speak to someone", "speak to a counselor",
    "i want a human", "gusto ko kausapin ang guidance", "makipag-usap sa tao",
  ],
};

/**
 * Local escalation scan — same contract as the backend service.
 * @returns {{escalate: boolean, category: string|null, matched_term: string|null}}
 */
function detectEscalationLocally(message) {
  const normalized = (message || "").toLowerCase();

  for (const [category, terms] of Object.entries(ESCALATION_TRIGGERS)) {
    for (const term of terms) {
      if (normalized.includes(term)) {
        return { escalate: true, category, matched_term: term };
      }
    }
  }

  return { escalate: false, category: null, matched_term: null };
}

/* ── Local supportive reply templates (demo mode) ────────────────────────── */

const LOCAL_ESCALATION_REPLIES = {
  self_harm:
    "I'm really glad you told me this, and I want you to know your safety matters. " +
    "You deserve support from a real person right now — please reach out. " +
    "I've shown the crisis hotlines below, and tapping \"Talk to an Admin\" will connect you with the Guidance Office. " +
    "You're not alone in this.",
  abuse:
    "Thank you for trusting me with this — what you described sounds really hard, and it's not your fault. " +
    "Your safety is important, and a real person should hear what's happening. " +
    "Please tap \"Talk to an Admin\" to reach the Guidance Office, or use the hotlines shown below. " +
    "You deserve to feel safe.",
  human_request:
    "Of course — talking to a real person is a good step. " +
    "Tap \"Talk to an Admin\" to connect with the Guidance Office, or send them a message from the Messages page. " +
    "They'll be glad you reached out.",
};

const LOCAL_TOPICS = [
  {
    keys: ["school", "schoolwork", "exam", "exams", "quiz", "assignment", "project", "deadline", "grade", "grades", "study", "studying", "class", "prof", "teacher", "aral", "pag-aaral", "bagsak", "failed", "failing"],
    reflect: "That sounds like a lot of pressure — school piling up can really weigh on you.",
    tips: [
      "Try picking just one small piece of it — even 15 focused minutes on a single task can shrink the mountain.",
      "A quick 4-7-8 breathing round before you start can take the edge off, too.",
    ],
    ask: "What's the one task that's stressing you out the most right now?",
  },
  {
    keys: ["sleep", "sleeping", "insomnia", "awake", "tired", "pagod", "tulog", "makatulog", "rest", "exhausted"],
    reflect: "Running on poor sleep makes everything else feel twice as heavy — I hear you.",
    tips: [
      "Try putting your phone away 30 minutes before bed and dimming the lights — small cues help your body wind down.",
      "A consistent wind-down time, even on weekends, does more than sleeping in.",
    ],
    ask: "What's usually keeping you up at night?",
  },
  {
    keys: ["focus", "concentrate", "distract", "distracted", "attention", "procrastinat", "focus", "makapag-focus"],
    reflect: "It's frustrating when your mind won't cooperate, especially when you have things to do.",
    tips: [
      "Try the 5-minute rule: commit to just five minutes of the task — starting is usually the hardest part.",
      "Silencing notifications for one short session can help a lot too.",
    ],
    ask: "What were you trying to focus on when it felt hardest?",
  },
  {
    keys: ["overwhelm", "too much", "can't keep up", "cant keep up", "burnout", "burn out", "stressed", "stress", "hindi ko na kaya", "sobrang", "bg", "pressure", "anxious", "anxiety", "worry", "worried", "nervous"],
    reflect: "That sounds genuinely overwhelming — carrying all of that at once is exhausting.",
    tips: [
      "Try a \"brain dump\": write everything on your mind on one page, then circle just one thing to handle today.",
      "A short walk or some slow breaths can also reset your nervous system more than you'd expect.",
    ],
    ask: "What's weighing on you the heaviest right now?",
  },
  {
    keys: ["alone", "lonely", "loneliness", "friend", "friends", "friendship", "kaibigan", "ignored", "left out", "no one", "nobody"],
    reflect: "Feeling alone — even around other people — really hurts, and it makes sense that it's bothering you.",
    tips: [
      "Consider reaching out to one person you trust, even with something small — connection often starts tiny.",
      "The Guidance Office is also there for exactly this kind of thing — no concern is too small for them.",
    ],
    ask: "Is there someone you used to feel close to that you miss?",
  },
  {
    keys: ["family", "parent", "parents", "mom", "dad", "mother", "father", "home", "pamilya", "magulang", "nanay", "tatay"],
    reflect: "Family stuff can cut deep — it's one of the hardest kinds of stress because you can't just walk away from it.",
    tips: [
      "Journaling about it, even messily, can help untangle what you're feeling.",
      "If it ever feels like too much to carry alone, the Guidance Office is a safe place to talk it through.",
    ],
    ask: "Would you like to tell me a bit more about what's been happening at home?",
  },
  {
    keys: ["sad", "down", "cry", "crying", "empty", "numb", "depress", "malungkot", "iyak", "upset", "hopeless"],
    reflect: "I'm sorry you're feeling this way — those heavy days are real, and you don't have to pretend otherwise here.",
    tips: [
      "Being kind to yourself today counts as progress — a warm shower, a meal, or a small thing you enjoy.",
      "Naming the feeling — even writing \"I feel ___ because ___\" — can take some of its power away.",
    ],
    ask: "How long have you been feeling this way?",
  },
];

const LOCAL_DEFAULT_REPLIES = [
  {
    reflect: "Thank you for sharing that with me — it takes something to put it into words.",
    tips: ["Taking a moment to breathe slowly — in for 4, out for 6 — can help steady things, even a little."],
    ask: "Can you tell me a bit more about what that's been like for you?",
  },
  {
    reflect: "I hear you, and it makes sense that this is on your mind.",
    tips: ["There are short self-help guides in the Support Resources page that might speak to what you're going through."],
    ask: "What part of it feels hardest right now?",
  },
];

/** Pick a topic template by keyword overlap with the student's message. */
function pickLocalTemplate(message) {
  const text = (message || "").toLowerCase();

  let best = null;
  let bestScore = 0;

  for (const topic of LOCAL_TOPICS) {
    const score = topic.keys.reduce(
      (n, k) => (text.includes(k) ? n + 1 : n),
      0
    );
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  if (best) {
    return `${best.reflect}\n\n${best.tips[0]} ${best.ask}`;
  }

  const fallback =
    LOCAL_DEFAULT_REPLIES[
      Math.floor(Math.random() * LOCAL_DEFAULT_REPLIES.length)
    ];
  return `${fallback.reflect}\n\n${fallback.tips[0]} ${fallback.ask}`;
}

/**
 * Build a full local (demo-mode) response matching the backend's shape.
 */
function buildLocalResponse(message) {
  const escalation = detectEscalationLocally(message);

  if (escalation.escalate) {
    return {
      success: true,
      reply:
        LOCAL_ESCALATION_REPLIES[escalation.category] ||
        LOCAL_ESCALATION_REPLIES.self_harm,
      escalated: escalation,
      _local: true,
    };
  }

  return {
    success: true,
    reply: pickLocalTemplate(message),
    escalated: null,
    _local: true,
  };
}

/* ── Public API ──────────────────────────────────────────────────────────── */

/**
 * Send one chat turn to the AI Support companion.
 * Falls back to local demo replies when the backend is unreachable,
 * unconfigured, or server-erroring — so the chat always responds.
 *
 * @param {string} message      The student's message.
 * @param {Array<{role: "user"|"assistant", content: string}>} history
 * @returns {Promise<{success: boolean, reply: string,
 *   escalated?: {escalate: boolean, category: string, matched_term: string}|null,
 *   _local?: boolean}>}
 */
export const sendChatMessage = async (message, history = []) => {
  try {
    const response = await api.post(
      "/ai-support",
      {
        message,
        history: history.slice(-20).map(({ role, content }) => ({ role, content })),
      },
      { timeout: 20000 }
    );

    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    // Rate limited — keep the server's honest message, don't fake a reply.
    if (status === 429) {
      return {
        success: false,
        reply:
          data?.message ||
          "You've sent a lot of messages in a short time — let's pause for a moment. " +
            "If you need someone right away, tap \"Talk to an Admin\".",
        escalated: data?.escalated ?? null,
      };
    }

    // Backend reachable but Gemini not configured / server error / no
    // backend at all → local demo reply so the conversation continues.
    console.warn(
      "AI Support: backend unavailable, using local demo replies.",
      status || err?.message
    );

    const local = buildLocalResponse(message);

    // Preserve a server-reported escalation even when falling back.
    if (data?.escalated && !local.escalated) {
      local.escalated = data.escalated;
      local.reply =
        LOCAL_ESCALATION_REPLIES[data.escalated.category] ||
        LOCAL_ESCALATION_REPLIES.self_harm;
    }

    return local;
  }
};

/**
 * Explicit request for human support ("Talk to an Admin" action).
 * Always flags the session for Guidance Office review — locally as well,
 * so flagging works even if the backend is down.
 */
export const requestHumanSupport = async (reason = "") => {
  try {
    const response = await api.post("/ai-support/escalate", { reason });
    return response.data;
  } catch (err) {
    console.warn(
      "AI Support: escalate request failed — flagging locally instead.",
      err?.message
    );
    return {
      success: true,
      escalated: {
        escalate: true,
        category: "human_request",
        matched_term: null,
      },
      _local: true,
    };
  }
};
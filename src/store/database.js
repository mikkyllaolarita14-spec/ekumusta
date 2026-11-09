import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

// ─── Pre-loaded Student Roster ───────────────────────────────────────────────
const STUDENT_ROSTER = [
  {
    studentId: "2024-001",
    firstName: "Gian",
    lastName: "Pesidas",
    email: "gian.pesidas@school.edu",
    course: "BS Information Technology",
    yearLevel: 3,
  },
  {
    studentId: "2024-002",
    firstName: "Hany Jane",
    lastName: "De Guzman",
    email: "hany.jane.de.guzman@school.edu",
    course: "BS Computer Science",
    yearLevel: 2,
  },
  {
    studentId: "2024-003",
    firstName: "Jessa",
    lastName: "Aumentado",
    email: "jessa.aumentado@school.edu",
    course: "BS Education",
    yearLevel: 1,
  },
  {
    studentId: "2024-004",
    firstName: "Jenny",
    lastName: "Ayenza",
    email: "jenny.ayenza@school.edu",
    course: "BS Business Administration",
    yearLevel: 4,
  },
  {
    studentId: "2024-005",
    firstName: "Mark",
    lastName: "Mendoza",
    email: "mark.mendoza@school.edu",
    course: "BS Psychology",
    yearLevel: 2,
  },
];

// ─── Pre-loaded Admin / Staff Accounts ────────────────────────────────────────
const STAFF_ROSTER = [
  {
    accountId: "admin-001",
    name: "Dr. Mikkylla Olarita",
    email: "mikkylla.olarita@school.edu",
    role: "admin",
    position: "Guidance Counselor",
  },
  {
    accountId: "guidance-001",
    name: "Mark Torres",
    email: "mark.torres@school.edu",
    role: "guidance",
    position: "Guidance Associate",
  },
];

// ─── Mock Data: Check-ins ────────────────────────────────────────────────────
const now = new Date();
const MOCK_CHECKINS = [
  {
    id: uuidv4(),
    studentId: "2024-001",
    studentName: "Gian Pesidas",
    mood: "positive",
    moodScore: 4,
    checkInText: "Feeling good today. Had a productive study session and met with friends.",
    sleepQuality: "good",
    stressLevel: 2,
    completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).toISOString(),
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "2024-002",
    studentName: "Hany Jane De Guzman",
    mood: "neutral",
    moodScore: 3,
    checkInText: "Average day. Some academic stress but manageable.",
    sleepQuality: "fair",
    stressLevel: 3,
    completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15).toISOString(),
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "2024-003",
    studentName: "Jessa Aumentado",
    mood: "needs_attention",
    moodScore: 2,
    checkInText: "Feeling overwhelmed with requirements. Having difficulty sleeping.",
    sleepQuality: "poor",
    stressLevel: 4,
    completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 45).toISOString(),
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "2024-001",
    studentName: "Gian Pesidas",
    mood: "positive",
    moodScore: 5,
    checkInText: "Great day! Finished my project ahead of schedule.",
    sleepQuality: "excellent",
    stressLevel: 1,
    completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 0).toISOString(),
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "2024-005",
    studentName: "Mark Mendoza",
    mood: "high_concern",
    moodScore: 1,
    checkInText: "Not doing well. Feeling very anxious and having panic attacks. Need someone to talk to.",
    sleepQuality: "very_poor",
    stressLevel: 5,
    completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 30).toISOString(),
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "2024-004",
    studentName: "Jenny Ayenza",
    mood: "positive",
    moodScore: 4,
    checkInText: "Good day overall. Looking forward to graduation.",
    sleepQuality: "good",
    stressLevel: 2,
    completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 8, 20).toISOString(),
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(),
  },
];

// ─── Mock Data: Cases ────────────────────────────────────────────────────────
const MOCK_CASES = [
  {
    id: uuidv4(),
    caseNumber: "CASE-1042",
    studentId: "2024-005",
    studentName: "Mark Mendoza",
    title: "Severe Anxiety and Panic Attacks",
    description: "Student reported frequent panic attacks and difficulty sleeping. Requires immediate attention.",
    status: "open",
    priority: "urgent",
    assignedTo: "Dr. Mikkylla Olarita",
    assignedToId: "admin-001",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 14, 0).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0).toISOString(),
    notes: [
      { id: uuidv4(), author: "Dr. Mikkylla Olarita", text: "Initial assessment completed. Student shows signs of severe anxiety.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 14, 30).toISOString() },
      { id: uuidv4(), author: "Mark Torres", text: "Follow-up session scheduled for tomorrow.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0).toISOString() },
    ],
    followUpDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
  },
  {
    id: uuidv4(),
    caseNumber: "CASE-1038",
    studentId: "2024-003",
    studentName: "Jessa Aumentado",
    title: "Academic Stress and Sleep Issues",
    description: "Student experiencing high academic stress with reported sleep difficulties.",
    status: "in_progress",
    priority: "high",
    assignedTo: "Mark Torres",
    assignedToId: "guidance-001",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 10, 0).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 11, 0).toISOString(),
    notes: [
      { id: uuidv4(), author: "Mark Torres", text: "Counseling session conducted. Student is open to discussing coping strategies.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 10, 30).toISOString() },
    ],
    followUpDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString(),
  },
  {
    id: uuidv4(),
    caseNumber: "CASE-1029",
    studentId: "2024-002",
    studentName: "Hany Jane De Guzman",
    title: "Social Isolation Concern",
    description: "Student has been increasingly isolated from peers. Follow-up recommended.",
    status: "follow_up",
    priority: "medium",
    assignedTo: "Dr. Mikkylla Olarita",
    assignedToId: "admin-001",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 9, 0).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 14, 0).toISOString(),
    notes: [
      { id: uuidv4(), author: "Dr. Mikkylla Olarita", text: "Initial concern raised by faculty. Student seems withdrawn.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 9, 15).toISOString() },
      { id: uuidv4(), author: "Dr. Mikkylla Olarita", text: "Meeting with student completed. Will schedule follow-up.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 14, 0).toISOString() },
    ],
    followUpDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString(),
  },
  {
    id: uuidv4(),
    caseNumber: "CASE-1015",
    studentId: "2024-004",
    studentName: "Jenny Ayenza",
    title: "Career Anxiety",
    description: "Student expressing anxiety about post-graduation plans.",
    status: "resolved",
    priority: "low",
    assignedTo: "Mark Torres",
    assignedToId: "guidance-001",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20, 11, 0).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 16, 0).toISOString(),
    notes: [
      { id: uuidv4(), author: "Mark Torres", text: "Career counseling session completed. Provided resources.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20, 11, 30).toISOString() },
      { id: uuidv4(), author: "Mark Torres", text: "Student reports feeling more confident about career path.", createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 16, 0).toISOString() },
    ],
    followUpDate: null,
  },
];

// ─── Mock Data: Alerts ───────────────────────────────────────────────────────
const MOCK_ALERTS = [
  {
    id: uuidv4(),
    alertId: "ALERT-001",
    studentId: "2024-005",
    studentName: "Mark Mendoza",
    severity: "urgent",
    title: "High Concern Check-in Detected",
    description: "Student reported panic attacks and severe anxiety in daily check-in.",
    status: "new",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 35).toISOString(),
    assignedTo: "Dr. Mikkylla Olarita",
    assignedToId: "admin-001",
    relatedCase: "CASE-1042",
  },
  {
    id: uuidv4(),
    alertId: "ALERT-002",
    studentId: "2024-003",
    studentName: "Jessa Aumentado",
    severity: "high",
    title: "Declining Mood Trend",
    description: "Student's mood scores have been declining over the past week.",
    status: "in_progress",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 8, 0).toISOString(),
    assignedTo: "Mark Torres",
    assignedToId: "guidance-001",
    relatedCase: "CASE-1038",
  },
  {
    id: uuidv4(),
    alertId: "ALERT-003",
    studentId: "2024-002",
    studentName: "Hany Jane De Guzman",
    severity: "medium",
    title: "Missed Check-in Streak",
    description: "Student has missed 3 consecutive daily check-ins.",
    status: "reviewed",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 9, 0).toISOString(),
    assignedTo: "Dr. Mikkylla Olarita",
    assignedToId: "admin-001",
    relatedCase: "CASE-1029",
  },
  {
    id: uuidv4(),
    alertId: "ALERT-004",
    studentId: "2024-005",
    studentName: "Mark Mendoza",
    severity: "low",
    title: "Check-in Pattern Change",
    description: "Student's check-in time has shifted significantly from their usual pattern.",
    status: "resolved",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 8, 30).toISOString(),
    assignedTo: "Dr. Mikkylla Olarita",
    assignedToId: "admin-001",
    relatedCase: null,
  },
];

// ─── Mock Data: Messages ─────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: uuidv4(),
    senderId: "admin-001",
    senderName: "Dr. Mikkylla Olarita",
    recipientId: "guidance-001",
    recipientName: "Mark Torres",
    subject: "Follow-up on CASE-1042",
    body: "Hi Mark, please review Sofia's latest check-in. The anxiety symptoms seem to be worsening.",
    isRead: false,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0).toISOString(),
  },
  {
    id: uuidv4(),
    senderId: "guidance-001",
    senderName: "Mark Torres",
    recipientId: "admin-001",
    recipientName: "Dr. Mikkylla Olarita",
    subject: "Re: Follow-up on CASE-1042",
    body: "Noted, Dr. Olarita. I'll schedule a follow-up session with Sofia today.",
    isRead: true,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 15, 30).toISOString(),
  },
  {
    id: uuidv4(),
    senderId: "admin-001",
    senderName: "Dr. Mikkylla Olarita",
    recipientId: "guidance-001",
    recipientName: "Mark Torres",
    subject: "CASE-1038 Progress Update",
    body: "How is Jessa doing with the coping strategies we discussed? Any updates from the last session?",
    isRead: false,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
  },
];

// ─── Mock Data: Resources ────────────────────────────────────────────────────
const MOCK_RESOURCES = [
  {
    id: uuidv4(),
    title: "Guidance Office Contact Information",
    description: "School guidance office hours, contact numbers, and location for walk-in consultations.",
    category: "General",
    content: "Guidance Office: Room 201, Building A\nOffice Hours: 8:00 AM - 5:00 PM\nPhone: (02) 8123-4567\nEmail: guidance@school.edu",
    author: "Dr. Mikkylla Olarita",
    isActive: true,
    createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
  },
  {
    id: uuidv4(),
    title: "Crisis Hotline Numbers",
    description: "Emergency mental health hotlines available 24/7 for students in crisis.",
    category: "Mental Health",
    content: "National Mental Health Crisis Hotline: 0917-899-USAP (8727)\nHopeline: (02) 8804-HOPE (4673)\nNCMH: (02) 8925-4030",
    author: "Dr. Mikkylla Olarita",
    isActive: true,
    createdAt: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
  },
  {
    id: uuidv4(),
    title: "Stress Management Techniques",
    description: "Practical strategies for managing academic stress and anxiety.",
    category: "Stress Management",
    content: "1. Deep breathing exercises\n2. Progressive muscle relaxation\n3. Time management strategies\n4. Regular physical activity\n5. Maintaining social connections\n6. Adequate sleep hygiene",
    author: "Dr. Mikkylla Olarita",
    isActive: true,
    createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
  },
  {
    id: uuidv4(),
    title: "Self-Care Checklist for Students",
    description: "Daily self-care practices to support mental wellness.",
    category: "General",
    content: "□ Get 7-8 hours of sleep\n□ Eat nutritious meals\n□ Exercise for 30 minutes\n□ Connect with friends/family\n□ Take breaks from studying\n□ Practice gratitude\n□ Limit social media",
    author: "Dr. Mikkylla Olarita",
    isActive: true,
    createdAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
  },
];

// ─── Mock Data: Notifications ────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: uuidv4(),
    type: "alert",
    title: "Urgent Alert: High Concern Check-in",
    message: "Sofia Mendoza reported severe anxiety and panic attacks.",
    isRead: false,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 35).toISOString(),
    link: "/admin/alerts",
  },
  {
    id: uuidv4(),
    type: "case",
    title: "New Case Assigned",
    message: "You have been assigned CASE-1038: Academic Stress.",
    isRead: false,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 10, 0).toISOString(),
    link: "/admin/cases",
  },
  {
    id: uuidv4(),
    type: "message",
    title: "New Message from Dr. Mikkylla Olarita",
    message: "Follow-up on CASE-1042",
    isRead: false,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0).toISOString(),
    link: "/admin/messages",
  },
  {
    id: uuidv4(),
    type: "system",
    title: "System Update",
    message: "e-Kumusta system has been updated with the latest security patches.",
    isRead: true,
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 9, 0).toISOString(),
    link: null,
  },
];

// ─── Mock Data: System Settings ──────────────────────────────────────────────
const MOCK_SETTINGS = {
  schoolName: "Sample State University",
  schoolEmail: "info@school.edu",
  schoolPhone: "(02) 8123-4567",
  academicYear: "2024-2025",
  checkInEnabled: true,
  checkInTime: "08:00",
  checkInReminderEnabled: true,
  alertNotificationEnabled: true,
  emailNotificationsEnabled: false,
  maintenanceMode: false,
};

// ─── Default in-memory database ──────────────────────────────────────────────
const SALT_ROUNDS = 10;

const db = {
  // User accounts (populated after activation)
  users: [],

  // Student roster (read-only reference)
  studentRoster: [...STUDENT_ROSTER],

  // Staff roster (read-only reference)
  staffRoster: [...STAFF_ROSTER],

  // Check-ins
  checkIns: [...MOCK_CHECKINS],

  // Cases
  cases: [...MOCK_CASES],

  // Alerts
  alerts: [...MOCK_ALERTS],

  // Messages
  messages: [...MOCK_MESSAGES],

  // Resources
  resources: [...MOCK_RESOURCES],

  // Notifications
  notifications: [...MOCK_NOTIFICATIONS],

  // Announcements
  announcements: [],

  // Alert thresholds
  alertThresholds: {
    consecutiveHighStress: 3,
    suddenMoodDrop: true,
    missedCheckInStreak: 3,
    lowMoodScoreThreshold: 2,
    highStressThreshold: 4,
  },

  // School structure (college)
  schoolStructure: {
    yearLevels: ["First Year", "Second Year", "Third Year", "Fourth Year"],
    blocks: ["Block 1", "Block 2", "Block 3", "Block 4", "Block 5"],
    academicTerms: ["1st Semester 2024-2025", "2nd Semester 2024-2025"],
  },

  // Check-in questions
  checkInQuestions: [
    { id: uuidv4(), text: "How are you feeling today?", type: "mood", isActive: true, order: 1 },
    { id: uuidv4(), text: "How would you rate your stress level?", type: "stress", isActive: true, order: 2 },
    { id: uuidv4(), text: "How well did you sleep last night?", type: "sleep", isActive: true, order: 3 },
    { id: uuidv4(), text: "Would you like to share anything else?", type: "journal", isActive: true, order: 4 },
  ],

  // Data retention settings
  dataRetention: {
    retentionPeriodDays: 365,
    autoDeleteExpired: false,
    consentRequired: true,
    lastReviewDate: null,
  },

  // System settings
  settings: { ...MOCK_SETTINGS },

  // Audit logs
  auditLogs: [],

  // Password reset tokens
  resetTokens: [],

  // Rate-limit tracking
  loginAttempts: {},
  resetAttempts: {},
};

// ─── Helper: Hash password/PIN ────────────────────────────────────────────────
async function hashValue(value) {
  return bcrypt.hash(value, SALT_ROUNDS);
}

async function compareValue(value, hash) {
  return bcrypt.compare(value, hash);
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
function logAuditEvent(event) {
  db.auditLogs.push({
    id: uuidv4(),
    ...event,
    timestamp: new Date().toISOString(),
  });
}

// ─── Initialize: Pre-create user entries for all rostered students ────────────
function initializeDatabase() {
  STUDENT_ROSTER.forEach((student, index) => {
    const existing = db.users.find((u) => u.studentId === student.studentId);
    if (!existing) {
      db.users.push({
        id: uuidv4(),
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        displayName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: "",
        address: "",
        course: student.course,
        yearLevel: student.yearLevel,
        profilePhoto: null,
        passwordHash: bcrypt.hashSync("student123", SALT_ROUNDS),
        pinHash: null,
        role: "student",
        isActivated: true,
        isActive: true,
        activationCode: `ACT2400${index + 1}`,
        activationExpiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        resetToken: null,
        resetTokenExpires: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notificationPrefs: {
          checkInReminder: true,
          checkInTime: "08:00",
          messageAlerts: true,
          announcementAlerts: true,
          emailNotifications: false,
        },
        privacySettings: {
          shareMoodWithGuidance: true,
          shareCheckInHistory: false,
          showOnlineStatus: true,
          allowAnonymousFeedback: true,
        },
      });
    }
  });

  STAFF_ROSTER.forEach((staff) => {
    const existing = db.users.find((u) => u.accountId === staff.accountId);
    if (!existing) {
      db.users.push({
        id: uuidv4(),
        accountId: staff.accountId,
        name: staff.name,
        displayName: staff.name,
        email: staff.email,
        phone: "",
        address: "",
        role: staff.role,
        position: staff.position,
        profilePhoto: null,
        passwordHash: bcrypt.hashSync("admin123", SALT_ROUNDS),
        pinHash: null,
        isActivated: true,
        isActive: true,
        activationCode: null,
        activationExpiresAt: null,
        resetToken: null,
        resetTokenExpires: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notificationPrefs: {
          checkInReminder: false,
          checkInTime: "08:00",
          messageAlerts: true,
          announcementAlerts: true,
          emailNotifications: true,
        },
        privacySettings: {
          shareMoodWithGuidance: true,
          shareCheckInHistory: false,
          showOnlineStatus: true,
          allowAnonymousFeedback: false,
        },
      });
    }
  });

  logAuditEvent({
    action: "DATABASE_INITIALIZED",
    userId: "SYSTEM",
    details: "Mock database initialized with roster and staff accounts.",
  });
}

// ─── Database Operations ─────────────────────────────────────────────────────

// --- Student Roster ---
function findStudentByStudentId(studentId) {
  return db.studentRoster.find((s) => s.studentId === studentId) || null;
}

// --- User Account Operations ---
function findUserByStudentId(studentId) {
  return db.users.find((u) => u.studentId === studentId) || null;
}

function findUserByAccountId(accountId) {
  return db.users.find((u) => u.accountId === accountId) || null;
}

function findUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}

function findUserByEmail(email) {
  return db.users.find((u) => u.email === email) || null;
}

function findUserByAnyId(identifier) {
  return (
    findUserByStudentId(identifier) ||
    findUserByAccountId(identifier) ||
    findUserByEmail(identifier) ||
    null
  );
}

// --- Authentication ---
async function authenticateUser(identifier, password) {
  const user = findUserByAnyId(identifier);
  if (!user)
    return { success: false, error: "INVALID_CREDENTIALS", user: null };

  if (!user.isActivated)
    return { success: false, error: "NOT_ACTIVATED", user: null };

  if (!user.isActive)
    return { success: false, error: "ACCOUNT_DEACTIVATED", user: null };

  const valid = await compareValue(password, user.passwordHash);
  if (!valid) {
    const key = user.studentId || user.accountId;
    db.loginAttempts[key] = (db.loginAttempts[key] || 0) + 1;

    logAuditEvent({
      action: "LOGIN_FAILED",
      userId: user.id,
      details: `Failed login attempt for ${key}.`,
    });

    return { success: false, error: "INVALID_CREDENTIALS", user: null };
  }

  const key = user.studentId || user.accountId;
  db.loginAttempts[key] = 0;

  user.lastLogin = new Date().toISOString();
  user.updatedAt = new Date().toISOString();

  logAuditEvent({
    action: "LOGIN_SUCCESS",
    userId: user.id,
    details: `${user.role} logged in: ${key}`,
  });

  return { success: true, user: { ...user, passwordHash: undefined, pinHash: undefined } };
}

// --- Logout ---
function logoutUser(userId) {
  const user = findUserById(userId);
  if (user) {
    logAuditEvent({
      action: "LOGOUT",
      userId: user.id,
      details: `User logged out: ${user.studentId || user.accountId}`,
    });
  }
  return { success: true };
}

// --- Password Reset ---
function initiatePasswordReset(identifier) {
  const user = findUserByAnyId(identifier);

  if (!user) {
    logAuditEvent({
      action: "PASSWORD_RESET_REQUEST",
      userId: "UNKNOWN",
      details: `Reset requested for unknown identifier.`,
    });
    return { success: true };
  }

  const key = user.studentId || user.accountId;
  const attempts = db.resetAttempts[key] || 0;
  if (attempts >= 5) {
    logAuditEvent({
      action: "PASSWORD_RESET_RATE_LIMITED",
      userId: user.id,
      details: `Rate limited for ${key}.`,
    });
    return { success: true };
  }

  db.resetAttempts[key] = attempts + 1;

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  user.resetToken = token;
  user.resetTokenExpires = expiresAt;
  user.updatedAt = new Date().toISOString();

  logAuditEvent({
    action: "PASSWORD_RESET_REQUEST",
    userId: user.id,
    details: `Reset token generated for ${key}.`,
  });

  return { success: true, token };
}

function verifyResetToken(identifier, token) {
  const user = findUserByAnyId(identifier);
  if (!user) return { success: false, error: "INVALID_TOKEN" };
  if (!user.resetToken || user.resetToken !== token)
    return { success: false, error: "INVALID_TOKEN" };
  if (new Date(user.resetTokenExpires) < new Date())
    return { success: false, error: "TOKEN_EXPIRED" };

  return { success: true };
}

function resetPassword(identifier, token, newPassword) {
  const user = findUserByAnyId(identifier);
  if (!user) return { success: false, error: "INVALID_REQUEST" };
  if (!user.resetToken || user.resetToken !== token)
    return { success: false, error: "INVALID_TOKEN" };
  if (new Date(user.resetTokenExpires) < new Date())
    return { success: false, error: "TOKEN_EXPIRED" };

  user.passwordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  user.resetToken = null;
  user.resetTokenExpires = null;
  user.updatedAt = new Date().toISOString();

  const key = user.studentId || user.accountId;
  db.resetAttempts[key] = 0;

  logAuditEvent({
    action: "PASSWORD_RESET",
    userId: user.id,
    details: `Password reset for ${key}.`,
  });

  return { success: true };
}

// --- Register User (Students Self-Register) ---
function registerUser(fullName, studentId, email, password) {
  // Validate required fields
  if (!fullName || !fullName.trim()) {
    return { success: false, error: "EMPTY_NAME" };
  }
  if (!studentId || !studentId.trim()) {
    return { success: false, error: "EMPTY_STUDENT_ID" };
  }
  if (!email || !email.trim()) {
    return { success: false, error: "EMPTY_EMAIL" };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "WEAK_PASSWORD" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: "INVALID_EMAIL" };
  }

  // Check if student ID already has an account
  const existingStudent = findUserByStudentId(studentId.trim());
  if (existingStudent) {
    return { success: false, error: "STUDENT_ID_TAKEN" };
  }

  // Check if email is already used
  const existingEmail = findUserByEmail(email.trim());
  if (existingEmail) {
    return { success: false, error: "EMAIL_TAKEN" };
  }

  // Check if the student ID is in the roster
  const rosterEntry = findStudentByStudentId(studentId.trim());

  const newUser = {
    id: uuidv4(),
    studentId: studentId.trim(),
    name: fullName.trim(),
    displayName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: "",
    address: "",
    course: rosterEntry ? rosterEntry.course : "",
    yearLevel: rosterEntry ? rosterEntry.yearLevel : 1,
    profilePhoto: null,
    passwordHash: bcrypt.hashSync(password, SALT_ROUNDS),
    pinHash: null,
    role: "student",
    isActivated: true,
    isActive: true,
    activationCode: null,
    activationExpiresAt: null,
    resetToken: null,
    resetTokenExpires: null,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notificationPrefs: {
      checkInReminder: true,
      checkInTime: "08:00",
      messageAlerts: true,
      announcementAlerts: true,
      emailNotifications: false,
    },
    privacySettings: {
      shareMoodWithGuidance: true,
      shareCheckInHistory: false,
      showOnlineStatus: true,
      allowAnonymousFeedback: true,
    },
  };

  db.users.push(newUser);

  logAuditEvent({
    action: "ACCOUNT_REGISTERED",
    userId: newUser.id,
    details: `New account registered for student ${newUser.studentId}.`,
  });

  const { passwordHash, pinHash, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

// --- Deactivate Account ---
function deactivateAccount(userId) {
  const user = findUserById(userId);
  if (!user) return { success: false };

  user.isActive = false;
  user.updatedAt = new Date().toISOString();

  logAuditEvent({
    action: "ACCOUNT_DEACTIVATED",
    userId: user.id,
    details: `Account deactivated: ${user.studentId || user.accountId}`,
  });

  return { success: true };
}

// --- Profile Operations ---
function updateUserProfile(userId, updates) {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "USER_NOT_FOUND" };

  const allowedFields = ["displayName", "email", "phone", "address"];
  const sanitized = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      sanitized[field] = String(updates[field]).trim();
    }
  }

  if (sanitized.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized.email)) {
      return { success: false, error: "INVALID_EMAIL" };
    }
  }

  if (sanitized.email && sanitized.email !== user.email) {
    const existing = findUserByEmail(sanitized.email);
    if (existing && existing.id !== userId) {
      return { success: false, error: "EMAIL_TAKEN" };
    }
  }

  Object.assign(user, sanitized);
  user.updatedAt = new Date().toISOString();

  logAuditEvent({
    action: "PROFILE_UPDATED",
    userId: user.id,
    details: `Profile fields updated: ${Object.keys(sanitized).join(", ")}`,
  });

  const { passwordHash, pinHash, resetToken, resetTokenExpires, activationCode, activationExpiresAt, ...safeUser } = user;
  return { success: true, user: safeUser };
}

function getUserPreferences(userId) {
  const user = findUserById(userId);
  if (!user) return null;

  return {
    notificationPrefs: user.notificationPrefs || {
      checkInReminder: true,
      checkInTime: "08:00",
      messageAlerts: true,
      announcementAlerts: true,
      emailNotifications: false,
    },
    privacySettings: user.privacySettings || {
      shareMoodWithGuidance: true,
      shareCheckInHistory: false,
      showOnlineStatus: true,
      allowAnonymousFeedback: true,
    },
  };
}

function updateUserPreferences(userId, section, preferences) {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "USER_NOT_FOUND" };

  if (section === "notificationPrefs") {
    const allowed = ["checkInReminder", "checkInTime", "messageAlerts", "announcementAlerts", "emailNotifications"];
    const current = user.notificationPrefs || {};
    for (const key of allowed) {
      if (preferences[key] !== undefined) {
        current[key] = preferences[key];
      }
    }
    user.notificationPrefs = current;
  } else if (section === "privacySettings") {
    const allowed = ["shareMoodWithGuidance", "shareCheckInHistory", "showOnlineStatus", "allowAnonymousFeedback"];
    const current = user.privacySettings || {};
    for (const key of allowed) {
      if (preferences[key] !== undefined) {
        current[key] = preferences[key];
      }
    }
    user.privacySettings = current;
  } else {
    return { success: false, error: "INVALID_SECTION" };
  }

  user.updatedAt = new Date().toISOString();

  logAuditEvent({
    action: "PREFERENCES_UPDATED",
    userId: user.id,
    details: `${section} preferences updated.`,
  });

  const { passwordHash, pinHash, resetToken, resetTokenExpires, activationCode, activationExpiresAt, ...safeUser } = user;
  return { success: true, user: safeUser };
}

// --- Admin: Cases ---
function getAllCases() {
  return [...db.cases];
}

function getCaseById(caseId) {
  return db.cases.find((c) => c.id === caseId) || null;
}

function getCasesByStudent(studentId) {
  return db.cases.filter((c) => c.studentId === studentId);
}

function createCase(caseData) {
  const caseNumber = `CASE-${1000 + db.cases.length + 1}`;
  const newCase = {
    id: uuidv4(),
    caseNumber,
    ...caseData,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [],
  };
  db.cases.push(newCase);
  logAuditEvent({
    action: "CASE_CREATED",
    userId: caseData.assignedToId || "SYSTEM",
    details: `Case ${caseNumber} created for student ${caseData.studentName}.`,
  });
  return newCase;
}

function updateCase(caseId, updates) {
  const caseItem = db.cases.find((c) => c.id === caseId);
  if (!caseItem) return null;
  Object.assign(caseItem, updates, { updatedAt: new Date().toISOString() });
  logAuditEvent({
    action: "CASE_UPDATED",
    userId: updates.assignedToId || "SYSTEM",
    details: `Case ${caseItem.caseNumber} updated.`,
  });
  return caseItem;
}

function addCaseNote(caseId, author, text) {
  const caseItem = db.cases.find((c) => c.id === caseId);
  if (!caseItem) return null;
  const note = { id: uuidv4(), author, text, createdAt: new Date().toISOString() };
  caseItem.notes.push(note);
  caseItem.updatedAt = new Date().toISOString();
  return note;
}

// --- Admin: Alerts ---
function getAllAlerts() {
  return [...db.alerts];
}

function getAlertById(alertId) {
  return db.alerts.find((a) => a.id === alertId) || null;
}

function updateAlert(alertId, updates) {
  const alert = db.alerts.find((a) => a.id === alertId);
  if (!alert) return null;
  Object.assign(alert, updates);
  logAuditEvent({
    action: "ALERT_UPDATED",
    userId: updates.assignedToId || "SYSTEM",
    details: `Alert ${alert.alertId} updated to status: ${alert.status}.`,
  });
  return alert;
}

// --- Admin: Messages ---
function getMessages(userId) {
  return db.messages.filter(
    (m) => m.senderId === userId || m.recipientId === userId
  );
}

function getMessageById(messageId) {
  return db.messages.find((m) => m.id === messageId) || null;
}

function sendMessage(messageData) {
  const newMessage = {
    id: uuidv4(),
    ...messageData,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.messages.push(newMessage);
  logAuditEvent({
    action: "MESSAGE_SENT",
    userId: messageData.senderId,
    details: `Message sent to ${messageData.recipientName}.`,
  });
  return newMessage;
}

function markMessageRead(messageId) {
  const message = db.messages.find((m) => m.id === messageId);
  if (message) {
    message.isRead = true;
  }
  return message;
}

function markAllMessagesRead(userId) {
  db.messages
    .filter((m) => m.recipientId === userId && !m.isRead)
    .forEach((m) => { m.isRead = true; });
}

// --- Admin: Resources ---
function getAllResources() {
  return [...db.resources];
}

function getResourceById(resourceId) {
  return db.resources.find((r) => r.id === resourceId) || null;
}

function createResource(resourceData) {
  const newResource = {
    id: uuidv4(),
    ...resourceData,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.resources.push(newResource);
  logAuditEvent({
    action: "RESOURCE_CREATED",
    userId: resourceData.author || "SYSTEM",
    details: `Resource "${resourceData.title}" created.`,
  });
  return newResource;
}

function updateResource(resourceId, updates) {
  const resource = db.resources.find((r) => r.id === resourceId);
  if (!resource) return null;
  Object.assign(resource, updates, { updatedAt: new Date().toISOString() });
  logAuditEvent({
    action: "RESOURCE_UPDATED",
    userId: updates.author || "SYSTEM",
    details: `Resource "${resource.title}" updated.`,
  });
  return resource;
}

// --- Admin: Check-ins ---
function getAllCheckIns() {
  return [...db.checkIns];
}

function getCheckInsByStudent(studentId) {
  return db.checkIns.filter((c) => c.studentId === studentId);
}

// --- Admin: Notifications ---
function getNotifications(userId) {
  return [...db.notifications];
}

function markNotificationRead(notificationId) {
  const notification = db.notifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
  }
  return notification;
}

function markAllNotificationsRead() {
  db.notifications.forEach((n) => { n.isRead = true; });
}

function createNotification(notificationData) {
  const newNotification = {
    id: uuidv4(),
    ...notificationData,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.push(newNotification);
  return newNotification;
}

// --- Alerts: create (used by AI Support escalation flagging) ---
function createAlert(alertData) {
  const newAlert = {
    id: uuidv4(),
    alertId: `ALERT-${String(db.alerts.length + 1).padStart(3, "0")}`,
    relatedCase: null,
    ...alertData,
    status: alertData.status || "new",
    createdAt: new Date().toISOString(),
  };
  db.alerts.push(newAlert);
  logAuditEvent({
    action: "ALERT_CREATED",
    userId: "SYSTEM",
    details: `${newAlert.alertId} (${newAlert.severity}) created for ${newAlert.studentName} — ${newAlert.title}.`,
  });
  return newAlert;
}

// --- Admin: Settings ---
function getSettings() {
  return { ...db.settings };
}

function updateSettings(updates) {
  Object.assign(db.settings, updates);
  logAuditEvent({
    action: "SETTINGS_UPDATED",
    userId: "ADMIN",
    details: `System settings updated.`,
  });
  return { ...db.settings };
}

// --- Announcements ---
function getAllAnnouncements() {
  return [...db.announcements];
}

function getAnnouncementById(announcementId) {
  return db.announcements.find((a) => a.id === announcementId) || null;
}

function createAnnouncement(announcementData) {
  const newAnnouncement = {
    id: uuidv4(),
    ...announcementData,
    isPublished: announcementData.isPublished || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.announcements.push(newAnnouncement);
  logAuditEvent({
    action: "ANNOUNCEMENT_CREATED",
    userId: announcementData.authorId || "SYSTEM",
    details: `Announcement "${announcementData.title}" created.`,
  });
  return newAnnouncement;
}

function updateAnnouncement(announcementId, updates) {
  const announcement = db.announcements.find((a) => a.id === announcementId);
  if (!announcement) return null;
  Object.assign(announcement, updates, { updatedAt: new Date().toISOString() });
  logAuditEvent({
    action: "ANNOUNCEMENT_UPDATED",
    userId: updates.authorId || "SYSTEM",
    details: `Announcement "${announcement.title}" updated.`,
  });
  return announcement;
}

function deleteAnnouncement(announcementId) {
  const index = db.announcements.findIndex((a) => a.id === announcementId);
  if (index === -1) return false;
  const removed = db.announcements.splice(index, 1)[0];
  logAuditEvent({
    action: "ANNOUNCEMENT_DELETED",
    userId: "SYSTEM",
    details: `Announcement "${removed.title}" deleted.`,
  });
  return true;
}

// --- Alert Thresholds ---
function getAlertThresholds() {
  return { ...db.alertThresholds };
}

function updateAlertThresholds(updates) {
  Object.assign(db.alertThresholds, updates);
  logAuditEvent({
    action: "ALERT_THRESHOLDS_UPDATED",
    userId: "ADMIN",
    details: `Alert thresholds updated.`,
  });
  return { ...db.alertThresholds };
}

// --- School Structure ---
function getSchoolStructure() {
  return { ...db.schoolStructure };
}

function updateSchoolStructure(updates) {
  Object.assign(db.schoolStructure, updates);
  logAuditEvent({
    action: "SCHOOL_STRUCTURE_UPDATED",
    userId: "ADMIN",
    details: `School structure updated.`,
  });
  return { ...db.schoolStructure };
}

// --- Check-in Questions ---
function getCheckInQuestions() {
  return [...db.checkInQuestions].sort((a, b) => a.order - b.order);
}

function updateCheckInQuestions(questions) {
  db.checkInQuestions = questions;
  logAuditEvent({
    action: "CHECKIN_QUESTIONS_UPDATED",
    userId: "ADMIN",
    details: `Check-in questions updated.`,
  });
  return getCheckInQuestions();
}

// --- Data Retention ---
function getDataRetention() {
  return { ...db.dataRetention };
}

function updateDataRetention(updates) {
  Object.assign(db.dataRetention, updates);
  logAuditEvent({
    action: "DATA_RETENTION_UPDATED",
    userId: "ADMIN",
    details: `Data retention settings updated.`,
  });
  return { ...db.dataRetention };
}

// --- Roster Import ---
function importRoster(students) {
  let imported = 0;
  let skipped = 0;
  students.forEach((student) => {
    const existing = db.users.find((u) => u.studentId === student.studentId);
    if (existing) {
      skipped++;
      return;
    }
    db.users.push({
      id: uuidv4(),
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      displayName: `${student.firstName} ${student.lastName}`,
      email: student.email || "",
      phone: "",
      address: "",
      course: student.course || "",
      yearLevel: student.yearLevel || 1,
      section: student.section || "",
      profilePhoto: null,
      passwordHash: null,
      pinHash: null,
      role: "student",
      isActivated: true,
      isActive: true,
      activationCode: null,
      activationExpiresAt: null,
      resetToken: null,
      resetTokenExpires: null,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationPrefs: {
        checkInReminder: true,
        checkInTime: "08:00",
        messageAlerts: true,
        announcementAlerts: true,
        emailNotifications: false,
      },
      privacySettings: {
        shareMoodWithGuidance: true,
        shareCheckInHistory: false,
        showOnlineStatus: true,
        allowAnonymousFeedback: true,
      },
    });
    imported++;
  });
  logAuditEvent({
    action: "ROSTER_IMPORTED",
    userId: "ADMIN",
    details: `Roster import: ${imported} imported, ${skipped} skipped (duplicates).`,
  });
  return { imported, skipped };
}

// --- Getters ---
function getAllUsers() {
  return db.users.map((u) => ({
    ...u,
    passwordHash: undefined,
    pinHash: undefined,
  }));
}

function getStaffUsers() {
  return db.users.filter((u) => u.role === "admin" || u.role === "guidance").map((u) => ({
    ...u,
    passwordHash: undefined,
    pinHash: undefined,
  }));
}

function getAuditLogs() {
  return [...db.auditLogs];
}

function getLoginAttempts(identifier) {
  return db.loginAttempts[identifier] || 0;
}

// Initialize on module load
initializeDatabase();

export {
  // Database
  db,
  // Roster
  findStudentByStudentId,
  // User lookups
  findUserByStudentId,
  findUserByAccountId,
  findUserById,
  findUserByEmail,
  findUserByAnyId,
  // Auth operations
  registerUser,
  authenticateUser,
  logoutUser,
  // Password reset
  initiatePasswordReset,
  verifyResetToken,
  resetPassword,
  // Profile
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  // Admin
  deactivateAccount,
  getAllUsers,
  getStaffUsers,
  getAuditLogs,
  getLoginAttempts,
  // Cases
  getAllCases,
  getCaseById,
  getCasesByStudent,
  createCase,
  updateCase,
  addCaseNote,
  // Alerts
  getAllAlerts,
  getAlertById,
  updateAlert,
  createAlert,
  // Messages
  getMessages,
  getMessageById,
  sendMessage,
  markMessageRead,
  markAllMessagesRead,
  // Resources
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  // Check-ins
  getAllCheckIns,
  getCheckInsByStudent,
  // Notifications
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  // Announcements
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  // Alert Thresholds
  getAlertThresholds,
  updateAlertThresholds,
  // School Structure
  getSchoolStructure,
  updateSchoolStructure,
  // Check-in Questions
  getCheckInQuestions,
  updateCheckInQuestions,
  // Data Retention
  getDataRetention,
  updateDataRetention,
  // Roster
  importRoster,
  // Settings
  getSettings,
  updateSettings,
  // Helpers
  hashValue,
  compareValue,
  logAuditEvent,
};

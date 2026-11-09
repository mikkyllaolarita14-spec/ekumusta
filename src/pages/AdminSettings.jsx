import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";

import {
  getAdminSettings,
  updateAdminSettings,
  getSchoolStructure,
  updateSchoolStructure,
  addCourse as createCourseApi,
  updateCourse as updateCourseApi,
  deleteCourse as deleteCourseApi,
  getDataRetention,
  updateDataRetention,
} from "../api/settings";

import { ConfirmDialog } from "../components/ui";
import Icon from "../components/Icon";

import {
  getThresholds,
  updateThresholds,
} from "../api/checkins";

import {
  DEFAULT_YEAR_LEVELS,
  DEFAULT_BLOCKS,
  DEFAULT_COURSES,
  normalizeCourse,
} from "../utils/labels";

export default function AdminSettings() {
  // =========================================================
  // GENERAL SETTINGS
  // =========================================================

  const [settings, setSettings] = useState({
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
  });

  // =========================================================
  // ALERT THRESHOLDS
  // =========================================================

  const [alertThresholds, setAlertThresholds] = useState({
    consecutiveHighStress: 3,
    missedCheckInStreak: 3,
    lowMoodScoreThreshold: 2,
    highStressThreshold: 4,
    suddenMoodDrop: true,
  });

  // =========================================================
  // SCHOOL STRUCTURE
  // =========================================================

  const [schoolStructure, setSchoolStructure] = useState({
    yearLevels: [...DEFAULT_YEAR_LEVELS],
    blocks: [...DEFAULT_BLOCKS],
    courses: [],
  });

  // Course editing state
  const [editingCourseId, setEditingCourseId] = useState(null); // null | existing id | temp id
  const [courseSnapshot, setCourseSnapshot] = useState(null); // { index, course } for cancel
  const [savingCourse, setSavingCourse] = useState(false);

  // Course deletion confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { index, id, name }

  // =========================================================
  // DATA RETENTION
  // =========================================================

  const [dataRetention, setDataRetention] = useState({
    retentionPeriodDays: 365,
    autoDeleteExpired: false,
    consentRequired: true,
  });

  // =========================================================
  // UI STATE
  // =========================================================

  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // LOAD ALL SETTINGS
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        setLoading(true);

        const [
          settingsResult,
          thresholdResult,
          structureResult,
          retentionResult,
        ] = await Promise.all([
          getAdminSettings(),
          getThresholds(),
          getSchoolStructure(),
          getDataRetention(),
        ]);

        if (cancelled) return;

        // -----------------------------------------------------
        // GENERAL SETTINGS
        // -----------------------------------------------------

        if (
          settingsResult?.success &&
          settingsResult?.settings
        ) {
          setSettings((current) => ({
            ...current,
            ...settingsResult.settings,
          }));
        }

        // -----------------------------------------------------
        // ALERT THRESHOLDS
        // -----------------------------------------------------

        if (
          thresholdResult?.success &&
          thresholdResult?.thresholds
        ) {
          setAlertThresholds((current) => ({
            ...current,
            ...thresholdResult.thresholds,
          }));
        }

        // -----------------------------------------------------
        // SCHOOL STRUCTURE
        // -----------------------------------------------------

        if (
          structureResult?.success &&
          structureResult?.schoolStructure
        ) {
          const structure = structureResult.schoolStructure;

          setSchoolStructure({
            yearLevels:
              Array.isArray(structure.yearLevels) &&
              structure.yearLevels.length > 0
                ? structure.yearLevels
                : [...DEFAULT_YEAR_LEVELS],

            blocks:
              Array.isArray(structure.blocks) &&
              structure.blocks.length > 0
                ? structure.blocks
                : [...DEFAULT_BLOCKS],

            courses: Array.isArray(structure.courses)
              ? structure.courses.map(normalizeCourse)
              : [],
          });
        }

        // -----------------------------------------------------
        // CHECK-IN QUESTIONS
        // -----------------------------------------------------

        if (
          retentionResult?.success &&
          retentionResult?.dataRetention
        ) {
          setDataRetention((current) => ({
            ...current,
            ...retentionResult.dataRetention,
          }));
        }

        console.log("SYSTEM SETTINGS LOADED:", {
          settings: settingsResult,
          thresholds: thresholdResult,
          structure: structureResult,
          retention: retentionResult,
        });
      } catch (error) {
        console.error("SYSTEM SETTINGS LOAD ERROR:", error);

        if (!cancelled) {
          setMessage(
            error?.response?.data?.message ||
              "Unable to load system settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // SAVE ALL SETTINGS
  // =========================================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      // Convert alert thresholds from object to array of {key, value} pairs
      const thresholdsArray = [];
      const entries = Object.entries(alertThresholds);
      for (let i = 0; i < entries.length; i++) {
        const key = entries[i][0];
        let value = entries[i][1];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        } else {
          value = Number(value) || 0;
        }
        thresholdsArray.push({ key, value });
      }

      await Promise.all([
        // General
        updateAdminSettings(settings),

        // Alert Thresholds
        updateThresholds(thresholdsArray),

        // School Structure
        updateSchoolStructure({
          yearLevels: schoolStructure.yearLevels,
          blocks: schoolStructure.blocks,
          courses: schoolStructure.courses.map((course) => {
            const normalized = normalizeCourse(course);
            return {
              ...(course?.id != null ? { id: course.id } : {}),
              name: normalized.name,
              abbreviation: normalized.abbreviation,
            };
          }),
        }),

        // Data Retention
        updateDataRetention(dataRetention),

        // Data Retention
        updateDataRetention(dataRetention),
      ]);

      setMessage("Settings saved successfully.");

      console.log("SYSTEM SETTINGS SAVED");
    } catch (error) {
      console.error("SYSTEM SETTINGS SAVE ERROR:", error);

      setMessage(
        error?.response?.data?.message ||
          "Unable to save settings. Please try again."
      );
    } finally {
      setSaving(false);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  // =========================================================
  // GENERAL SETTINGS HANDLER
  // =========================================================

  const handleChange = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =========================================================
  // YEAR LEVEL HANDLERS
  // =========================================================

  const updateYearLevel = (index, value) => {
    setSchoolStructure((current) => {
      const updated = [...current.yearLevels];
      updated[index] = value;

      return {
        ...current,
        yearLevels: updated,
      };
    });
  };

  const removeYearLevel = (index) => {
    setSchoolStructure((current) => ({
      ...current,
      yearLevels: current.yearLevels.filter(
        (_, currentIndex) => currentIndex !== index
      ),
    }));
  };

  const addYearLevel = () => {
    setSchoolStructure((current) => ({
      ...current,
      yearLevels: [
        ...current.yearLevels,
        `Year Level ${current.yearLevels.length + 1}`,
      ],
    }));
  };

  // =========================================================
  // BLOCK HANDLERS
  // =========================================================

  const updateBlock = (index, value) => {
    setSchoolStructure((current) => {
      const updated = [...current.blocks];
      updated[index] = value;

      return {
        ...current,
        blocks: updated,
      };
    });
  };

  const removeBlock = (index) => {
    setSchoolStructure((current) => ({
      ...current,
      blocks: current.blocks.filter(
        (_, currentIndex) => currentIndex !== index
      ),
    }));
  };

  const addBlock = () => {
    setSchoolStructure((current) => ({
      ...current,
      blocks: [
        ...current.blocks,
        `Block ${current.blocks.length + 1}`,
      ],
    }));
  };

  // =========================================================
  // COURSE HANDLERS
  // =========================================================

  const updateCourseField = (index, field, value) => {
    setSchoolStructure((current) => {
      const updated = [...current.courses];
      const existing = updated[index] || {};
      updated[index] = {
        ...existing,
        ...normalizeCourse(existing),
        [field]: value,
      };

      return {
        ...current,
        courses: updated,
      };
    });
  };

  const startAddCourse = () => {
    setMessage("");
    const tempId = `new-${Date.now()}`;
    const index = schoolStructure.courses.length;
    setCourseSnapshot({ index, course: null });
    setEditingCourseId(tempId);
    setSchoolStructure((current) => ({
      ...current,
      courses: [
        ...current.courses,
        { _tempId: tempId, name: "", abbreviation: "" },
      ],
    }));
  };

  const startEditCourse = (index) => {
    const original = schoolStructure.courses[index];
    const course = { ...original, ...normalizeCourse(original) };
    setMessage("");
    setEditingCourseId(original?.id ?? original?._tempId ?? `idx-${index}`);
    setCourseSnapshot({ index, course: { ...original } });
  };

  const cancelCourseEdit = () => {
    if (courseSnapshot) {
      setSchoolStructure((current) => {
        const updated = [...current.courses];
        if (!courseSnapshot.course) {
          updated.splice(courseSnapshot.index, 1);
        } else {
          updated[courseSnapshot.index] = courseSnapshot.course;
        }
        return { ...current, courses: updated };
      });
    }
    setEditingCourseId(null);
    setCourseSnapshot(null);
  };

  const saveCourseRow = async (index) => {
    const course = normalizeCourse(schoolStructure.courses[index]);
    if (!course.name) {
      setMessage("Course name is required.");
      return;
    }
    if (!course.abbreviation) {
      setMessage("Course abbreviation is required.");
      return;
    }

    try {
      setSavingCourse(true);
      setMessage("");

      let result;
      if (schoolStructure.courses[index]?.id) {
        result = await updateCourseApi(
          schoolStructure.courses[index].id,
          { name: course.name, abbreviation: course.abbreviation }
        );
      } else {
        result = await createCourseApi({
          name: course.name,
          abbreviation: course.abbreviation,
        });
      }

      if (result?.success && result.course) {
        setSchoolStructure((current) => {
          const updated = [...current.courses];
          updated[index] = normalizeCourse(result.course);
          return { ...current, courses: updated };
        });
        setEditingCourseId(null);
        setCourseSnapshot(null);
        setMessage("Course saved successfully.");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result?.message || "Unable to save course.");
      }
    } catch (error) {
      console.error("COURSE SAVE ERROR:", error);
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors) {
        const firstError = Object.values(apiErrors).flat()[0];
        setMessage(firstError || "Unable to save course.");
      } else {
        setMessage(
          error?.response?.data?.message || "Unable to save course."
        );
      }
    } finally {
      setSavingCourse(false);
    }
  };

  const confirmRemoveCourse = (index) => {
    const course = normalizeCourse(schoolStructure.courses[index]);
    if (!schoolStructure.courses[index]?.id) {
      setSchoolStructure((current) => ({
        ...current,
        courses: current.courses.filter(
          (_, currentIndex) => currentIndex !== index
        ),
      }));
      setEditingCourseId(null);
      setCourseSnapshot(null);
      return;
    }
    setDeleteConfirm({
      index,
      id: schoolStructure.courses[index].id,
      name: course.name || course.abbreviation || "this course",
    });
  };

  const removeCourse = async () => {
    if (!deleteConfirm?.id) return;
    try {
      setSavingCourse(true);
      setMessage("");
      const result = await deleteCourseApi(deleteConfirm.id);
      if (result?.success) {
        setSchoolStructure((current) => ({
          ...current,
          courses: current.courses.filter(
            (course) => course?.id !== deleteConfirm.id
          ),
        }));
        setMessage(result.message || "Course deleted.");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result?.message || "Unable to delete course.");
      }
    } catch (error) {
      console.error("COURSE DELETE ERROR:", error);
      setMessage(
        error?.response?.data?.message || "Unable to delete course."
      );
    } finally {
      setSavingCourse(false);
      setDeleteConfirm(null);
    }
  };

  // =========================================================
  // QUESTION HANDLERS
  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AdminLayout>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="admin-page-header">
        <div>
          <h2>System Settings</h2>

          <p>
            Configure system-wide settings and preferences.
          </p>
        </div>

        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* =====================================================
          LOADING MESSAGE
      ===================================================== */}

      {loading && (
        <div className="admin-alert">
          Loading system settings...
        </div>
      )}

      {/* =====================================================
          SUCCESS / ERROR MESSAGE
      ===================================================== */}

      {message && (
        <div className="admin-alert admin-alert-success">
          {message}
        </div>
      )}

      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${
            activeTab === "general"
              ? "admin-tab-active"
              : ""
          }`}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>

        <button
          className={`admin-tab ${
            activeTab === "alerts"
              ? "admin-tab-active"
              : ""
          }`}
          onClick={() => setActiveTab("alerts")}
        >
          Alert Thresholds
        </button>

        <button
          className={`admin-tab ${
            activeTab === "structure"
              ? "admin-tab-active"
              : ""
          }`}
          onClick={() => setActiveTab("structure")}
        >
          School Structure
        </button>

        <button
          className={`admin-tab ${
            activeTab === "privacy"
              ? "admin-tab-active"
              : ""
          }`}
          onClick={() => setActiveTab("privacy")}
        >
          Data & Privacy
        </button>
      </div>

      {/* =====================================================
          GENERAL TAB
      ===================================================== */}

      {activeTab === "general" && (
        <div className="admin-settings-grid">
          {/* SCHOOL INFORMATION */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>School Information</h3>
            </div>

            <div className="admin-card-body">
              <div className="admin-field">
                <label className="admin-label">
                  School Name
                </label>

                <input
                  type="text"
                  value={settings.schoolName}
                  onChange={(e) =>
                    handleChange(
                      "schoolName",
                      e.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  School Email
                </label>

                <input
                  type="email"
                  value={settings.schoolEmail}
                  onChange={(e) =>
                    handleChange(
                      "schoolEmail",
                      e.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  School Phone
                </label>

                <input
                  type="text"
                  value={settings.schoolPhone}
                  onChange={(e) =>
                    handleChange(
                      "schoolPhone",
                      e.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Academic Year
                </label>

                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={(e) =>
                    handleChange(
                      "academicYear",
                      e.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* CHECK-IN CONFIGURATION */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Check-in Configuration</h3>
            </div>

            <div className="admin-card-body">
              <div className="admin-toggle-row">
                <div>
                  <h4>Daily Check-in</h4>

                  <p>
                    Enable or disable the daily student
                    check-in system.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    settings.checkInEnabled
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "checkInEnabled",
                      !settings.checkInEnabled
                    )
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Check-in Time
                </label>

                <input
                  type="time"
                  value={settings.checkInTime}
                  onChange={(e) =>
                    handleChange(
                      "checkInTime",
                      e.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>

              <div className="admin-toggle-row">
                <div>
                  <h4>Check-in Reminders</h4>

                  <p>
                    Send reminders to students who have not
                    checked in.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    settings.checkInReminderEnabled
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "checkInReminderEnabled",
                      !settings.checkInReminderEnabled
                    )
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          {/* NOTIFICATION SETTINGS */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Notification Settings</h3>
            </div>

            <div className="admin-card-body">
              <div className="admin-toggle-row">
                <div>
                  <h4>Alert Notifications</h4>

                  <p>
                    Receive notifications for new alerts.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    settings.alertNotificationEnabled
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "alertNotificationEnabled",
                      !settings.alertNotificationEnabled
                    )
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>

              <div className="admin-toggle-row">
                <div>
                  <h4>Email Notifications</h4>

                  <p>
                    Send notifications via email.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    settings.emailNotificationsEnabled
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "emailNotificationsEnabled",
                      !settings.emailNotificationsEnabled
                    )
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          {/* SYSTEM */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>System</h3>
            </div>

            <div className="admin-card-body">
              <div className="admin-toggle-row">
                <div>
                  <h4>Maintenance Mode</h4>

                  <p>
                    Put the system in maintenance mode.
                    Only admins can access.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    settings.maintenanceMode
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "maintenanceMode",
                      !settings.maintenanceMode
                    )
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ALERT THRESHOLDS TAB
      ===================================================== */}

      {activeTab === "alerts" && (
        <div className="admin-settings-grid">
          <div className="admin-card admin-card-wide">
            <div className="admin-card-header">
              <h3>Alert Thresholds</h3>
            </div>

            <div className="admin-card-body">
              <p className="ek-form-hint">
                Configure the conditions that automatically
                flag check-ins.
              </p>

              <div className="admin-field">
                <label className="admin-label">
                  Consecutive High Stress Days
                </label>

                <input
                  type="number"
                  min="1"
                  max="10"
                  value={
                    alertThresholds.consecutiveHighStress
                  }
                  onChange={(e) =>
                    setAlertThresholds((current) => ({
                      ...current,
                      consecutiveHighStress:
                        parseInt(e.target.value) || 3,
                    }))
                  }
                  className="admin-input ek-input-narrow"
                />

                <p className="ek-field-note">
                  Flag after this many consecutive
                  high-stress check-ins.
                </p>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Missed Check-in Streak
                </label>

                <input
                  type="number"
                  min="1"
                  max="10"
                  value={
                    alertThresholds.missedCheckInStreak
                  }
                  onChange={(e) =>
                    setAlertThresholds((current) => ({
                      ...current,
                      missedCheckInStreak:
                        parseInt(e.target.value) || 3,
                    }))
                  }
                  className="admin-input ek-input-narrow"
                />

                <p className="ek-field-note">
                  Flag after this many missed consecutive
                  check-ins.
                </p>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Low Mood Score Threshold
                </label>

                <input
                  type="number"
                  min="1"
                  max="5"
                  value={
                    alertThresholds.lowMoodScoreThreshold
                  }
                  onChange={(e) =>
                    setAlertThresholds((current) => ({
                      ...current,
                      lowMoodScoreThreshold:
                        parseInt(e.target.value) || 2,
                    }))
                  }
                  className="admin-input ek-input-narrow"
                />

                <p className="ek-field-note">
                  Flag check-ins with mood score at or below
                  this value.
                </p>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  High Stress Threshold
                </label>

                <input
                  type="number"
                  min="1"
                  max="5"
                  value={
                    alertThresholds.highStressThreshold
                  }
                  onChange={(e) =>
                    setAlertThresholds((current) => ({
                      ...current,
                      highStressThreshold:
                        parseInt(e.target.value) || 4,
                    }))
                  }
                  className="admin-input ek-input-narrow"
                />

                <p className="ek-field-note">
                  Flag check-ins with stress level at or
                  above this value.
                </p>
              </div>

              <div className="admin-toggle-row">
                <div>
                  <h4>Sudden Mood Drop Detection</h4>

                  <p>
                    Automatically flag significant mood
                    drops between consecutive check-ins.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    alertThresholds.suddenMoodDrop
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    setAlertThresholds((current) => ({
                      ...current,
                      suddenMoodDrop:
                        !current.suddenMoodDrop,
                    }))
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SCHOOL STRUCTURE TAB
      ===================================================== */}

      {activeTab === "structure" && (
        <div className="admin-settings-grid">
          {/* YEAR LEVELS */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Year Levels</h3>
            </div>

            <div className="admin-card-body">
              {schoolStructure.yearLevels.map(
                (level, index) => (
                  <div
                    key={index}
                    className="admin-field admin-field-inline"
                  >
                    <input
                      type="text"
                      value={level}
                      onChange={(e) =>
                        updateYearLevel(
                          index,
                          e.target.value
                        )
                      }
                      className="admin-input"
                    />

                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger-outline"
                      onClick={() =>
                        removeYearLevel(index)
                      }
                    >
                      Remove
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-outline"
                onClick={addYearLevel}
              >
                + Add Year Level
              </button>
            </div>
          </div>

          {/* BLOCKS */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Blocks</h3>
            </div>

            <div className="admin-card-body">
              {schoolStructure.blocks.map(
                (block, index) => (
                  <div
                    key={index}
                    className="admin-field admin-field-inline"
                  >
                    <input
                      type="text"
                      value={block}
                      onChange={(e) =>
                        updateBlock(
                          index,
                          e.target.value
                        )
                      }
                      className="admin-input"
                    />

                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger-outline"
                      onClick={() => removeBlock(index)}
                    >
                      Remove
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-outline"
                onClick={addBlock}
              >
                + Add Block
              </button>
            </div>
          </div>

          {/* COURSES */}

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Courses</h3>
            </div>

            <div className="admin-card-body">
              {schoolStructure.courses.length === 0 && (
                <p className="ek-field-note">No courses found.</p>
              )}

              {schoolStructure.courses.map((course, index) => {
                const normalized = normalizeCourse(course);
                const rowKey =
                  course?.id ?? course?._tempId ?? `course-${index}`;
                const isEditing =
                  editingCourseId === (course?.id ?? course?._tempId ?? `idx-${index}`);

                return (
                  <div
                    key={rowKey}
                    className="admin-field admin-field-inline"
                  >
                    <input
                      type="text"
                      value={normalized.name}
                      onChange={(e) =>
                        updateCourseField(index, "name", e.target.value)
                      }
                      className="admin-input"
                      placeholder="Course name"
                      disabled={savingCourse || (editingCourseId != null && !isEditing)}
                    />

                    <input
                      type="text"
                      value={normalized.abbreviation}
                      onChange={(e) =>
                        updateCourseField(index, "abbreviation", e.target.value)
                      }
                      className="admin-input"
                      placeholder="Abbreviation"
                      style={{ maxWidth: "140px" }}
                      disabled={savingCourse || (editingCourseId != null && !isEditing)}
                    />

                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => saveCourseRow(index)}
                          disabled={savingCourse}
                        >
                          {savingCourse ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={cancelCourseEdit}
                          disabled={savingCourse}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => startEditCourse(index)}
                          disabled={savingCourse || editingCourseId != null}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger-outline"
                          onClick={() => confirmRemoveCourse(index)}
                          disabled={savingCourse || editingCourseId != null}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-outline"
                onClick={startAddCourse}
                disabled={savingCourse || editingCourseId != null}
              >
                + Add Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CHECK-IN QUESTIONS TAB
      ===================================================== */}

            {/* =====================================================
          DATA & PRIVACY TAB
      ===================================================== */}

      {activeTab === "privacy" && (
        <div className="admin-settings-grid">
          <div className="admin-card admin-card-wide">
            <div className="admin-card-header">
              <h3>Data Retention & Privacy</h3>
            </div>

            <div className="admin-card-body">
              <div className="admin-field">
                <label className="admin-label">
                  Data Retention Period (Days)
                </label>

                <input
                  type="number"
                  min="30"
                  value={
                    dataRetention.retentionPeriodDays
                  }
                  onChange={(e) =>
                    setDataRetention((current) => ({
                      ...current,
                      retentionPeriodDays:
                        parseInt(e.target.value) || 365,
                    }))
                  }
                  className="admin-input ek-input-narrow"
                />

                <p className="ek-field-note">
                  How long student check-in data is
                  retained.
                </p>
              </div>

              <div className="admin-toggle-row">
                <div>
                  <h4>Auto-Delete Expired Data</h4>

                  <p>
                    Automatically delete data older than
                    the retention period.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    dataRetention.autoDeleteExpired
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    setDataRetention((current) => ({
                      ...current,
                      autoDeleteExpired:
                        !current.autoDeleteExpired,
                    }))
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>

              <div className="admin-toggle-row">
                <div>
                  <h4>Consent Required</h4>

                  <p>
                    Require student consent before
                    collecting check-in data.
                  </p>
                </div>

                <button
                  className={`admin-toggle ${
                    dataRetention.consentRequired
                      ? "admin-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    setDataRetention((current) => ({
                      ...current,
                      consentRequired:
                        !current.consentRequired,
                    }))
                  }
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Delete Course"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.name}"? Students currently assigned to this course may prevent deletion.`
            : ""
        }
        confirmLabel={savingCourse ? "Deleting..." : "Delete"}
        onConfirm={removeCourse}
        onCancel={() => !savingCourse && setDeleteConfirm(null)}
        danger
      />
    </AdminLayout>
  );
}
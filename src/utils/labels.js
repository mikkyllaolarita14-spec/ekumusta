// =============================================================
// COLLEGE TERMINOLOGY (single source of truth)
//
// This is a COLLEGE system. The user-facing vocabulary is:
//   "Year Level" (never "Grade" / "Grade Level" / Grade 7–12)
//   "Block"      (never "Section" / Section A–D)
//   "Course"     (never "Program" / "Degree")
// =============================================================

export const DEFAULT_YEAR_LEVELS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
];

export const DEFAULT_BLOCKS = [
  "Block 1",
  "Block 2",
  "Block 3",
  "Block 4",
  "Block 5",
];

export const DEFAULT_COURSES = [
  { name: "BS Information Technology", abbreviation: "BSIT" },
  { name: "BS Criminology", abbreviation: "BSCrim" },
  { name: "BS in Education", abbreviation: "BSEd" },
  { name: "BS Political Science", abbreviation: "BSPS" },
];

// Fallback list used when the API is unreachable (mirrors the DB seed).
export const FALLBACK_YEAR_LEVELS = DEFAULT_YEAR_LEVELS;
export const FALLBACK_BLOCKS = DEFAULT_BLOCKS;
export const FALLBACK_COURSES = DEFAULT_COURSES;

/**
 * Normalize a course entry into { id?, name, abbreviation }.
 * Accepts legacy string values and API objects.
 */
export function normalizeCourse(course) {
  if (course && typeof course === "object") {
    const name = String(course.name ?? course.value ?? "").trim();
    const abbreviation = String(course.abbreviation ?? "").trim();
    return {
      ...(course.id != null ? { id: course.id } : {}),
      name,
      abbreviation,
    };
  }

  const value = String(course ?? "").trim();
  return { name: value, abbreviation: "" };
}

/**
 * Return a display label for a course entry.
 */
export function courseLabel(course) {
  const normalized = normalizeCourse(course);
  if (!normalized.name) return normalized.abbreviation || "—";
  if (
    normalized.abbreviation &&
    normalized.abbreviation !== normalized.name
  ) {
    return `${normalized.name} (${normalized.abbreviation})`;
  }
  return normalized.name;
}

/**
 * Return the canonical value to store on a student/course field.
 */
export function courseValue(course) {
  return normalizeCourse(course).name;
}

/**
 * Format a stored year value for display.
 * Accepts a string ("First Year") or a numeric legacy value (1–4).
 */
export function formatYearLevel(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/**
 * Format a stored block value for display.
 */
export function formatBlock(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/**
 * Format a stored course value for display.
 */
export function formatCourse(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/**
 * Build the Year Level dropdown options, preferring the saved
 * school structure values and falling back to the defaults.
 */
export function yearLevelOptions(yearLevels) {
  const list =
    Array.isArray(yearLevels) && yearLevels.length > 0
      ? yearLevels
      : FALLBACK_YEAR_LEVELS;
  return list;
}

/**
 * Build the Block dropdown options, preferring the saved
 * school structure values and falling back to the defaults.
 */
export function blockOptions(blocks) {
  const list =
    Array.isArray(blocks) && blocks.length > 0 ? blocks : FALLBACK_BLOCKS;
  return list;
}

/**
 * Build the Course dropdown options, preferring the saved
 * school structure values and falling back to the defaults.
 */
export function courseOptions(courses) {
  const list =
    Array.isArray(courses) && courses.length > 0 ? courses : FALLBACK_COURSES;
  return list.map(normalizeCourse).filter((course) => course.name || course.abbreviation);
}

import api from "./axios";

// =========================================================
// GENERAL SETTINGS
// =========================================================

export const getAdminSettings = async () => {
  const response = await api.get("/admin/settings");
  return response.data;
};

export const updateAdminSettings = async (settings) => {
  const response = await api.patch(
    "/admin/settings",
    settings
  );

  return response.data;
};

// =========================================================
// SCHOOL STRUCTURE
// =========================================================

export const getSchoolStructure = async () => {
  const response = await api.get(
    "/admin/school-structure"
  );

  return response.data;
};

export const updateSchoolStructure = async (
  schoolStructure
) => {
  const response = await api.patch(
    "/admin/school-structure",
    schoolStructure
  );

  return response.data;
};

// =========================================================
// COURSE CRUD (name + abbreviation)
// =========================================================

export const addCourse = async (course) => {
  const response = await api.post(
    "/admin/school-structure/courses",
    course
  );

  return response.data;
};

export const updateCourse = async (id, course) => {
  const response = await api.patch(
    `/admin/school-structure/courses/${id}`,
    course
  );

  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await api.delete(
    `/admin/school-structure/courses/${id}`
  );

  return response.data;
};

// =========================================================
// CHECK-IN QUESTIONS
// =========================================================

export const getCheckInQuestions = async () => {
  const response = await api.get(
    "/admin/check-in-questions"
  );

  return response.data;
};

export const updateCheckInQuestions = async (
  questions
) => {
  const response = await api.patch(
    "/admin/check-in-questions",
    {
      questions,
    }
  );

  return response.data;
};

// =========================================================
// DATA RETENTION
// =========================================================

export const getDataRetention = async () => {
  const response = await api.get(
    "/admin/data-retention"
  );

  return response.data;
};

export const updateDataRetention = async (
  dataRetention
) => {
  const response = await api.patch(
    "/admin/data-retention",
    dataRetention
  );

  return response.data;
};
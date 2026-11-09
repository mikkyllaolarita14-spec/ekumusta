import api from "./axios";

export const getAdminCases = async () => {
  const response = await api.get("/admin/cases");
  return response.data;
};

export const getAdminCase = async (caseId) => {
  const response = await api.get(`/admin/cases/${caseId}`);
  return response.data;
};

export const createAdminCase = async (payload) => {
  const response = await api.post("/admin/cases", payload);
  return response.data;
};

export const addAdminCaseNote = async (caseId, note) => {
  const response = await api.post(`/admin/cases/${caseId}/notes`, { note });
  return response.data;
};

export const updateAdminCaseStatus = async (caseId, status) => {
  const response = await api.patch(`/admin/cases/${caseId}/status`, { status });
  return response.data;
};

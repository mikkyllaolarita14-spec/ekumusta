import api from "./axios";

export const getAdminReports = async () => {
  const response = await api.get("/admin/reports");

  return response.data;
};
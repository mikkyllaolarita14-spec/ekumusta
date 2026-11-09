import api from "./axios";

export const getAdminAlerts = async () => {
  const response = await api.get("/admin/alerts");
  return response.data;
};

export const getAdminAlert = async (alertId) => {
  const response = await api.get(`/admin/alerts/${alertId}`);
  return response.data;
};

export const updateAdminAlertStatus = async (alertId, status) => {
  const response = await api.patch(`/admin/alerts/${alertId}/status`, {
    status,
  });
  return response.data;
};

export const createCaseFromAlert = async (alertId, payload = {}) => {
  const response = await api.post("/admin/cases", {
    source_flag_id: alertId,
    alert_id: alertId,
    ...payload,
  });
  return response.data;
};

import api from "./axios";

export const getAdminStaffUsers = async (params = {}) => {
  const query =
    typeof params === "string"
      ? params
        ? { search: params }
        : {}
      : { ...(params || {}) };

  // Remove empty values so filters reset cleanly.
  Object.keys(query).forEach((key) => {
    if (query[key] === "" || query[key] === null || query[key] === undefined) {
      delete query[key];
    }
  });

  const response = await api.get("/admin/staff-users", {
    params: query,
  });

  return response.data;
};

export const createManagedUser = async (data) => {
  const response = await api.post("/admin/admin-accounts", data);
  return response.data;
};

export const updateAdminUser = async (id, data) => {
  const response = await api.put(`/admin/admin-accounts/${id}`, data);
  return response.data;
};

export const deleteAdminUser = async (id, currentPassword) => {
  const config = {};
  if (currentPassword !== undefined) {
    config.data = { current_password: currentPassword };
  }
  const response = await api.delete(`/admin/admin-accounts/${id}`, config);
  return response.data;
};
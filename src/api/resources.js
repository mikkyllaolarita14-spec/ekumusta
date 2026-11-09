import api from "./axios";

/**
 * Admin resources endpoints (Laravel: routes/api.php → AdminResourcesController).
 * The admin list response shape is { success, resources, meta }.
 */

export const getAdminResources = async (params = {}) => {
  // Server-side filtering: ?search=…&category=…&includeArchived=1
  const response = await api.get("/admin/resources", { params });

  return response.data;
};

export const createAdminResource = async ({
  title,
  description,
  category,
  content,
}) => {
  const response = await api.post("/admin/resources", {
    title,
    description,
    category,
    content,
  });

  return response.data;
};

export const updateAdminResource = async (id, data) => {
  const response = await api.put(`/admin/resources/${id}`, data);

  return response.data;
};

/**
 * DELETE /api/admin/resources/{id} — permanently removes the resource.
 */
export const deleteAdminResource = async (id) => {
  const response = await api.delete(`/admin/resources/${id}`);

  return response.data;
};

/**
 * PATCH /api/admin/resources/{id}/archive — toggles is_active on the backend.
 */
export const toggleAdminResourceArchive = async (id) => {
  const response = await api.patch(`/admin/resources/${id}/archive`);

  return response.data;
};
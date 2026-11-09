import api from "./axios";

export const getAdminAnnouncements = async () => {
  const response = await api.get("/admin/announcements");

  return response.data;
};

export const createAdminAnnouncement = async ({
  title,
  content,
  is_published,
}) => {
  const response = await api.post("/admin/announcements", {
    title,
    content,
    is_published,
  });

  return response.data;
};

export const updateAdminAnnouncement = async (
  id,
  data
) => {
  const response = await api.put(
    `/admin/announcements/${id}`,
    data
  );

  return response.data;
};

export const deleteAdminAnnouncement = async (id) => {
  const response = await api.delete(
    `/admin/announcements/${id}`
  );

  return response.data;
};
import api from "./axios";

export const getAdminProfile = async () => {
  const response = await api.get("/admin/profile");

  return response.data;
};

export const updateAdminProfile = async ({
  name,
  email,
  phone,
  address,
}) => {
  const response = await api.patch(
    "/admin/profile",
    {
      name,
      email,
      phone,
      address,
    }
  );

  return response.data;
};
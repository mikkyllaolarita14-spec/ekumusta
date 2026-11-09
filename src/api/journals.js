import api from "./axios";

export const getAdminJournals = async ({
  search = "",
  mood = "all",
} = {}) => {
  const response = await api.get(
    "/admin/journals",
    {
      params: {
        search,
        mood,
      },
    }
  );

  return response.data;
};
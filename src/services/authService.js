import api from "./api";

const authService = {
  login: async (username, password) => {
    const response = await api.post("/auth/login", {
      username,
      password,
    });

    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");

    return response.data;
  },

  refresh: async () => {
    const response = await api.post("/auth/refresh");

    return response.data;
  },
};

export default authService;
import axios from "axios";

const api = axios.create({
  baseURL: "https://furniture-erp-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (
      !isLoginRequest &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      window.dispatchEvent(
        new CustomEvent("erp:notify", {
          detail: {
            type: "error",
            message: "Your session has expired. Please login again.",
          },
        }),
      );
      window.setTimeout(() => {
        window.location.href = "/";
      }, 900);
    }

    return Promise.reject(error);
  }
);

export default api;

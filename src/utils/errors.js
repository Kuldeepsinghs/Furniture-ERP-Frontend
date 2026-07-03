export function getErrorMessage(error, fallback = "Unable to load data.") {
  if (!navigator.onLine) return "Network connection failed.";

  const status = error?.response?.status;

  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (status === 401) return "Your session has expired. Please login again.";
  if (status === 403) return "Access denied.";

  if (data && typeof data === "object") return Object.values(data).join(" ");

  return error?.message || fallback;
}
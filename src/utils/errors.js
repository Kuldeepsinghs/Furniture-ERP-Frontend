export function getErrorMessage(error, fallback = "Unable to load data.") {
  if (!navigator.onLine) return "Network connection failed.";

  const status = error?.response?.status;

  if (status === 401) return "Your session has expired. Please login again.";
  if (status === 403) return "Access denied.";

  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    fallback
  );
}

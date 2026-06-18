import { useCallback, useEffect, useMemo, useState } from "react";
import NotificationContext from "./NotificationContextValue";

const tones = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-orange-200 bg-orange-50 text-orange-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();

    setNotifications((current) => [
      ...current,
      {
        id,
        message,
        type,
      },
    ]);

    window.setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  useEffect(() => {
    const handler = (event) => {
      notify(event.detail?.message ?? "Something went wrong.", event.detail?.type ?? "info");
    };

    window.addEventListener("erp:notify", handler);
    return () => window.removeEventListener("erp:notify", handler);
  }, [notify]);

  const value = useMemo(
    () => ({
      notify,
      success: (message) => notify(message, "success"),
      error: (message) => notify(message, "error"),
      warning: (message) => notify(message, "warning"),
      info: (message) => notify(message, "info"),
    }),
    [notify],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] w-[calc(100vw-2rem)] max-w-sm space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg shadow-slate-900/10 ${tones[notification.type] ?? tones.info}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{notification.message}</p>
              <button
                type="button"
                onClick={() => dismiss(notification.id)}
                className="text-lg leading-none opacity-60 transition hover:opacity-100"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Notification } from "../types.js";
import { useToast } from "./ToastContext.js";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: (userId: string) => void;
  markAsRead: (notificationIds: string[]) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { pushToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: notifications[0]?.userId,
            notificationIds,
          }),
        });
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n,
          ),
        );
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await markAsRead(unreadIds);
  }, [notifications, markAsRead]);

  const clearNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }, []);

  // Poll for new notifications every 30 seconds and show toast for new ones
  useEffect(() => {
    if (!notifications.length) return;

    const interval = setInterval(async () => {
      const prevUnread = notifications.filter((n) => !n.read).length;
      const res = await fetch(
        `/api/notifications?userId=${notifications[0].userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        const newUnread = (data.notifications || []).filter(
          (n: Notification) => !n.read,
        ).length;
        setNotifications(data.notifications || []);
        if (newUnread > prevUnread) {
          pushToast("You have new notifications", "success");
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [notifications, pushToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

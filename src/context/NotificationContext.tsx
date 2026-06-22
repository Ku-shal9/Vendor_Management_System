import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  // Store userId in a ref so polling and markAsRead can always access the latest
  // value without it being a reactive dependency that restarts intervals.
  const userIdRef = useRef<string | null>(null);
  const unreadCountRef = useRef<number>(0);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keep unreadCountRef in sync so the polling closure reads the latest value.
  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const fetchNotifications = useCallback(async (userId: string) => {
    userIdRef.current = userId;
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
            userId: userIdRef.current,
            notificationIds,
          }),
        });
        setNotifications((prev) =>
          prev.filter((n) => !notificationIds.includes(n.id)),
        );
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    },
    [],
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

  // Poll for new notifications every 30 seconds and show toast for new ones.
  // Reads userId and unread count from refs so the interval is created once
  // and never restarted due to notification state changes.
  useEffect(() => {
    const interval = setInterval(async () => {
      const userId = userIdRef.current;
      if (!userId) return;
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          const newUnread = (data.notifications || []).filter(
            (n: Notification) => !n.read,
          ).length;
          if (newUnread > unreadCountRef.current) {
            pushToast("You have new notifications", "success");
          }
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to poll notifications:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [pushToast]);

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
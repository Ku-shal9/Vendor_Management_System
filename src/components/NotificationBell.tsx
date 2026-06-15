import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.js";
import { UserInfo } from "../types.js";
import { useEffect } from "react";

interface NotificationBellProps {
  user: UserInfo | null;
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.email);
    }
  }, [user, fetchNotifications]);

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={markAllAsRead}
      aria-label={`${unreadCount} unread notifications`}
      className="relative p-2.5 min-w-11 min-h-11 rounded-lg text-ink-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

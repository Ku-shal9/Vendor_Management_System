import { useState, useRef, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.js";
import { UserInfo } from "../types.js";

interface NotificationPanelProps {
  user: UserInfo | null;
}

export default function NotificationPanel({ user }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    clearNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.email);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleNotificationClick = async (id: string) => {
    await markAsRead([id]);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-ink">Notifications</h3>
          </div>
          {unreadNotifications.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">No new notifications</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {unreadNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className="p-4 hover:bg-surface-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-ink flex-1">
                      {notification.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification.id)}
                      aria-label="Mark as read"
                      className="p-1 rounded hover:bg-primary/10"
                    >
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                  <p className="text-xs text-ink-subtle mt-1">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

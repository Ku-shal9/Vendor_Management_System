import { X } from "lucide-react";
import { useToast } from "../context/ToastContext.js";

export default function ToastStack() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-[60] flex flex-col gap-2 w-[min(100%,20rem)]"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${
            toast.variant === "success" ? "vms-alert-success" : "vms-alert-error"
          }`}
        >
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

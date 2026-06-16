import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  className?: string;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function focusWithoutScroll(element: HTMLElement | null) {
  if (!element) return;
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

export default function Modal({
  open,
  onClose,
  titleId,
  children,
  className = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const latestOnClose = useRef(onClose);
  latestOnClose.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && panel.contains(activeElement)) return;

    focusWithoutScroll(panel);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        latestOnClose.current();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const elements = getFocusableElements(panel);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        focusWithoutScroll(last);
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        focusWithoutScroll(first);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus && document.contains(previousFocus)) {
        focusWithoutScroll(previousFocus);
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

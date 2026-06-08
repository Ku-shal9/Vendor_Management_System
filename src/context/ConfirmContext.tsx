import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Modal from "../components/Modal.jsx";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmState = ConfirmOptions & { open: true };

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(
  () => Promise.resolve(false)
);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const close = (result: boolean) => {
    setState(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal
          open={state.open}
          onClose={() => close(false)}
          titleId="confirm-dialog-title"
          className="vms-panel p-6 max-w-md w-full shadow-xl"
        >
          <h2 id="confirm-dialog-title" className="font-bold text-ink mb-2">
            {state.title}
          </h2>
          <p className="text-sm text-ink-muted mb-6">{state.message}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => close(false)} className="vms-btn-secondary">
              {state.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={state.destructive ? "vms-btn-danger" : "vms-btn-primary"}
            >
              {state.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

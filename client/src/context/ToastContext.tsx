import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "warning" | "error";

interface ToastEntry {
  id: number;
  variant: ToastVariant;
  title: string;
  message: string;
}

interface ToastContextValue {
  pushToast: (input: {
    variant: ToastVariant;
    title: string;
    message: string;
    durationMs?: number;
  }) => void;
}

const noop = () => {};

const ToastContext = createContext<ToastContextValue>({
  pushToast: noop
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (input: { variant: ToastVariant; title: string; message: string; durationMs?: number }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const toast: ToastEntry = {
        id,
        variant: input.variant,
        title: input.title,
        message: input.message
      };

      setToasts((previous) => [toast, ...previous].slice(0, 5));

      const durationMs = input.durationMs ?? 4500;
      window.setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      pushToast
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast toast-${toast.variant}`}>
            <p className="toast-title">{toast.title}</p>
            <p className="toast-message">{toast.message}</p>
            <button
              className="toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

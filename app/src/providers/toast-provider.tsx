"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBottomChrome } from "@/providers/bottom-chrome-provider";

interface Toast {
  id: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  const { viewportBottomOffset, navHeightPx } = useBottomChrome();
  return (
    <div
      className="pointer-events-none fixed left-0 right-0 z-[60] mx-auto flex max-w-lg flex-col gap-2 px-4"
      style={{
        bottom: `calc(${viewportBottomOffset + navHeightPx + 16}px + env(safe-area-inset-bottom, 0px))`,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-2xl border bg-card px-4 py-3 text-base font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2"
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

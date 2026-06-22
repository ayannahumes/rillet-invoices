"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "warning" | "error";

interface NotifyToast {
  id: string;
  kind: "notify";
  message: string;
  variant: ToastVariant;
}

interface ConfirmToast {
  id: string;
  kind: "confirm";
  message: string;
  variant: ToastVariant;
  confirmLabel: string;
  cancelLabel: string;
  onResult: (ok: boolean) => void;
}

type Toast = NotifyToast | ConfirmToast;

interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-success bg-success-soft text-success-strong",
  warning: "border-warning bg-warning-soft text-warning-strong",
  error: "border-error bg-error-soft text-error-strong",
};

const CONFIRM_BTN: Record<ToastVariant, string> = {
  success: "bg-success hover:bg-success-hover",
  warning: "bg-warning hover:bg-warning-hover",
  error: "bg-error hover:bg-error-hover",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = crypto.randomUUID();
      setToasts((list) => [...list, { id, kind: "notify", message, variant }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        const id = crypto.randomUUID();
        setToasts((list) => [
          ...list,
          {
            id,
            kind: "confirm",
            message,
            variant: options?.variant ?? "warning",
            confirmLabel: options?.confirmLabel ?? "Confirm",
            cancelLabel: options?.cancelLabel ?? "Cancel",
            onResult: resolve,
          },
        ]);
      }),
    [],
  );

  function resolveConfirm(t: ConfirmToast, ok: boolean) {
    t.onResult(ok);
    remove(t.id);
  }

  const notifyToasts = toasts.filter(
    (t): t is NotifyToast => t.kind === "notify",
  );
  const confirmToasts = toasts.filter(
    (t): t is ConfirmToast => t.kind === "confirm",
  );

  // Escape cancels the topmost open confirm (parity with backdrop click).
  useEffect(() => {
    if (confirmToasts.length === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const top = confirmToasts[confirmToasts.length - 1];
      top.onResult(false);
      remove(top.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmToasts, remove]);

  // Shared markup for a single notification. The live-region semantics live on
  // the always-mounted wrappers below, not here.
  const renderNotify = (t: NotifyToast) => (
    <div
      key={t.id}
      className={`pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-lg border-l-4 px-4 py-3 text-sm shadow-sm ${VARIANT_STYLES[t.variant]}`}
    >
      <span>{t.message}</span>
      <button
        type="button"
        onClick={() => remove(t.id)}
        aria-label="Dismiss"
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {/* While a confirm dialog is open the rest of the app is inert, so neither
          Tab nor a screen-reader's virtual cursor can reach the page behind the
          modal. The dialog and toasts render outside this wrapper, so they stay
          interactive. */}
      <div inert={confirmToasts.length > 0}>{children}</div>

      {/* Transient notifications — corner stack. Two always-mounted live regions
          so a screen reader reliably announces text injected into an existing
          region: polite for success/warning, assertive for errors. aria-atomic
          is false so only the new toast is read, not the whole stack. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col gap-2 px-4 sm:inset-x-auto sm:right-4">
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="flex flex-col items-center gap-2 sm:items-end"
        >
          {notifyToasts.filter((t) => t.variant !== "error").map(renderNotify)}
        </div>
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="false"
          className="flex flex-col items-center gap-2 sm:items-end"
        >
          {notifyToasts.filter((t) => t.variant === "error").map(renderNotify)}
        </div>
      </div>

      {/* Confirmations — centered blocking overlay */}
      {confirmToasts.map((t) => (
        <ConfirmDialog
          key={t.id}
          toast={t}
          onResolve={(ok) => resolveConfirm(t, ok)}
        />
      ))}
    </ToastContext.Provider>
  );
}

/**
 * Modal confirmation dialog. Handles the keyboard / screen-reader contract for a
 * modal: focus moves to the (safe) Cancel button on open, Tab is trapped inside
 * the dialog, and focus is restored to the triggering element on close. Escape
 * is handled by the provider. `aria-labelledby` names the dialog by its message.
 */
function ConfirmDialog({
  toast,
  onResolve,
}: {
  toast: ConfirmToast;
  onResolve: (ok: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const messageId = `confirm-message-${toast.id}`;

  // Move focus into the dialog on open; restore it to the previously-focused
  // element (the trigger) on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  // Trap Tab focus within the dialog.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay"
        onClick={() => onResolve(false)}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={messageId}
        onKeyDown={onKeyDown}
        className="relative w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-xl"
      >
        <p id={messageId} className="text-sm text-ink">
          {toast.message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onResolve(false)}
            className="rounded border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-bg"
          >
            {toast.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`rounded px-4 py-2 text-sm font-medium text-on-accent ${CONFIRM_BTN[toast.variant]}`}
          >
            {toast.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import clsx from "clsx";
import { useUIStore } from "../../store/ui.store";
import styles from "./ToastContainer.module.css";

const AUTO_DISMISS_MS = 2800;

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = toasts.map((toast) => globalThis.setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS));
    return () => {
      timers.forEach((timer) => globalThis.clearTimeout(timer));
    };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={clsx(styles.toast, styles[toast.variant])}>
          <span>{toast.message}</span>
          <button className={styles.dismiss} type="button" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

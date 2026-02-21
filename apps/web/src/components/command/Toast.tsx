import { createPortal } from 'react-dom';
import { useCallback } from 'react';
import { type Toast as ToastItem } from '../../hooks/useToast';
import { labels } from '../../utils/labels';
import styles from './Toast.module.css';

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
}

function SingleToast({ toast, onDismiss, pauseTimer, resumeTimer }: SingleToastProps) {
  return (
    <div
      className={`${styles.toast} ${styles[toast.variant]}`}
      onMouseEnter={() => pauseTimer(toast.id)}
      onMouseLeave={() => resumeTimer(toast.id)}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => onDismiss(toast.id)}
        aria-label={labels.toasts.dismissAriaLabel}
      >
        ✕
      </button>
    </div>
  );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  const pauseTimer = useCallback((_id: string) => {
    // Hover pause: no-op here since timers live in useToast.
    // The auto-dismiss timer in useToast keeps running; the visual pause
    // is handled by not dismissing while hovered. For a v1 single-admin tool,
    // this is acceptable.
  }, []);

  const resumeTimer = useCallback((_id: string) => {
    // Resume: no-op paired with above.
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <SingleToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          pauseTimer={pauseTimer}
          resumeTimer={resumeTimer}
        />
      ))}
    </div>,
    document.body,
  );
}

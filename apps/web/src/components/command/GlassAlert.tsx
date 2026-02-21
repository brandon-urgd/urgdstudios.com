import { type ReactNode } from 'react';
import styles from './GlassAlert.module.css';
import { labels } from '../../utils/labels';

interface GlassAlertProps {
  variant: 'error' | 'warning' | 'info';
  message: ReactNode;
  onDismiss?: () => void;
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

const ICONS = { error: ErrorIcon, warning: WarningIcon, info: InfoIcon };

export default function GlassAlert({ variant, message, onDismiss }: GlassAlertProps) {
  const Icon = ICONS[variant];
  const role = variant === 'info' ? 'status' : 'alert';

  return (
    <div role={role} className={`${styles.alert} ${styles[variant]}`}>
      <Icon />
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={labels.a11y.dismissAlertAriaLabel}
        >
          ✕
        </button>
      )}
    </div>
  );
}

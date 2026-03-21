import { type ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  heading?: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ heading, message, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      {heading && <h2 className={styles.heading}>{heading}</h2>}
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

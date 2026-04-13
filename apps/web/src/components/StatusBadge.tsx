import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: 'Active' | 'In Development' | 'Coming Soon' | 'Sunset' | 'Beta';
}

/**
 * Status badge component for application status indicators.
 *
 * Maps status values to semantic colors:
 * - Active: green (success)
 * - In Development: blue (info)
 * - Coming Soon: muted gray
 * - Sunset: red (error)
 * - Beta: sage green (Pulse accent)
 *
 * Rendered as a semantic span with aria-label for screen reader context.
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusClass = status.toLowerCase().replace(/\s+/g, '-');

  return (
    <span
      className={`${styles.badge} ${styles[statusClass]}`}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}

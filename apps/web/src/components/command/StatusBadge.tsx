import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: 'new' | 'in-progress' | 'closed';
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  'in-progress': 'In Progress',
  closed: 'Closed',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status.replace('-', '_')]}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

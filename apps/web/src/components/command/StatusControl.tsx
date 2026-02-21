import { type Message } from '../../hooks/useMessages';
import { labels } from '../../utils/labels';
import styles from './StatusControl.module.css';

interface StatusControlProps {
  currentStatus: Message['status'];
  onChange: (status: Message['status']) => void;
  isPending?: boolean;
}

export default function StatusControl({ currentStatus, onChange, isPending = false }: StatusControlProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value as Message['status']);
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="status-select" className="sr-only">
        {labels.statusControl.ariaLabel}
      </label>
      <select
        id="status-select"
        className={styles.select}
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        aria-disabled={isPending || undefined}
        aria-label={labels.statusControl.ariaLabel}
      >
        <option value="new">{labels.statusControl.new}</option>
        <option value="in-progress">{labels.statusControl.inProgress}</option>
        <option value="closed">{labels.statusControl.closed}</option>
      </select>
    </div>
  );
}

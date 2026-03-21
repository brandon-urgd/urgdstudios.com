import { type Message } from '../../hooks/useMessages';
import { labels, getCategoryLabel, getStatusLabel, formatDateShort } from '../../utils/labels';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import styles from './MessageRow.module.css';

interface MessageRowProps {
  message: Message;
  isSelected?: boolean;
  onOpen: (message: Message) => void;
  onDelete: (id: string) => void;
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function MessageRow({ message, isSelected = false, onOpen, onDelete }: MessageRowProps) {
  const categoryLabel = getCategoryLabel(message.type);
  const statusLabel = getStatusLabel(message.status);

  function handleRowClick() {
    onOpen(message);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(message);
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(message.submissionId);
  }

  function handleDeleteKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
  }

  return (
    <tr
      className={`${styles.row} ${isSelected ? styles.selected : ''}`}
      data-status={message.status}
      tabIndex={0}
      role="button"
      aria-label={labels.table.rowAriaLabel(message.name, categoryLabel, statusLabel)}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
    >
      <td className={styles.date}>{formatDateShort(message.timestamp)}</td>
      <td className={styles.category}>
        <span className={styles.categoryDesktop}>
          <CategoryBadge type={message.type} />
        </span>
        <span className={styles.categoryMobile}>
          <CategoryBadge type={message.type} iconOnly />
        </span>
      </td>
      <td className={styles.name}>{message.name}</td>
      <td className={styles.preview}>{message.preview}</td>
      <td className={styles.status}>
        <StatusBadge status={message.status} />
      </td>
      <td className={styles.actions}>
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={labels.table.deleteRowAriaLabel(message.name)}
          onClick={handleDeleteClick}
          onKeyDown={handleDeleteKeyDown}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}

import { type Message } from '../../hooks/useMessages';
import { labels } from '../../utils/labels';
import MessageRow from './MessageRow';
import EmptyState from './EmptyState';
import styles from './MessageTable.module.css';

interface MessageTableProps {
  messages: Message[];
  selectedId?: string;
  hasActiveFilters: boolean;
  onRowClick: (message: Message) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
}

export default function MessageTable({
  messages,
  selectedId,
  hasActiveFilters,
  onRowClick,
  onDelete,
  onClearFilters,
}: MessageTableProps) {
  if (messages.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          heading={labels.emptyState.noFilterResultsHeading}
          message={labels.emptyState.noFilterResultsDescription}
          action={
            <button type="button" onClick={onClearFilters} className={styles.clearLink}>
              {labels.emptyState.clearFiltersAction}
            </button>
          }
        />
      );
    }
    return (
      <EmptyState
        heading={labels.emptyState.noMessagesHeading}
        message={labels.emptyState.noMessagesDescription}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="sr-only">{labels.table.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.thDate}>{labels.table.colDate}</th>
            <th scope="col" className={styles.thCategory}>{labels.table.colCategory}</th>
            <th scope="col" className={styles.thFrom}>{labels.table.colFrom}</th>
            <th scope="col" className={styles.thPreview}>{labels.table.colPreview}</th>
            <th scope="col" className={styles.thStatus}>{labels.table.colStatus}</th>
            <th scope="col" className={styles.thActions}>
              <span className="sr-only">{labels.table.colActionsHidden}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <MessageRow
              key={message.submissionId}
              message={message}
              isSelected={message.submissionId === selectedId}
              onOpen={onRowClick}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

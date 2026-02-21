import { type Reply } from '../../hooks/useMessages';
import { labels, formatDateWithTime } from '../../utils/labels';
import styles from './ReplyHistoryItem.module.css';

interface ReplyHistoryItemProps {
  reply: Reply;
}

export default function ReplyHistoryItem({ reply }: ReplyHistoryItemProps) {
  const formattedDate = formatDateWithTime(reply.sentAt);

  return (
    <article
      className={styles.item}
      aria-label={labels.reply.historyItemAriaLabel(formattedDate)}
    >
      <p className={styles.body}>{reply.body}</p>
      <footer className={styles.meta}>
        <span>{labels.reply.sentLabel} {formattedDate}</span>
        <span>{labels.reply.toLabel} {reply.sentTo}</span>
      </footer>
    </article>
  );
}

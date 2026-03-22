import { useEffect, useRef } from 'react';
import { type MessageDetail, type Message } from '../../hooks/useMessages';
import { labels, formatDateLong } from '../../utils/labels';
import { isFeatureEnabled } from '../../utils/featureFlags';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';
import StatusControl from './StatusControl';
import ReplyCompose from './ReplyCompose';
import ReplyHistoryItem from './ReplyHistoryItem';
import GlassButton from './GlassButton';
import GlassAlert from './GlassAlert';
import EmptyState from './EmptyState';
import styles from './MessageDetailModal.module.css';

interface MessageDetailModalProps {
  message: MessageDetail | null;
  isNotFound?: boolean;
  statusUpdateError?: string | null;
  isStatusPending?: boolean;
  onClose: () => void;
  onStatusChange: (status: Message['status']) => void;
  onReplySuccess: (email: string) => void;
  onDelete: () => void;
}

export default function MessageDetailModal({
  message,
  isNotFound = false,
  statusUpdateError,
  isStatusPending = false,
  onClose,
  onStatusChange,
  onReplySuccess,
  onDelete,
}: MessageDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Escape key closes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const modalEl = document.getElementById('message-detail-modal');
    if (!modalEl) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        modalEl!.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        id="message-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-sender-heading"
        className={styles.content}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          aria-label={labels.detail.closeButton}
          onClick={onClose}
        >
          ✕
        </button>

        {isNotFound ? (
          <EmptyState message={labels.detail.notFound} />
        ) : message ? (
          <>
            <div className={styles.header}>
              <h2 id="modal-sender-heading" className={styles.senderName}>
                {message.name}
              </h2>
              <CategoryBadge type={message.type} />
            </div>

            <div className={styles.meta}>
              {message.source && (
                <span>
                  <strong>{labels.detail.appLabel}</strong> {message.source}
                </span>
              )}
              <span>
                <strong>{labels.detail.fromLabel}</strong> {message.email}
              </span>
              <span>
                <strong>{labels.detail.submittedLabel}</strong> {formatDateLong(message.timestamp)}
              </span>
              <StatusBadge status={message.status} />
            </div>

            <div className={styles.messageBody}>
              {message.message}
            </div>

            {message.replies && message.replies.length > 0 && (
              <div className={styles.replyHistory}>
                <h3 className={styles.replyHistoryHeading}>
                  {labels.detail.replyHistoryHeading}
                </h3>
                {message.replies.map((reply, i) => (
                  <ReplyHistoryItem key={i} reply={reply} />
                ))}
              </div>
            )}

            {statusUpdateError && (
              <GlassAlert variant="error" message={statusUpdateError} />
            )}

            <div className={styles.actions}>
              <StatusControl
                currentStatus={message.status}
                onChange={onStatusChange}
                isPending={isStatusPending}
              />
              <div className={styles.actionButtons}>
                {isFeatureEnabled('commandCenterReply') && message.status !== 'closed' && (
                  <ReplyCompose
                    messageId={message.submissionId}
                    recipientName={message.name}
                    recipientEmail={message.email}
                    onSuccess={onReplySuccess}
                  />
                )}
                {isFeatureEnabled('commandCenterReply') && message.status === 'closed' && (
                  <div className={styles.closedNotice}>
                    This message is closed. Reopen it to reply.
                  </div>
                )}
                <GlassButton variant="destructive" onClick={onDelete}>
                  {labels.detail.deleteButton}
                </GlassButton>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

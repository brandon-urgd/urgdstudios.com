import { useState } from 'react';
import { labels } from '../../utils/labels';
import { useReplyToMessage } from '../../hooks/useMessages';
import GlassButton from './GlassButton';
import GlassAlert from './GlassAlert';
import styles from './ReplyCompose.module.css';

interface ReplyComposeProps {
  messageId: string;
  recipientName: string;
  recipientEmail: string;
  onSuccess: (email: string) => void;
}

export default function ReplyCompose({ messageId, recipientName, recipientEmail, onSuccess }: ReplyComposeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const replyMutation = useReplyToMessage();

  const canSend = body.trim().length > 0;

  function handleExpand() {
    setIsExpanded(true);
  }

  function handleCancel() {
    setIsExpanded(false);
    setBody('');
    setErrorMsg(null);
    replyMutation.reset();
  }

  async function handleSend() {
    if (!canSend) return;
    setErrorMsg(null);

    try {
      await replyMutation.mutateAsync({ id: messageId, body });
      setBody('');
      setIsExpanded(false);
      onSuccess(recipientEmail);
    } catch {
      setErrorMsg(labels.errors.replyFailed);
    }
  }

  if (!isExpanded) {
    return (
      <GlassButton variant="secondary" onClick={handleExpand}>
        {labels.reply.replyButton}
      </GlassButton>
    );
  }

  return (
    <div className={styles.compose}>
      <textarea
        className={styles.textarea}
        aria-label={labels.reply.textareaAriaLabel(recipientName)}
        placeholder={labels.reply.textareaPlaceholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={replyMutation.isPending}
        rows={5}
      />

      {errorMsg && (
        <GlassAlert
          variant="error"
          message={errorMsg}
          onDismiss={() => setErrorMsg(null)}
        />
      )}

      <div className={styles.actions}>
        <GlassButton
          variant="primary"
          isLoading={replyMutation.isPending}
          loadingText={labels.reply.sendingButton}
          disabled={!canSend}
          onClick={handleSend}
        >
          {labels.reply.sendButton}
        </GlassButton>
        <button
          type="button"
          className={styles.cancelLink}
          onClick={handleCancel}
          disabled={replyMutation.isPending}
        >
          {labels.reply.cancelLink}
        </button>
      </div>
    </div>
  );
}

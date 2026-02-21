import { useEffect, useRef } from 'react';
import { labels } from '../../utils/labels';
import GlassButton from './GlassButton';
import GlassAlert from './GlassAlert';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export default function ConfirmDialog({ onConfirm, onCancel, isLoading = false, errorMessage }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus Cancel button on open (safe default — not the destructive action)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Escape key cancels
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isLoading]);

  return (
    <div className={styles.overlay} onClick={isLoading ? undefined : onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-heading"
        aria-describedby="confirm-body"
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-heading" className={styles.heading}>
          {labels.confirmDelete.heading}
        </h2>
        <p id="confirm-body" className={styles.body}>
          {labels.confirmDelete.body}
        </p>

        {errorMessage && (
          <GlassAlert variant="error" message={errorMessage} />
        )}

        <div className={styles.actions}>
          <GlassButton
            variant="secondary"
            ref={cancelRef}
            onClick={onCancel}
            disabled={isLoading}
          >
            {labels.confirmDelete.cancelButton}
          </GlassButton>
          <GlassButton
            variant="destructive"
            isLoading={isLoading}
            loadingText={labels.confirmDelete.deletingButton}
            onClick={onConfirm}
          >
            {labels.confirmDelete.deleteButton}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useMessages,
  useMessage,
  useUpdateStatus,
  useDeleteMessage,
  type MessageFilters,
  type Message,
} from '../../hooks/useMessages';
import { useToast } from '../../hooks/useToast';
import FilterBar, { getInitialFilters } from '../../components/command/FilterBar';
import MessageTable from '../../components/command/MessageTable';
import MessageDetailModal from '../../components/command/MessageDetailModal';
import LoadingSkeleton from '../../components/command/LoadingSkeleton';
import EmptyState from '../../components/command/EmptyState';
import Toast from '../../components/command/Toast';
import { labels } from '../../utils/labels';
import styles from './MessageDashboard.module.css';
import { useState } from 'react';

const DEFAULT_FILTERS: MessageFilters = {
  status: 'all',
  category: 'all',
  search: '',
};

function getDefaultFilters(): MessageFilters {
  return getInitialFilters();
}

export default function MessageDashboard() {
  const { id: selectedId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<MessageFilters>(getDefaultFilters);
  const { toasts, addToast, removeToast } = useToast();

  // ── List ────────────────────────────────────────────────────────────────────
  const { data: allMessages, isLoading, isError, isFetching, refetch } = useMessages();

  // Client-side filtering (Message uses `type` for category, `preview` for body)
  const messages = useMemo<Message[]>(() => {
    if (!allMessages) return [];
    return allMessages.filter((msg) => {
      if (filters.status && filters.status !== 'all' && msg.status !== filters.status) return false;
      if (filters.category && filters.category !== 'all' && msg.type !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = [msg.name, msg.email, msg.preview].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [allMessages, filters]);

  // ── Detail ──────────────────────────────────────────────────────────────────
  const {
    data: selectedMessage,
    isError: isDetailError,
  } = useMessage(selectedId ?? '');

  const updateStatus = useUpdateStatus();
  const deleteMessage = useDeleteMessage();

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedId) {
        navigate('/command/dashboard', { replace: true });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, navigate]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleRowClick(message: Message) {
    navigate(`/command/dashboard/messages/${message.submissionId}`);
  }

  function handleModalClose() {
    navigate('/command/dashboard', { replace: true });
  }

  function handleStatusChange(status: Message['status']) {
    if (!selectedId) return;
    updateStatus.mutate(
      { id: selectedId, status },
      {
        onError: () => addToast(labels.errors.statusUpdateFailed, 'error'),
      },
    );
  }

  function handleReplySuccess(email: string) {
    addToast(labels.toasts.replySent(email), 'success');
  }

  function handleDelete() {
    if (!selectedId) return;
    handleDeleteById(selectedId);
  }

  function handleDeleteById(id: string) {
    deleteMessage.mutate(id, {
      onSuccess: () => {
        addToast(labels.toasts.messageDeleted, 'success');
        if (id === selectedId) navigate('/command/dashboard', { replace: true });
      },
      onError: () => addToast(labels.errors.deleteFailed, 'error'),
    });
  }

  function handleFilterChange(updated: Partial<MessageFilters>) {
    setFilters((prev) => ({ ...prev, ...updated }));
  }

  const hasFilters = !!(
    (filters.status && filters.status !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    filters.search
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{labels.dashboard.pageTitle}</h1>
        {!isLoading && !isError && (allMessages?.length ?? 0) > 0 && (
          <p className={styles.count} aria-live="polite">
            {labels.dashboard.messageCount(messages.length)}
          </p>
        )}
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Refresh messages"
          title="Refresh messages"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={isFetching ? styles.spinning : undefined}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </header>

      <div className={styles.toolbar}>
        <FilterBar filters={filters} onChange={handleFilterChange} />
      </div>

      <div className={styles.content} role="main">
        {isLoading ? (
          <LoadingSkeleton variant="table" />
        ) : isError ? (
          <EmptyState
            message={labels.errors.loadFailed}
            action={
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => void refetch()}
              >
                {labels.errors.retry}
              </button>
            }
          />
        ) : (
          <MessageTable
            messages={messages}
            selectedId={selectedId}
            hasActiveFilters={hasFilters}
            onRowClick={handleRowClick}
            onDelete={handleDeleteById}
            onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          />
        )}
      </div>

      {selectedId && (
        <MessageDetailModal
          message={selectedMessage ?? null}
          isNotFound={isDetailError}
          isStatusPending={updateStatus.isPending}
          statusUpdateError={
            updateStatus.isError ? labels.errors.statusUpdateFailed : null
          }
          onClose={handleModalClose}
          onStatusChange={handleStatusChange}
          onReplySuccess={handleReplySuccess}
          onDelete={handleDelete}
        />
      )}

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

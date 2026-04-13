import { useEffect, useState, useCallback } from 'react';
import { authedFetch } from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import LoadingSkeleton from '../../components/command/LoadingSkeleton';
import EmptyState from '../../components/command/EmptyState';
import Toast from '../../components/command/Toast';
import { formatDateShort } from '../../utils/labels';
import styles from './BetaDashboard.module.css';

interface BetaSignup {
  signupId: string;
  name: string;
  email: string;
  app: string;
  signupTimestamp: string;
  sessionsSent: boolean;
  hasSurvey: boolean;
  surveyTimestamp?: string;
}

export default function BetaDashboard() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const { toasts, addToast, removeToast } = useToast();

  const fetchSignups = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setIsError(false);

    try {
      const res = await authedFetch('/v1/admin/beta/signups');
      if (!res.ok) throw new Error('Failed to load beta signups');
      const data = (await res.json()) as { signups: BetaSignup[] };
      // Sort by signupTimestamp descending
      const sorted = [...data.signups].sort(
        (a, b) => new Date(b.signupTimestamp).getTime() - new Date(a.signupTimestamp).getTime(),
      );
      setSignups(sorted);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSignups();
  }, [fetchSignups]);

  async function handleToggleSent(signupId: string, current: boolean) {
    setTogglingIds((prev) => new Set(prev).add(signupId));

    // Optimistic update
    setSignups((prev) =>
      prev.map((s) => (s.signupId === signupId ? { ...s, sessionsSent: !current } : s)),
    );

    try {
      const res = await authedFetch(`/v1/admin/beta/signups/${signupId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sessionsSent: !current }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      // Rollback
      setSignups((prev) =>
        prev.map((s) => (s.signupId === signupId ? { ...s, sessionsSent: current } : s)),
      );
      addToast('Failed to update sessions sent. Try again.', 'error');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(signupId);
        return next;
      });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Beta Signups</h1>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void fetchSignups(true)}
          disabled={isRefreshing}
          aria-label="Refresh beta signups"
          title="Refresh beta signups"
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
            className={isRefreshing ? styles.spinning : undefined}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <LoadingSkeleton variant="table" />
        ) : isError ? (
          <EmptyState
            message="Something went wrong. Try again."
            action={
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => void fetchSignups()}
              >
                Retry
              </button>
            }
          />
        ) : signups.length === 0 ? (
          <EmptyState message="No beta signups yet." />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>App</th>
                  <th>Signed Up</th>
                  <th>Sessions Sent</th>
                  <th>Survey</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((signup) => (
                  <tr key={signup.signupId}>
                    <td className={styles.nameCell}>{signup.name}</td>
                    <td className={styles.emailCell}>{signup.email}</td>
                    <td className={styles.appCell}>{signup.app}</td>
                    <td className={styles.dateCell}>
                      {formatDateShort(signup.signupTimestamp)}
                    </td>
                    <td>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          className={styles.toggleInput}
                          checked={signup.sessionsSent}
                          disabled={togglingIds.has(signup.signupId)}
                          onChange={() =>
                            void handleToggleSent(signup.signupId, signup.sessionsSent)
                          }
                          aria-label={`Sessions sent to ${signup.name}`}
                        />
                        <span className={styles.toggleTrack} />
                      </label>
                    </td>
                    <td>
                      {signup.hasSurvey ? (
                        <span className={styles.surveyYes}>
                          Yes{signup.surveyTimestamp ? ` — ${formatDateShort(signup.surveyTimestamp)}` : ''}
                        </span>
                      ) : (
                        <span className={styles.surveyNo}>No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

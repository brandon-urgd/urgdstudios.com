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
  betaEmailSentAt: string | null;
  hasSurvey: boolean;
  surveyTimestamp?: string;
}

type SortKey = 'name' | 'email' | 'app' | 'signupTimestamp' | 'betaEmailSentAt' | 'hasSurvey';
type SortDir = 'asc' | 'desc';

export default function BetaDashboard() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('signupTimestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { toasts, addToast, removeToast } = useToast();

  const fetchSignups = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setIsError(false);

    try {
      const res = await authedFetch('/v1/admin/beta/signups');
      if (!res.ok) throw new Error('Failed to load beta signups');
      const data = (await res.json()) as { signups: BetaSignup[] };
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

  // Client-side search filter
  const filtered = signups.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.app.toLowerCase().includes(q)
    );
  });

  // Client-side column sort
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'name':
      case 'email':
      case 'app':
        return dir * a[sortKey].localeCompare(b[sortKey]);
      case 'signupTimestamp':
        return dir * (new Date(a.signupTimestamp).getTime() - new Date(b.signupTimestamp).getTime());
      case 'betaEmailSentAt':
        return dir * ((a.betaEmailSentAt || '').localeCompare(b.betaEmailSentAt || ''));
      case 'hasSurvey':
        return dir * (Number(a.hasSurvey) - Number(b.hasSurvey));
      default:
        return 0;
    }
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  const surveyCount = signups.filter((s) => s.hasSurvey).length;
  const sentCount = signups.filter((s) => !!s.betaEmailSentAt).length;

  async function handleToggleSent(signupId: string, currentSentAt: string | null) {
    setTogglingIds((prev) => new Set(prev).add(signupId));

    const newValue = currentSentAt ? null : new Date().toISOString();

    // Optimistic update
    setSignups((prev) =>
      prev.map((s) => (s.signupId === signupId ? { ...s, betaEmailSentAt: newValue } : s)),
    );

    try {
      const res = await authedFetch(`/v1/admin/beta/signups/${signupId}`, {
        method: 'PATCH',
        body: JSON.stringify({ betaEmailSentAt: newValue }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      // Rollback
      setSignups((prev) =>
        prev.map((s) => (s.signupId === signupId ? { ...s, betaEmailSentAt: currentSentAt } : s)),
      );
      addToast('Failed to update beta email status. Try again.', 'error');
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
        <div className={styles.headerTop}>
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
        </div>
        {!isLoading && signups.length > 0 && (
          <>
            <div className={styles.stats}>
              <span>{signups.length} signup{signups.length !== 1 ? 's' : ''}</span>
              <span className={styles.statDot}>·</span>
              <span>{sentCount} sent</span>
              <span className={styles.statDot}>·</span>
              <span>{surveyCount} surveyed</span>
            </div>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search beta signups"
            />
          </>
        )}
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
        ) : filtered.length === 0 ? (
          <EmptyState message="No signups match your search." />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortable} onClick={() => handleSort('name')}>Name{sortIndicator('name')}</th>
                  <th className={styles.sortable} onClick={() => handleSort('email')}>Email{sortIndicator('email')}</th>
                  <th className={styles.sortable} onClick={() => handleSort('app')}>App{sortIndicator('app')}</th>
                  <th className={styles.sortable} onClick={() => handleSort('signupTimestamp')}>Signed Up{sortIndicator('signupTimestamp')}</th>
                  <th className={styles.sortable} onClick={() => handleSort('betaEmailSentAt')}>Beta Email Sent{sortIndicator('betaEmailSentAt')}</th>
                  <th className={styles.sortable} onClick={() => handleSort('hasSurvey')}>Survey{sortIndicator('hasSurvey')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((signup) => (
                  <tr key={signup.signupId}>
                    <td className={styles.nameCell}>{signup.name.split(/\s+/)[0]}</td>
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
                          checked={!!signup.betaEmailSentAt}
                          disabled={togglingIds.has(signup.signupId)}
                          onChange={() =>
                            void handleToggleSent(signup.signupId, signup.betaEmailSentAt)
                          }
                          aria-label={`Beta email sent to ${signup.name.split(/\s+/)[0]}`}
                        />
                        <span className={styles.toggleTrack} />
                      </label>
                      {signup.betaEmailSentAt && (
                        <span className={styles.sentDate}>{formatDateShort(signup.betaEmailSentAt)}</span>
                      )}
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

import { useEffect } from 'react';
import { labels } from '../../utils/labels';
import { type MessageFilters } from '../../hooks/useMessages';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  filters: MessageFilters;
  onChange: (filters: MessageFilters) => void;
}

const STORAGE_KEY = 'urgd-cc-filters';

function loadStoredFilters(): Partial<MessageFilters> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Partial<MessageFilters>) : {};
  } catch {
    return {};
  }
}

export function getInitialFilters(): MessageFilters {
  const stored = loadStoredFilters();
  return {
    category: stored.category ?? 'all',
    status: stored.status ?? 'all',
    search: stored.search ?? '',
  };
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  function handleCategory(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, category: e.target.value });
  }

  function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, status: e.target.value });
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...filters, search: e.target.value });
  }

  return (
    <div className={styles.bar}>
      <div className={styles.control}>
        <label htmlFor="filter-category" className={styles.label}>
          {labels.filters.categoryLabel}
        </label>
        <select
          id="filter-category"
          className={styles.select}
          value={filters.category ?? 'all'}
          onChange={handleCategory}
        >
          <option value="all">{labels.filters.allCategories}</option>
          {Object.entries(labels.filters.categories).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={styles.control}>
        <label htmlFor="filter-status" className={styles.label}>
          {labels.filters.statusLabel}
        </label>
        <select
          id="filter-status"
          className={styles.select}
          value={filters.status ?? 'all'}
          onChange={handleStatus}
        >
          <option value="all">{labels.filters.allStatuses}</option>
          {Object.entries(labels.filters.statuses).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={`${styles.control} ${styles.searchControl}`}>
        <label htmlFor="filter-search" className={styles.label}>
          {labels.filters.searchLabel}
        </label>
        <input
          id="filter-search"
          type="search"
          className={styles.search}
          placeholder={labels.filters.searchPlaceholder}
          aria-label={labels.filters.searchAriaLabel}
          value={filters.search ?? ''}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
}

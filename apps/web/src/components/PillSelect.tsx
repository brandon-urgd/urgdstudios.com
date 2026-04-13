/**
 * urgdstudios.com — PillSelect Component
 *
 * Reusable pill-button selector for choosing between options.
 * Each pill is a button with aria-pressed state.
 * Tab between pills, Enter/Space to select.
 * Minimum 44px touch targets. Interactive blue for selected state.
 */

import styles from './PillSelect.module.css';

interface PillSelectProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string | null;
}

export default function PillSelect({
  name,
  label,
  options,
  value,
  onChange,
  error,
}: PillSelectProps) {
  const errorId = `${name}-error`;

  return (
    <div className={styles.group}>
      <span className={styles.label} id={`${name}-label`}>
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={`${name}-label`}
        aria-describedby={error ? errorId : undefined}
        className={styles.pillRow}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const pillClasses = [styles.pill, isSelected && styles.selected]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              className={pillClasses}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <div id={errorId} className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

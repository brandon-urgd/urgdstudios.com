/**
 * urgdstudios.com — RatingScale Component
 *
 * Reusable 1-5 rating scale following WAI-ARIA radio group pattern.
 * Arrow key navigation (Left/Right) with wrapping, roving tabindex.
 * Minimum 44px touch targets. Interactive blue for selected state.
 */

import { useRef, useCallback, KeyboardEvent } from 'react';
import styles from './RatingScale.module.css';

interface RatingScaleProps {
  name: string;
  label: string;
  lowAnchor: string;
  highAnchor: string;
  value: number | null;
  onChange: (value: number) => void;
  error?: string | null;
}

const OPTIONS = [1, 2, 3, 4, 5] as const;

export default function RatingScale({
  name,
  label,
  lowAnchor,
  highAnchor,
  value,
  onChange,
  error,
}: RatingScaleProps) {
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, index: number) => {
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % OPTIONS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
      }

      if (nextIndex !== null) {
        onChange(OPTIONS[nextIndex]);
        optionRefs.current[nextIndex]?.focus();
      }
    },
    [onChange],
  );

  const errorId = `${name}-error`;
  const focusedIndex = value !== null ? value - 1 : 0;

  return (
    <div className={styles.group}>
      <span className={styles.label} id={`${name}-label`}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        className={styles.scaleRow}
      >
        {OPTIONS.map((option, index) => {
          const isSelected = value === option;
          const optionClasses = [
            styles.option,
            isSelected && styles.selected,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={option}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option}`}
              tabIndex={index === focusedIndex ? 0 : -1}
              className={optionClasses}
              onClick={() => onChange(option)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {option}
            </div>
          );
        })}
      </div>
      <div className={styles.anchors}>
        <span className={styles.anchor}>{lowAnchor}</span>
        <span className={styles.anchor}>{highAnchor}</span>
      </div>
      {error && (
        <div id={errorId} className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

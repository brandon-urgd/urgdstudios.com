/**
 * urgdstudios.com — Character Counter Component
 *
 * Displays current/max character count with warning color at 90%+ threshold.
 */

import styles from './CharacterCounter.module.css';

interface CharacterCounterProps {
  current: number;
  max: number;
}

export default function CharacterCounter({
  current,
  max,
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 90 && percentage < 100;
  const isError = percentage >= 100;

  const counterClasses = [
    styles.counter,
    isWarning && styles.warning,
    isError && styles.error,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={counterClasses} aria-live="polite" aria-atomic="true">
      {current}/{max}
    </div>
  );
}

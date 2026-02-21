import styles from './LoadingSkeleton.module.css';
import { labels } from '../../utils/labels';

interface LoadingSkeletonProps {
  variant: 'table' | 'card';
}

function SkeletonRow() {
  return (
    <div className={styles.row} aria-hidden="true">
      <div className={`${styles.bar} ${styles.date}`} />
      <div className={`${styles.bar} ${styles.category}`} />
      <div className={`${styles.bar} ${styles.name}`} />
      <div className={`${styles.bar} ${styles.preview}`} />
      <div className={`${styles.bar} ${styles.status}`} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.table}>
      <div className={styles.headerRow} aria-hidden="true">
        <div className={`${styles.bar} ${styles.headerDate}`} />
        <div className={`${styles.bar} ${styles.headerCategory}`} />
        <div className={`${styles.bar} ${styles.headerName}`} />
        <div className={`${styles.bar} ${styles.headerPreview}`} />
        <div className={`${styles.bar} ${styles.headerStatus}`} />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.bar} ${styles.cardTitle}`} />
      <div className={`${styles.bar} ${styles.cardMeta}`} />
      <div className={`${styles.bar} ${styles.cardBody}`} />
      <div className={`${styles.bar} ${styles.cardBody}`} />
      <div className={`${styles.bar} ${styles.cardBodyShort}`} />
      <div className={styles.cardActions}>
        <div className={`${styles.bar} ${styles.cardButton}`} />
        <div className={`${styles.bar} ${styles.cardButton}`} />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ variant }: LoadingSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={labels.dashboard.loadingAriaLabel}
      className={styles.container}
    >
      {variant === 'table' ? <TableSkeleton /> : <CardSkeleton />}
    </div>
  );
}

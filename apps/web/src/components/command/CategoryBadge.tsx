import React from 'react';
import styles from './CategoryBadge.module.css';
import { getCategoryLabel } from '../../utils/labels';

type Category = 'general-inquiry' | 'feature-request' | 'bug-report' | 'privacy-question' | 'report-abuse';

interface CategoryBadgeProps {
  type: Category;
  iconOnly?: boolean;
}

function BugIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2l1.5 1.5" /><path d="M14.5 3.5L16 2" />
      <path d="M9 9h6" /><path d="M12 3C9.239 3 7 5.239 7 8v3c0 2.761 2.239 5 5 5s5-2.239 5-5V8c0-2.761-2.239-5-5-5z" />
      <path d="M7 10H3" /><path d="M21 10h-4" /><path d="M12 16v5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17H8v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<Category, () => React.JSX.Element> = {
  'bug-report': BugIcon,
  'report-abuse': ShieldIcon,
  'general-inquiry': EnvelopeIcon,
  'feature-request': LightbulbIcon,
  'privacy-question': LockIcon,
};

const CATEGORY_CLASS: Record<Category, string> = {
  'bug-report': styles.bug,
  'report-abuse': styles.abuse,
  'general-inquiry': styles.general,
  'feature-request': styles.feature,
  'privacy-question': styles.privacy,
};

export default function CategoryBadge({ type, iconOnly = false }: CategoryBadgeProps) {
  const Icon = CATEGORY_ICONS[type] ?? EnvelopeIcon;
  const label = getCategoryLabel(type);

  if (iconOnly) {
    return (
      <span className={`${styles.badge} ${CATEGORY_CLASS[type]}`} aria-label={label}>
        <Icon />
      </span>
    );
  }

  return (
    <span className={`${styles.badge} ${CATEGORY_CLASS[type]}`}>
      <Icon />
      <span className={styles.label}>{label}</span>
    </span>
  );
}

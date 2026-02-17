import { ReactNode } from 'react';
import styles from './PullQuote.module.css';

interface PullQuoteProps {
  children: ReactNode;
  className?: string;
}

/**
 * Accent-styled text callout for breaking up content sections.
 *
 * Visual landmark for scanners. Uses <blockquote> with appropriate ARIA.
 * Styled with --font-size-intro or --font-size-h3, --color-accent or bold treatment.
 */
export default function PullQuote({ children, className }: PullQuoteProps) {
  const quoteClasses = [styles.quote, className].filter(Boolean).join(' ');

  return <blockquote className={quoteClasses}>{children}</blockquote>;
}

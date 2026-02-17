import { ReactNode } from 'react';
import styles from './ContentSection.module.css';

interface ContentSectionProps {
  heading: string;
  children: ReactNode;
  id?: string;
}

/**
 * Reusable semantic section component for content pages.
 *
 * Renders a section with an H2 heading and prose body content.
 * ID is auto-generated from heading if not provided (for potential anchor linking).
 *
 * Used by Privacy, Terms, and Legal pages for structured content.
 */
export default function ContentSection({
  heading,
  children,
  id,
}: ContentSectionProps) {
  const sectionId = id || heading.toLowerCase().replace(/\s+/g, '-');

  return (
    <section id={sectionId} className={styles.section}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.content}>{children}</div>
    </section>
  );
}

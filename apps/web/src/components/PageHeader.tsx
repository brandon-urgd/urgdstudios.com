import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Page-level header component for content pages.
 *
 * Renders consistent H1 treatment across all content pages.
 * Optional subtitle for additional context.
 *
 * Distinct from the Home page hero — simpler, more utilitarian.
 */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}

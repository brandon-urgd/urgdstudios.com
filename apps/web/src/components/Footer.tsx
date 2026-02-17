import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const LEGAL_LINKS = [
  { to: '/privacy/', label: 'Privacy' },
  { to: '/terms/', label: 'Terms' },
  { to: '/legal/', label: 'Legal' },
] as const;

export default function Footer() {
  return (
    <footer role="contentinfo" className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.address}>ur/gd Studios LLC · Seattle, WA</p>
        <nav aria-label="Legal links" className={styles.legalNav}>
          {LEGAL_LINKS.map(({ to, label }, index) => (
            <span key={to}>
              {index > 0 && <span className={styles.separator} aria-hidden="true"> · </span>}
              <Link to={to} className={styles.link}>
                {label}
              </Link>
            </span>
          ))}
        </nav>
        <p className={styles.tagline}>
          Your data. Your privacy. Your experience. You're good.
        </p>
      </div>
    </footer>
  );
}

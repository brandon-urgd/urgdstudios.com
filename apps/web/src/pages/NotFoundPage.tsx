import { Link } from 'react-router-dom';
import styles from './page.module.css';
import notFoundStyles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <img
        src="/assets/logo-studios.png"
        alt="ur/gd Studios"
        className={notFoundStyles.logo}
        width="88"
        height="88"
      />
      <h1 className={styles.heading}>This page doesn't exist</h1>
      <p className={styles.placeholder}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className={notFoundStyles.backLink}>
        Back to Home
      </Link>
    </div>
  );
}

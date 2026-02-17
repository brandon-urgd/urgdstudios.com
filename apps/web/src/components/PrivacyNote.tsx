/**
 * urgdstudios.com — Privacy Note Component
 *
 * Privacy assurance text displayed below contact form.
 */

import { Link } from 'react-router';
import styles from './PrivacyNote.module.css';

export default function PrivacyNote() {
  return (
    <p className={styles.note}>
      We'll only use your email to respond to this message. See our{' '}
      <Link to="/privacy/" className={styles.link}>
        Privacy policy
      </Link>{' '}
      for details.
    </p>
  );
}

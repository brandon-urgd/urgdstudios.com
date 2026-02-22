import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { labels } from '../../utils/labels';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { signOut } = useAuth();

  // Close on Escape when mobile sidebar is open
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <nav
      aria-label={labels.sidebar.navAriaLabel}
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
    >
      <div className={styles.top}>
        <a
          href="https://urgdstudios.com"
          className={styles.logoLink}
          aria-label={labels.sidebar.logoAlt}
        >
          <div className={styles.logo} role="img" aria-hidden="true" />
        </a>
      </div>

      <ul className={styles.nav} role="list">
        <li>
          <NavLink
            to="/command/dashboard"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
            aria-current={undefined}
          >
            {({ isActive }) => (
              <span aria-current={isActive ? 'page' : undefined}>
                {labels.sidebar.messagesLink}
              </span>
            )}
          </NavLink>
        </li>
      </ul>

      <div className={styles.bottom}>
        <button
          type="button"
          className={styles.signOut}
          onClick={handleSignOut}
        >
          {labels.sidebar.signOut}
        </button>
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import styles from './Navigation.module.css';

interface NavigationProps {
  orientation?: 'horizontal' | 'vertical';
  onLinkClick?: () => void;
}

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/applications/', label: 'Applications' },
  { to: '/contact/', label: 'Contact' },
] as const;

export default function Navigation({ orientation = 'horizontal', onLinkClick }: NavigationProps) {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`${styles.nav} ${orientation === 'vertical' ? styles.vertical : ''}`}
    >
      <ul className={styles.list}>
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
              onClick={onLinkClick}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

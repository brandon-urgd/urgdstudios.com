import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import MobileMenuOverlay from './MobileMenuOverlay';
import styles from './Header.module.css';

const MOBILE_BREAKPOINT = 768;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const openMenu = () => setMenuOpen(true);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header role="banner" className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo} aria-label="ur/gd Studios home">
            <img src="/assets/logo.svg" alt="ur/gd Studios" className={styles.logoImg} />
          </Link>

          <div className={styles.desktopNav}>
            <Navigation />
          </div>

          <button
            ref={hamburgerRef}
            className={styles.hamburger}
            onClick={openMenu}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            type="button"
          >
            <span className={styles.hamburgerIcon}>☰</span>
          </button>
        </div>
      </header>

      <MobileMenuOverlay isOpen={menuOpen} onClose={closeMenu} />
    </>
  );
}

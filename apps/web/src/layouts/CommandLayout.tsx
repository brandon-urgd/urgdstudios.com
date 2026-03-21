import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/command/Sidebar';
import MobileMenuOverlay from '../components/command/MobileMenuOverlay';
import { labels } from '../utils/labels';
import styles from './CommandLayout.module.css';

export default function CommandLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function openSidebar() { setSidebarOpen(true); }
  function closeSidebar() { setSidebarOpen(false); }

  return (
    <div className={styles.layout}>
      <a href="#main-content" className={styles.skipLink}>
        {labels.a11y.skipToContent}
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {sidebarOpen && <MobileMenuOverlay onClose={closeSidebar} />}

      <div className={styles.mainWrapper}>
        {/* Mobile hamburger header */}
        <div className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.hamburger}
            onClick={openSidebar}
            aria-label={labels.a11y.sidebarToggleOpen}
            aria-expanded={sidebarOpen}
            aria-controls="command-sidebar"
          >
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
          </button>
          <a
            href="https://urgdstudios.com"
            className={styles.mobileLogoLink}
            aria-label={labels.sidebar.logoAlt}
            target="_top"
            rel="noopener"
          >
            <div className={styles.mobileLogo} role="img" aria-hidden="true" />
          </a>
        </div>

        <main id="main-content" className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

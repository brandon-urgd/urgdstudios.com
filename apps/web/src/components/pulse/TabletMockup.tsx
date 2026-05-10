import type { ReactNode } from 'react';
import styles from './TabletMockup.module.css';

interface TabletMockupProps {
  children: ReactNode;
}

/**
 * iPad-shaped mockup chrome. Camera dot + rounded screen + soft glow.
 * Content is rendered inside the screen as-is.
 */
export default function TabletMockup({ children }: TabletMockupProps) {
  return (
    <div className={styles.ipadWrap}>
      <div className={styles.ipadGlow} />
      <div className={styles.ipadFrame}>
        <div className={styles.ipadCamera} />
        <div className={styles.ipadScreen}>{children}</div>
      </div>
    </div>
  );
}

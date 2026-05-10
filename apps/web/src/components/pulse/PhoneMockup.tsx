import type { ReactNode } from 'react';
import styles from './PhoneMockup.module.css';

interface PhoneMockupProps {
  children: ReactNode;
}

/**
 * iPhone-shaped mockup chrome. Notch + rounded screen + soft glow.
 * Content is rendered inside the screen as-is.
 */
export default function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className={styles.deviceWrap}>
      <div className={styles.deviceGlow} />
      <div className={styles.deviceFrame}>
        <div className={styles.deviceNotch} />
        <div className={styles.deviceScreen}>{children}</div>
      </div>
    </div>
  );
}

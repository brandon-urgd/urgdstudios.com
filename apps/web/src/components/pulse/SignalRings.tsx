import { motion, useReducedMotion } from 'framer-motion';
import styles from './SignalRings.module.css';

/**
 * Four concentric rings pulsing outward from the hero wordmark,
 * staggered in time. Ties the visual language to the "pulse" name.
 * Reduced motion: one static ring at low opacity.
 */

const RING_COUNT = 4;

export default function SignalRings() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={styles.container} aria-hidden="true">
        <div className={`${styles.ring} ${styles.ringStatic}`} />
      </div>
    );
  }

  return (
    <div className={styles.container} aria-hidden="true">
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className={`${styles.ring} ${i % 2 === 0 ? styles.ringDim : styles.ringBright}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: [0.6, 1.6 + i * 0.3],
            opacity: [0, 0.15 - i * 0.025, 0],
          }}
          transition={{
            duration: 4 + i * 0.8,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 1.2,
          }}
        />
      ))}
    </div>
  );
}

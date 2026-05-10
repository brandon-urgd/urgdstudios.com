import { motion, useReducedMotion, type Variants } from 'framer-motion';
import styles from './AuroraBackground.module.css';

/**
 * Three drifting radial gradient blobs in the Pulse sage spectrum,
 * layered over a vignette that blends back to the page background.
 * Honors prefers-reduced-motion: blobs become static.
 */

const blobVariants: Variants = {
  animate: (custom: number) => ({
    x: [0, 30 * custom, -20 * custom, 15 * custom, 0],
    y: [0, -20 * custom, 25 * custom, -15 * custom, 0],
    scale: [1, 1.05, 0.97, 1.02, 1],
    transition: {
      duration: 18 + custom * 4,
      ease: 'easeInOut' as const,
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  }),
  reduced: {
    x: 0,
    y: 0,
    scale: 1,
  },
};

export default function AuroraBackground() {
  const reduced = useReducedMotion();

  return (
    <div className={styles.aurora} aria-hidden="true">
      <motion.div
        className={`${styles.blob} ${styles.blob1}`}
        custom={1}
        variants={blobVariants}
        initial="reduced"
        animate={reduced ? 'reduced' : 'animate'}
      />
      <motion.div
        className={`${styles.blob} ${styles.blob2}`}
        custom={-1}
        variants={blobVariants}
        initial="reduced"
        animate={reduced ? 'reduced' : 'animate'}
      />
      <motion.div
        className={`${styles.blob} ${styles.blob3}`}
        custom={0.6}
        variants={blobVariants}
        initial="reduced"
        animate={reduced ? 'reduced' : 'animate'}
      />
      <div className={styles.vignette} />
    </div>
  );
}

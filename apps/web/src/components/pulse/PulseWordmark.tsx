import { motion, useReducedMotion, type Variants } from 'framer-motion';
import styles from './PulseWordmark.module.css';

/**
 * The "pulse" wordmark entrance. Letters stagger in with a 3D rotateX flip,
 * a horizontal glow sweep reveals across. Title-card energy for the hero.
 * Reduced motion: static wordmark, no animation.
 */

const LETTERS = 'pulse'.split('');

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const letterVariants: Variants = {
  hidden: {
    y: 60,
    opacity: 0,
    rotateX: -80,
  },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 100,
    },
  },
};

const glowVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: 0.1,
    },
  },
};

export default function PulseWordmark() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <h1 className={styles.wordmark} aria-label="pulse">
        {LETTERS.map((letter, i) => (
          <span key={i} className={styles.letter}>
            {letter}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <motion.h1
      className={styles.wordmark}
      aria-label="pulse"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.span
        className={styles.glowSweep}
        variants={glowVariants}
        aria-hidden="true"
      />
      {LETTERS.map((letter, i) => (
        <motion.span
          key={i}
          className={styles.letter}
          variants={letterVariants}
        >
          {letter}
        </motion.span>
      ))}
    </motion.h1>
  );
}

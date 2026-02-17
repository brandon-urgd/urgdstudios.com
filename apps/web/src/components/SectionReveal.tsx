import { ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import styles from './SectionReveal.module.css';

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for scroll-triggered section reveals.
 *
 * Children start with opacity: 0 and translateY: 20px.
 * On intersection (10% visible), they transition to opacity: 1 and translateY: 0
 * over --transition-slow (350ms) with --easing-default.
 *
 * Sections are always in the DOM — only the visual presentation is deferred.
 * Screen readers access content regardless of scroll position or visual state.
 *
 * Reduced motion: Children always visible (no opacity/transform manipulation).
 */
export default function SectionReveal({
  children,
  className,
}: SectionRevealProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  const revealClasses = [
    styles.reveal,
    isVisible && styles.visible,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={revealClasses}>
      {children}
    </div>
  );
}

import { ReactNode } from 'react';
import styles from './GlassPanel.module.css';

interface GlassPanelProps {
  interactive?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Base glass surface component.
 *
 * Two modes:
 * - Non-interactive (default): No hover effects. Used for studios, principles.
 * - Interactive: Full hover language (lift, shadow, glow). Used for teaser cards.
 *
 * Applies glass tokens: --glass-bg, --glass-blur, --glass-border, --card-radius,
 * --card-padding, --card-shadow.
 */
export default function GlassPanel({
  interactive = false,
  children,
  className,
}: GlassPanelProps) {
  const panelClasses = [
    styles.panel,
    interactive && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={panelClasses}>{children}</div>;
}

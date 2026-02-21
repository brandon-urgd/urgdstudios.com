import { type ReactNode, type Ref } from 'react';
import styles from './GlassButton.module.css';

interface GlassButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'compact';
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  className?: string;
}

export default function GlassButton({
  variant = 'primary',
  size = 'default',
  isLoading = false,
  loadingText,
  disabled = false,
  onClick,
  type = 'button',
  children,
  ref,
  className,
}: GlassButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      onClick={isDisabled ? undefined : onClick}
      aria-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      className={[
        styles.button,
        styles[variant],
        size === 'compact' ? styles.compact : '',
        isDisabled ? styles.disabled : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}

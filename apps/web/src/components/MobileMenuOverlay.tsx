import { useEffect, useRef, useCallback } from 'react';
import { trapFocus, getFocusableElements } from '../utils/focusTrap';
import Navigation from './Navigation';
import styles from './MobileMenuOverlay.module.css';

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenuOverlay({ isOpen, onClose }: MobileMenuOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (overlayRef.current) {
        trapFocus(event, overlayRef.current);
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);

    const timer = requestAnimationFrame(() => {
      if (overlayRef.current) {
        const focusable = getFocusableElements(overlayRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(timer);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.content}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close menu"
          type="button"
        >
          ✕
        </button>
        <Navigation orientation="vertical" onLinkClick={onClose} />
      </div>
    </div>
  );
}

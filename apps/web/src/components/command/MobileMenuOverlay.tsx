import styles from './MobileMenuOverlay.module.css';

interface MobileMenuOverlayProps {
  onClose: () => void;
}

export default function MobileMenuOverlay({ onClose }: MobileMenuOverlayProps) {
  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

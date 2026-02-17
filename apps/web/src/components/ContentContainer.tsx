import styles from './ContentContainer.module.css';

interface ContentContainerProps {
  children: React.ReactNode;
  narrow?: boolean;
}

export default function ContentContainer({ children, narrow }: ContentContainerProps) {
  return (
    <div className={`${styles.container} ${narrow ? styles.narrow : ''}`}>
      {children}
    </div>
  );
}

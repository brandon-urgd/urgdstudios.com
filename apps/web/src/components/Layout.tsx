import SkipLink from './SkipLink';
import Header from './Header';
import Footer from './Footer';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <SkipLink />
      <Header />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

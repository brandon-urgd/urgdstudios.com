import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ApplicationsPage from './pages/ApplicationsPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'ur/gd Studios',
  '/applications/': 'Applications — ur/gd Studios',
  '/contact/': 'Contact — ur/gd Studios',
  '/privacy/': 'Privacy — ur/gd Studios',
  '/terms/': 'Terms of Service — ur/gd Studios',
  '/legal/': 'Legal — ur/gd Studios',
};

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  '/': 'ur/gd Studios is a creative technology studio building tools for people who need them most. Calm, respectful, quietly powerful.',
  '/applications/': 'Applications built by ur/gd Studios. Tools we wish we had — some live, some on the way.',
  '/contact/': 'Get in touch with ur/gd Studios. Questions, ideas, bug reports, or anything else.',
  '/privacy/': 'Privacy policy for ur/gd Studios and its applications.',
  '/terms/': 'Terms of service for ur/gd Studios and its applications.',
  '/legal/': 'Legal information for ur/gd Studios LLC.',
};

function RouteChangeManager() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const path = location.pathname;
    const title = ROUTE_TITLES[path] || 'Page Not Found — ur/gd Studios';
    const description = ROUTE_DESCRIPTIONS[path] || '';

    document.title = title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${title}`;
    }

    requestAnimationFrame(() => {
      const h1 = document.querySelector('h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus();
        h1.addEventListener(
          'blur',
          () => h1.removeAttribute('tabindex'),
          { once: true },
        );
      }
    });
  }, [location.pathname]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-route-announcer"
    />
  );
}

export default function App() {
  return (
    <>
      <RouteChangeManager />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/applications/" element={<ApplicationsPage />} />
          <Route path="/contact/" element={<ContactPage />} />
          <Route path="/privacy/" element={<PrivacyPage />} />
          <Route path="/terms/" element={<TermsPage />} />
          <Route path="/legal/" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

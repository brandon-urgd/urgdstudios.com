/**
 * urgdstudios.com — Contact Page
 *
 * Contact form (feature-flagged) or email-only fallback.
 */

import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import GlassPanel from '../components/GlassPanel';
import ContactForm from '../components/ContactForm';
import PrivacyNote from '../components/PrivacyNote';
import { useMeta } from '../utils/useMeta';
import styles from './ContactPage.module.css';

export default function ContactPage() {
  useMeta({
    title: 'Contact — ur/gd Studios',
    description: 'Get in touch with ur/gd Studios. Questions, ideas, bug reports, or anything else.',
    ogUrl: 'https://urgdstudios.com/contact/',
  });

  // Check feature flag — guard window access for SSR compatibility.
  // During SSR (pre-rendering), window is not available; default true so the pre-rendered
  // HTML matches what the client will hydrate (intakeFormEnabled is true in production config.js).
  const config = typeof window !== 'undefined' ? (window as any).URGD_CONFIG : null;
  const intakeFormEnabled = config === null ? true : config?.intakeFormEnabled === true;

  return (
    <ContentContainer>
      <PageHeader title="Contact" subtitle="Get in touch" />

      <SectionReveal>
        {intakeFormEnabled ? (
          // Form enabled — render ContactForm inside GlassPanel
          <>
            <GlassPanel className={styles.formPanel}>
              <ContactForm />
            </GlassPanel>
            <PrivacyNote />
          </>
        ) : (
          // Form disabled — email fallback
          <>
            <GlassPanel className={styles.fallbackPanel}>
              <p className={styles.fallbackPrimary}>
                Reach us at{' '}
                <a
                  href="mailto:admin@urgdstudios.com"
                  className={styles.fallbackLink}
                >
                  admin@urgdstudios.com
                </a>
              </p>
              <p className={styles.fallbackSecondary}>
                We'll get back to you within 2 business days.
              </p>
            </GlassPanel>
            <p className={styles.tagline}>
              Your data. Your privacy. Your experience. You're good.
            </p>
          </>
        )}
      </SectionReveal>
    </ContentContainer>
  );
}

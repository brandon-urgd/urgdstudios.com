/**
 * urgdstudios.com — Contact Page
 *
 * Contact form (feature-flagged) or email-only fallback.
 */

import { useEffect } from 'react';
import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import GlassPanel from '../components/GlassPanel';
import ContactForm from '../components/ContactForm';
import PrivacyNote from '../components/PrivacyNote';
import styles from './ContactPage.module.css';

export default function ContactPage() {
  // Update document title and meta description
  useEffect(() => {
    document.title = 'Contact — ur/gd Studios';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      'Get in touch with ur/gd Studios. Send a message or reach us by email.'
    );
  }, []);

  // Check feature flag
  const config = (window as any).URGD_CONFIG;
  const intakeFormEnabled = config?.intakeFormEnabled === true;

  return (
    <ContentContainer>
      <PageHeader title="Contact" subtitle="Get in touch" />

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
    </ContentContainer>
  );
}

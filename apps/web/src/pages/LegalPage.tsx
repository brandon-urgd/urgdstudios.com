import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';
import styles from './LegalPages.module.css';

export default function LegalPage() {
  useMeta({
    title: 'Legal — ur/gd Studios',
    description: 'Legal information for ur/gd Studios LLC.',
    ogUrl: 'https://urgdstudios.com/legal/',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Legal" />

      <SectionReveal>
        <p className={styles.legalIntro}>
          urgd studios LLC is a Washington State limited liability company. This
          page provides general legal and transparency information about our
          Services. For binding terms governing use of our Services, please see
          our <a href="/terms/">Terms of Use</a> and{' '}
          <a href="/privacy/">Privacy Policy</a>.
        </p>

        <ContentSection heading="1. Intellectual Property Notice">
          <p>
            All ur/gd names, logos, designs, branding elements, and proprietary
            software are the property of urgd studios LLC unless otherwise
            noted.
          </p>
          <p>
            Open-source components, where used, remain subject to their
            respective licenses.
          </p>
        </ContentSection>

        <ContentSection heading="2. Our Design and Privacy Philosophy">
          <p>
            We aim to build tools that respect your time, your privacy, and your
            experience.
          </p>
          <p>
            Statements on this page reflect our guiding principles and design
            intentions. They are aspirational in nature and do not create
            contractual obligations beyond those described in our{' '}
            <a href="/terms/">Terms of Use</a> and{' '}
            <a href="/privacy/">Privacy Policy</a>.
          </p>
          <p>
            Details regarding data practices and legal rights are described in
            our <a href="/privacy/">Privacy Policy</a>.
          </p>
        </ContentSection>

        <ContentSection heading="3. Application Transparency">
          <p>
            Each ur/gd application reflects the same design principles, with
            functionality-specific data practices.
          </p>
          <p>
            Future applications may describe their specific data practices
            within the app interface or supporting documentation, where
            applicable.
          </p>
        </ContentSection>

        <ContentSection heading="4. Professional Advice Disclaimer">
          <p>ur/gd Services are tools intended to assist users.</p>
          <p>
            They are not substitutes for professional medical, legal, financial,
            or other licensed advice.
          </p>
        </ContentSection>
      </SectionReveal>

      <SectionReveal>
        <ContentSection heading="5. Availability & Performance">
          <p>
            We design our systems for reliability and stability. However, no
            system can guarantee uninterrupted availability or performance.
          </p>
          <p>
            Users assume responsibility for how they use the Services.
          </p>
        </ContentSection>

        <ContentSection heading="6. Security Reporting">
          <p>
            If you believe you have identified a potential security issue, please
            contact us at{' '}
            <a href="mailto:admin@urgdstudios.com">admin@urgdstudios.com</a>.
            We appreciate reports of potential vulnerabilities.
          </p>
        </ContentSection>

        <ContentSection heading="7. Accessibility">
          <p>
            We aim to build Services that are usable and accessible. If you
            encounter accessibility issues, please contact us so we can improve.
          </p>
        </ContentSection>

        <ContentSection heading="8. Contact Information">
          <p>
            For privacy-related inquiries:{' '}
            <a href="mailto:privacy@urgdstudios.com">
              privacy@urgdstudios.com
            </a>
          </p>
          <p>
            For general legal or administrative inquiries:{' '}
            <a href="mailto:admin@urgdstudios.com">admin@urgdstudios.com</a>
          </p>
        </ContentSection>
      </SectionReveal>
    </ContentContainer>
  );
}

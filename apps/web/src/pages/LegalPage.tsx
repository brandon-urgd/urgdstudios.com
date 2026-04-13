import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
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
      <p className={styles.effectiveDate}>Last updated: 04/13/2026</p>

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

          <h4>Pulse Philosophy:</h4>
          <p>
            Pulse is built on the principle that good feedback makes good
            products. We believe the best feedback comes from real
            conversations &mdash; not surveys, not star ratings, not comment
            boxes.
          </p>
          <p>
            Pulse uses AI to guide reviewers through structured, thoughtful
            feedback sessions. The AI asks follow-up questions, keeps the
            conversation focused, and helps reviewers articulate what they
            actually think. It then helps product builders make sense of that
            feedback through aggregated analysis and AI-generated reports.
          </p>
          <p>We are transparent about how AI is used in Pulse:</p>
          <ul>
            <li>
              AI guides conversations but does not fabricate reviewer opinions.
              Every insight in a Pulse report traces back to what reviewers
              actually said.
            </li>
            <li>
              Reviewer feedback and Tenant-uploaded content are processed
              through third-party AI services (Amazon Bedrock) solely to deliver
              the features described above. This content is not used to train AI
              models.
            </li>
            <li>
              AI-generated outputs &mdash; including summaries, reports, and
              revisions &mdash; are tools to assist decision-making. They are
              not professional advice and may contain errors or omissions.
            </li>
            <li>
              Session transcripts are automatically deleted 30 days after the
              associated Pulse Check is generated. We believe in collecting what
              we need and letting go of what we don&rsquo;t.
            </li>
          </ul>
          <p>
            Pulse does not use AI to make decisions about people. It uses AI to
            help people make better decisions about products.
          </p>

          <h4>Beta Programs Philosophy:</h4>
          <p>
            We run beta programs because we believe the people who use our tools
            should help shape them. A beta is an invitation, not an obligation.
          </p>
          <p>When you participate in a ur/gd beta:</p>
          <ul>
            <li>
              Your feedback goes directly into improving the product. We read
              every response.
            </li>
            <li>
              We are transparent about what data we collect and why. Beta signup
              collects your name and email so we can send you session links.
              Surveys collect your honest reactions so we can learn what works
              and what doesn&rsquo;t.
            </li>
            <li>
              Your responses may be quoted anonymously in our internal analysis,
              but we will never share your identity or contact information
              outside of ur/gd.
            </li>
            <li>
              You can withdraw from a beta at any time. Your data will be
              deleted at the end of the retention period regardless of whether
              you complete the program.
            </li>
          </ul>
          <p>
            We ask for your time because we respect your perspective.
            That&rsquo;s the deal.
          </p>

          <p>
            Additional applications may describe their specific data practices
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
          <p>
            Where our Services incorporate artificial intelligence, AI-generated
            outputs &mdash; including reports, summaries, and analysis &mdash;
            are provided as informational tools only. They may contain errors,
            inaccuracies, or omissions and should not be relied upon as a
            substitute for independent judgment or professional consultation.
          </p>
        </ContentSection>

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
    </ContentContainer>
  );
}

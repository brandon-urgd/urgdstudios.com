import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';
import styles from './LegalPages.module.css';

export default function PrivacyPage() {
  useMeta({
    title: 'Privacy Policy — ur/gd Studios',
    description: 'Privacy policy for ur/gd Studios and its applications.',
    ogUrl: 'https://urgdstudios.com/privacy/',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Privacy Policy" />
      <p className={styles.effectiveDate}>Last updated: 04/13/2026</p>

        <p className={styles.legalIntro}>
          urgd studios LLC (&ldquo;ur/gd,&rdquo; &ldquo;we,&rdquo;
          &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy. We
          design our systems with stability, reliability, and trust in mind.
          This Privacy Policy explains how we collect, use, disclose, and
          protect information when you use our websites, applications, and
          related services (collectively, the &ldquo;Services&rdquo;).
        </p>

        <ContentSection heading="1. Scope of This Policy">
          <p>This Privacy Policy applies to:</p>
          <ul>
            <li>The ur/gd marketing website</li>
            <li>All ur/gd applications and digital tools</li>
            <li>Communications with us, including support inquiries</li>
          </ul>
          <p>
            Certain applications may collect additional data specific to their
            functionality. Where applicable, those details will be described
            within the relevant application or its documentation.
          </p>
        </ContentSection>

        <ContentSection heading="2. Information We Collect">
          <p>We collect information in the following categories:</p>

          <h3>2.1 Information You Provide</h3>
          <p>You may provide information such as:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Account credentials</li>
            <li>
              Content you upload (e.g., photos, messages, files, codes)
            </li>
            <li>Communications with us, including contact form submissions</li>
          </ul>
          <p>
            When you submit a contact form, we store your name, email address,
            message category, and message content. We may send you an acknowledgment
            email confirming receipt and, if appropriate, a reply email in response
            to your inquiry.
          </p>
          <p>You control what content you choose to submit.</p>
          <p>
            Where our Services offer sign-in through third-party authentication
            providers (such as Apple or Google), we receive limited profile
            information &mdash; typically your name and email address &mdash;
            from the provider when you choose to sign in. We do not receive or
            store your third-party account password. The information shared with
            us is governed by the authentication provider&rsquo;s privacy policy
            and the permissions you grant during sign-in.
          </p>

          <h3>2.2 Information Collected Automatically</h3>
          <p>
            When you use the Services, we collect certain technical information
            such as IP address, device type, browser type, and usage data. This
            information is collected through standard server logs and
            infrastructure monitoring tools and is used for security,
            diagnostics, and service improvement.
          </p>
          <p>
            Our Services are protected by a web application firewall (WAF) and
            security monitoring infrastructure. These systems automatically
            collect and analyze request-level data&nbsp;&mdash; including IP
            addresses, request patterns, and headers&nbsp;&mdash; to detect and
            block malicious traffic, enforce rate limits, and protect the
            integrity of the Services. This data is used solely for security
            purposes and is not used for tracking, profiling, or advertising.
          </p>
          <p>
            Where the Services accept file uploads, uploaded content may be
            automatically scanned for malware using third-party security
            scanning services provided by our cloud infrastructure provider.
            Files identified as malicious are rejected and deleted immediately.
            Scan metadata (such as scan status and timestamps) is retained
            temporarily for operational purposes and is automatically deleted.
          </p>
          <p>
            We do not use advertising cookies or cross-site tracking
            technologies.
          </p>

          <h3>2.3 App-Specific Data</h3>
          <p>
            Some ur/gd applications may collect additional information necessary
            to provide their intended functionality. We design data collection
            to be proportional to the feature being provided.
          </p>

          <h4>Pulse (AI-Powered Feedback and Review Platform):</h4>
          <p>
            Pulse enables product builders (&ldquo;Tenants&rdquo;) to collect
            structured feedback from Reviewers through AI-guided conversational
            sessions. When you use or interact with Pulse:
          </p>

          <p><strong>Tenant Data:</strong></p>
          <ul>
            <li>
              We collect your name, email address, and account credentials when
              you create a Pulse account.
            </li>
            <li>
              If you sign in using Apple or Google, we receive limited profile
              information (such as your name and email address) from the
              authentication provider in accordance with their privacy policies.
              We do not receive or store your Apple or Google account password.
            </li>
            <li>
              If you use the organizations feature, we collect organization
              names and member role assignments.
            </li>
            <li>
              We store a Stripe customer identifier to manage your subscription.
              We do not store payment card numbers, expiration dates, or
              security codes. Payment information is collected and processed
              directly by Stripe in accordance with Stripe&rsquo;s privacy
              policy.
            </li>
          </ul>

          <p><strong>Reviewer Data:</strong></p>
          <ul>
            <li>
              Reviewers access Pulse sessions via invitation links or direct
              email invitations and do not create Pulse accounts.
            </li>
            <li>
              We collect session transcripts &mdash; the messages exchanged
              between the Reviewer and the AI assistant during feedback
              sessions.
            </li>
            <li>
              Session transcripts are used to generate summaries and aggregated
              analysis for the Tenant.
            </li>
            <li>
              Session transcripts are subject to automatic deletion thirty (30)
              days after the associated Pulse Check is generated. Transcripts
              are retained while an item remains open and no Pulse Check has
              been generated.
            </li>
          </ul>

          <p><strong>Content Processed by AI:</strong></p>
          <ul>
            <li>
              Tenant-uploaded content (text descriptions, documents, and images)
              and Reviewer session transcripts are processed through Amazon
              Bedrock, a third-party AI inference service provided by Amazon Web
              Services, to deliver Pulse&rsquo;s core functionality &mdash;
              including AI-guided conversations, session summaries, aggregated
              analysis (&ldquo;Pulse Checks&rdquo;), reports, and content
              revisions.
            </li>
            <li>
              Your content is processed for the sole purpose of providing the
              requested functionality. It is not used to train AI models.
            </li>
            <li>
              AI-generated outputs (summaries, reports, pulse checks, revisions)
              are derived from your content and are stored as part of the
              Service.
            </li>
          </ul>

          <p><strong>Uploaded Files:</strong></p>
          <ul>
            <li>
              Documents uploaded for text extraction and images uploaded for
              visual feedback are scanned for malware, processed, and retained
              while the associated item remains active.
            </li>
            <li>
              When an item is deleted, associated uploaded files are deleted.
            </li>
          </ul>

          <p><strong>Transactional Email:</strong></p>
          <ul>
            <li>
              We use Amazon Simple Email Service (SES) to send transactional
              emails, including session invitations, reminders, and completion
              notifications. Email addresses used for these communications are
              processed solely for delivery purposes.
            </li>
          </ul>

          <h4>Stitch (SVG-to-PES Converter):</h4>
          <p>
            Stitch is a file conversion tool that does not require an account,
            authentication, or any personally identifying information. When you
            use Stitch:
          </p>
          <ul>
            <li>
              You upload SVG files for conversion to PES embroidery format.
              Uploaded files are temporarily stored, scanned for malware, and
              processed. Original files are deleted immediately after conversion
              or rejection.
            </li>
            <li>
              Converted PES files are temporarily available for download and are
              automatically deleted within 24 hours.
            </li>
            <li>
              A randomly generated request identifier (UUID) is used to track
              conversion status. This identifier is not linked to any personal
              information and is automatically deleted after 7 days.
            </li>
            <li>
              No user accounts, login credentials, cookies, or tracking
              identifiers are used.
            </li>
          </ul>
          <p>
            Additional applications may describe their specific data practices
            within the application interface or supporting documentation at the
            time of release.
          </p>

          <h4>Beta and Pre-Release Programs:</h4>
          <p>
            When you participate in a ur/gd beta or pre-release program, we
            collect the following information:
          </p>
          <ul>
            <li>
              <strong>Signup data:</strong> Your name and email address,
              provided when you register for the beta program.
            </li>
            <li>
              <strong>Consent record:</strong> A record that you accepted the
              beta participation terms, including the date and time of consent.
            </li>
            <li>
              <strong>Survey responses:</strong> If the beta program includes a
              feedback survey, your responses are collected and linked to your
              signup record. Survey responses may include ratings, text
              feedback, and preference selections.
            </li>
            <li>
              <strong>Technical data:</strong> Your IP address is collected for
              rate-limiting purposes. IP addresses are hashed immediately upon
              receipt and are never stored or logged in raw form.
            </li>
            <li>
              <strong>Administrative notifications:</strong> When you sign up or
              complete a survey, an internal notification is sent to ur/gd
              administrators. These notifications contain your signup
              identifier, timestamp, and the beta program name. They do not
              contain your name, email address, or survey responses.
            </li>
          </ul>
          <p>
            Beta program data is retained for ninety (90) days from the date of
            signup, unless the specific beta program specifies a different
            retention period. After the retention period, records are
            automatically deleted.
          </p>
          <p>
            Beta program data is not shared with third parties and is used
            solely to evaluate and improve the associated Service.
          </p>
        </ContentSection>

        <ContentSection heading="3. How We Use Information">
          <p>We use information to:</p>
          <ul>
            <li>Operate and maintain the Services</li>
            <li>Provide functionality requested by users</li>
            <li>Respond to inquiries and provide support</li>
            <li>Monitor system performance and security</li>
            <li>
              Scan uploaded content for malware and reject harmful files
            </li>
            <li>Prevent fraud, misuse, or abuse</li>
            <li>Comply with legal obligations</li>
            <li>
              Process user content through third-party AI inference services to
              generate AI-powered responses, summaries, analysis, and reports as
              part of the requested Service functionality (your content is not
              used to train AI models)
            </li>
          </ul>
          <p>
            We do not use personal information for profiling or behavioral
            advertising.
          </p>
          <p>
            We do not use personal information for automated decision-making
            that produces legal or similarly significant effects.
          </p>
        </ContentSection>

        <ContentSection heading="4. Data Sharing & Disclosure">
          <h3>4.1 No Sale of Personal Information</h3>
          <p>We do not sell personal information.</p>

          <h3>4.2 Service Providers</h3>
          <p>
            We may share information with service providers who process
            information on our behalf to operate the Services (such as cloud
            hosting providers):
          </p>
          <ul>
            <li>Cloud infrastructure providers (Amazon Web Services)</li>
            <li>Hosting services</li>
            <li>Payment processors (Stripe)</li>
            <li>
              Security and monitoring providers, including malware detection
              services
            </li>
            <li>
              AI inference providers (Amazon Bedrock) &mdash; for processing
              user content to deliver AI-powered features
            </li>
            <li>
              Authentication providers (Amazon Cognito, including Apple and
              Google sign-in integrations)
            </li>
            <li>Transactional email services (Amazon SES)</li>
          </ul>
          <p>
            These providers are contractually obligated to safeguard information
            and may only use it to perform services on our behalf.
          </p>

          <h3>4.3 Legal Requirements</h3>
          <p>We may disclose information if required to:</p>
          <ul>
            <li>Comply with law or lawful requests</li>
            <li>Protect rights, safety, or security</li>
            <li>Investigate fraud or misuse</li>
          </ul>
        </ContentSection>

        <ContentSection heading="5. Data Retention">
          <p>
            We retain personal information only for as long as necessary to
            provide the Services, fulfill the purposes described in this Privacy
            Policy, and comply with legal obligations.
          </p>
          <p>Retention periods may vary depending on:</p>
          <ul>
            <li>The nature of the information</li>
            <li>The purpose for which it was collected</li>
            <li>Account status and user activity</li>
            <li>Legal, accounting, or dispute-resolution requirements</li>
          </ul>
          <p>
            For file-processing services such as Stitch, the following retention
            periods apply:
          </p>
          <ul>
            <li>
              <strong>Uploaded files:</strong> Deleted immediately after
              processing or rejection
            </li>
            <li>
              <strong>Converted output files:</strong> Available for a limited
              download period (typically up to 24 hours), then automatically
              deleted
            </li>
            <li>
              <strong>Conversion status records:</strong> Automatically deleted
              after 7 days
            </li>
            <li>
              <strong>Security scan metadata:</strong> Retained temporarily for
              operational purposes and automatically deleted
            </li>
          </ul>
          <p>For Pulse, the following retention periods apply:</p>
          <ul>
            <li>
              <strong>Session transcripts:</strong> Automatically deleted 30
              days after the associated Pulse Check is generated; retained while
              the item remains open and no Pulse Check has been generated
            </li>
            <li>
              <strong>AI-generated outputs (summaries, reports, pulse checks):</strong>{' '}
              Retained while the associated item or Tenant account remains
              active
            </li>
            <li>
              <strong>Uploaded documents and images:</strong> Retained while the
              associated item remains active; deleted when the item is deleted
            </li>
            <li>
              <strong>Tenant account data:</strong> Retained while the account
              is active; deleted upon account deletion request
            </li>
            <li>
              <strong>Billing records (Stripe customer identifiers):</strong>{' '}
              Retained as required for legal and accounting purposes
            </li>
            <li>
              <strong>Organization data:</strong> Retained while the
              organization remains active
            </li>
          </ul>
          <p>
            For beta and pre-release programs, the following retention periods
            apply:
          </p>
          <ul>
            <li>
              <strong>Signup records (name, email, consent):</strong>{' '}
              Automatically deleted 90 days after signup
            </li>
            <li>
              <strong>Survey responses:</strong> Retained with the signup record
              and deleted on the same schedule
            </li>
            <li>
              <strong>IP hashes:</strong> Retained with the signup record for
              rate-limiting purposes and deleted on the same schedule
            </li>
          </ul>
          <p>
            Users may request deletion of their personal information by
            contacting us at{' '}
            <a href="mailto:privacy@urgdstudios.com">
              privacy@urgdstudios.com
            </a>
            . We will process deletion requests in accordance with applicable
            law.
          </p>
          <p>
            Certain information may be retained where required to comply with
            legal obligations, resolve disputes, or enforce agreements.
          </p>
        </ContentSection>

        <ContentSection heading="6. Your Rights">
          <p>
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul>
            <li>Request access to your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your information</li>
            <li>Object to or restrict certain processing</li>
            <li>Request data portability</li>
          </ul>
          <p>
            Requests may be submitted to:{' '}
            <a href="mailto:privacy@urgdstudios.com">
              privacy@urgdstudios.com
            </a>
          </p>
          <p>
            We will respond to verifiable requests within forty-five (45) days,
            or as otherwise required by applicable law.
          </p>
        </ContentSection>

        <ContentSection heading="7. California Privacy Rights">
          <p>
            If you are a California resident, you may have rights under the
            California Consumer Privacy Act (CCPA), as amended by the California
            Privacy Rights Act (CPRA), including the right to:
          </p>
          <ul>
            <li>Know what personal information we collect</li>
            <li>Request deletion of personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>
              Opt out of the sale or sharing of personal information
            </li>
          </ul>
          <p>
            We do not sell or share personal information as defined under
            California law.
          </p>
          <p>
            We will respond to verifiable requests within forty-five (45) days,
            as required by applicable law.
          </p>
          <p>
            At this time, ur/gd studios LLC does not meet the thresholds
            required to be classified as a &ldquo;business&rdquo; under the
            CCPA/CPRA, but we provide these disclosures voluntarily in the
            interest of transparency.
          </p>
        </ContentSection>

        <ContentSection heading="8. International Users and GDPR">
          <p>urgd studios LLC is based in the United States.</p>
          <p>
            Our Services are primarily intended for users located in the United
            States. We do not intentionally target or market to individuals in
            the European Economic Area (EEA) or United Kingdom.
          </p>
          <p>
            If you access the Services from outside the United States, your
            information may be transferred to and processed in the United
            States.
          </p>
          <p>
            If we become subject to the General Data Protection Regulation
            (GDPR) or other international data protection laws due to our
            operations, we will implement appropriate safeguards as required by
            law.
          </p>
          <p>
            Individuals located in the EEA or UK may have additional rights,
            including the right to lodge a complaint with their local
            supervisory authority.
          </p>
        </ContentSection>

        <ContentSection heading="9. Security">
          <p>
            We implement reasonable administrative, technical, and
            organizational measures to protect personal information.
          </p>
          <p>
            Data is encrypted in transit and, where supported by our
            infrastructure providers, at rest.
          </p>
          <p>
            Our Services are protected by a centralized web application firewall
            (WAF) and rate-limiting controls. Where the Services accept file
            uploads, uploaded content is automatically scanned for malware
            before processing.
          </p>
          <p>
            However, no method of transmission over the Internet or electronic
            storage is 100% secure.
          </p>
        </ContentSection>

        <ContentSection heading="10. Data Security Incidents">
          <p>
            In the event of a confirmed data security incident affecting
            personal information, we will take appropriate steps consistent with
            applicable law, including notification to affected individuals where
            required.
          </p>
        </ContentSection>

        <ContentSection heading="11. Children&rsquo;s Privacy">
          <p>
            Our Services are not directed to children under 13 years of age.
          </p>
          <p>
            In jurisdictions where the minimum age for consent to use online
            services is higher than 13, we do not knowingly collect personal
            information from individuals below that age.
          </p>
        </ContentSection>

        <ContentSection heading="12. Third-Party Links">
          <p>
            Our Services may contain links to third-party websites or services.
          </p>
          <p>We are not responsible for their privacy practices.</p>
        </ContentSection>

        <ContentSection heading="13. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time.</p>
          <p>
            When we do, we will revise the &ldquo;Last Updated&rdquo; date at
            the top of this page.
          </p>
          <p>
            Continued use of the Services after changes indicates acceptance of
            the updated Policy.
          </p>
        </ContentSection>

        <ContentSection heading="14. Contact Us">
          <p>
            For questions or privacy-related requests, contact{' '}
            <a href="mailto:privacy@urgdstudios.com">
              privacy@urgdstudios.com
            </a>
          </p>
          <p>
            <strong>Mailing Address</strong>
            <br />
            ATTN: ur/gd Studios LLC
            <br />
            The Cloud Room
            <br />
            1424 11th Ave STE 400
            <br />
            Seattle, WA 98122
          </p>
        </ContentSection>
    </ContentContainer>
  );
}

import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';
import styles from './LegalPages.module.css';

export default function TermsPage() {
  useMeta({
    title: 'Terms of Use — ur/gd Studios',
    description: 'Terms of use for ur/gd Studios and its applications.',
    ogUrl: 'https://urgdstudios.com/terms/',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Terms of Use" />
      <p className={styles.effectiveDate}>Last updated: 04/13/2026</p>

        <p className={styles.legalIntro}>
          These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and
          use of urgd studios LLC&rsquo;s (&ldquo;ur/gd,&rdquo;
          &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) websites,
          applications, and services (collectively, the
          &ldquo;Services&rdquo;).
        </p>
        <p className={styles.legalIntro}>
          By accessing or using the Services, you agree to these Terms. If you
          do not agree, do not use the Services.
        </p>

        <ContentSection heading="1. Eligibility">
          <p>You must be at least 13 years old to use the Services.</p>
          <p>
            If you are located in a jurisdiction where the minimum age for
            consent to use online services is higher than 13, you must meet that
            higher age requirement.
          </p>
          <p>
            If you are using the Services on behalf of an organization, you
            represent that you have authority to bind that organization.
          </p>
        </ContentSection>

        <ContentSection heading="2. Acceptable Use">
          <p>You agree to use the Services only for lawful purposes.</p>
          <p>You may not, and may not attempt to:</p>
          <ul>
            <li>Interfere with or bypass security features</li>
            <li>
              Reverse-engineer, decompile, copy, or redistribute the Services
            </li>
            <li>
              Scrape, data-mine, automate extraction of, or use the Services or
              any content from the Services for unauthorized machine learning or
              artificial intelligence training
            </li>
            <li>
              Use the Services in a manner that harms ur/gd, other users, or
              third parties
            </li>
            <li>
              Upload or share content that is unlawful, defamatory, obscene, or
              infringes third-party rights
            </li>
            <li>
              Upload files containing malware, viruses, or other harmful code
            </li>
          </ul>
          <p>
            Where the Services accept file uploads, uploaded content may be
            automatically scanned for security purposes. Files identified as
            malicious will be rejected and deleted without notice.
          </p>
          <p>
            We reserve the right to suspend or restrict access for violations of
            these Terms.
          </p>
        </ContentSection>

        <ContentSection heading="3. Pulse — AI-Powered Feedback Platform">
          <p>
            Certain provisions in this Section apply specifically to Pulse,
            ur/gd&rsquo;s AI-powered feedback and review platform, available at
            pulse.urgdstudios.com.
          </p>

          <h4>3.1 Description of Service</h4>
          <p>
            Pulse enables product builders (&ldquo;Tenants&rdquo;) to collect
            structured feedback from reviewers (&ldquo;Reviewers&rdquo;)
            through AI-guided conversational sessions. Tenants create items for
            review, invite Reviewers, and receive AI-generated analysis,
            reports, and revisions based on collected feedback.
          </p>

          <h4>3.2 Tenant Responsibilities</h4>
          <p>
            If you use Pulse as a Tenant, you agree that:
          </p>
          <ul>
            <li>
              You are responsible for the content you upload to Pulse, including
              text descriptions, documents, and images submitted for review.
            </li>
            <li>
              You will not upload content that is unlawful, defamatory, obscene,
              or that infringes third-party intellectual property rights.
            </li>
            <li>
              You are responsible for ensuring that you have the right to share
              any content you submit for review, including any confidential or
              proprietary materials.
            </li>
            <li>
              You are responsible for how you use, distribute, or rely upon
              AI-generated reports, summaries, pulse checks, and revisions
              produced by the Service.
            </li>
            <li>
              If you use the organizations feature, you are responsible for
              managing member access and roles within your organization.
            </li>
          </ul>

          <h4>3.3 Reviewer Participation</h4>
          <p>
            Reviewers access Pulse sessions via invitation links or direct
            invitations from Tenants. Reviewers do not create Pulse accounts.
            Reviewer sessions are authenticated using session-specific tokens.
          </p>
          <p>
            By participating in a Pulse session, Reviewers agree to these Terms
            and acknowledge that their feedback &mdash; including all messages
            exchanged during the session &mdash; will be collected, processed by
            AI, and made available to the Tenant who created the review item.
          </p>

          <h4>3.4 Artificial Intelligence Disclosure</h4>
          <p>
            Pulse uses artificial intelligence services provided by third-party
            AI model providers to power its core functionality, including but
            not limited to:
          </p>
          <ul>
            <li>
              Guiding Reviewers through structured feedback conversations
            </li>
            <li>Generating session summaries</li>
            <li>
              Producing aggregated analysis (&ldquo;Pulse Checks&rdquo;) across
              multiple sessions
            </li>
            <li>
              Generating reports and content revisions based on collected
              feedback
            </li>
            <li>Analyzing uploaded documents and images</li>
          </ul>
          <p>
            <strong>
              AI-generated content is produced by automated systems and may
              contain errors, inaccuracies, or omissions.
            </strong>{' '}
            AI-generated outputs are provided as tools to assist your
            decision-making. They do not constitute professional advice of any
            kind, and ur/gd makes no representations or warranties regarding the
            accuracy, completeness, or fitness for purpose of any AI-generated
            content.
          </p>
          <p>
            You are solely responsible for reviewing, verifying, and determining
            how to use any AI-generated content produced by the Service.
          </p>
          <p>
            ur/gd does not guarantee that AI-generated outputs will be free from
            bias, factual errors, or unintended content. The underlying AI
            models are provided by third-party providers and may change over
            time.
          </p>
          <p>
            User content submitted to Pulse &mdash; including reviewer feedback,
            uploaded documents, and images &mdash; is processed through
            third-party AI inference services to provide the functionality
            described above. For details on how this data is handled, see our{' '}
            <a href="/privacy/">Privacy Policy</a>.
          </p>

          <h4>3.5 Subscription Billing</h4>
          <p>
            Access to certain Pulse features is governed by subscription tiers.
            Subscriptions are billed on a recurring basis through our
            third-party payment processor, Stripe.
          </p>
          <p>
            By subscribing to a paid Pulse plan, you agree that:
          </p>
          <ul>
            <li>
              You authorize recurring charges to your selected payment method at
              the applicable subscription rate.
            </li>
            <li>
              Subscription fees are billed in advance for each billing period.
            </li>
            <li>
              You may manage your subscription, update payment methods, or
              cancel through the Stripe customer portal accessible within Pulse.
            </li>
            <li>
              Cancellation takes effect at the end of the current billing
              period. You will retain access to paid features until the end of
              the period for which you have already paid.
            </li>
            <li>
              ur/gd reserves the right to change subscription pricing with
              reasonable advance notice. Continued use after a price change
              constitutes acceptance of the new pricing.
            </li>
            <li>
              Refunds are handled in accordance with applicable law. Unless
              otherwise required by law, subscription fees are non-refundable.
            </li>
          </ul>
          <p>
            ur/gd does not store your payment card details. Payment processing
            is handled entirely by Stripe in accordance with Stripe&rsquo;s
            terms of service and privacy policy.
          </p>

          <h4>3.6 Data Retention and Deletion</h4>
          <p>
            Pulse applies automated data retention policies to certain
            categories of data. Session transcripts (messages exchanged between
            Reviewers and the AI during feedback sessions) are subject to
            automatic deletion thirty (30) days after the associated Pulse Check
            is generated. Transcripts are retained while an item remains open
            and no Pulse Check has been generated.
          </p>
          <p>
            Tenants may export reports and analysis before transcript data is
            purged.
          </p>
          <p>
            For additional details on data retention, see our{' '}
            <a href="/privacy/">Privacy Policy</a>.
          </p>

          <h4>3.7 Exported Content</h4>
          <p>
            Pulse allows Tenants to export AI-generated reports and analysis in
            PDF and Markdown formats. Exported content is generated at the time
            of export and reflects the data available at that time.
          </p>
          <p>
            ur/gd is not responsible for how exported content is used,
            distributed, or relied upon after export.
          </p>
        </ContentSection>

        <ContentSection heading="4. Accounts & Security">
          <p>Some Services may require account registration.</p>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your credentials</li>
            <li>All activity occurring under your account</li>
            <li>Promptly notifying us of unauthorized access</li>
          </ul>
          <p>
            We are not liable for losses resulting from your failure to
            safeguard account credentials.
          </p>
        </ContentSection>

        <ContentSection heading="5. Intellectual Property">
          <p>
            All ur/gd branding, design elements, software, and proprietary
            materials made available through the Services are owned by urgd
            studios LLC or its licensors.
          </p>
          <p>
            Subject to your compliance with these Terms, ur/gd grants you a
            limited, non-exclusive, non-transferable, revocable license to
            access and use the Services for their intended purpose.
          </p>
          <p>
            Open-source components, if any, are governed by their respective
            licenses.
          </p>
          <p>
            Nothing in these Terms transfers ownership of any intellectual
            property to you.
          </p>
        </ContentSection>

        <ContentSection heading="6. User Content">
          <p>
            You retain ownership of content you submit to the Services.
          </p>
          <p>
            You grant ur/gd a limited license to host, process, and display your
            content solely to provide the Services. This includes the right to
            scan uploaded content for security purposes, process files for
            format conversion, and temporarily store content as necessary to
            deliver the requested functionality.
          </p>
          <p>
            For Services that incorporate artificial intelligence features, this
            license also includes the right to process your content through
            third-party AI inference services to generate responses, summaries,
            analysis, and other AI-powered outputs as part of the requested
            functionality. Your content is not used to train AI models.
          </p>
          <p>
            Uploaded content is processed and automatically deleted after use.
            ur/gd does not retain copies of user content beyond what is
            necessary to provide the Services, as described in our Privacy
            Policy.
          </p>
          <p>
            You represent that your content does not violate third-party rights.
          </p>
          <p>
            We reserve the right to remove content that violates these Terms or
            applicable law.
          </p>
        </ContentSection>

        <ContentSection heading="7. Privacy">
          <p>
            Your use of the Services is also governed by our{' '}
            <a href="/privacy/">Privacy Policy</a>, which is incorporated by
            reference.
          </p>
        </ContentSection>

        <ContentSection heading="8. Disclaimers">
          <p>
            The Services are provided &ldquo;as is&rdquo; and &ldquo;as
            available.&rdquo;
          </p>
          <p>
            To the fullest extent permitted by law, ur/gd disclaims all
            warranties, express or implied, including warranties of
            merchantability and fitness for a particular purpose.
          </p>
          <p>
            We do not guarantee uninterrupted availability, performance, or data
            retention.
          </p>
          <p>
            The Services are tools and do not constitute medical, legal,
            financial, or other professional advice.
          </p>
          <p>
            You are responsible for your use of the Services and compliance with
            applicable laws.
          </p>
        </ContentSection>

        <ContentSection heading="9. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, ur/gd&rsquo;s total
            liability arising out of or related to the Services shall not
            exceed:
          </p>
          <p>
            (a) for paid Services, the greater of (i) the amount you paid to us
            in the twelve (12) months preceding the claim, or (ii) $100; and
          </p>
          <p>(b) for free Services, $100.</p>
          <p>
            ur/gd shall not be liable for indirect, incidental, consequential,
            special, or punitive damages.
          </p>
          <p>
            Nothing in these Terms limits liability for gross negligence, willful
            misconduct, or liabilities that cannot be limited under applicable
            law.
          </p>
        </ContentSection>

        <ContentSection heading="10. Indemnification">
          <p>
            You agree to indemnify and hold ur/gd harmless from claims arising
            out of:
          </p>
          <ul>
            <li>Your misuse of the Services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of law</li>
            <li>Your content infringing third-party rights</li>
          </ul>
        </ContentSection>

        <ContentSection heading="11. Termination">
          <p>
            We may suspend or terminate access to the Services at our
            discretion, including for violations of these Terms or where
            necessary to protect the security, integrity, or operation of the
            Services or other users.
          </p>
        </ContentSection>

        <ContentSection heading="12. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Washington,
            without regard to its conflict-of-law principles.
          </p>
          <p>
            Any disputes shall be resolved in state or federal courts located in
            King County, Washington.
          </p>
        </ContentSection>

        <ContentSection heading="13. Changes to Terms">
          <p>
            We may update these Terms by posting revised Terms on our website.
          </p>
          <p>Changes are effective upon posting.</p>
          <p>
            Continued use of the Services constitutes acceptance of the updated
            Terms.
          </p>
        </ContentSection>

        <ContentSection heading="14. Relationship to Other Agreements">
          <p>
            If you have entered into a separate written agreement with ur/gd
            governing specific Services, that agreement will control in the
            event of a conflict with these Terms.
          </p>
        </ContentSection>

        <ContentSection heading="15. Subscription Billing">
          <p>
            Certain Services may offer paid subscription tiers. Where
            applicable, the following terms govern subscription billing:
          </p>
          <ul>
            <li>
              Subscriptions are billed on a recurring basis through our
              third-party payment processor. You authorize recurring charges to
              your selected payment method at the applicable subscription rate.
            </li>
            <li>
              Subscription fees are billed in advance for each billing period.
            </li>
            <li>
              You may manage your subscription, update payment methods, or
              cancel through the billing management portal accessible within the
              applicable Service.
            </li>
            <li>
              Cancellation takes effect at the end of the current billing
              period. You will retain access to paid features until the end of
              the period for which you have already paid.
            </li>
            <li>
              ur/gd reserves the right to change subscription pricing with
              reasonable advance notice. Continued use after a price change
              constitutes acceptance of the new pricing.
            </li>
            <li>
              Refunds are handled in accordance with applicable law. Unless
              otherwise required by law, subscription fees are non-refundable.
            </li>
            <li>
              ur/gd does not store your payment card details. Payment processing
              is handled entirely by our third-party payment processor in
              accordance with their terms of service and privacy policy.
            </li>
          </ul>
          <p>
            Application-specific billing details (such as tier definitions and
            pricing) are described within the applicable Service.
          </p>
        </ContentSection>

        <ContentSection heading="16. Beta and Pre-Release Programs">
          <p>
            From time to time, ur/gd may offer beta, preview, or pre-release
            versions of Services or features (&ldquo;Beta Services&rdquo;). By
            participating in a Beta Service, you agree that:
          </p>
          <ul>
            <li>
              Beta Services are provided &ldquo;as-is&rdquo; and &ldquo;as
              available,&rdquo; without warranties of any kind. They may contain
              bugs, errors, or incomplete functionality.
            </li>
            <li>
              Beta Services may change, be suspended, or be discontinued at any
              time without notice. Features available during a beta period may
              differ from any final release.
            </li>
            <li>
              ur/gd may collect your name, email address, and feedback responses
              as part of the beta program. Data collection practices for beta
              programs are described in our{' '}
              <a href="/privacy/">Privacy Policy</a>.
            </li>
            <li>
              Feedback, survey responses, and other input you provide during a
              beta program may be used by ur/gd to evaluate, improve, and refine
              the Service. Your responses may be quoted anonymously in internal
              analysis.
            </li>
            <li>
              Beta Services are not intended for production use. You should not
              rely on Beta Services for critical workflows.
            </li>
            <li>
              ur/gd&rsquo;s total liability for Beta Services is limited to $0.
              Beta Services are provided at no cost and carry no financial
              obligation.
            </li>
          </ul>
          <p>
            Participation in a beta program is voluntary. You may withdraw at
            any time by contacting us.
          </p>
        </ContentSection>
    </ContentContainer>
  );
}

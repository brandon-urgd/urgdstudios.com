import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
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
      <p className={styles.effectiveDate}>Last updated: 02/24/2026</p>

      <SectionReveal>
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

        <ContentSection heading="3. Broadcast Acceptable Use Policy (AUP) and SMS Communications">
          <p>
            Certain Services (like Broadcast) involve SMS or messaging
            functionality.
          </p>

          <h4>For Senders (Admins):</h4>
          <p>
            If you use the Broadcast platform as a Sender, you must adhere to
            this strict Acceptable Use Policy to ensure compliance with the
            Telephone Consumer Protection Act (TCPA) and to prevent spam. You
            agree that:
          </p>
          <ul>
            <li>
              You will only send messages to Listeners who have provided
              explicit, verifiable opt-in consent to receive communications from
              your specific channel.
            </li>
            <li>
              You will not send spam, unsolicited marketing, phishing attempts,
              or illegal content.
            </li>
            <li>
              You will not attempt to bypass or interfere with our automated
              opt-out mechanisms (e.g., &ldquo;STOP&rdquo; or
              &ldquo;QUIET&rdquo; commands).
            </li>
            <li>
              We reserve the right to immediately suspend or terminate your
              Broadcast channel and account if we determine, in our sole
              discretion, that you are violating this AUP, generating excessive
              spam complaints, or violating any applicable telecommunications
              laws.
            </li>
          </ul>

          <h4>For Listeners (Subscribers):</h4>
          <p>
            By subscribing to a Broadcast channel, you represent that you have
            provided the required consent under applicable law to receive
            communications from that specific Sender.
          </p>
          <p>
            You may opt out of SMS communications at any time by replying
            &ldquo;STOP&rdquo; or &ldquo;QUIET&rdquo; to the message, or by
            following the instructions provided in the message. Message and data
            rates may apply.
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
      </SectionReveal>

      <SectionReveal>
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
      </SectionReveal>

      <SectionReveal>
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
      </SectionReveal>
    </ContentContainer>
  );
}

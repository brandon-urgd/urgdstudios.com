import { useState, useRef } from 'react';
import GlassPanel from '../components/GlassPanel';
import SignupModal from '../components/SignupModal';
import SurveyModal from '../components/SurveyModal';
import { useMeta } from '../utils/useMeta';
import styles from './BetaPulsePage.module.css';

/* ----------------------------------------------------------------
   Config types — read from window.URGD_CONFIG (set in config.js)
   ---------------------------------------------------------------- */

interface BetaPulseConfig {
  betaSignupEnabled: boolean;
  betaSurveyEnabled: boolean;
  betaPhase: 'coming-soon' | 'signup' | 'survey' | 'both' | 'concluded';
}

function getConfig(): BetaPulseConfig {
  const cfg = (typeof window !== 'undefined' ? (window as any).URGD_CONFIG : null) ?? {};
  return {
    betaSignupEnabled: cfg.betaSignupEnabled ?? false,
    betaSurveyEnabled: cfg.betaSurveyEnabled ?? false,
    betaPhase: cfg.betaPhase ?? 'coming-soon',
  };
}

/* ----------------------------------------------------------------
   PulseIcon — inline SVG radar icon (decorative)
   ---------------------------------------------------------------- */

function PulseIcon() {
  return (
    <img
      src="/assets/pulse-icon.svg"
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      className={styles.pulseIcon}
      draggable={false}
    />
  );
}

/* ----------------------------------------------------------------
   BetaPulsePage
   ---------------------------------------------------------------- */

export default function BetaPulsePage() {
  const config = getConfig();

  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreContentRef = useRef<HTMLDivElement>(null);

  useMeta({
    title: 'Pulse Beta — ur/gd Studios',
    description:
      'Join the Pulse closed beta. Two sessions, one survey, about 30 minutes of your time.',
    ogUrl: 'https://urgdstudios.com/beta/pulse',
    favicon: '/assets/pulse-icon.svg',
  });

  /* ---------------------------------------------------------------
     Page state matrix — driven by betaPhase
     --------------------------------------------------------------- */

  const { betaPhase } = config;

  const showButtons = betaPhase !== 'coming-soon';
  const signupActive = betaPhase === 'signup' || betaPhase === 'both';
  const surveyActive = betaPhase === 'survey' || betaPhase === 'both';

  const signupDisabledLabel =
    betaPhase === 'survey' ? 'Signups closed' :
    betaPhase === 'concluded' ? 'Signups closed' :
    undefined;

  const surveyDisabledLabel =
    betaPhase === 'signup' ? 'Available after your sessions' :
    betaPhase === 'concluded' ? 'Survey closed' :
    undefined;

  const specialMessage =
    betaPhase === 'coming-soon'
      ? 'Pulse beta is coming soon. Check back for details.'
      : betaPhase === 'concluded'
        ? 'The Pulse beta has concluded. Thank you to everyone who participated.'
        : null;

  return (
    <main className={styles.page}>
      {/* Header — PulseIcon + wordmark + attribution */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <PulseIcon />
          <span className={styles.wordmark}>pulse</span>
        </div>
        <span className={styles.attribution}>by ur/gd Studios</span>
      </header>

      {/* Hero — heading + subheading */}
      <section className={styles.hero}>
        <h1>
          Join the <span className={styles.betaShimmer}>Beta</span>
        </h1>
        <p className={styles.subheading}>
          Help us make Pulse better. Two sessions. One survey. About 30 minutes
          of your time.
        </p>
      </section>

      {/* What is Pulse — plain-speak explainer + expandable detail */}
      <section className={styles.whatIsPulse}>
        <GlassPanel className={styles.whatIsPulsePanel}>
          <h2>What is Pulse?</h2>
          <p className={styles.whatIsPulseBody}>
            Pulse is a feedback tool. You upload something you're working on and
            invite people to review it. Instead of getting "looks good" or
            silence, each reviewer has a short AI-guided conversation that draws
            out what they actually think. Pulse pulls everything together into
            one clear view so you can make decisions, not just collect opinions.
          </p>

          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setMoreOpen((prev) => !prev)}
            aria-expanded={moreOpen}
            aria-controls="pulse-more-detail"
          >
            {moreOpen ? 'Less' : 'More'}
            <span className={`${styles.moreChevron} ${moreOpen ? styles.moreChevronOpen : ''}`} aria-hidden="true">
              ›
            </span>
          </button>

          <div
            id="pulse-more-detail"
            className={`${styles.moreContent} ${moreOpen ? styles.moreContentOpen : ''}`}
            ref={moreContentRef}
            style={{
              maxHeight: moreOpen
                ? `${moreContentRef.current?.scrollHeight ?? 0}px`
                : '0px',
            }}
          >
            <div className={styles.moreInner}>
              <p>
                Pulse reads your document and tailors the conversation to what
                you're sharing. Reviewers don't fill out forms. They talk through
                their reactions naturally, and the AI asks follow-up questions to
                get past surface-level responses.
              </p>
              <p>
                After everyone's weighed in, Pulse consolidates the feedback into
                a Pulse Check. What landed. What didn't. Specific revision
                proposals you can accept, adjust, or dismiss.
              </p>
              <p>
                Reviewers don't need an account. Share a link, send an email
                invite, or print a QR code. They accept a confidentiality
                agreement and start talking. That's it.
              </p>
              <p>
                Your work stays yours. Transcripts are auto-deleted after 30
                days, and your content never trains AI models.
              </p>
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* Overview — "What to expect" */}
      <section className={styles.overview}>
        <GlassPanel>
          <h2>What to expect</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepDot} />
              <div>
                <strong>Sign up</strong>
                <p>Enter your name and email. In the coming days, you'll receive three emails — one with instructions and two session invites.</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} />
              <div>
                <strong>Two sessions</strong>
                <p>
                  Read a short essay (~5 min) and have an AI-guided conversation about it (~10 min). Then review a photo from the perspective of someone considering an Airbnb rental (~5 min).
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} />
              <div>
                <strong>Quick survey</strong>
                <p>
                  Share your thoughts on the experience in a brief survey after your sessions.
                </p>
              </div>
            </div>
          </div>
          <div className={styles.giftCallout}>
            Complete all three steps and you'll be entered into a gift card
            drawing.
          </div>
        </GlassPanel>
      </section>

      {/* Special message (coming-soon / concluded) */}
      {specialMessage && (
        <p className={styles.specialMessage}>{specialMessage}</p>
      )}

      {/* Action buttons */}
      {showButtons && (
        <section className={styles.actions}>
          <div className={styles.actionButton}>
            <button
              type="button"
              className="primary"
              disabled={!signupActive}
              onClick={() => setSignupModalOpen(true)}
            >
              Join the Beta
            </button>
            {signupDisabledLabel && (
              <span className={styles.disabledLabel}>{signupDisabledLabel}</span>
            )}
          </div>
          <div className={styles.actionButton}>
            <button
              type="button"
              className="primary"
              disabled={!surveyActive}
              onClick={() => setSurveyModalOpen(true)}
            >
              Take the Survey
            </button>
            {surveyDisabledLabel && (
              <span className={styles.disabledLabel}>{surveyDisabledLabel}</span>
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
      <SurveyModal isOpen={surveyModalOpen} onClose={() => setSurveyModalOpen(false)} />

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.pulseLine} aria-hidden="true" />
        <p>pulse — Quietly Powerful, by <a href="https://urgdstudios.com/">ur/gd Studios</a></p>
        <p>Seattle, WA</p>
        <nav>
          <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a>
        </nav>
      </footer>
    </main>
  );
}

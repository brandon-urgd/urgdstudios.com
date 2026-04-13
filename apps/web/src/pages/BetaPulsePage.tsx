import { useState } from 'react';
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
  const cfg = (window as any).URGD_CONFIG ?? {};
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

  useMeta({
    title: 'Pulse Beta — ur/gd Studios',
    description:
      'Join the Pulse closed beta. Two sessions, one survey, about 30 minutes of your time.',
    ogUrl: 'https://urgdstudios.com/beta/pulse',
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

      {/* Overview — "What to expect" */}
      <section className={styles.overview}>
        <GlassPanel>
          <h2>What to expect</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepDot} />
              <div>
                <strong>Sign up</strong>
                <p>Enter your name and email to join the beta.</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} />
              <div>
                <strong>Two sessions</strong>
                <p>
                  Complete two short AI-guided feedback sessions — about 10
                  minutes each.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} />
              <div>
                <strong>Quick survey</strong>
                <p>
                  Share your thoughts in a brief survey after your sessions.
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
        <p>pulse — Quietly Powerful, by ur/gd Studios</p>
        <p>Seattle, WA</p>
        <nav>
          <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a>
        </nav>
      </footer>
    </main>
  );
}

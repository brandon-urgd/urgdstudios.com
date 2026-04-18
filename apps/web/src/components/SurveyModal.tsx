/**
 * urgdstudios.com — Survey Modal Component
 *
 * Paginated survey for Pulse beta:
 *   1. Email lookup → crossfade to "Welcome back, [Name]"
 *   2. One question per page with Next/Back navigation
 *   3. Submit on final question → crossfade to thank-you
 *
 * Focus-trapped, keyboard-accessible, screen-reader-friendly.
 * Closing mid-survey discards progress but does not lock the user out.
 */

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { SurveyResponses } from '../utils/betaValidation';
import RatingScale from './RatingScale';
import PillSelect from './PillSelect';
import styles from './SurveyModal.module.css';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = 'lookup' | 'greeting' | 'questions' | 'submitting' | 'success' | 'alreadyDone';

const MAX_TEXT_LENGTH = 1000;
const TOTAL_QUESTIONS = 7;
const GREETING_DURATION = 1800;

/* ----------------------------------------------------------------
   Question definitions
   ---------------------------------------------------------------- */

interface QuestionDef {
  key: keyof SurveyResponses;
  type: 'pill' | 'rating' | 'textarea';
  number: number;
  question: string;
  subtitle?: string;
  required: boolean;
  // pill-specific
  options?: { value: string; label: string }[];
  // rating-specific
  lowAnchor?: string;
  highAnchor?: string;
  // textarea-specific
  placeholder?: string;
}

const QUESTIONS: QuestionDef[] = [
  {
    key: 'deviceUsed',
    type: 'pill',
    number: 1,
    question: 'Which device did you use for your sessions?',
    required: true,
    options: [
      { value: 'mobile', label: 'Phone' },
      { value: 'desktop', label: 'Computer' },
      { value: 'both', label: 'Both' },
    ],
  },
  {
    key: 'aiConversationQuality',
    type: 'rating',
    number: 2,
    question: 'How well did the AI guide the conversation?',
    required: true,
    lowAnchor: 'Got in the way',
    highAnchor: 'Really helpful',
  },
  {
    key: 'aiAccuracy',
    type: 'pill',
    number: 3,
    question: 'Did the AI ever say something that wasn\u2019t accurate?',
    subtitle: 'Like describing details that weren\u2019t there, or putting words in your mouth.',
    required: true,
    options: [
      { value: 'no', label: 'No, it was accurate' },
      { value: 'minor', label: 'Minor stuff' },
      { value: 'yes', label: 'Yes, noticeably' },
    ],
  },
  {
    key: 'sessionPreference',
    type: 'pill',
    number: 4,
    question: 'Which session type worked better for giving feedback?',
    required: true,
    options: [
      { value: 'document', label: 'Document' },
      { value: 'photo', label: 'Photo' },
      { value: 'same', label: 'About the same' },
    ],
  },
  {
    key: 'biggestFriction',
    type: 'textarea',
    number: 5,
    question: 'What was the most frustrating or confusing moment?',
    subtitle: 'If nothing was, tell us what almost was. Even small things count.',
    required: true,
    placeholder: 'Take your time\u2026',
  },
  {
    key: 'wouldUseAgain',
    type: 'pill',
    number: 6,
    question: 'If you could use Pulse to get feedback on your own work, would you?',
    required: true,
    options: [
      { value: 'definitely', label: 'Definitely' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'probably_not', label: 'Probably not' },
    ],
  },
  {
    key: 'anythingElse',
    type: 'textarea',
    number: 7,
    question: 'Anything else we should know?',
    subtitle: 'Totally optional \u2014 but we read every word.',
    required: false,
    placeholder: 'No pressure.',
  },
];

/* ----------------------------------------------------------------
   SurveyModal
   ---------------------------------------------------------------- */

export default function SurveyModal({ isOpen, onClose }: SurveyModalProps) {
  const [phase, setPhase] = useState<Phase>('lookup');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState<string>(styles.fadeIn);

  // Lookup
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // User
  const [signupId, setSignupId] = useState('');
  const [userName, setUserName] = useState('');

  // Responses
  const [responses, setResponses] = useState<SurveyResponses>({
    deviceUsed: null,
    aiConversationQuality: null,
    aiAccuracy: null,
    sessionPreference: null,
    biggestFriction: null,
    wouldUseAgain: null,
    anythingElse: null,
  });

  // Submission
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState('');

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  /* ---------------------------------------------------------------
     Transition helper — fade out → hold black → swap → fade in
     --------------------------------------------------------------- */
  const crossfadeTo = useCallback((next: () => void) => {
    // Phase 1: fade out current content
    setFadeClass(styles.fadeOut);
    // Phase 2: after fade-out completes, hide content and swap
    setTimeout(() => {
      setFadeClass(styles.hidden); // visibility:hidden + opacity:0
      // Phase 3: swap content while fully hidden
      next();
      // Phase 4: hold at hidden for one frame, then fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFadeClass(styles.fadeIn);
        });
      });
    }, 300);
  }, []);

  /* ---------------------------------------------------------------
     Focus trap
     --------------------------------------------------------------- */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!overlayRef.current) return [];
    const selectors =
      'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(overlayRef.current.querySelectorAll<HTMLElement>(selectors));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    },
    [getFocusableElements, onClose],
  );

  /* ---------------------------------------------------------------
     Open / close
     --------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement;
    requestAnimationFrame(() => emailRef.current?.focus());
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  // Refocus on phase/question change
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 1) focusable[1]?.focus();
      else if (focusable.length > 0) focusable[0]?.focus();
    });
  }, [phase, questionIndex, isOpen, getFocusableElements]);

  /* ---------------------------------------------------------------
     Email lookup
     --------------------------------------------------------------- */
  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = lookupEmail.trim();
    if (!trimmed) { setLookupError('Please enter your email address.'); return; }

    setLookupLoading(true);
    setLookupError('');

    try {
      const cfg = (window as any).URGD_CONFIG ?? {};
      const apiBaseUrl: string = cfg.apiBaseUrl ?? '';
      const res = await fetch(
        `${apiBaseUrl}/v1/beta/lookup?email=${encodeURIComponent(trimmed)}&app=pulse`,
      );

      if (res.ok) {
        const data = await res.json();
        setSignupId(data.signupId);
        setUserName(data.name);

        // Already submitted — show friendly message, don't enter survey
        if (data.hasSurvey) {
          crossfadeTo(() => setPhase('alreadyDone'));
          return;
        }

        crossfadeTo(() => setPhase('greeting'));
        // Auto-advance from greeting to first question after a pause
        setTimeout(() => {
          crossfadeTo(() => { setPhase('questions'); setQuestionIndex(0); });
        }, GREETING_DURATION);
        return;
      }

      if (res.status === 404) {
        setLookupError("We couldn\u2019t find that email. Make sure it\u2019s the one you used to sign up.");
      } else {
        setLookupError('Something went wrong. Please try again.');
      }
    } catch {
      setLookupError('Something went wrong. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  /* ---------------------------------------------------------------
     Navigation
     --------------------------------------------------------------- */
  const currentQ = QUESTIONS[questionIndex];
  const currentValue = currentQ ? responses[currentQ.key] : null;
  const canAdvance = !currentQ?.required || (currentValue != null && currentValue !== '');
  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      crossfadeTo(() => setQuestionIndex((i) => i + 1));
    }
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      crossfadeTo(() => setQuestionIndex((i) => i - 1));
    }
  };

  /* ---------------------------------------------------------------
     Submit
     --------------------------------------------------------------- */
  const handleSubmit = async () => {
    setSurveyLoading(true);
    setSurveyError('');
    crossfadeTo(async () => {
      setPhase('submitting');

      const minHold = new Promise((r) => setTimeout(r, 1200));

      try {
        const cfg = (window as any).URGD_CONFIG ?? {};
        const apiBaseUrl: string = cfg.apiBaseUrl ?? '';
        const apiCall = fetch(`${apiBaseUrl}/v1/beta/survey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signupId,
            responses: {
              deviceUsed: responses.deviceUsed,
              aiConversationQuality: responses.aiConversationQuality,
              aiAccuracy: responses.aiAccuracy,
              sessionPreference: responses.sessionPreference,
              biggestFriction: responses.biggestFriction?.trim() ?? '',
              wouldUseAgain: responses.wouldUseAgain,
              anythingElse: responses.anythingElse?.trim() || undefined,
            },
          }),
        });

        // Wait for both the API and the minimum display time
        const [res] = await Promise.all([apiCall, minHold]);

        if (res.ok) {
          crossfadeTo(() => setPhase('success'));
          return;
        }

        if (res.status === 409) {
          crossfadeTo(() => setPhase('alreadyDone'));
          return;
        }
        if (res.status === 404) setSurveyError('We couldn\u2019t find your signup. Please close and try again.');
        else setSurveyError('Something went wrong. Please try again.');
        crossfadeTo(() => setPhase('questions'));
      } catch {
        await minHold;
        setSurveyError('Something went wrong. Please try again.');
        crossfadeTo(() => setPhase('questions'));
      } finally {
        setSurveyLoading(false);
      }
    });
  };

  /* ---------------------------------------------------------------
     Response setters
     --------------------------------------------------------------- */
  const setResponse = (key: keyof SurveyResponses, value: string | number | null) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const setText = (key: 'biggestFriction' | 'anythingElse', value: string) => {
    if (value.length <= MAX_TEXT_LENGTH) {
      setResponses((prev) => ({ ...prev, [key]: value || null }));
    }
  };

  /* ---------------------------------------------------------------
     Overlay click
     --------------------------------------------------------------- */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const headingId = 'survey-modal-heading';

  if (!isOpen) return null;

  /* ---------------------------------------------------------------
     Render shell — single overlay, content swaps inside
     --------------------------------------------------------------- */
  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div className={styles.panel}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className={`${styles.content} ${fadeClass}`}>

          {/* --- Lookup --- */}
          {phase === 'lookup' && (
            <div className={styles.phaseContent}>
              <h2 id={headingId} className={styles.heading}>Welcome back</h2>
              <p className={styles.subtitle}>
                Enter the email you signed up with.
              </p>

              {lookupError && (
                <div className={styles.errorBanner} role="alert">{lookupError}</div>
              )}

              <form className={styles.form} noValidate onSubmit={handleLookup}>
                <div className={styles.field}>
                  <label htmlFor="survey-email" className={styles.label}>Email</label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="survey-email"
                    name="email"
                    className={styles.input}
                    value={lookupEmail}
                    onChange={(e) => { setLookupEmail(e.target.value); if (lookupError) setLookupError(''); }}
                    disabled={lookupLoading}
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  className={styles.navButton}
                  disabled={lookupLoading || !lookupEmail.trim()}
                  aria-busy={lookupLoading}
                >
                  {lookupLoading ? 'Looking up\u2026' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* --- Greeting --- */}
          {phase === 'greeting' && (
            <div className={styles.greetingContent}>
              <h2 id={headingId} className={styles.greetingHeading}>
                Welcome back,
                <span className={styles.greetingName}>{userName}.</span>
              </h2>
              <p className={styles.greetingSubtitle}>Fetching your survey.</p>
              <div className={styles.greetingDots} aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* --- Submitting --- */}
          {phase === 'submitting' && (
            <div className={styles.greetingContent}>
              <h2 id={headingId} className={styles.greetingHeading}>
                Submitting your responses\u2026
              </h2>
              <div className={styles.greetingDots} aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* --- Questions --- */}
          {phase === 'questions' && currentQ && (
            <div className={styles.phaseContent}>
              {/* Progress */}
              <div className={styles.progress}>
                <span className={styles.progressLabel}>
                  Question {currentQ.number} <span className={styles.progressTotal}>of {TOTAL_QUESTIONS}</span>
                </span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(currentQ.number / TOTAL_QUESTIONS) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question text */}
              <h2 id={headingId} className={styles.questionText}>
                {currentQ.question}
              </h2>
              {currentQ.subtitle && (
                <p className={styles.questionSubtitle}>{currentQ.subtitle}</p>
              )}

              {/* Error */}
              {surveyError && (
                <div className={styles.errorBanner} role="alert">{surveyError}</div>
              )}

              {/* Answer area */}
              <div className={styles.answerArea}>
                {currentQ.type === 'pill' && currentQ.options && (
                  <PillSelect
                    name={currentQ.key}
                    label=""
                    options={currentQ.options}
                    value={responses[currentQ.key] as string | null}
                    onChange={(v) => setResponse(currentQ.key, v)}
                  />
                )}

                {currentQ.type === 'rating' && (
                  <RatingScale
                    name={currentQ.key}
                    label=""
                    lowAnchor={currentQ.lowAnchor!}
                    highAnchor={currentQ.highAnchor!}
                    value={responses[currentQ.key] as number | null}
                    onChange={(v) => setResponse(currentQ.key, v)}
                  />
                )}

                {currentQ.type === 'textarea' && (
                  <div className={styles.textareaGroup}>
                    <textarea
                      id={`survey-${currentQ.key}`}
                      className={styles.textarea}
                      maxLength={MAX_TEXT_LENGTH}
                      value={(responses[currentQ.key] as string) ?? ''}
                      onChange={(e) => setText(currentQ.key as 'biggestFriction' | 'anythingElse', e.target.value)}
                      disabled={surveyLoading}
                      placeholder={currentQ.placeholder}
                      rows={4}
                    />
                    <span className={styles.counter}>
                      {((responses[currentQ.key] as string) ?? '').length}/{MAX_TEXT_LENGTH}
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className={styles.navRow}>
                {questionIndex > 0 ? (
                  <button type="button" className={styles.backButton} onClick={handleBack}>
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className={styles.navButton}
                  disabled={!canAdvance}
                  onClick={handleNext}
                >
                  {isLastQuestion ? 'Submit' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* --- Already Done --- */}
          {phase === 'alreadyDone' && (
            <div className={styles.successContent}>
              <svg
                aria-hidden="true"
                className={styles.checkmark}
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
              >
                <circle cx="24" cy="24" r="22" stroke="var(--beta-accent)" strokeWidth="2.5" fill="var(--beta-accent-fill)" />
                <path d="M15 24l6 6 12-12" stroke="var(--beta-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>

              <h2 id={headingId} className={styles.successHeading}>
                You're all set,
                <span className={styles.successName}>{userName}!</span>
              </h2>
              <p className={styles.successMessage}>
                We already have your survey responses. Thanks for checking in.
              </p>
              <p className={styles.giftNote}>
                You've been entered into the gift card drawing. We'll be in touch!
              </p>

              <button type="button" className={styles.navButton} onClick={onClose}>
                Done
              </button>
            </div>
          )}

          {/* --- Success --- */}
          {phase === 'success' && (
            <div className={styles.successContent}>
              <svg
                aria-hidden="true"
                className={styles.checkmark}
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
              >
                <circle cx="24" cy="24" r="22" stroke="var(--beta-accent)" strokeWidth="2.5" fill="var(--beta-accent-fill)" />
                <path d="M15 24l6 6 12-12" stroke="var(--beta-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>

              <h2 id={headingId} className={styles.successHeading}>
                Thank you,
                <span className={styles.successName}>{userName}!</span>
              </h2>
              <p className={styles.successMessage}>
                Your feedback means a lot. It's going directly into making Pulse better.
              </p>
              <p className={styles.giftNote}>
                You've been entered into the gift card drawing. We'll be in touch!
              </p>

              <button type="button" className={styles.navButton} onClick={onClose}>
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

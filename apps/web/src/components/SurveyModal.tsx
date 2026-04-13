/**
 * urgdstudios.com — Survey Modal Component
 *
 * Three-step modal for Pulse beta survey:
 *   Step 1 — Email lookup (identify returning tester)
 *   Step 2 — Survey questions (3 rating scales, 1 pill select, 3 textareas)
 *   Step 3 — Success / thank-you
 *
 * Focus-trapped, keyboard-accessible, screen-reader-friendly.
 * Same accessibility pattern as SignupModal.
 */

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { isSurveyFormValid, SurveyResponses } from '../utils/betaValidation';
import RatingScale from './RatingScale';
import PillSelect from './PillSelect';
import styles from './SurveyModal.module.css';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'lookup' | 'survey' | 'success';

const MAX_TEXT_LENGTH = 1000;

/* ----------------------------------------------------------------
   Character counter — inline helper
   ---------------------------------------------------------------- */

function CharacterCounter({ current, max }: { current: number; max: number }) {
  const isNearLimit = current > max * 0.9;
  return (
    <span className={isNearLimit ? styles.counterNearLimit : styles.counter}>
      {current}/{max}
    </span>
  );
}

/* ----------------------------------------------------------------
   SurveyModal
   ---------------------------------------------------------------- */

export default function SurveyModal({ isOpen, onClose }: SurveyModalProps) {
  /* ---------------------------------------------------------------
     State
     --------------------------------------------------------------- */
  const [step, setStep] = useState<Step>('lookup');

  // Lookup state
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // Signup record from lookup
  const [signupId, setSignupId] = useState('');
  const [userName, setUserName] = useState('');

  // Survey responses
  const [responses, setResponses] = useState<SurveyResponses>({
    overallExperience: null,
    aiNaturalness: null,
    sessionPreference: null,
    usefulness: null,
    bestPart: null,
    whatToChange: null,
    anythingElse: null,
  });

  // Survey submission state
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState('');

  /* ---------------------------------------------------------------
     Refs
     --------------------------------------------------------------- */
  const overlayRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

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
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [getFocusableElements, onClose],
  );

  /* ---------------------------------------------------------------
     Open / close effects
     --------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;

    requestAnimationFrame(() => {
      emailRef.current?.focus();
    });

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  /* ---------------------------------------------------------------
     Refocus when step changes
     --------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        // Skip the close button (index 0) and focus the first interactive element
        const target = focusable.length > 1 ? focusable[1] : focusable[0];
        target?.focus();
      }
    });
  }, [step, isOpen, getFocusableElements]);

  /* ---------------------------------------------------------------
     Email lookup
     --------------------------------------------------------------- */
  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = lookupEmail.trim();
    if (!trimmed) {
      setLookupError('Please enter your email address.');
      return;
    }

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
        setStep('survey');
        return;
      }

      if (res.status === 404) {
        setLookupError(
          "We couldn't find that email. Make sure it's the one you used to sign up.",
        );
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
     Survey submission
     --------------------------------------------------------------- */
  const handleSurveySubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSurveyLoading(true);
    setSurveyError('');

    try {
      const cfg = (window as any).URGD_CONFIG ?? {};
      const apiBaseUrl: string = cfg.apiBaseUrl ?? '';

      const res = await fetch(`${apiBaseUrl}/v1/beta/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signupId,
          responses: {
            overallExperience: responses.overallExperience,
            aiNaturalness: responses.aiNaturalness,
            sessionPreference: responses.sessionPreference,
            usefulness: responses.usefulness,
            bestPart: responses.bestPart?.trim() ?? '',
            whatToChange: responses.whatToChange?.trim() ?? '',
            anythingElse: responses.anythingElse?.trim() || undefined,
          },
        }),
      });

      if (res.ok) {
        setStep('success');
        return;
      }

      if (res.status === 409) {
        setSurveyError('Survey already submitted.');
      } else if (res.status === 404) {
        setSurveyError('Signup not found. Please try the email lookup again.');
      } else {
        setSurveyError('Something went wrong. Please try again.');
      }
    } catch {
      setSurveyError('Something went wrong. Please try again.');
    } finally {
      setSurveyLoading(false);
    }
  };

  /* ---------------------------------------------------------------
     Response helpers
     --------------------------------------------------------------- */
  const setRating = (key: 'overallExperience' | 'aiNaturalness' | 'usefulness', value: number) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const setText = (key: 'bestPart' | 'whatToChange' | 'anythingElse', value: string) => {
    if (value.length <= MAX_TEXT_LENGTH) {
      setResponses((prev) => ({ ...prev, [key]: value || null }));
    }
  };

  /* ---------------------------------------------------------------
     Overlay click (close on scrim, not panel)
     --------------------------------------------------------------- */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  /* ---------------------------------------------------------------
     Derived state
     --------------------------------------------------------------- */
  const isValid = isSurveyFormValid(responses);
  const headingId = 'survey-modal-heading';

  if (!isOpen) return null;

  /* ---------------------------------------------------------------
     Step 3 — Success
     --------------------------------------------------------------- */
  if (step === 'success') {
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

          <div className={styles.successContent}>
            <svg
              aria-hidden="true"
              className={styles.checkmark}
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
            >
              <circle cx="24" cy="24" r="22" stroke="#7a9e87" strokeWidth="2.5" fill="rgba(122,158,135,0.1)" />
              <path d="M15 24l6 6 12-12" stroke="#7a9e87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>

            <h2 id={headingId} className={styles.successHeading}>
              Thank you, {userName}!
            </h2>
            <p className={styles.successMessage}>
              Your feedback means a lot. It's going directly into making Pulse better.
            </p>
            <p className={styles.giftNote}>
              You've been entered into the gift card drawing. We'll be in touch!
            </p>

            <button
              type="button"
              className={styles.doneButton}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------
     Step 1 — Email Lookup
     --------------------------------------------------------------- */
  if (step === 'lookup') {
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

          <h2 id={headingId} className={styles.heading}>Welcome back</h2>

          {lookupError && (
            <div className={styles.errorBanner} role="alert">
              {lookupError}
            </div>
          )}

          <form className={styles.form} noValidate onSubmit={handleLookup}>
            <div className={styles.field}>
              <label htmlFor="survey-email" className={styles.label}>
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                id="survey-email"
                name="email"
                className={styles.input}
                value={lookupEmail}
                onChange={(e) => {
                  setLookupEmail(e.target.value);
                  if (lookupError) setLookupError('');
                }}
                disabled={lookupLoading}
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={lookupLoading || !lookupEmail.trim()}
              aria-busy={lookupLoading}
            >
              {lookupLoading ? 'Looking up...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------
     Step 2 — Survey Questions
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

        <h2 id={headingId} className={styles.heading}>
          Welcome back, {userName}. How were your sessions?
        </h2>

        {surveyError && (
          <div className={styles.errorBanner} role="alert">
            {surveyError}
          </div>
        )}

        <form className={styles.form} noValidate onSubmit={handleSurveySubmit}>
          {/* Q1 — Overall experience */}
          <RatingScale
            name="overallExperience"
            label="1. Overall, how was your experience?"
            lowAnchor="Poor"
            highAnchor="Excellent"
            value={responses.overallExperience}
            onChange={(v) => setRating('overallExperience', v)}
          />

          {/* Q2 — AI conversation naturalness */}
          <RatingScale
            name="aiNaturalness"
            label="2. How natural did the AI conversation feel?"
            lowAnchor="Unnatural"
            highAnchor="Very natural"
            value={responses.aiNaturalness}
            onChange={(v) => setRating('aiNaturalness', v)}
          />

          {/* Q3 — Document vs. photo preference */}
          <PillSelect
            name="sessionPreference"
            label="3. Which session type did you prefer?"
            options={[
              { value: 'document', label: 'Document' },
              { value: 'photo', label: 'Photo' },
              { value: 'same', label: 'About the same' },
            ]}
            value={responses.sessionPreference}
            onChange={(v) => setResponses((prev) => ({ ...prev, sessionPreference: v }))}
          />

          {/* Q4 — Usefulness for own work */}
          <RatingScale
            name="usefulness"
            label="4. How useful would Pulse be for your own work?"
            lowAnchor="Not useful"
            highAnchor="Very useful"
            value={responses.usefulness}
            onChange={(v) => setRating('usefulness', v)}
          />

          {/* Q5 — Best part */}
          <div className={styles.questionGroup}>
            <label htmlFor="survey-bestPart" className={styles.label}>
              5. What was the best part?
            </label>
            <textarea
              id="survey-bestPart"
              className={styles.textarea}
              maxLength={MAX_TEXT_LENGTH}
              value={responses.bestPart ?? ''}
              onChange={(e) => setText('bestPart', e.target.value)}
              disabled={surveyLoading}
              placeholder="Tell us what stood out..."
              rows={3}
            />
            <CharacterCounter current={(responses.bestPart ?? '').length} max={MAX_TEXT_LENGTH} />
          </div>

          {/* Q6 — What to change */}
          <div className={styles.questionGroup}>
            <label htmlFor="survey-whatToChange" className={styles.label}>
              6. What would you change?
            </label>
            <textarea
              id="survey-whatToChange"
              className={styles.textarea}
              maxLength={MAX_TEXT_LENGTH}
              value={responses.whatToChange ?? ''}
              onChange={(e) => setText('whatToChange', e.target.value)}
              disabled={surveyLoading}
              placeholder="Anything we could do better..."
              rows={3}
            />
            <CharacterCounter current={(responses.whatToChange ?? '').length} max={MAX_TEXT_LENGTH} />
          </div>

          {/* Q7 — Anything else (optional) */}
          <div className={styles.questionGroup}>
            <label htmlFor="survey-anythingElse" className={styles.label}>
              7. Anything else? <span className={styles.optionalTag}>(optional)</span>
            </label>
            <textarea
              id="survey-anythingElse"
              className={styles.textarea}
              maxLength={MAX_TEXT_LENGTH}
              value={responses.anythingElse ?? ''}
              onChange={(e) => setText('anythingElse', e.target.value)}
              disabled={surveyLoading}
              placeholder="Any other thoughts..."
              rows={3}
            />
            <CharacterCounter current={(responses.anythingElse ?? '').length} max={MAX_TEXT_LENGTH} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!isValid || surveyLoading}
            aria-busy={surveyLoading}
          >
            {surveyLoading ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>
      </div>
    </div>
  );
}

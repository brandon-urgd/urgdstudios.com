/**
 * urgdstudios.com — Signup Modal Component
 *
 * Modal dialog for Pulse beta signup. Glassmorphism panel with
 * form fields, inline validation, honeypot, and success state.
 * Focus-trapped, keyboard-accessible, screen-reader-friendly.
 */

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { isSignupFormValid } from '../utils/betaValidation';
import styles from './SignupModal.module.css';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FieldErrors {
  name: string | null;
  email: string | null;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  /* ---------------------------------------------------------------
     Form state
     --------------------------------------------------------------- */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [formState, setFormState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<FieldErrors>({ name: null, email: null });
  const [apiError, setApiError] = useState('');

  /* ---------------------------------------------------------------
     Refs
     --------------------------------------------------------------- */
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
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

    // Capture the element that triggered the modal
    triggerRef.current = document.activeElement as HTMLElement;

    // Focus first input after paint
    requestAnimationFrame(() => {
      nameRef.current?.focus();
    });

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Return focus to trigger
      triggerRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  /* ---------------------------------------------------------------
     Inline validation on blur
     --------------------------------------------------------------- */
  const validateName = (value: string): string | null => {
    if (!value.trim()) return 'Name is required.';
    return null;
  };

  const validateEmail = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
    return null;
  };

  const handleBlur = (field: 'name' | 'email') => {
    if (field === 'name') {
      setErrors((prev) => ({ ...prev, name: validateName(name) }));
    } else {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    }
  };

  /* ---------------------------------------------------------------
     Submit
     --------------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Final validation
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    if (nameErr || emailErr) {
      setErrors({ name: nameErr, email: emailErr });
      return;
    }

    setFormState('submitting');
    setApiError('');

    try {
      const cfg = (window as any).URGD_CONFIG ?? {};
      const apiBaseUrl: string = cfg.apiBaseUrl ?? '';

      const res = await fetch(`${apiBaseUrl}/v1/beta/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          consentGiven: consent,
          honeypot,
          app: 'pulse',
        }),
      });

      if (res.ok) {
        setFormState('success');
        return;
      }

      // Error responses
      if (res.status === 409) {
        setApiError('This email is already signed up.');
      } else if (res.status === 429) {
        setApiError('Too many attempts. Please try again in a few minutes.');
      } else {
        setApiError('Something went wrong. Please try again.');
      }
      setFormState('error');
    } catch {
      setApiError('Something went wrong. Please try again.');
      setFormState('error');
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
  const isValid = isSignupFormValid(name, email, consent);
  const isProcessing = formState === 'submitting';
  const headingId = 'signup-modal-heading';

  if (!isOpen) return null;

  /* ---------------------------------------------------------------
     Success state
     --------------------------------------------------------------- */
  if (formState === 'success') {
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
            {/* Sage green checkmark */}
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

            <h2 id={headingId} className={styles.successHeading}>You're in!</h2>
            <p className={styles.successMessage}>
              Thanks, {name.trim()}. Here's what happens next:
            </p>

            <ol className={styles.instructionsList}>
              <li>You'll receive three emails in the coming days — one with instructions and two session invites</li>
              <li>Read the essay before starting your first session (~5 min read)</li>
              <li>The whole thing takes about 30 minutes</li>
              <li>Come back here for the survey after your sessions</li>
            </ol>

            <button
              type="button"
              className={styles.gotItButton}
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------
     Form state
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

        <h2 id={headingId} className={styles.heading}>Join the Beta</h2>

        {/* API error banner */}
        {apiError && (
          <div className={styles.errorBanner} role="alert">
            {apiError}
          </div>
        )}

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          {/* Honeypot */}
          <div className={styles.honeypot}>
            <label htmlFor="signup-website">Website</label>
            <input
              type="text"
              id="signup-website"
              name="website"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="signup-name" className={styles.label}>
              Name
            </label>
            <input
              ref={nameRef}
              type="text"
              id="signup-name"
              name="name"
              maxLength={200}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              aria-describedby={errors.name ? 'signup-name-error' : undefined}
              aria-invalid={errors.name ? true : undefined}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              onBlur={() => handleBlur('name')}
              disabled={isProcessing}
              placeholder="Jane Doe"
            />
            {errors.name && (
              <span role="alert" id="signup-name-error" className={styles.error}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="signup-email"
              name="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              aria-invalid={errors.email ? true : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              onBlur={() => handleBlur('email')}
              disabled={isProcessing}
              placeholder="you@example.com"
            />
            {errors.email && (
              <span role="alert" id="signup-email-error" className={styles.error}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Consent */}
          <div className={styles.consentField}>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={isProcessing}
              />
              <span className={styles.consentText}>
                I understand my feedback will be used to improve Pulse and that
                my responses may be quoted anonymously. See our{' '}
                <a href="/terms/" className={styles.link}>Terms</a> and{' '}
                <a href="/privacy/" className={styles.link}>Privacy</a>.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!isValid || isProcessing}
            aria-busy={isProcessing}
          >
            {isProcessing ? 'Signing up...' : 'Sign Me Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

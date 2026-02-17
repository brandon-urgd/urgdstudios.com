/**
 * urgdstudios.com — Contact Form Component
 *
 * Complete form state machine with validation, honeypot, proof-of-work,
 * and API submission. Feature-flagged via config.
 */

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import CharacterCounter from './CharacterCounter';
import GuidanceBox from './GuidanceBox';
import { validateForm, validateName, validateEmail, validateType, validateMessage } from '../utils/validation';
import { generateChallenge, requestProofOfWork, POW_DIFFICULTY } from '../utils/proofOfWork';
import { submitIntake } from '../utils/submitIntake';
import styles from './ContactForm.module.css';

type FormState = 'idle' | 'validating' | 'computing' | 'submitting' | 'success' | 'error';

interface FormErrors {
  name: string | null;
  email: string | null;
  type: string | null;
  message: string | null;
}

export default function ContactForm() {
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Form state
  const [formState, setFormState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<FormErrors>({
    name: null,
    email: null,
    type: null,
    message: null,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionId, setSubmissionId] = useState('');

  // Refs for focus management
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  // Handle field change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name: fieldName, value } = e.target;

    switch (fieldName) {
      case 'name':
        setName(value);
        // Clear error on change if present
        if (errors.name) {
          setErrors((prev) => ({ ...prev, name: null }));
        }
        break;
      case 'email':
        setEmail(value);
        if (errors.email) {
          setErrors((prev) => ({ ...prev, email: null }));
        }
        break;
      case 'type':
        setType(value);
        if (errors.type) {
          setErrors((prev) => ({ ...prev, type: null }));
        }
        break;
      case 'message':
        setMessage(value);
        if (errors.message) {
          setErrors((prev) => ({ ...prev, message: null }));
        }
        break;
      case 'website':
        setHoneypot(value);
        break;
    }
  };

  // Handle field blur (inline validation)
  const handleBlur = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name: fieldName, value } = e.target;

    switch (fieldName) {
      case 'name':
        setErrors((prev) => ({ ...prev, name: validateName(value) }));
        break;
      case 'email':
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
        break;
      case 'type':
        setErrors((prev) => ({ ...prev, type: validateType(value) }));
        break;
      case 'message':
        setErrors((prev) => ({ ...prev, message: validateMessage(value) }));
        break;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Phase 1: Validation
    setFormState('validating');
    const validationErrors = validateForm({ name, email, type, message });
    const hasErrors = Object.values(validationErrors).some((err) => err !== null);

    if (hasErrors) {
      setErrors({
        name: validationErrors.name,
        email: validationErrors.email,
        type: validationErrors.type,
        message: validationErrors.message,
      });
      setFormState('idle');

      // Focus first error field
      if (validationErrors.name) {
        nameRef.current?.focus();
      } else if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.type) {
        typeRef.current?.focus();
      } else if (validationErrors.message) {
        messageRef.current?.focus();
      }

      return;
    }

    // Phase 2: Proof-of-Work
    setFormState('computing');
    let proofOfWork;

    try {
      const challenge = generateChallenge();
      const result = await requestProofOfWork(challenge, POW_DIFFICULTY);
      proofOfWork = {
        challenge,
        nonce: result.nonce,
        solution: result.solution,
      };
    } catch (err) {
      setFormState('error');
      setErrorMessage(
        'Verification timed out. Please try again, or email us at admin@urgdstudios.com'
      );
      errorBannerRef.current?.focus();
      return;
    }

    // Phase 3: API Submission
    setFormState('submitting');

    try {
      const response = await submitIntake({
        name: name.trim(),
        email: email.trim(),
        type,
        message: message.trim(),
        honeypot,
        proofOfWork,
      });

      // Success
      setFormState('success');
      setSubmissionId(response.submissionId || '');
    } catch (err) {
      setFormState('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "We couldn't send your message. Please try again, or email us at admin@urgdstudios.com"
      );
      errorBannerRef.current?.focus();
    }
  };

  // Handle reset (from success or error states)
  const handleReset = () => {
    setName('');
    setEmail('');
    setType('');
    setMessage('');
    setHoneypot('');
    setErrors({ name: null, email: null, type: null, message: null });
    setErrorMessage('');
    setSubmissionId('');
    setFormState('idle');
  };

  // Success state
  if (formState === 'success') {
    return (
      <div className={styles.success} role="alert">
        <div className={styles.successIcon} aria-hidden="true">
          ✓
        </div>
        <h2 className={styles.successHeading}>Message sent</h2>
        <p className={styles.successMessage}>
          We'll get back to you within 2 business days.
        </p>
        {submissionId && (
          <p className={styles.submissionId}>Submission ID: {submissionId}</p>
        )}
        <button
          type="button"
          onClick={handleReset}
          className={styles.secondaryButton}
        >
          Send another message
        </button>
      </div>
    );
  }

  // Button label based on state
  const buttonLabel =
    formState === 'computing'
      ? 'Verifying...'
      : formState === 'submitting'
        ? 'Sending...'
        : formState === 'error'
          ? 'Try Again'
          : 'Send Message';

  const isProcessing = formState === 'computing' || formState === 'submitting';

  return (
    <>
      {/* Error banner */}
      {formState === 'error' && (
        <div
          ref={errorBannerRef}
          className={styles.errorBanner}
          role="alert"
          tabIndex={-1}
        >
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {/* Honeypot field (hidden) */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            value={honeypot}
            onChange={handleChange}
          />
        </div>

        {/* Name field */}
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name
          </label>
          <input
            ref={nameRef}
            type="text"
            id="name"
            name="name"
            placeholder="Jane Doe"
            required
            maxLength={200}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            value={name}
            onBlur={handleBlur}
            onChange={handleChange}
            disabled={isProcessing}
          />
          {errors.name && (
            <span role="alert" id="name-error" className={styles.error}>
              {errors.name}
            </span>
          )}
        </div>

        {/* Email field */}
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            ref={emailRef}
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            value={email}
            onBlur={handleBlur}
            onChange={handleChange}
            disabled={isProcessing}
          />
          {errors.email && (
            <span role="alert" id="email-error" className={styles.error}>
              {errors.email}
            </span>
          )}
        </div>

        {/* Type field */}
        <div className={styles.field}>
          <label htmlFor="type" className={styles.label}>
            What can we help with?
          </label>
          <select
            ref={typeRef}
            id="type"
            name="type"
            required
            className={`${styles.select} ${errors.type ? styles.inputError : ''}`}
            aria-describedby={errors.type ? 'type-error' : undefined}
            aria-invalid={!!errors.type}
            value={type}
            onBlur={handleBlur}
            onChange={handleChange}
            disabled={isProcessing}
          >
            <option value="" disabled>
              Select an inquiry type...
            </option>
            <option value="general-inquiry">General Inquiry</option>
            <option value="bug-report">Bug Report</option>
            <option value="report-abuse">Abuse Report</option>
            <option value="privacy-question">Privacy Question</option>
            <option value="feature-request">Feature Request</option>
          </select>
          {errors.type && (
            <span role="alert" id="type-error" className={styles.error}>
              {errors.type}
            </span>
          )}
          <GuidanceBox type={type} />
        </div>

        {/* Message field */}
        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Message
          </label>
          <textarea
            ref={messageRef}
            id="message"
            name="message"
            placeholder="Tell us what's on your mind"
            required
            maxLength={5000}
            rows={6}
            className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
            aria-describedby={
              errors.message
                ? 'message-error message-counter'
                : 'message-counter'
            }
            aria-invalid={!!errors.message}
            value={message}
            onBlur={handleBlur}
            onChange={handleChange}
            disabled={isProcessing}
          />
          <CharacterCounter current={message.length} max={5000} />
          {errors.message && (
            <span role="alert" id="message-error" className={styles.error}>
              {errors.message}
            </span>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isProcessing}
          aria-busy={isProcessing}
          className={styles.submitButton}
        >
          {buttonLabel}
        </button>
      </form>

      {/* Email fallback */}
      <p className={styles.emailFallback}>
        Prefer email? Reach us directly at{' '}
        <a href="mailto:admin@urgdstudios.com" className={styles.emailLink}>
          admin@urgdstudios.com
        </a>
      </p>
    </>
  );
}

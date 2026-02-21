import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { forgotPassword, confirmForgotPassword } from '../../utils/auth';
import { labels } from '../../utils/labels';
import GlassButton from '../../components/command/GlassButton';
import GlassAlert from '../../components/command/GlassAlert';
import styles from './ForgotPasswordPage.module.css';

type Step = 'request' | 'confirm';

function mapForgotError(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    if (name === 'CodeMismatchException' || name === 'ExpiredCodeException') {
      return labels.errors.invalidCode;
    }
    if (name === 'InvalidPasswordException') {
      return labels.errors.passwordPolicyViolation;
    }
    if (
      name === 'UserNotFoundException' ||
      name === 'NotAuthorizedException'
    ) {
      return labels.errors.incorrectCredentials;
    }
  }
  if (err instanceof TypeError) return labels.errors.unableToConnect;
  return labels.errors.generic;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email if redirected from LoginPage
  useState(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email) setEmail(state.email);
  });

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('confirm');
    } catch (err) {
      setErrorMsg(mapForgotError(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg(labels.errors.passwordsDoNotMatch);
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      navigate('/command/login', {
        state: { successMessage: labels.forgotPassword.successMessage },
        replace: true,
      });
    } catch (err) {
      setErrorMsg(mapForgotError(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div
          className={styles.logo}
          role="img"
          aria-label={labels.login.logoAlt}
        />

        {step === 'request' ? (
          <>
            <h1 className={styles.heading}>{labels.forgotPassword.step1Heading}</h1>
            <p className={styles.description}>{labels.forgotPassword.step1Description}</p>

            <form onSubmit={handleSendCode} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="fp-email" className={styles.label}>
                  {labels.forgotPassword.emailLabel}
                </label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  required
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {errorMsg && (
                <GlassAlert variant="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
              )}

              <GlassButton
                type="submit"
                variant="primary"
                isLoading={isLoading}
                loadingText={labels.forgotPassword.sendingCodeButton}
              >
                {labels.forgotPassword.sendCodeButton}
              </GlassButton>

              <a href="/command/login" className={styles.backLink}>
                {labels.forgotPassword.backToSignIn}
              </a>
            </form>
          </>
        ) : (
          <>
            <h1 className={styles.heading}>{labels.forgotPassword.step2Heading}</h1>
            <p className={styles.description}>{labels.forgotPassword.step2Description(email)}</p>

            <form onSubmit={handleConfirmReset} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="fp-code" className={styles.label}>
                  {labels.forgotPassword.codeLabel}
                </label>
                <input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  required
                  placeholder={labels.forgotPassword.codePlaceholder}
                  className={styles.input}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="fp-password" className={styles.label}>
                  {labels.forgotPassword.newPasswordLabel}
                </label>
                <input
                  id="fp-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="fp-confirm" className={styles.label}>
                  {labels.forgotPassword.confirmPasswordLabel}
                </label>
                <input
                  id="fp-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {errorMsg && (
                <GlassAlert variant="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
              )}

              {errorMsg?.includes('expired') && (
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => { setStep('request'); setErrorMsg(null); }}
                >
                  {labels.forgotPassword.sendCodeAgain}
                </button>
              )}

              <GlassButton
                type="submit"
                variant="primary"
                isLoading={isLoading}
                loadingText={labels.forgotPassword.resettingButton}
              >
                {labels.forgotPassword.resetButton}
              </GlassButton>

              <a href="/command/login" className={styles.backLink}>
                {labels.forgotPassword.backToSignIn}
              </a>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

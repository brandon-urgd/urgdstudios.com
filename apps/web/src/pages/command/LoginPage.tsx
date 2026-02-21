import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { labels } from '../../utils/labels';
import GlassButton from '../../components/command/GlassButton';
import GlassAlert from '../../components/command/GlassAlert';
import styles from './LoginPage.module.css';

type Step = 'credentials' | 'newPassword';

function mapAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    const message = 'message' in err ? (err as { message: string }).message : '';
    
    if (name === 'AuthNotConfiguredException') return `Auth is not configured. Contact support. (${message})`;
    if (name === 'AuthUserPoolException') return `Auth service misconfigured. Contact support. (${message})`;
    if (name === 'NotAuthorizedException') return labels.errors.incorrectCredentials;
    if (name === 'UserNotFoundException') return labels.errors.incorrectCredentials;
    if (name === 'UserNotConfirmedException') return labels.errors.accountNotConfirmed;
    if (name === 'PasswordResetRequiredException') return labels.errors.passwordResetRequired;
    if (name === 'LimitExceededException') return labels.errors.tooManyAttempts;
    if (name === 'AuthIncompleteException') return labels.errors.loadFailed;
    
    return `${labels.errors.loadFailed} (${name}: ${message})`;
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return labels.errors.unableToConnect;
  }
  return labels.errors.incorrectCredentials;
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const { signIn, completeNewPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/command/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (isExpanded) emailRef.current?.focus();
  }, [isExpanded]);

  useEffect(() => {
    if (step === 'newPassword') newPasswordRef.current?.focus();
  }, [step]);

  function handleSignInClick() {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    if (!email || !password) {
      setErrorMsg(labels.errors.incorrectCredentials);
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.status === 'newPasswordRequired') {
        setStep('newPassword');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNewPasswordSubmit() {
    if (newPassword !== confirmPassword) {
      setErrorMsg(labels.errors.passwordsDoNotMatch);
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await completeNewPassword(newPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSubmit();
  }

  if (step === 'newPassword') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div
            className={styles.logo}
            role="img"
            aria-label={labels.login.logoAlt}
          />

          <h1 className={styles.title}>{labels.newPassword.heading}</h1>
          <p className={styles.subtitle}>{labels.newPassword.description}</p>

          <form
            aria-label={labels.newPassword.heading}
            onSubmit={(e) => { e.preventDefault(); void handleNewPasswordSubmit(); }}
            className={styles.form}
          >
            <div className={`${styles.formFields} ${styles.expanded}`}>
              <div className={styles.field}>
                <label htmlFor="new-password" className={styles.label}>
                  {labels.newPassword.newPasswordLabel}
                </label>
                <input
                  ref={newPasswordRef}
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  aria-required="true"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirm-password" className={styles.label}>
                  {labels.newPassword.confirmPasswordLabel}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  aria-required="true"
                />
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              loadingText={labels.newPassword.submittingButton}
            >
              {labels.newPassword.submitButton}
            </GlassButton>

            {errorMsg && (
              <GlassAlert
                variant="error"
                message={errorMsg}
                onDismiss={() => setErrorMsg(null)}
              />
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div
          className={styles.logo}
          role="img"
          aria-label={labels.login.logoAlt}
        />

        <h1 className={styles.title}>{labels.login.title}</h1>
        <p className={styles.subtitle}>{labels.login.subtitle}</p>

        <form
          aria-label={labels.login.formAriaLabel}
          onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
          className={styles.form}
        >
          <div className={`${styles.formFields} ${isExpanded ? styles.expanded : ''}`}>
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                {labels.login.emailLabel}
              </label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder={labels.login.emailPlaceholder}
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                onKeyDown={handleKeyDown}
                aria-required="true"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>
                {labels.login.passwordLabel}
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                placeholder={labels.login.passwordPlaceholder}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                onKeyDown={handleKeyDown}
                aria-required="true"
              />
            </div>
          </div>

          <GlassButton
            type={isExpanded ? 'submit' : 'button'}
            variant="primary"
            isLoading={isLoading}
            loadingText={labels.login.signingInButton}
            onClick={isExpanded ? undefined : handleSignInClick}
          >
            {labels.login.signInButton}
          </GlassButton>

          {isExpanded && (
            <Link to="/command/forgot-password" className={styles.forgotLink}>
              {labels.login.forgotPassword}
            </Link>
          )}

          {errorMsg && (
            <GlassAlert
              variant="error"
              message={errorMsg}
              onDismiss={() => setErrorMsg(null)}
            />
          )}
        </form>
      </div>
    </div>
  );
}

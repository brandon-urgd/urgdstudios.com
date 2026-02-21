import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { labels } from '../../utils/labels';
import GlassButton from '../../components/command/GlassButton';
import GlassAlert from '../../components/command/GlassAlert';
import styles from './LoginPage.module.css';

function mapAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    if (name === 'NotAuthorizedException') return labels.errors.incorrectCredentials;
    if (name === 'UserNotFoundException') return labels.errors.incorrectCredentials;
    if (name === 'UserNotConfirmedException') return labels.errors.accountNotConfirmed;
    if (name === 'PasswordResetRequiredException') return labels.errors.passwordResetRequired;
    if (name === 'LimitExceededException') return labels.errors.tooManyAttempts;
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return labels.errors.unableToConnect;
  }
  return labels.errors.incorrectCredentials;
}

export default function LoginPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/command/dashboard';

  // Already authenticated → redirect immediately
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  // Focus email input after form expands
  useEffect(() => {
    if (isExpanded) emailRef.current?.focus();
  }, [isExpanded]);

  function handleSignInClick() {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signIn(email, password);
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

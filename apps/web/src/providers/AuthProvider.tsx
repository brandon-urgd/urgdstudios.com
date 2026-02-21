/**
 * AuthProvider — Cognito session state for the Command Center.
 * Wraps the app in main.tsx. Manages token state in memory only.
 * Listens for 'auth:expired' custom event from api.ts.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  configureAuth,
  signIn as authSignIn,
  signOut as authSignOut,
  getAccessToken,
  getCurrentUser,
  type AuthUser,
} from '../utils/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Configure Amplify once on mount
  useEffect(() => {
    configureAuth();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const currentUser = await getCurrentUser();
      if (!cancelled) {
        setUser(currentUser);
        setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for auth:expired events dispatched by authedFetch on 401
  useEffect(() => {
    function handleAuthExpired() {
      setUser(null);
      navigate('/command/login');
    }

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [navigate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authSignIn(email, password);
    setUser(loggedInUser);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    navigate('/command/login');
  }, [navigate]);

  const getToken = useCallback(() => getAccessToken(), []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signIn,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

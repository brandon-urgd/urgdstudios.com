/**
 * useAuth — Convenience hook for accessing the AuthContext.
 * Throws if used outside of AuthProvider.
 */

import { useAuthContext } from '../providers/AuthProvider';

export function useAuth() {
  return useAuthContext();
}

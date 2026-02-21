/**
 * Cognito SDK wrapper using AWS Amplify v6.
 * Configures Amplify from Vite build-time environment variables.
 */

import { Amplify } from '@aws-amplify/core';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignIn as amplifyConfirmSignIn,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  type AuthUser,
} from '@aws-amplify/auth';

export type { AuthUser };

export type SignInResult =
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'newPasswordRequired' };

let authConfigured = false;

export function isAuthConfigured(): boolean {
  return authConfigured;
}

export function configureAuth(): void {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

  if (userPoolId && userPoolClientId) {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: userPoolId as string,
          userPoolClientId: userPoolClientId as string,
        },
      },
    });
    authConfigured = true;
  } else {
    console.error(
      'Amplify Auth: VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_CLIENT_ID is missing.',
      { userPoolId: userPoolId ?? '(undefined)', userPoolClientId: userPoolClientId ?? '(undefined)' },
    );
    authConfigured = false;
  }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (!authConfigured) {
    const error = new Error('Auth is not configured. Cognito environment variables may be missing from the build.');
    (error as any).name = 'AuthNotConfiguredException';
    throw error;
  }

  // Clear any stale session state from a previous interrupted sign-in attempt.
  // Without this, Amplify v6 can throw if there's a pending challenge session
  // (e.g., user saw FORCE_CHANGE_PASSWORD form, then refreshed the page).
  try {
    await amplifySignOut();
  } catch {
    // Ignore — signOut throws if there's no session, which is fine
  }

  try {
    const { isSignedIn, nextStep } = await amplifySignIn({ username: email, password });

    if (isSignedIn) {
      const user = await amplifyGetCurrentUser();
      return { status: 'authenticated', user };
    }

    if (
      nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' ||
      nextStep?.signInStep === 'RESET_PASSWORD' ||
      (nextStep?.signInStep as any)?.includes?.('PASSWORD')
    ) {
      return { status: 'newPasswordRequired' };
    }

    const error = new Error(`Auth incomplete: ${nextStep?.signInStep || 'Unknown'}`);
    (error as any).name = 'AuthIncompleteException';
    throw error;
  } catch (err: any) {
    if (err?.name === 'AuthNotConfiguredException' || err?.name === 'AuthIncompleteException') {
      throw err;
    }
    // Amplify v6 masking bug: challenge details on the error object instead of result
    if (err && typeof err === 'object' && 'nextStep' in err) {
      if (err.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return { status: 'newPasswordRequired' };
      }
    }
    throw err;
  }
}

export async function completeNewPassword(newPassword: string): Promise<AuthUser> {
  await amplifyConfirmSignIn({ challengeResponse: newPassword });
  return amplifyGetCurrentUser();
}

export async function signOut(): Promise<void> {
  await amplifySignOut();
}

export async function getAccessToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) {
    throw new Error('No active session');
  }
  return token;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await amplifyGetCurrentUser();
  } catch {
    return null;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await resetPassword({ username: email });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await confirmResetPassword({
    username: email,
    confirmationCode: code,
    newPassword,
  });
}

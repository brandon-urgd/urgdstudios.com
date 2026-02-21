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

export function configureAuth(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
        userPoolRegion: 'us-west-2',
      },
    },
  });
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const { isSignedIn, nextStep } = await amplifySignIn({ username: email, password });

    if (isSignedIn) {
      const user = await amplifyGetCurrentUser();
      return { status: 'authenticated', user };
    }

    if (
      nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' ||
      nextStep?.signInStep === 'RESET_PASSWORD' ||
      (nextStep?.signInStep as any)?.includes('PASSWORD')
    ) {
      return { status: 'newPasswordRequired' };
    }

    const error = new Error(`Auth incomplete: ${nextStep?.signInStep || 'Unknown'}`);
    (error as any).name = 'AuthIncompleteException';
    throw error;
  } catch (err: any) {
    // Check if the error object itself contains the challenge (Amplify v6 masking bug)
    if (err.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      return { status: 'newPasswordRequired' };
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

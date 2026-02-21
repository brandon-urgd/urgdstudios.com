/**
 * Authenticated fetch wrapper for Command Center API calls.
 * Automatically injects the Bearer token from the active Cognito session.
 * On 401: dispatches a custom 'auth:expired' event (caught by AuthProvider).
 */

import { getAccessToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function authedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  return response;
}

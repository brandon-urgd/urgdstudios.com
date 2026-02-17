/**
 * urgdstudios.com — Contact Form Submission
 *
 * API submission function for intake form.
 * Reads base URL from config, handles all response codes.
 */

export interface IntakePayload {
  name: string;
  email: string;
  type: string;
  message: string;
  honeypot: string;
  proofOfWork: {
    challenge: string;
    nonce: number;
    solution: string;
  };
}

export interface IntakeResponse {
  message: string;
  submissionId?: string;
}

export interface IntakeError {
  error: string;
}

/**
 * Submit contact form to API.
 *
 * @param payload - Form data with proof-of-work
 * @returns Promise resolving to response or rejecting with error
 * @throws Error with user-friendly message on failure
 */
export async function submitIntake(
  payload: IntakePayload
): Promise<IntakeResponse> {
  // Read API base URL from config
  const config = (window as any).URGD_CONFIG;
  const apiBaseUrl = config?.apiBaseUrl || 'https://urgdstudios.com';
  const url = `${apiBaseUrl}/v1/intake`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Success (200)
    if (response.ok) {
      const data: IntakeResponse = await response.json();
      return data;
    }

    // Validation error (400)
    if (response.status === 400) {
      const data: IntakeError = await response.json();
      throw new Error(
        data.error || 'Please check your input and try again.'
      );
    }

    // Rate limit (429)
    if (response.status === 429) {
      throw new Error(
        "We've received a lot of messages recently. Please try again in a few minutes. Or email us at admin@urgdstudios.com"
      );
    }

    // Server error (500) or unexpected status
    throw new Error(
      "We couldn't send your message. Please try again, or email us at admin@urgdstudios.com"
    );
  } catch (err) {
    // Network error (offline, DNS, timeout)
    if (err instanceof Error && err.message.includes('fetch')) {
      throw new Error(
        "We couldn't reach our servers. Check your connection and try again, or email us at admin@urgdstudios.com"
      );
    }

    // Re-throw known errors (from status code handling above)
    if (err instanceof Error) {
      throw err;
    }

    // Unknown error
    throw new Error(
      "We couldn't send your message. Please try again, or email us at admin@urgdstudios.com"
    );
  }
}

/**
 * urgdstudios.com — Beta Form Validation Utilities
 *
 * Pure functions that determine button-enabled state for
 * the signup and survey modals. No side effects.
 */

export interface SurveyResponses {
  deviceUsed: string | null;
  aiConversationQuality: number | null;
  aiAccuracy: string | null;
  sessionPreference: string | null;
  biggestFriction: string | null;
  wouldUseAgain: string | null;
  anythingElse?: string | null;
}

/**
 * Determine whether the "Sign Me Up" button should be enabled.
 *
 * Returns true if and only if:
 * - name is non-empty after trimming
 * - email passes basic format validation (has @, text before/after @, dot after @)
 * - consent is true
 */
export function isSignupFormValid(
  name: string,
  email: string,
  consent: boolean,
): boolean {
  if (!consent) return false;

  const trimmedName = name.trim();
  if (trimmedName.length === 0) return false;

  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) return false;

  // Basic email check: text@text.text
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) return false;

  return true;
}

/**
 * Determine whether the "Submit Survey" button should be enabled.
 *
 * Returns true if and only if questions 1-6 are all answered (non-null/undefined).
 * Question 7 (anythingElse) does NOT affect the result.
 */
export function isSurveyFormValid(responses: SurveyResponses): boolean {
  return (
    responses.deviceUsed != null &&
    responses.aiConversationQuality != null &&
    responses.aiAccuracy != null &&
    responses.sessionPreference != null &&
    responses.biggestFriction != null &&
    responses.wouldUseAgain != null
  );
}

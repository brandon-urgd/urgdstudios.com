/**
 * urgdstudios.com — Form Validation Utilities
 *
 * Client-side validation matching server-side rules exactly.
 * Human-friendly error messages.
 */

const INQUIRY_TYPES = [
  'general-inquiry',
  'bug-report',
  'report-abuse',
  'privacy-question',
  'feature-request',
];

export interface FormFields {
  name: string;
  email: string;
  type: string;
  message: string;
}

/**
 * Validate name field.
 * Required, 1–200 characters.
 */
export function validateName(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return 'Please enter your name';
  }

  if (trimmed.length > 200) {
    return 'Name must be 200 characters or fewer';
  }

  return null;
}

/**
 * Validate email field.
 * Required, basic format check.
 */
export function validateEmail(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return 'Please enter your email address';
  }

  // Basic email format: contains @ and . after @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validate inquiry type field.
 * Must be in allowlist.
 */
export function validateType(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return 'Please select an inquiry type';
  }

  if (!INQUIRY_TYPES.includes(value)) {
    return 'Please select a valid inquiry type';
  }

  return null;
}

/**
 * Validate message field.
 * Required, 1–5,000 characters.
 */
export function validateMessage(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return 'Please enter a message';
  }

  if (trimmed.length > 5000) {
    return 'Message must be 5,000 characters or fewer';
  }

  return null;
}

/**
 * Validate all form fields.
 * Returns error map: { fieldName: errorMessage | null }
 */
export function validateForm(fields: FormFields): Record<string, string | null> {
  return {
    name: validateName(fields.name),
    email: validateEmail(fields.email),
    type: validateType(fields.type),
    message: validateMessage(fields.message),
  };
}

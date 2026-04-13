import sanitizeHtml from 'sanitize-html';
import { validateEmail as sharedValidateEmail } from './shared/utils.mjs';

/**
 * Sanitizes text by stripping all HTML tags.
 * Wraps sanitize-html with no allowed tags, discard mode.
 * @param {string} text - Input text to sanitize
 * @returns {string} Sanitized string with all HTML tags removed
 */
export function sanitizeText(text) {
  return sanitizeHtml(text, {
    allowedTags: [],
    disallowedTagsMode: 'discard',
  });
}

/**
 * Validates email format using the shared validateEmail utility.
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  return sharedValidateEmail(email);
}

/**
 * Validates a name field: non-empty string, max 200 characters.
 * @param {string} name - Name to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length > 200) {
    return { valid: false, error: 'Name must be 200 characters or fewer' };
  }
  return { valid: true };
}

/**
 * Validates a rating value: must be an integer between 1 and 5 inclusive.
 * @param {*} value - Rating value to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRating(value) {
  if (value === undefined || value === null) {
    return { valid: false, error: 'Rating is required' };
  }
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return { valid: false, error: 'Rating must be an integer between 1 and 5' };
  }
  return { valid: true };
}

/**
 * Validates a session preference value: must be one of "document", "photo", "same".
 * @param {*} value - Session preference to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSessionPreference(value) {
  const validPreferences = ['document', 'photo', 'same'];
  if (!value || typeof value !== 'string') {
    return { valid: false, error: 'sessionPreference is required' };
  }
  if (!validPreferences.includes(value)) {
    return { valid: false, error: 'sessionPreference must be one of: document, photo, same' };
  }
  return { valid: true };
}

/**
 * Validates a text field: non-empty string, max length.
 * @param {*} value - Text value to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @param {number} maxLength - Maximum allowed length
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTextField(value, fieldName, maxLength) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (value.trim().length > maxLength) {
    return { valid: false, error: `${fieldName} must be ${maxLength} characters or fewer` };
  }
  return { valid: true };
}

/**
 * Validates the full signup request body.
 * Returns an errors object where keys are field names and values are error messages.
 * An empty object means the input is valid.
 * @param {object} body - Signup request body
 * @returns {object} Errors object (empty = valid)
 */
export function validateSignupInput(body) {
  const errors = {};

  // Name validation
  const nameResult = validateName(body.name);
  if (!nameResult.valid) {
    errors.name = nameResult.error;
  }

  // Email validation
  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!validateEmail(body.email.trim())) {
    errors.email = 'Invalid email address';
  }

  // Consent validation
  if (body.consentGiven !== true) {
    errors.consentGiven = 'Consent is required';
  }

  return errors;
}

/**
 * Validates the full survey responses object.
 * Returns an errors object where keys are field names and values are error messages.
 * An empty object means the responses are valid.
 * @param {object} responses - Survey responses object
 * @returns {object} Errors object (empty = valid)
 */
export function validateSurveyResponses(responses) {
  const errors = {};

  if (!responses || typeof responses !== 'object') {
    errors.responses = 'Survey responses are required';
    return errors;
  }

  // Rating field: aiConversationQuality must be integer 1-5
  const ratingResult = validateRating(responses.aiConversationQuality);
  if (!ratingResult.valid) {
    const val = responses.aiConversationQuality;
    if (val === undefined || val === null) {
      errors.aiConversationQuality = 'aiConversationQuality is required';
    } else {
      errors.aiConversationQuality = 'aiConversationQuality must be an integer between 1 and 5';
    }
  }

  // Pill-select fields: must be one of allowed values
  const pillFields = {
    deviceUsed: ['mobile', 'desktop', 'both'],
    aiAccuracy: ['no', 'minor', 'yes'],
    sessionPreference: ['document', 'photo', 'same'],
    wouldUseAgain: ['definitely', 'maybe', 'probably_not'],
  };

  for (const [field, allowed] of Object.entries(pillFields)) {
    const val = responses[field];
    if (!val || typeof val !== 'string') {
      errors[field] = `${field} is required`;
    } else if (!allowed.includes(val)) {
      errors[field] = `${field} must be one of: ${allowed.join(', ')}`;
    }
  }

  // Required text field: biggestFriction — non-empty string, max 1000 chars
  const frictionResult = validateTextField(responses.biggestFriction, 'biggestFriction', 1000);
  if (!frictionResult.valid) {
    errors.biggestFriction = frictionResult.error;
  }

  // anythingElse: optional, but if provided must be string max 1000 chars
  if (responses.anythingElse !== undefined && responses.anythingElse !== null && responses.anythingElse !== '') {
    if (typeof responses.anythingElse !== 'string') {
      errors.anythingElse = 'anythingElse must be a string';
    } else if (responses.anythingElse.trim().length > 1000) {
      errors.anythingElse = 'anythingElse must be 1000 characters or fewer';
    }
  }

  return errors;
}

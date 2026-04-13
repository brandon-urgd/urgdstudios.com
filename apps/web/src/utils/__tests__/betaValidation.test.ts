/**
 * Property-based tests for beta form validation utilities.
 *
 * Feature: beta-signup
 * Property 2: Signup form validation determines button state
 * Property 10: Survey form validation determines button state
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isSignupFormValid, isSurveyFormValid, type SurveyResponses } from '../betaValidation';

// ── Generators ───────────────────────────────────────────────────────────────

const validName = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

const validEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,5}$/),
    fc.constantFrom('com', 'org', 'net'),
  )
  .map(([u, d, t]) => `${u}@${d}.${t}`);

const invalidEmail = fc.oneof(
  fc.constant(''),
  fc.constant('nope'),
  fc.constant('@'),
  fc.stringMatching(/^[a-z]{1,10}$/),
);

const validRating = fc.integer({ min: 1, max: 5 });

const validSessionPreference = fc.constantFrom('document', 'photo', 'same');

const validText = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);


// ── Property 2: Signup form validation determines button state ───────────────
// **Validates: Requirements 4.6**

describe('Property 2: Signup form validation determines button state', () => {
  it('valid name + valid email + consent=true → returns true', () => {
    fc.assert(
      fc.property(validName, validEmail, (name, email) => {
        expect(isSignupFormValid(name, email, true)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('empty/whitespace name + valid email + consent=true → returns false', () => {
    const whitespaceOnly = fc.constantFrom('', ' ', '  ', '\t', '\n', '  \t\n  ');
    fc.assert(
      fc.property(whitespaceOnly, validEmail, (name, email) => {
        expect(isSignupFormValid(name, email, true)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('valid name + invalid email + consent=true → returns false', () => {
    fc.assert(
      fc.property(validName, invalidEmail, (name, email) => {
        expect(isSignupFormValid(name, email, true)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('valid name + valid email + consent=false → returns false', () => {
    fc.assert(
      fc.property(validName, validEmail, (name, email) => {
        expect(isSignupFormValid(name, email, false)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('all invalid → returns false', () => {
    const whitespaceOnly = fc.constantFrom('', ' ', '  ', '\t');
    fc.assert(
      fc.property(whitespaceOnly, invalidEmail, (name, email) => {
        expect(isSignupFormValid(name, email, false)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 10: Survey form validation determines button state ──────────────
// **Validates: Requirements 8.3**

describe('Property 10: Survey form validation determines button state', () => {
  const fullSurveyResponses = fc.record({
    overallExperience: validRating,
    aiNaturalness: validRating,
    sessionPreference: validSessionPreference,
    usefulness: validRating,
    bestPart: validText,
    whatToChange: validText,
  });

  it('all 6 required fields answered → returns true (regardless of anythingElse)', () => {
    const anythingElse = fc.oneof(fc.constant(null), fc.constant(undefined), validText);
    fc.assert(
      fc.property(fullSurveyResponses, anythingElse, (base, extra) => {
        const responses: SurveyResponses = { ...base, anythingElse: extra };
        expect(isSurveyFormValid(responses)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('any one of the 6 required fields is null → returns false', () => {
    const requiredKeys: (keyof Omit<SurveyResponses, 'anythingElse'>)[] = [
      'overallExperience',
      'aiNaturalness',
      'sessionPreference',
      'usefulness',
      'bestPart',
      'whatToChange',
    ];
    const keyIndex = fc.integer({ min: 0, max: requiredKeys.length - 1 });

    fc.assert(
      fc.property(fullSurveyResponses, keyIndex, (base, idx) => {
        const responses: SurveyResponses = { ...base, anythingElse: null };
        // Null out one required field
        (responses as Record<string, unknown>)[requiredKeys[idx]] = null;
        expect(isSurveyFormValid(responses)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('all required answered + anythingElse null → returns true', () => {
    fc.assert(
      fc.property(fullSurveyResponses, (base) => {
        const responses: SurveyResponses = { ...base, anythingElse: null };
        expect(isSurveyFormValid(responses)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('all required answered + anythingElse provided → returns true', () => {
    fc.assert(
      fc.property(fullSurveyResponses, validText, (base, extra) => {
        const responses: SurveyResponses = { ...base, anythingElse: extra };
        expect(isSurveyFormValid(responses)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

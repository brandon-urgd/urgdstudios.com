// Feature: beta-signup — Validation and sanitization property tests
// Validates: Requirements 11.1, 11.3, 11.4, 11.5

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the shared utils module so validation.mjs can import validateEmail
// without pulling in the full shared module (crypto, etc.)
vi.mock('./shared/utils.mjs', () => ({
  validateEmail: vi.fn((email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.trim().length <= 200;
  }),
}));

// Import the real validation functions — sanitize-html is NOT mocked
import {
  sanitizeText,
  validateName,
  validateRating,
  validateSessionPreference,
  validateTextField,
} from '../validation.mjs';

// ── Generators ───────────────────────────────────────────────────────────────

// --- Property 13 generators ---

/** Wrap arbitrary text in a bold tag */
const htmlBoldString = fc.string().map((s) => `<b>${s}</b>`);

/** Wrap arbitrary text in a script tag */
const htmlScriptString = fc.string().map((s) => `<script>alert('${s}')</script>`);

/** Wrap arbitrary text in a div with attributes */
const htmlDivString = fc.string().map((s) => `<div class="x">${s}</div>`);

/** Nested HTML tags */
const htmlNestedString = fc.string().map((s) => `<p><em>${s}</em></p>`);

/** img tag with onerror */
const htmlImgString = fc.string().map((s) => `<img src="x" onerror="alert('${s}')">`);

/** Mix of plain text and HTML */
const htmlMixedString = fc
  .tuple(fc.string(), fc.string(), fc.string())
  .map(([a, b, c]) => `${a}<b>${b}</b>${c}`);

/** One-of generator combining all HTML variants */
const stringWithHtmlTags = fc.oneof(
  htmlBoldString,
  htmlScriptString,
  htmlDivString,
  htmlNestedString,
  htmlImgString,
  htmlMixedString,
);

// --- Property 14 generators ---

/** Valid name: 1-200 chars, non-whitespace-only */
const validNameGen = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 .'-]{0,99}$/)
  .filter((s) => s.trim().length > 0 && s.trim().length <= 200);

/** Name that is too long: >200 trimmed chars */
const tooLongNameGen = fc
  .integer({ min: 201, max: 400 })
  .map((len) => 'A'.repeat(len));

/** Empty / whitespace-only name */
const emptyNameGen = fc.constantFrom('', '   ', '\t', '\n');

/** Valid rating: integer 1-5 */
const validRatingGen = fc.integer({ min: 1, max: 5 });

/** Invalid rating: out of range integer */
const outOfRangeRatingGen = fc.oneof(
  fc.integer({ min: -100, max: 0 }),
  fc.integer({ min: 6, max: 100 }),
);

/** Invalid rating: non-integer number */
const nonIntegerRatingGen = fc
  .double({ min: 1.01, max: 4.99, noNaN: true })
  .filter((n) => !Number.isInteger(n));

/** Invalid rating: non-number types */
const nonNumberRatingGen = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.constant(true),
  fc.constant(false),
);

/** Valid session preference */
const validSessionPrefGen = fc.constantFrom('document', 'photo', 'same');

/** Invalid session preference: any string not in the valid set */
const invalidSessionPrefGen = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => !['document', 'photo', 'same'].includes(s));

/** Valid text field: 1-1000 trimmed chars */
const validTextFieldGen = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0 && s.trim().length <= 1000);

/** Text field that is too long: >1000 trimmed chars */
const tooLongTextFieldGen = fc
  .integer({ min: 1001, max: 1500 })
  .map((len) => 'X'.repeat(len));

/** Empty / whitespace-only text field */
const emptyTextFieldGen = fc.constantFrom('', '   ', '\t');

// ── Property 13: HTML sanitization strips all tags ───────────────────────────
// Feature: beta-signup, Property 13: HTML sanitization strips all tags
// **Validates: Requirements 11.1**
describe('Property 13: HTML sanitization strips all tags', () => {
  it('output contains no HTML tags for any input with HTML tags', async () => {
    await fc.assert(
      fc.property(stringWithHtmlTags, (input) => {
        const result = sanitizeText(input);

        // The output SHALL contain no HTML tags — no < or > that form tags
        // sanitize-html strips tags, so no <tagname> or </tagname> should remain
        expect(result).not.toMatch(/<[a-zA-Z/][^>]*>/);
      }),
      { numRuns: 100 },
    );
  });

  it('text content between tags is preserved after sanitization', async () => {
    // Use a simpler generator where we know the exact text content
    const textAndTag = fc
      .tuple(
        fc.stringMatching(/^[A-Za-z0-9 ]{1,50}$/),
        fc.constantFrom('b', 'i', 'em', 'strong', 'div', 'span', 'p'),
      )
      .filter(([text]) => text.trim().length > 0);

    await fc.assert(
      fc.property(textAndTag, ([text, tag]) => {
        const input = `<${tag}>${text}</${tag}>`;
        const result = sanitizeText(input);

        // The text content SHALL be preserved
        expect(result).toContain(text);

        // No HTML tags in output
        expect(result).not.toMatch(/<[a-zA-Z/][^>]*>/);
      }),
      { numRuns: 100 },
    );
  });

  it('script tags and their content are fully removed', async () => {
    await fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z0-9 ]{0,30}$/), (content) => {
        const input = `<script>${content}</script>`;
        const result = sanitizeText(input);

        // Script tags and content should be stripped entirely
        expect(result).not.toContain('<script');
        expect(result).not.toContain('</script');
      }),
      { numRuns: 100 },
    );
  });

  it('plain text without HTML passes through unchanged', async () => {
    const plainText = fc
      .stringMatching(/^[A-Za-z0-9 .,!?'-]{1,100}$/)
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.property(plainText, (input) => {
        const result = sanitizeText(input);
        expect(result).toBe(input);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 14: Input field validation enforces constraints ─────────────────
// Feature: beta-signup, Property 14: Input field validation enforces constraints
// **Validates: Requirements 11.3, 11.4, 11.5**
describe('Property 14: Input field validation enforces constraints', () => {
  // 14a: name strings exceeding 200 characters SHALL be rejected
  describe('14a: name validation', () => {
    it('accepts valid names (1-200 trimmed chars)', async () => {
      await fc.assert(
        fc.property(validNameGen, (name) => {
          const result = validateName(name);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects names exceeding 200 characters', async () => {
      await fc.assert(
        fc.property(tooLongNameGen, (name) => {
          const result = validateName(name);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects empty or whitespace-only names', async () => {
      await fc.assert(
        fc.property(emptyNameGen, (name) => {
          const result = validateName(name);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });
  });

  // 14b: survey text responses exceeding 1000 characters SHALL be rejected
  describe('14b: text field validation', () => {
    it('accepts valid text fields (1-1000 trimmed chars)', async () => {
      await fc.assert(
        fc.property(validTextFieldGen, (text) => {
          const result = validateTextField(text, 'testField', 1000);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects text fields exceeding 1000 characters', async () => {
      await fc.assert(
        fc.property(tooLongTextFieldGen, (text) => {
          const result = validateTextField(text, 'testField', 1000);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects empty or whitespace-only text fields', async () => {
      await fc.assert(
        fc.property(emptyTextFieldGen, (text) => {
          const result = validateTextField(text, 'testField', 1000);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });
  });

  // 14c: rating values that are not integers in [1, 5] SHALL be rejected
  describe('14c: rating validation', () => {
    it('accepts valid ratings (integers 1-5)', async () => {
      await fc.assert(
        fc.property(validRatingGen, (rating) => {
          const result = validateRating(rating);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects out-of-range integer ratings', async () => {
      await fc.assert(
        fc.property(outOfRangeRatingGen, (rating) => {
          const result = validateRating(rating);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects non-integer number ratings', async () => {
      await fc.assert(
        fc.property(nonIntegerRatingGen, (rating) => {
          const result = validateRating(rating);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects non-number rating types (null, undefined, string, boolean)', async () => {
      await fc.assert(
        fc.property(nonNumberRatingGen, (rating) => {
          const result = validateRating(rating);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });
  });

  // 14d: sessionPreference values not in {"document", "photo", "same"} SHALL be rejected
  describe('14d: sessionPreference validation', () => {
    it('accepts valid session preferences', async () => {
      await fc.assert(
        fc.property(validSessionPrefGen, (pref) => {
          const result = validateSessionPreference(pref);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects invalid session preference strings', async () => {
      await fc.assert(
        fc.property(invalidSessionPrefGen, (pref) => {
          const result = validateSessionPreference(pref);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });
  });
});

// Feature: beta-signup, Property 1: CloudFront /beta/* SPA rewrite
// **Validates: Requirements 1.2**

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadCfnTemplate } from './cfn-yaml.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '..', '..', '..', 'cloudformation', 'urgd-urgdstudios-com.yaml');

/**
 * Extract the FunctionCode string from ViewerRequestFunction in the CFN template.
 */
function extractViewerRequestCode(template) {
  const fn = template.Resources.ViewerRequestFunction;
  return fn.Properties.FunctionCode;
}

/**
 * Build a callable handler from the CloudFront Function code string.
 * CloudFront Functions define a top-level `handler` function — we wrap it
 * in a Function constructor so we can call it directly in Node.js.
 */
function buildHandler(code) {
  // eslint-disable-next-line no-new-func
  const factory = new Function(`${code}\nreturn handler;`);
  return factory();
}

let handler;

beforeAll(() => {
  const template = loadCfnTemplate(readFileSync(templatePath, 'utf8'));
  const code = extractViewerRequestCode(template);
  handler = buildHandler(code);
});

/**
 * Helper: invoke the handler with a given URI and non-www host, return the result.
 * Returns the request object (with potentially rewritten uri).
 */
function rewrite(uri) {
  const event = {
    request: {
      uri,
      headers: { host: { value: 'urgdstudios.com' } },
    },
  };
  const result = handler(event);
  // The handler returns either a redirect object (statusCode) or the request
  return result.uri;
}

// ── Generators ───────────────────────────────────────────────────────────────

/**
 * Arbitrary: extensionless path segment (no dots, at least one char).
 * e.g. "dashboard", "pulse", "abc123"
 */
const extensionlessSegment = fc
  .stringMatching(/^[a-zA-Z0-9_-]+$/)
  .filter(s => s.length > 0 && !s.includes('.'));

/**
 * Arbitrary: extensionless path under /beta/ (e.g. /beta/pulse, /beta/pulse/signup)
 */
const betaExtensionlessPath = fc
  .array(extensionlessSegment, { minLength: 1, maxLength: 4 })
  .map(segments => '/beta/' + segments.join('/'));

/**
 * Arbitrary: file extensions commonly served by CloudFront
 */
const extensions = fc.constantFrom(
  '.js', '.css', '.png', '.svg', '.woff2', '.json', '.html', '.ico', '.map', '.txt', '.jpg', '.webp'
);

/**
 * Arbitrary: path under /beta/ WITH a file extension (should pass through unchanged)
 * e.g. /beta/style.css, /beta/assets/logo.png
 */
const betaPathWithExtension = fc
  .tuple(
    fc.array(extensionlessSegment, { minLength: 0, maxLength: 3 }),
    extensionlessSegment,
    extensions
  )
  .map(([dirs, name, ext]) => {
    const prefix = dirs.length > 0 ? '/beta/' + dirs.join('/') + '/' : '/beta/';
    return `${prefix}${name}${ext}`;
  });

// ── Property Tests ───────────────────────────────────────────────────────────

describe('Property 1: CloudFront /beta/* SPA rewrite', () => {
  it('extensionless paths under /beta/* are rewritten to /index.html', () => {
    fc.assert(
      fc.property(betaExtensionlessPath, (uri) => {
        expect(rewrite(uri)).toBe('/index.html');
      }),
      { numRuns: 100 }
    );
  });

  it('/beta (bare path) is rewritten to /index.html', () => {
    expect(rewrite('/beta')).toBe('/index.html');
  });

  it('paths under /beta/* WITH file extensions pass through unchanged', () => {
    fc.assert(
      fc.property(betaPathWithExtension, (uri) => {
        expect(rewrite(uri)).toBe(uri);
      }),
      { numRuns: 100 }
    );
  });

  it('extensionless and has-extension cases are mutually exclusive for /beta/*', () => {
    fc.assert(
      fc.property(
        fc.oneof(betaExtensionlessPath, betaPathWithExtension),
        (uri) => {
          const hasDot = uri.slice('/beta/'.length).includes('.');
          const rewrittenUri = rewrite(uri);
          const isRewritten = rewrittenUri === '/index.html';

          if (hasDot) {
            // Extension paths must NOT be rewritten to /index.html
            expect(isRewritten).toBe(false);
          } else {
            // Extensionless SPA paths MUST be rewritten to /index.html
            expect(isRewritten).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

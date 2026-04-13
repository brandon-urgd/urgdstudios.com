// Feature: beta-signup — Handler scaffolding tests
// Validates: Requirements 10.1, 10.6, 18.1, 18.3

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK clients before importing handler
vi.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = vi.fn();
  return {
    DynamoDBClient: vi.fn(() => ({ send: mockSend })),
    DescribeTableCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSend = vi.fn();
  const mockFrom = vi.fn(() => ({ send: mockSend }));
  return {
    DynamoDBDocumentClient: { from: mockFrom },
    PutCommand: vi.fn(),
    GetCommand: vi.fn(),
    UpdateCommand: vi.fn(),
    QueryCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/client-ses', () => {
  const mockSend = vi.fn();
  return {
    SESClient: vi.fn(() => ({ send: mockSend })),
    SendEmailCommand: vi.fn(),
    GetSendQuotaCommand: vi.fn(),
  };
});

vi.mock('sanitize-html', () => ({
  default: vi.fn((str) => str),
}));

/**
 * Build a minimal API Gateway v2 event.
 * API Gateway HTTP API includes the stage prefix in the path,
 * e.g. /prod/v1/beta/signup. The handler strips the first segment.
 */
function makeEvent(method, path, { body, headers, queryStringParameters, stage = 'prod' } = {}) {
  return {
    requestContext: {
      requestId: 'test-request-id',
      http: {
        method,
        path: `/${stage}${path}`,
        sourceIp: '127.0.0.1',
      },
    },
    headers: {
      origin: 'https://urgdstudios.com',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    queryStringParameters: queryStringParameters || undefined,
  };
}

describe('Beta Lambda handler scaffolding', () => {
  let handler;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    // Re-import handler fresh for each test
    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  describe('OPTIONS preflight', () => {
    it('returns 200 with CORS headers for OPTIONS on /v1/beta/signup', async () => {
      const event = makeEvent('OPTIONS', '/v1/beta/signup');
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('https://urgdstudios.com');
      const body = JSON.parse(response.body);
      expect(body.message).toBe('OK');
    });

    it('returns 200 with CORS headers for OPTIONS on /v1/beta/survey', async () => {
      const event = makeEvent('OPTIONS', '/v1/beta/survey');
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('https://urgdstudios.com');
    });

    it('returns 200 with CORS headers for OPTIONS on /v1/beta/lookup', async () => {
      const event = makeEvent('OPTIONS', '/v1/beta/lookup');
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('https://urgdstudios.com');
    });
  });

  describe('Unknown routes → 404', () => {
    it('returns 404 for GET /v1/beta/unknown', async () => {
      const event = makeEvent('GET', '/v1/beta/unknown');
      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not found');
    });

    it('returns 404 for POST /v1/beta/unknown', async () => {
      const event = makeEvent('POST', '/v1/beta/unknown');
      const response = await handler(event);

      expect(response.statusCode).toBe(404);
    });

    it('returns 404 for DELETE /v1/beta/signup', async () => {
      const event = makeEvent('DELETE', '/v1/beta/signup');
      const response = await handler(event);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Stage prefix stripping', () => {
    it('strips stage prefix and routes correctly', async () => {
      // makeEvent already adds /prod prefix, so /prod/v1/beta/unknown → /v1/beta/unknown → 404
      const event = makeEvent('GET', '/v1/beta/unknown');
      const response = await handler(event);

      expect(response.statusCode).toBe(404);
    });

    it('works with different stage names', async () => {
      const event = makeEvent('OPTIONS', '/v1/beta/signup', { stage: 'staging' });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Lookup handler routes correctly', () => {
    it('GET /v1/beta/lookup returns 400 when email is missing', async () => {
      const event = makeEvent('GET', '/v1/beta/lookup', {
        queryStringParameters: { app: 'pulse' },
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toMatch(/email/i);
    });

    it('GET /v1/beta/lookup returns 400 when app is missing', async () => {
      const event = makeEvent('GET', '/v1/beta/lookup', {
        queryStringParameters: { email: 'test@example.com' },
      });
      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toMatch(/app/i);
    });
  });
});


// ── Property-Based Tests ─────────────────────────────────────────────────────
import * as fc from 'fast-check';

/**
 * Helper: get the mocked docClient.send function.
 * The vi.mock factory for @aws-sdk/lib-dynamodb creates a mockSend and wires it
 * through DynamoDBDocumentClient.from(). We retrieve it by calling .from() and
 * reading .send off the returned object.
 */
async function getDocClientSend() {
  const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');
  return DynamoDBDocumentClient.from().send;
}

/**
 * Helper: get the mocked sesClient.send function.
 */
async function getSesClientSend() {
  const { SESClient } = await import('@aws-sdk/client-ses');
  return new SESClient().send;
}

// ── Generators ───────────────────────────────────────────────────────────────

/** Valid name: non-empty string, 1-200 chars, no leading/trailing whitespace-only */
const validName = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 .'-]{0,99}$/)
  .filter(s => s.trim().length > 0 && s.trim().length <= 200);

/** Invalid name: empty string */
const emptyName = fc.constant('');

/** Name that is too long: >200 chars */
const tooLongName = fc
  .integer({ min: 201, max: 300 })
  .map(len => 'A'.repeat(len));

/** Valid email: user@domain.tld format */
const validEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.constantFrom('com', 'org', 'net', 'io', 'dev')
  )
  .map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

/** Invalid email: missing @, missing domain, etc. */
const invalidEmail = fc.oneof(
  fc.constant(''),
  fc.constant('notanemail'),
  fc.constant('@nodomain'),
  fc.constant('no@'),
  fc.constant('spaces in@email.com'),
  fc.stringMatching(/^[a-z]{1,10}$/) // no @ at all
);

/** Non-empty honeypot string (indicates bot) */
const nonEmptyHoneypot = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

// Feature: beta-signup, Property 3: Signup request validation
// **Validates: Requirements 5.1, 11.6**
describe('Property 3: Signup request validation', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    // Default: rate limit returns 0, duplicate returns 0 — so validation is the only gate
    docClientSend.mockResolvedValue({ Count: 0 });
    sesClientSend.mockResolvedValue({});

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('returns 200 for any valid signup request (valid name, valid email, consent=true, empty honeypot)', async () => {
    await fc.assert(
      fc.asyncProperty(validName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.signupId).toBeDefined();
        expect(body.signupId).not.toMatch(/^bot-/);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 400 for empty name', async () => {
    await fc.assert(
      fc.asyncProperty(emptyName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(400);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 400 for name exceeding 200 characters', async () => {
    await fc.assert(
      fc.asyncProperty(tooLongName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/name/i);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 400 for invalid email', async () => {
    await fc.assert(
      fc.asyncProperty(validName, invalidEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/email/i);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 400 when consentGiven is false', async () => {
    await fc.assert(
      fc.asyncProperty(validName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: false, honeypot: '' },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/consent/i);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 400 when consentGiven is missing', async () => {
    await fc.assert(
      fc.asyncProperty(validName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, honeypot: '' },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(400);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 4: Honeypot silent rejection
// **Validates: Requirements 5.2**
describe('Property 4: Honeypot silent rejection', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    docClientSend.mockResolvedValue({ Count: 0 });
    sesClientSend.mockResolvedValue({});

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('returns 200 with bot- prefixed signupId for any non-empty honeypot, and never calls DynamoDB PutCommand', async () => {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

    await fc.assert(
      fc.asyncProperty(validName, validEmail, nonEmptyHoneypot, async (name, email, honeypot) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        PutCommand.mockClear();

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot },
        });
        const response = await handler(event);

        // SHALL return HTTP 200
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);

        // SHALL contain a fake signupId starting with "bot-"
        expect(body.signupId).toMatch(/^bot-/);

        // SHALL contain a UUID after "bot-" prefix
        const uuidPart = body.signupId.slice(4);
        expect(uuidPart).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );

        // SHALL NOT store any record — PutCommand never instantiated
        expect(PutCommand).not.toHaveBeenCalled();

        // docClient.send should NOT have been called (no DB operations at all)
        expect(docClientSend).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('honeypot rejection happens before any validation — even with invalid fields', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyHoneypot, async (honeypot) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        // Send completely invalid data but with a non-empty honeypot
        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name: '', email: 'invalid', consentGiven: false, honeypot },
        });
        const response = await handler(event);

        // Still returns 200 (silent rejection) — not 400
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.signupId).toMatch(/^bot-/);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 5: Signup record round-trip
// **Validates: Requirements 5.3, 5.7, 18.2**
describe('Property 5: Signup record round-trip', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    // QueryCommand returns Count: 0 (no rate limit, no duplicate)
    docClientSend.mockResolvedValue({ Count: 0 });
    // SES succeeds
    sesClientSend.mockResolvedValue({});

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('stores a correct DynamoDB record and returns the same signupId for any valid signup', async () => {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

    await fc.assert(
      fc.asyncProperty(validName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        PutCommand.mockClear();

        // QueryCommand returns Count: 0 (no rate limit, no duplicate)
        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const beforeTimestamp = new Date().toISOString();

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        const afterTimestamp = new Date().toISOString();

        // Response SHALL be 200 with a signupId
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.signupId).toBeDefined();

        // PutCommand SHALL have been called exactly once
        expect(PutCommand).toHaveBeenCalledTimes(1);

        // Capture the stored record from PutCommand constructor args
        const putArgs = PutCommand.mock.calls[0][0];
        const item = putArgs.Item;

        // signupId SHALL be a UUID and match the response
        expect(item.signupId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(item.signupId).toBe(body.signupId);

        // name SHALL be the sanitized name (sanitize-html is mocked as identity)
        expect(item.name).toBe(name.trim());

        // email SHALL be lowercase
        expect(item.email).toBe(email.trim().toLowerCase());

        // app SHALL be "pulse"
        expect(item.app).toBe('pulse');

        // consentGiven SHALL be true
        expect(item.consentGiven).toBe(true);

        // signupTimestamp SHALL be ISO 8601 and within the test window
        expect(item.signupTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(item.signupTimestamp >= beforeTimestamp).toBe(true);
        expect(item.signupTimestamp <= afterTimestamp).toBe(true);

        // status SHALL be "active"
        expect(item.status).toBe('active');

        // ipHash SHALL be an MD5 hex string (32 hex chars), never the raw IP
        expect(item.ipHash).toMatch(/^[0-9a-f]{32}$/);
        expect(item.ipHash).not.toBe('127.0.0.1');

        // ttl SHALL be approximately 90 days in the future (within 60s tolerance)
        const nowEpoch = Math.floor(Date.now() / 1000);
        const ninetyDaysSeconds = 90 * 24 * 60 * 60;
        const expectedTtl = nowEpoch + ninetyDaysSeconds;
        expect(item.ttl).toBeGreaterThanOrEqual(expectedTtl - 60);
        expect(item.ttl).toBeLessThanOrEqual(expectedTtl + 60);

        // TableName SHALL be the configured table
        expect(putArgs.TableName).toBe('test-beta-table');
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 6: Admin notification contains no PII
// **Validates: Requirements 5.4, 8.8**
describe('Property 6: Admin notification contains no PII', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    // QueryCommand returns Count: 0 (no rate limit, no duplicate)
    docClientSend.mockResolvedValue({ Count: 0 });
    // SES succeeds
    sesClientSend.mockResolvedValue({});

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('SES notification email contains signupId and app but NOT the user name or email', async () => {
    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

    await fc.assert(
      fc.asyncProperty(validName, validEmail, async (name, email) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        SendEmailCommand.mockClear();
        PutCommand.mockClear();

        docClientSend.mockResolvedValue({ Count: 0 });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);
        expect(response.statusCode).toBe(200);

        // SendEmailCommand SHALL have been called exactly once
        expect(SendEmailCommand).toHaveBeenCalledTimes(1);

        // Capture the SES email content
        const sesArgs = SendEmailCommand.mock.calls[0][0];
        const subject = sesArgs.Message.Subject.Data;
        const textBody = sesArgs.Message.Body.Text.Data;
        const htmlBody = sesArgs.Message.Body.Html.Data;

        // Get the signupId from the stored record
        const signupId = PutCommand.mock.calls[0][0].Item.signupId;

        // Subject SHALL contain app name
        expect(subject).toContain('pulse');

        // Text body SHALL contain signupId
        expect(textBody).toContain(signupId);

        // Text body SHALL contain app name
        expect(textBody).toContain('pulse');

        // HTML body SHALL contain signupId
        expect(htmlBody).toContain(signupId);

        // Subject SHALL NOT contain the user's name or email
        const trimmedName = name.trim();
        const lowerEmail = email.trim().toLowerCase();

        // Only check for name if it's long enough to be meaningful (avoid false positives
        // from single-char names appearing in HTML tags or common words)
        if (trimmedName.length >= 3) {
          expect(subject).not.toContain(trimmedName);
          expect(textBody).not.toContain(trimmedName);
          expect(htmlBody).not.toContain(trimmedName);
        }

        // Email SHALL NOT appear in subject, text body, or HTML body
        expect(subject).not.toContain(lowerEmail);
        expect(textBody).not.toContain(lowerEmail);
        expect(htmlBody).not.toContain(lowerEmail);

        // Also check the original email casing
        const originalEmail = email.trim();
        if (originalEmail !== lowerEmail) {
          expect(subject).not.toContain(originalEmail);
          expect(textBody).not.toContain(originalEmail);
          expect(htmlBody).not.toContain(originalEmail);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 7: Rate limiting enforcement
// **Validates: Requirements 5.5**
describe('Property 7: Rate limiting enforcement', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('returns 429 when rate limit count >= 3 for any valid signup request', async () => {
    // Generate counts from 3-10 (at or above the threshold)
    const rateLimitedCount = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(validName, validEmail, rateLimitedCount, async (name, email, count) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        // First call: rate limit query → returns count >= 3 (rate limited)
        // Handler should stop here and return 429 without making further calls
        let callIndex = 0;
        docClientSend.mockImplementation(() => {
          callIndex++;
          if (callIndex === 1) {
            // Rate limit check — return high count
            return Promise.resolve({ Count: count });
          }
          // Should not reach here when rate limited
          return Promise.resolve({ Count: 0 });
        });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        // SHALL return HTTP 429
        expect(response.statusCode).toBe(429);

        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/too many/i);

        // docClient.send should have been called exactly once (rate limit check only)
        expect(docClientSend).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });

  it('proceeds normally when rate limit count < 3 for any valid signup request', async () => {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

    // Generate counts from 0-2 (below the threshold)
    const belowLimitCount = fc.integer({ min: 0, max: 2 });

    await fc.assert(
      fc.asyncProperty(validName, validEmail, belowLimitCount, async (name, email, count) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        PutCommand.mockClear();

        // First call: rate limit query → returns count < 3 (allowed)
        // Second call: duplicate email check → returns 0 (no duplicate)
        // Third call: PutCommand → succeeds
        let callIndex = 0;
        docClientSend.mockImplementation(() => {
          callIndex++;
          if (callIndex === 1) {
            // Rate limit check — below threshold
            return Promise.resolve({ Count: count });
          }
          if (callIndex === 2) {
            // Duplicate email check — no duplicate
            return Promise.resolve({ Count: 0 });
          }
          // PutCommand — succeeds
          return Promise.resolve({});
        });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        // SHALL proceed normally and return 200
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.signupId).toBeDefined();
        expect(body.signupId).not.toMatch(/^bot-/);

        // PutCommand SHALL have been called (record was stored)
        expect(PutCommand).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 8: Duplicate email detection
// **Validates: Requirements 5.6**
describe('Property 8: Duplicate email detection', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('returns 409 and does not store a record when email already exists', async () => {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

    // Generate duplicate counts from 1-5 (at least one existing record)
    const duplicateCount = fc.integer({ min: 1, max: 5 });

    await fc.assert(
      fc.asyncProperty(validName, validEmail, duplicateCount, async (name, email, existingCount) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();
        PutCommand.mockClear();

        // First call: rate limit query → returns 0 (not rate limited)
        // Second call: duplicate email check → returns existingCount > 0 (duplicate found)
        let callIndex = 0;
        docClientSend.mockImplementation(() => {
          callIndex++;
          if (callIndex === 1) {
            // Rate limit check — passes
            return Promise.resolve({ Count: 0 });
          }
          if (callIndex === 2) {
            // Duplicate email check — existing record found
            return Promise.resolve({ Count: existingCount });
          }
          // Should not reach here when duplicate detected
          return Promise.resolve({});
        });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/signup', {
          body: { name, email, consentGiven: true, honeypot: '' },
        });
        const response = await handler(event);

        // SHALL return HTTP 409
        expect(response.statusCode).toBe(409);

        const body = JSON.parse(response.body);
        expect(body.error).toBe('This email is already signed up.');

        // PutCommand SHALL NOT have been called (no new record created)
        expect(PutCommand).not.toHaveBeenCalled();

        // docClient.send should have been called exactly twice (rate limit + duplicate check)
        expect(docClientSend).toHaveBeenCalledTimes(2);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 9: Email lookup round-trip
// **Validates: Requirements 7.3, 7.4**
describe('Property 9: Email lookup round-trip', () => {
  let handler;
  let docClientSend;

  /** Generator for a UUID-format signupId */
  const validSignupId = fc
    .uuid()
    .map(id => id.toLowerCase());

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('returns 200 with matching signupId and name when a record exists for the email', async () => {
    await fc.assert(
      fc.asyncProperty(validEmail, validName, validSignupId, async (email, name, signupId) => {
        docClientSend.mockReset();

        // Mock QueryCommand to return a matching record
        docClientSend.mockResolvedValue({
          Items: [{ signupId, name }],
          Count: 1,
        });

        const event = makeEvent('GET', '/v1/beta/lookup', {
          queryStringParameters: { email, app: 'pulse' },
        });
        const response = await handler(event);

        // SHALL return HTTP 200
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);

        // SHALL return the signupId from the matching record
        expect(body.signupId).toBe(signupId);

        // SHALL return the name from the matching record
        expect(body.name).toBe(name);

        // docClient.send should have been called exactly once (QueryCommand on email-app-index GSI)
        expect(docClientSend).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 404 when no record exists for the email', async () => {
    await fc.assert(
      fc.asyncProperty(validEmail, async (email) => {
        docClientSend.mockReset();

        // Mock QueryCommand to return empty results
        docClientSend.mockResolvedValue({
          Items: [],
          Count: 0,
        });

        const event = makeEvent('GET', '/v1/beta/lookup', {
          queryStringParameters: { email, app: 'pulse' },
        });
        const response = await handler(event);

        // SHALL return HTTP 404
        expect(response.statusCode).toBe(404);

        const body = JSON.parse(response.body);
        expect(body.error).toBe('Email not found');

        // docClient.send should have been called exactly once
        expect(docClientSend).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Survey Property-Based Tests ──────────────────────────────────────────────

// ── Survey Generators ────────────────────────────────────────────────────────

/** Valid rating: integer 1-5 */
const validRating = fc.integer({ min: 1, max: 5 });

/** Invalid rating: outside 1-5, non-integer, or null/undefined */
const invalidRating = fc.oneof(
  fc.integer({ max: 0 }),
  fc.integer({ min: 6 }),
  fc.double().filter(n => !Number.isInteger(n)),
  fc.constant(null),
  fc.constant(undefined)
);

/** Valid pill-select values */
const validDeviceUsed = fc.constantFrom('mobile', 'desktop', 'both');
const validAiAccuracy = fc.constantFrom('no', 'minor', 'yes');
const validSessionPreference = fc.constantFrom('document', 'photo', 'same');
const validWouldUseAgain = fc.constantFrom('definitely', 'maybe', 'probably_not');

/** Invalid sessionPreference */
const invalidSessionPreference = fc.string({ minLength: 1, maxLength: 50 }).filter(
  s => !['document', 'photo', 'same'].includes(s)
);

/** Valid text field: non-empty, 1-1000 chars, trims to non-empty */
const validTextField = fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);

/** Too-long text field: >1000 chars */
const tooLongTextField = fc.integer({ min: 1001, max: 1500 }).map(len => 'A'.repeat(len));

/** Valid signupId (UUID format) */
const validSurveySignupId = fc.uuid().map(id => id.toLowerCase());

/** Build a complete valid survey responses object */
const validSurveyResponses = fc.record({
  deviceUsed: validDeviceUsed,
  aiConversationQuality: validRating,
  aiAccuracy: validAiAccuracy,
  sessionPreference: validSessionPreference,
  biggestFriction: validTextField,
  wouldUseAgain: validWouldUseAgain,
});

/** Optional anythingElse field */
const optionalAnythingElse = fc.option(validTextField, { nil: undefined });

// Feature: beta-signup, Property 11: Survey request validation
// **Validates: Requirements 8.5, 8.7, 11.4, 11.5**
describe('Property 11: Survey request validation', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  // Test case 1: Valid survey with all required fields → 200
  it('returns 200 for a valid survey with all required fields against an existing signup', async () => {
    await fc.assert(
      fc.asyncProperty(validSurveySignupId, validSurveyResponses, async (signupId, responses) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        // Call 1: GetCommand → found record without surveyResponses
        // Call 2: UpdateCommand → success
        let callIndex = 0;
        docClientSend.mockImplementation(() => {
          callIndex++;
          if (callIndex === 1) {
            return Promise.resolve({
              Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
            });
          }
          return Promise.resolve({});
        });
        sesClientSend.mockResolvedValue({});

        const event = makeEvent('POST', '/v1/beta/survey', {
          body: { signupId, responses },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toBe('Survey submitted');
      }),
      { numRuns: 100 }
    );
  });

  // Test case 2: Missing signupId → 400
  it('returns 400 when signupId is missing', async () => {
    await fc.assert(
      fc.asyncProperty(validSurveyResponses, async (responses) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        const event = makeEvent('POST', '/v1/beta/survey', {
          body: { responses },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/signupId/i);

        // No DynamoDB calls should have been made
        expect(docClientSend).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  // Test case 3: SignupId not found in table → 404
  it('returns 404 when signupId is not found in the table', async () => {
    await fc.assert(
      fc.asyncProperty(validSurveySignupId, validSurveyResponses, async (signupId, responses) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        // GetCommand → record not found
        docClientSend.mockResolvedValue({ Item: undefined });

        const event = makeEvent('POST', '/v1/beta/survey', {
          body: { signupId, responses },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/not found/i);

        // Only one DynamoDB call (GetCommand)
        expect(docClientSend).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });

  // Test case 4: Survey already submitted (record has surveyResponses) → 409
  it('returns 409 when the record already has surveyResponses', async () => {
    await fc.assert(
      fc.asyncProperty(validSurveySignupId, validSurveyResponses, async (signupId, responses) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        // GetCommand → record found WITH surveyResponses already present
        docClientSend.mockResolvedValue({
          Item: {
            signupId,
            name: 'Test',
            email: 'test@example.com',
            app: 'pulse',
            surveyResponses: { overallExperience: 3 },
          },
        });

        const event = makeEvent('POST', '/v1/beta/survey', {
          body: { signupId, responses },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.body);
        expect(body.error).toMatch(/already submitted/i);

        // Only one DynamoDB call (GetCommand)
        expect(docClientSend).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });

  // Test case 5: Invalid rating (not integer 1-5) → 400
  it('returns 400 when a rating field has an invalid value', async () => {
    // Only one rating field now: aiConversationQuality
    const ratingFieldArb = fc.constantFrom('aiConversationQuality');

    await fc.assert(
      fc.asyncProperty(
        validSurveySignupId,
        validSurveyResponses,
        ratingFieldArb,
        invalidRating,
        async (signupId, baseResponses, field, badValue) => {
          docClientSend.mockReset();
          sesClientSend.mockReset();

          // GetCommand → found record without surveyResponses
          docClientSend.mockResolvedValue({
            Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
          });

          const responses = { ...baseResponses, [field]: badValue };

          const event = makeEvent('POST', '/v1/beta/survey', {
            body: { signupId, responses },
          });
          const response = await handler(event);

          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test case 6: Invalid sessionPreference → 400
  it('returns 400 when sessionPreference is not a valid option', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSurveySignupId,
        validSurveyResponses,
        invalidSessionPreference,
        async (signupId, baseResponses, badPref) => {
          docClientSend.mockReset();
          sesClientSend.mockReset();

          // GetCommand → found record without surveyResponses
          docClientSend.mockResolvedValue({
            Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
          });

          const responses = { ...baseResponses, sessionPreference: badPref };

          const event = makeEvent('POST', '/v1/beta/survey', {
            body: { signupId, responses },
          });
          const response = await handler(event);

          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test case 7: Empty required text field → 400
  it('returns 400 when a required text field is empty', async () => {
    const textFieldArb = fc.constantFrom('biggestFriction');
    const emptyTextArb = fc.constantFrom('', '   ', '\t\n');

    await fc.assert(
      fc.asyncProperty(
        validSurveySignupId,
        validSurveyResponses,
        textFieldArb,
        emptyTextArb,
        async (signupId, baseResponses, field, emptyVal) => {
          docClientSend.mockReset();
          sesClientSend.mockReset();

          // GetCommand → found record without surveyResponses
          docClientSend.mockResolvedValue({
            Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
          });

          const responses = { ...baseResponses, [field]: emptyVal };

          const event = makeEvent('POST', '/v1/beta/survey', {
            body: { signupId, responses },
          });
          const response = await handler(event);

          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test case 8: Text field exceeding 1000 chars → 400
  it('returns 400 when a text field exceeds 1000 characters', async () => {
    const textFieldArb = fc.constantFrom('biggestFriction');

    await fc.assert(
      fc.asyncProperty(
        validSurveySignupId,
        validSurveyResponses,
        textFieldArb,
        tooLongTextField,
        async (signupId, baseResponses, field, longText) => {
          docClientSend.mockReset();
          sesClientSend.mockReset();

          // GetCommand → found record without surveyResponses
          docClientSend.mockResolvedValue({
            Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
          });

          const responses = { ...baseResponses, [field]: longText };

          const event = makeEvent('POST', '/v1/beta/survey', {
            body: { signupId, responses },
          });
          const response = await handler(event);

          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test case 9: Valid survey with optional anythingElse → 200
  it('returns 200 for a valid survey that includes the optional anythingElse field', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSurveySignupId,
        validSurveyResponses,
        validTextField,
        async (signupId, baseResponses, anythingElse) => {
          docClientSend.mockReset();
          sesClientSend.mockReset();

          let callIndex = 0;
          docClientSend.mockImplementation(() => {
            callIndex++;
            if (callIndex === 1) {
              return Promise.resolve({
                Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
              });
            }
            return Promise.resolve({});
          });
          sesClientSend.mockResolvedValue({});

          const responses = { ...baseResponses, anythingElse };

          const event = makeEvent('POST', '/v1/beta/survey', {
            body: { signupId, responses },
          });
          const response = await handler(event);

          expect(response.statusCode).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test case 10: Valid survey without anythingElse → 200
  it('returns 200 for a valid survey without the optional anythingElse field', async () => {
    await fc.assert(
      fc.asyncProperty(validSurveySignupId, validSurveyResponses, async (signupId, responses) => {
        docClientSend.mockReset();
        sesClientSend.mockReset();

        let callIndex = 0;
        docClientSend.mockImplementation(() => {
          callIndex++;
          if (callIndex === 1) {
            return Promise.resolve({
              Item: { signupId, name: 'Test', email: 'test@example.com', app: 'pulse' },
            });
          }
          return Promise.resolve({});
        });
        sesClientSend.mockResolvedValue({});

        // Explicitly ensure no anythingElse field
        const cleanResponses = { ...responses };
        delete cleanResponses.anythingElse;

        const event = makeEvent('POST', '/v1/beta/survey', {
          body: { signupId, responses: cleanResponses },
        });
        const response = await handler(event);

        expect(response.statusCode).toBe(200);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: beta-signup, Property 12: Survey record update round-trip
// **Validates: Requirements 8.6**
describe('Property 12: Survey record update round-trip', () => {
  let handler;
  let docClientSend;
  let sesClientSend;

  beforeEach(async () => {
    vi.stubEnv('TABLE_NAME', 'test-beta-table');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', 'https://urgdstudios.com');
    vi.stubEnv('ADMIN_EMAIL', 'admin@urgdstudios.com');
    vi.stubEnv('ENVIRONMENT', 'test');

    docClientSend = await getDocClientSend();
    sesClientSend = await getSesClientSend();

    const mod = await import('../index.mjs');
    handler = mod.handler;
  });

  it('UpdateCommand contains all survey responses and an ISO 8601 surveyTimestamp', async () => {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');

    await fc.assert(
      fc.asyncProperty(
        validSurveySignupId,
        validSurveyResponses,
        optionalAnythingElse,
        async (signupId, baseResponses, anythingElse) => {
          docClientSend.mockReset();
          sesClientSend.mockReset();
          UpdateCommand.mockClear();

          const existingRecord = {
            signupId,
            name: 'Test User',
            email: 'test@example.com',
            app: 'pulse',
            consentGiven: true,
            signupTimestamp: '2026-01-01T00:00:00.000Z',
            status: 'active',
          };

          // Call 1: GetCommand → existing record (no surveyResponses)
          // Call 2: UpdateCommand → success
          let callIndex = 0;
          docClientSend.mockImplementation(() => {
            callIndex++;
            if (callIndex === 1) {
              return Promise.resolve({ Item: existingRecord });
            }
            return Promise.resolve({});
          });
          sesClientSend.mockResolvedValue({});

          const responses = anythingElse !== undefined
            ? { ...baseResponses, anythingElse }
            : { ...baseResponses };

          const beforeTimestamp = new Date().toISOString();

          const event = makeEvent('POST', '/v1/beta/survey', {
            body: { signupId, responses },
          });
          const response = await handler(event);

          const afterTimestamp = new Date().toISOString();

          // SHALL return 200
          expect(response.statusCode).toBe(200);

          // UpdateCommand SHALL have been called exactly once
          expect(UpdateCommand).toHaveBeenCalledTimes(1);

          const updateArgs = UpdateCommand.mock.calls[0][0];

          // Key SHALL reference the correct signupId
          expect(updateArgs.Key).toEqual({ signupId });

          // TableName SHALL be the configured table
          expect(updateArgs.TableName).toBe('test-beta-table');

          // ExpressionAttributeValues SHALL contain the survey responses
          const storedResponses = updateArgs.ExpressionAttributeValues[':responses'];

          // All rating fields SHALL match the submitted values
          expect(storedResponses.aiConversationQuality).toBe(baseResponses.aiConversationQuality);

          // Pill-select fields SHALL match
          expect(storedResponses.deviceUsed).toBe(baseResponses.deviceUsed);
          expect(storedResponses.aiAccuracy).toBe(baseResponses.aiAccuracy);
          expect(storedResponses.sessionPreference).toBe(baseResponses.sessionPreference);
          expect(storedResponses.wouldUseAgain).toBe(baseResponses.wouldUseAgain);

          // Text fields SHALL be the trimmed versions (sanitize-html is mocked as identity)
          expect(storedResponses.biggestFriction).toBe(baseResponses.biggestFriction.trim());

          // anythingElse: if provided, SHALL be present and trimmed; if not, SHALL be absent
          if (anythingElse !== undefined) {
            expect(storedResponses.anythingElse).toBe(anythingElse.trim());
          } else {
            expect(storedResponses).not.toHaveProperty('anythingElse');
          }

          // surveyTimestamp SHALL be ISO 8601 and within the test window
          const storedTimestamp = updateArgs.ExpressionAttributeValues[':timestamp'];
          expect(storedTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
          expect(storedTimestamp >= beforeTimestamp).toBe(true);
          expect(storedTimestamp <= afterTimestamp).toBe(true);

          // ConditionExpression SHALL prevent overwriting existing survey
          expect(updateArgs.ConditionExpression).toContain('attribute_not_exists(surveyResponses)');

          // The original signup fields SHALL NOT be modified (UpdateCommand only sets survey fields)
          expect(updateArgs.UpdateExpression).toContain('surveyResponses');
          expect(updateArgs.UpdateExpression).toContain('surveyTimestamp');
          expect(updateArgs.UpdateExpression).not.toContain('name');
          expect(updateArgs.UpdateExpression).not.toContain('email');
          expect(updateArgs.UpdateExpression).not.toContain('signupId');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * urgdstudios.com — Proof-of-Work Utilities
 *
 * Challenge generation and Web Worker orchestration for human verification.
 */

export const POW_DIFFICULTY = 4; // 4 leading zeros (~1–3s on modern hardware)

/**
 * Generate time-bound proof-of-work challenge.
 *
 * Format: urgd-{ISO timestamp}-{random}
 * Example: urgd-2026-02-17T12:34:56.789Z-a1b2c3d4
 */
export function generateChallenge(): string {
  const timestamp = new Date().toISOString();
  const random = crypto.randomUUID().slice(0, 8);
  return `urgd-${timestamp}-${random}`;
}

/**
 * Request proof-of-work computation from Web Worker.
 *
 * @param challenge - Challenge string
 * @param difficulty - Number of leading zeros required
 * @returns Promise resolving to { nonce, solution } or rejecting on error/timeout
 */
export function requestProofOfWork(
  challenge: string,
  difficulty: number
): Promise<{ nonce: number; solution: string }> {
  return new Promise((resolve, reject) => {
    // Check Web Worker support
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Workers not supported'));
      return;
    }

    let worker: Worker;

    try {
      worker = new Worker('/pow-worker.js');
    } catch (err) {
      reject(new Error('Failed to load proof-of-work worker'));
      return;
    }

    // 30-second timeout
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Proof-of-work computation timed out'));
    }, 30000);

    worker.onmessage = (event) => {
      const { type, nonce, solution, message } = event.data;

      if (type === 'result') {
        clearTimeout(timeout);
        worker.terminate();
        resolve({ nonce, solution });
      } else if (type === 'error') {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(message || 'Proof-of-work failed'));
      }
      // Ignore 'progress' messages (for future logging/UI if needed)
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error('Worker error: ' + err.message));
    };

    // Start computation
    worker.postMessage({ challenge, difficulty });
  });
}

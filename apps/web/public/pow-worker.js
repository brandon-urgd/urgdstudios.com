/**
 * urgdstudios.com — Proof-of-Work Web Worker
 *
 * Computes SHA-256 of challenge + nonce until leading zeros match difficulty.
 * Vanilla JS — not bundled by Vite (lives in public/).
 *
 * Message protocol:
 * - IN:  { challenge: string, difficulty: number }
 * - OUT: { type: 'progress', nonce: number } — every 1000 iterations
 * - OUT: { type: 'result', nonce: number, solution: string } — on success
 * - OUT: { type: 'error', message: string } — on error
 */

self.addEventListener('message', async (event) => {
  const { challenge, difficulty } = event.data;

  if (!challenge || typeof difficulty !== 'number') {
    self.postMessage({
      type: 'error',
      message: 'Invalid challenge or difficulty',
    });
    return;
  }

  try {
    let nonce = 0;
    const encoder = new TextEncoder();

    while (true) {
      // Compute SHA-256 of challenge + nonce
      const input = `${challenge}${nonce}`;
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Check if hash has required leading zeros
      const leadingZeros = hashHex.match(/^0*/)[0].length;

      if (leadingZeros >= difficulty) {
        // Success — found valid nonce
        self.postMessage({
          type: 'result',
          nonce,
          solution: hashHex,
        });
        return;
      }

      // Progress update every 1000 iterations
      if (nonce % 1000 === 0) {
        self.postMessage({
          type: 'progress',
          nonce,
        });
      }

      nonce++;
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err.message || 'Unknown error',
    });
  }
});

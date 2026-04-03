/**
 * Pattern Matcher
 *
 * Generates random strings that match XSD pattern constraints
 * using the randexp library.
 */

import RandExp from 'randexp';
import { SeededRandom } from './SeededRandom';

export class PatternMatcher {
  private patternCache = new Map<string, RandExp>();

  /**
   * Generate a random string matching the given regex pattern.
   *
   * @param pattern - Regular expression pattern string
   * @param options - Optional parameters (rng for seeding, timeoutMs for timeout)
   * @returns Random matching string, or null if pattern is too complex/invalid
   */
  generate(
    pattern: string,
    options?: { rng?: SeededRandom; timeoutMs?: number }
  ): string | null {
    const rng = options?.rng;
    const timeoutMs = options?.timeoutMs ?? 100;

    try {
      const re = this.getCachedPattern(pattern);

      // Set reasonable max to prevent infinite loops
      const originalMax = re.max;
      re.max = Math.min(originalMax, 100);

      // Use seeded random if provided
      const originalRandInt = (re as any).randInt;
      if (rng) {
        (re as any).randInt = (min: number, max: number) => rng.nextIntRange(min, max);
      }

      // Measure execution time
      const startTime = Date.now();
      const result = re.gen();
      const elapsed = Date.now() - startTime;

      // Reset max and randInt
      re.max = originalMax;
      (re as any).randInt = originalRandInt;

      // Check if generation timed out
      if (elapsed > timeoutMs) {
        return null;
      }

      // Check if result is empty (can happen with unicode patterns)
      if (!result || result.length === 0) {
        return null;
      }

      return result;
    } catch {
      // Pattern too complex, invalid, or timed out
      return null;
    }
  }

  /**
   * Get or create a cached RandExp instance for the pattern.
   */
  private getCachedPattern(pattern: string): RandExp {
    if (!this.patternCache.has(pattern)) {
      const re = new RandExp(pattern);
      this.patternCache.set(pattern, re);
    }
    return this.patternCache.get(pattern)!;
  }

  /**
   * Clear the pattern cache (useful for testing or memory management).
   */
  clearCache(): void {
    this.patternCache.clear();
  }
}

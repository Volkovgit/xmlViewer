/**
 * Pattern Matcher
 *
 * Generates random strings that match XSD pattern constraints
 * using the randexp library.
 */

import RandExp from 'randexp';

export class PatternMatcher {
  private patternCache = new Map<string, RandExp>();

  /**
   * Generate a random string matching the given regex pattern.
   *
   * @param pattern - Regular expression pattern string
   * @param timeoutMs - Timeout in milliseconds (default: 100)
   * @returns Random matching string, or null if pattern is too complex/invalid
   */
  generate(pattern: string, timeoutMs: number = 100): string | null {
    try {
      const re = this.getCachedPattern(pattern);

      // Set reasonable max to prevent infinite loops
      const originalMax = re.max;
      re.max = Math.min(originalMax, 100);

      // Measure execution time
      const startTime = Date.now();
      const result = re.gen();
      const elapsed = Date.now() - startTime;

      // Reset max
      re.max = originalMax;

      // Check if generation timed out
      if (elapsed > timeoutMs) {
        return null;
      }

      // Check if result is empty (can happen with unicode patterns)
      if (!result || result.length === 0) {
        return null;
      }

      return result;
    } catch (error) {
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

/**
 * Seeded Random Number Generator
 *
 * Provides deterministic random number generation using a seed.
 * Implements a simple Linear Congruential Generator (LCG) for reproducibility.
 *
 * Algorithm: Mulberry32 - a simple, fast, high-quality PRNG
 * Reference: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */

export class SeededRandom {
  private state: number;

  /**
   * Create a new seeded random number generator.
   *
   * @param seed - Initial seed value (will be converted to integer)
   */
  constructor(seed: number) {
    // Convert seed to 32-bit integer and initialize state
    this.state = this.hashSeed(seed);
  }

  /**
   * Generate a random float between 0 (inclusive) and 1 (exclusive).
   *
   * @returns Random float in range [0, 1)
   */
  next(): number {
    // Mulberry32 algorithm
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Generate a random integer between 0 (inclusive) and max (exclusive).
   *
   * @param max - Upper bound (exclusive)
   * @returns Random integer in range [0, max)
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /**
   * Generate a random integer between min (inclusive) and max (exclusive).
   *
   * @param min - Lower bound (inclusive)
   * @param max - Upper bound (exclusive)
   * @returns Random integer in range [min, max)
   */
  nextIntRange(min: number, max: number): number {
    return min + this.nextInt(max - min);
  }

  /**
   * Generate a random float between min (inclusive) and max (exclusive).
   *
   * @param min - Lower bound (inclusive)
   * @param max - Upper bound (exclusive)
   * @returns Random float in range [min, max)
   */
  nextFloatRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Hash a seed value to a 32-bit integer.
   * Uses a simple hash function to distribute seed values.
   */
  private hashSeed(seed: number): number {
    // Convert to 32-bit integer
    let h = seed >>> 0;
    // Apply simple mixing
    h = Math.imul(h ^ h >>> 15, h | 1);
    h ^= h + Math.imul(h ^ h >>> 7, h | 61);
    return h >>> 0;
  }

  /**
   * Reset the generator with a new seed.
   *
   * @param seed - New seed value
   */
  reseed(seed: number): void {
    this.state = this.hashSeed(seed);
  }

  /**
   * Clone the generator (useful for creating independent sequences).
   *
   * @returns A new SeededRandom instance with the same state
   */
  clone(): SeededRandom {
    const cloned = new SeededRandom(this.state);
    cloned.state = this.state;
    return cloned;
  }
}

/**
 * Create a deterministic random number generator from a seed.
 *
 * @param seed - Seed value
 * @returns SeededRandom instance
 */
export function createSeededRandom(seed: number): SeededRandom {
  return new SeededRandom(seed);
}

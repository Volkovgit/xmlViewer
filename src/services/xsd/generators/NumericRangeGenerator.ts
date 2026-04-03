/**
 * Numeric Range Generator
 *
 * Generates random numeric values within XSD constraint ranges.
 * Supports integer and decimal types with inclusive/exclusive bounds.
 */

import type { XSDRestriction } from '../XSDParser';
import { SeededRandom } from './SeededRandom';

export class NumericRangeGenerator {
  private readonly DEFAULT_MIN_INT = 0;
  private readonly DEFAULT_MAX_INT = 100;
  private readonly DEFAULT_MIN_DEC = 0.0;
  private readonly DEFAULT_MAX_DEC = 100.0;

  /**
   * Generate a random integer within the restriction bounds.
   *
   * @param restriction - XSD restriction with min/max constraints
   * @param rng - Optional seeded random number generator
   * @returns Random integer, or null if constraints are conflicting
   */
  generateInteger(restriction: XSDRestriction, rng?: SeededRandom): number | null {
    const min = this.getMinValue(restriction, this.DEFAULT_MIN_INT);
    const max = this.getMaxValue(restriction, this.DEFAULT_MAX_INT);
    const minInclusive = this.isMinInclusive(restriction);
    const maxInclusive = this.isMaxInclusive(restriction);
    return this.generateInRange(min, max, minInclusive, maxInclusive, true, rng);
  }

  /**
   * Generate a random decimal within the restriction bounds.
   *
   * @param restriction - XSD restriction with min/max constraints
   * @param rng - Optional seeded random number generator
   * @returns Random decimal, or null if constraints are conflicting
   */
  generateDecimal(restriction: XSDRestriction, rng?: SeededRandom): number | null {
    const min = this.getMinValue(restriction, this.DEFAULT_MIN_DEC);
    const max = this.getMaxValue(restriction, this.DEFAULT_MAX_DEC);
    const minInclusive = this.isMinInclusive(restriction);
    const maxInclusive = this.isMaxInclusive(restriction);
    return this.generateInRange(min, max, minInclusive, maxInclusive, false, rng);
  }

  /**
   * Get minimum value from restriction, or default if not specified.
   */
  private getMinValue(restriction: XSDRestriction, defaultValue: number): number {
    return restriction.minInclusive ?? restriction.minExclusive ?? defaultValue;
  }

  /**
   * Get maximum value from restriction, or default if not specified.
   */
  private getMaxValue(restriction: XSDRestriction, defaultValue: number): number {
    return restriction.maxInclusive ?? restriction.maxExclusive ?? defaultValue;
  }

  /**
   * Check if minimum bound is inclusive.
   */
  private isMinInclusive(restriction: XSDRestriction): boolean {
    return restriction.minInclusive !== undefined;
  }

  /**
   * Check if maximum bound is inclusive.
   */
  private isMaxInclusive(restriction: XSDRestriction): boolean {
    return restriction.maxInclusive !== undefined;
  }

  /**
   * Generate a random number within range, respecting inclusivity.
   */
  private generateInRange(
    min: number,
    max: number,
    minInclusive: boolean,
    maxInclusive: boolean,
    isInteger: boolean,
    rng?: SeededRandom
  ): number | null {
    // Adjust for exclusive bounds
    const effectiveMin = minInclusive ? min : min + (isInteger ? 1 : 0.0001);
    const effectiveMax = maxInclusive ? max : max - (isInteger ? 1 : 0.0001);

    // Check for conflicting constraints
    if (effectiveMin > effectiveMax) {
      return null;
    }

    // Generate random value (seeded or random)
    const random = rng ? rng.next() : Math.random();
    const value = effectiveMin + random * (effectiveMax - effectiveMin);

    return isInteger ? Math.floor(value) : value;
  }
}

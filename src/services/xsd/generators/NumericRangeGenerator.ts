/**
 * Numeric Range Generator
 *
 * Generates random numeric values within XSD constraint ranges.
 * Supports integer and decimal types with inclusive/exclusive bounds.
 */

import type { XSDRestriction } from '../XSDParser';

export class NumericRangeGenerator {
  private readonly DEFAULT_MIN_INT = 0;
  private readonly DEFAULT_MAX_INT = 100;
  private readonly DEFAULT_MIN_DEC = 0.0;
  private readonly DEFAULT_MAX_DEC = 100.0;

  /**
   * Generate a random integer within the restriction bounds.
   *
   * @param restriction - XSD restriction with min/max constraints
   * @param seed - Optional seed for deterministic generation
   * @returns Random integer, or null if constraints are conflicting
   */
  generateInteger(restriction: XSDRestriction, seed?: number): number | null {
    const min = this.getMinValue(restriction, this.DEFAULT_MIN_INT);
    const max = this.getMaxValue(restriction, this.DEFAULT_MAX_INT);
    const minInclusive = this.isMinInclusive(restriction);
    const maxInclusive = this.isMaxInclusive(restriction);
    return this.generateInRange(min, max, minInclusive, maxInclusive, true, seed);
  }

  /**
   * Generate a random decimal within the restriction bounds.
   *
   * @param restriction - XSD restriction with min/max constraints
   * @param seed - Optional seed for deterministic generation
   * @returns Random decimal, or null if constraints are conflicting
   */
  generateDecimal(restriction: XSDRestriction, seed?: number): number | null {
    const min = this.getMinValue(restriction, this.DEFAULT_MIN_DEC);
    const max = this.getMaxValue(restriction, this.DEFAULT_MAX_DEC);
    const minInclusive = this.isMinInclusive(restriction);
    const maxInclusive = this.isMaxInclusive(restriction);
    return this.generateInRange(min, max, minInclusive, maxInclusive, false, seed);
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
    seed?: number
  ): number | null {
    // Adjust for exclusive bounds
    const effectiveMin = minInclusive ? min : min + (isInteger ? 1 : 0.0001);
    const effectiveMax = maxInclusive ? max : max - (isInteger ? 1 : 0.0001);

    // Check for conflicting constraints
    if (effectiveMin > effectiveMax) {
      return null;
    }

    // Generate random value (seeded or random)
    const random = seed !== undefined ? this.seededRandom(seed) : Math.random();
    const value = effectiveMin + random * (effectiveMax - effectiveMin);

    return isInteger ? Math.floor(value) : value;
  }

  /**
   * Generate a seeded random number between 0 and 1.
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}

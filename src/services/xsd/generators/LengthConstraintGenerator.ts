/**
 * Length Constraint Generator
 *
 * Adjusts string values to meet XSD length constraints
 * (minLength, maxLength, exact length).
 */

import type { XSDRestriction } from '../XSDParser';

export class LengthConstraintGenerator {
  /**
   * Apply length constraints to a string value.
   *
   * @param value - Original string value
   * @param restriction - XSD restriction with length constraints
   * @returns String adjusted to meet length constraints
   */
  applyLength(value: string, restriction: XSDRestriction): string {
    // Exact length case (minLength === maxLength)
    if (
      restriction.minLength !== undefined &&
      restriction.maxLength !== undefined &&
      restriction.minLength === restriction.maxLength
    ) {
      return this.setToExactLength(value, restriction.minLength);
    }

    // Pad if too short
    if (restriction.minLength !== undefined) {
      value = this.padToMinLength(value, restriction.minLength);
    }

    // Truncate if too long
    if (restriction.maxLength !== undefined) {
      value = this.truncateToMaxLength(value, restriction.maxLength);
    }

    return value;
  }

  /**
   * Set string to exact length by padding or truncating.
   */
  private setToExactLength(value: string, targetLength: number): string {
    const currentLength = this.getGraphemeCount(value);

    if (currentLength < targetLength) {
      return this.padString(value, targetLength);
    }

    if (currentLength > targetLength) {
      return this.truncateString(value, targetLength);
    }

    return value;
  }

  /**
   * Pad string to minimum length.
   */
  private padToMinLength(value: string, minLength: number): string {
    const currentLength = this.getGraphemeCount(value);

    if (currentLength >= minLength) {
      return value;
    }

    return this.padString(value, minLength);
  }

  /**
   * Truncate string to maximum length.
   */
  private truncateToMaxLength(value: string, maxLength: number): string {
    const currentLength = this.getGraphemeCount(value);

    if (currentLength <= maxLength) {
      return value;
    }

    return this.truncateString(value, maxLength);
  }

  /**
   * Pad string by repeating its content.
   */
  private padString(value: string, targetLength: number): string {
    if (value.length === 0) {
      value = 'x';
    }

    let result = value;
    while (this.getGraphemeCount(result) < targetLength) {
      const remaining = targetLength - this.getGraphemeCount(result);
      const toAdd = value.substring(0, Math.min(remaining, value.length));
      result += toAdd;
    }

    return this.truncateString(result, targetLength);
  }

  /**
   * Truncate string to target length (unicode-aware).
   */
  private truncateString(value: string, targetLength: number): string {
    const graphemes = [...value];
    return graphemes.slice(0, targetLength).join('');
  }

  /**
   * Get grapheme count (unicode-aware length).
   */
  private getGraphemeCount(value: string): number {
    return [...value].length;
  }
}

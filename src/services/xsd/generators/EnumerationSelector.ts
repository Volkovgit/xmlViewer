/**
 * Enumeration Selector
 *
 * Randomly selects values from XSD enumeration constraints.
 * Supports both random and seeded (deterministic) selection.
 */

export class EnumerationSelector {
  /**
   * Select a random value from the enumeration array.
   *
   * @param enumerations - Array of enumeration values
   * @param seed - Optional seed for deterministic selection
   * @returns Selected enumeration value, or empty string if array is empty
   */
  select(enumerations: string[], seed?: number): string {
    if (enumerations.length === 0) {
      return '';
    }

    if (enumerations.length === 1) {
      return enumerations[0];
    }

    const index = this.seededRandom(enumerations.length, seed);
    return enumerations[index];
  }

  /**
   * Generate a random index with optional seed.
   */
  private seededRandom(max: number, seed?: number): number {
    if (seed !== undefined) {
      // Simple seeded random for reproducibility
      const x = Math.sin(seed) * 10000;
      const random = x - Math.floor(x);
      return Math.floor(random * max);
    }
    return Math.floor(Math.random() * max);
  }
}
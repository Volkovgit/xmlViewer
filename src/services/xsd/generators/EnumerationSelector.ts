/**
 * Enumeration Selector
 *
 * Randomly selects values from XSD enumeration constraints.
 * Supports both random and seeded (deterministic) selection.
 */

import { SeededRandom } from './SeededRandom';

export class EnumerationSelector {
  /**
   * Select a random value from the enumeration array.
   *
   * @param enumerations - Array of enumeration values
   * @param rng - Optional seeded random number generator
   * @returns Selected enumeration value, or empty string if array is empty
   */
  select(enumerations: string[], rng?: SeededRandom): string {
    if (enumerations.length === 0) {
      return '';
    }

    if (enumerations.length === 1) {
      return enumerations[0];
    }

    const index = rng ? rng.nextInt(enumerations.length) : Math.floor(Math.random() * enumerations.length);
    return enumerations[index];
  }
}
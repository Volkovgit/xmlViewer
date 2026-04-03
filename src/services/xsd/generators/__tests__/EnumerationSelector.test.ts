/**
 * EnumerationSelector Tests
 */

import { describe, it, expect } from 'vitest';
import { EnumerationSelector } from '../EnumerationSelector';
import { SeededRandom } from '../SeededRandom';

describe('EnumerationSelector', () => {
  it('should select random value from enumerations', () => {
    const selector = new EnumerationSelector();
    const enums = ['red', 'green', 'blue'];
    const result = selector.select(enums);
    expect(enums).toContain(result);
  });

  it('should return single value when only one enumeration', () => {
    const selector = new EnumerationSelector();
    const enums = ['only'];
    const result = selector.select(enums);
    expect(result).toBe('only');
  });

  it('should use seed for deterministic selection', () => {
    const selector = new EnumerationSelector();
    const enums = ['a', 'b', 'c', 'd', 'e'];
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);
    const result1 = selector.select(enums, rng1);
    const result2 = selector.select(enums, rng2);
    expect(result1).toBe(result2);
  });

  it('should select different values with different seeds', () => {
    const selector = new EnumerationSelector();
    const enums = ['a', 'b', 'c', 'd', 'e'];
    const rng1 = new SeededRandom(1);
    const rng2 = new SeededRandom(99);
    const result1 = selector.select(enums, rng1);
    const result2 = selector.select(enums, rng2);
    expect(result1).not.toBe(result2);
  });

  it('should handle empty enumeration array', () => {
    const selector = new EnumerationSelector();
    const result = selector.select([]);
    expect(result).toBe('');
  });
});
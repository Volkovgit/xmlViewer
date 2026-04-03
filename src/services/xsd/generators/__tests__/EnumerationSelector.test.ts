/**
 * EnumerationSelector Tests
 */

import { describe, it, expect } from 'vitest';
import { EnumerationSelector } from '../EnumerationSelector';

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
    const result1 = selector.select(enums, 42);
    const result2 = selector.select(enums, 42);
    expect(result1).toBe(result2);
  });

  it('should select different values with different seeds', () => {
    const selector = new EnumerationSelector();
    const enums = ['a', 'b', 'c', 'd', 'e'];
    const result1 = selector.select(enums, 1);
    const result2 = selector.select(enums, 99);
    expect(result1).not.toBe(result2);
  });

  it('should handle empty enumeration array', () => {
    const selector = new EnumerationSelector();
    const result = selector.select([]);
    expect(result).toBe('');
  });
});
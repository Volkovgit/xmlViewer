/**
 * NumericRangeGenerator Tests
 */

import { describe, it, expect } from 'vitest';
import { NumericRangeGenerator } from '../NumericRangeGenerator';
import type { XSDRestriction } from '../../XSDParser';

describe('NumericRangeGenerator', () => {
  it('should generate integer within inclusive range', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minInclusive: 10,
      maxInclusive: 20,
    };
    const result = generator.generateInteger(restriction);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(10);
    expect(result!).toBeLessThanOrEqual(20);
    expect(Number.isInteger(result!)).toBe(true);
  });

  it('should generate integer with exclusive bounds', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minExclusive: 0,
      maxExclusive: 10,
    };
    const result = generator.generateInteger(restriction);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
    expect(result!).toBeLessThan(10);
  });

  it('should generate integer with mixed inclusive/exclusive', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minInclusive: 5,
      maxExclusive: 10,
    };
    const result = generator.generateInteger(restriction);
    expect(result!).toBeGreaterThanOrEqual(5);
    expect(result!).toBeLessThan(10);
  });

  it('should generate decimal within range', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:decimal',
      minInclusive: 0.0,
      maxInclusive: 1.0,
    };
    const result = generator.generateDecimal(restriction);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(0.0);
    expect(result!).toBeLessThanOrEqual(1.0);
  });

  it('should return null for conflicting constraints', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minInclusive: 100,
      maxInclusive: 10,
    };
    const result = generator.generateInteger(restriction);
    expect(result).toBeNull();
  });

  it('should use default range when no constraints', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
    };
    const result = generator.generateInteger(restriction);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(0);
    expect(result!).toBeLessThanOrEqual(100);
  });

  it('should handle single value range (min = max)', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minInclusive: 42,
      maxInclusive: 42,
    };
    const result = generator.generateInteger(restriction);
    expect(result).toBe(42);
  });

  it('should handle negative ranges', () => {
    const generator = new NumericRangeGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minInclusive: -100,
      maxInclusive: -50,
    };
    const result = generator.generateInteger(restriction);
    expect(result!).toBeGreaterThanOrEqual(-100);
    expect(result!).toBeLessThanOrEqual(-50);
  });
});

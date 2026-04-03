/**
 * ConstraintValueGenerator Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ConstraintValueGenerator } from '../ConstraintValueGenerator';
import { PatternMatcher } from '../PatternMatcher';
import { NumericRangeGenerator } from '../NumericRangeGenerator';
import { LengthConstraintGenerator } from '../LengthConstraintGenerator';
import { EnumerationSelector } from '../EnumerationSelector';
import type { XSDRestriction } from '../../XSDParser';

describe('ConstraintValueGenerator', () => {
  it('should use enumeration when available (highest priority)', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const restriction: XSDRestriction = {
      base: 'xs:string',
      enumerations: ['red', 'green', 'blue'],
      pattern: '[a-z]+',
    };

    const result = generator.generateValue('xs:string', restriction, 'color');
    expect(['red', 'green', 'blue']).toContain(result);
  });

  it('should use pattern when no enumeration', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const restriction: XSDRestriction = {
      base: 'xs:string',
      pattern: '\\d{3}',
    };

    const result = generator.generateValue('xs:string', restriction, 'code');
    expect(result).toMatch(/^\d{3}$/);
  });

  it('should apply length constraints to generated values', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const restriction: XSDRestriction = {
      base: 'xs:string',
      minLength: 10,
      maxLength: 10,
    };

    const result = generator.generateValue('xs:string', restriction, 'field');
    expect(result.length).toBe(10);
  });

  it('should generate integers within range', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const restriction: XSDRestriction = {
      base: 'xs:integer',
      minInclusive: 10,
      maxInclusive: 20,
    };

    const result = generator.generateValue('xs:integer', restriction, 'age');
    expect(result).toMatch(/^\d+$/);
    const num = parseInt(result, 10);
    expect(num).toBeGreaterThanOrEqual(10);
    expect(num).toBeLessThanOrEqual(20);
  });

  it('should generate decimals within range', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const restriction: XSDRestriction = {
      base: 'xs:decimal',
      minInclusive: 0.0,
      maxInclusive: 1.0,
    };

    const result = generator.generateValue('xs:decimal', restriction, 'rate');
    const num = parseFloat(result);
    expect(num).toBeGreaterThanOrEqual(0.0);
    expect(num).toBeLessThanOrEqual(1.0);
  });

  it('should fall back to base type sample when pattern fails', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const restriction: XSDRestriction = {
      base: 'xs:string',
      pattern: '[invalid',
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = generator.generateValue('xs:string', restriction, 'field');

    expect(result).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle no restrictions', () => {
    const patternMatcher = new PatternMatcher();
    const numericGenerator = new NumericRangeGenerator();
    const lengthGenerator = new LengthConstraintGenerator();
    const enumSelector = new EnumerationSelector();

    const generator = new ConstraintValueGenerator(
      patternMatcher,
      numericGenerator,
      lengthGenerator,
      enumSelector
    );

    const result = generator.generateValue('xs:string', undefined, 'field');
    expect(result).toBe('sample_field');
  });
});

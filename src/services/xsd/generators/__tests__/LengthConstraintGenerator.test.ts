/**
 * LengthConstraintGenerator Tests
 */

import { describe, it, expect } from 'vitest';
import { LengthConstraintGenerator } from '../LengthConstraintGenerator';
import type { XSDRestriction } from '../../XSDParser';

describe('LengthConstraintGenerator', () => {
  it('should pad string to meet minLength', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
      minLength: 10,
    };
    const result = generator.applyLength('abc', restriction);
    expect(result.length).toBeGreaterThanOrEqual(10);
  });

  it('should truncate string to meet maxLength', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
      maxLength: 5,
    };
    const result = generator.applyLength('This is a very long string', restriction);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('should set exact length when specified', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
      minLength: 8,
      maxLength: 8,
    };
    const result = generator.applyLength('abc', restriction);
    expect(result.length).toBe(8);
  });

  it('should handle unicode characters correctly', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
      minLength: 5,
    };
    const result = generator.applyLength('абв', restriction);
    expect([...result].length).toBeGreaterThanOrEqual(5);
  });

  it('should return original string when no length constraints', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
    };
    const result = generator.applyLength('original', restriction);
    expect(result).toBe('original');
  });

  it('should handle empty string with minLength', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
      minLength: 3,
    };
    const result = generator.applyLength('', restriction);
    expect(result.length).toBe(3);
  });

  it('should pad within range when both min and max specified', () => {
    const generator = new LengthConstraintGenerator();
    const restriction: XSDRestriction = {
      base: 'xs:string',
      minLength: 5,
      maxLength: 10,
    };
    const shortResult = generator.applyLength('ab', restriction);
    const longResult = generator.applyLength('very long string', restriction);
    expect(shortResult.length).toBeGreaterThanOrEqual(5);
    expect(longResult.length).toBeLessThanOrEqual(10);
  });
});

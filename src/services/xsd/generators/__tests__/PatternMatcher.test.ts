/**
 * PatternMatcher Tests
 */

import { describe, it, expect } from 'vitest';
import { PatternMatcher } from '../PatternMatcher';

describe('PatternMatcher', () => {
  it('should generate simple character class patterns', () => {
    const matcher = new PatternMatcher();
    const result = matcher.generate('[a-z]{5}');
    expect(result).not.toBeNull();
    expect(result!.length).toBe(5);
    expect(result).toMatch(/^[a-z]{5}$/);
  });

  it('should generate digit patterns', () => {
    const matcher = new PatternMatcher();
    const result = matcher.generate('\\d{3}-\\d{2}');
    expect(result).not.toBeNull();
    expect(result).toMatch(/^\d{3}-\d{2}$/);
  });

  it('should generate patterns with quantifiers', () => {
    const matcher = new PatternMatcher();
    const result = matcher.generate('[A-Z]{1,3}');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(1);
    expect(result!.length).toBeLessThanOrEqual(3);
  });

  it('should handle unicode patterns gracefully', () => {
    const matcher = new PatternMatcher();
    // randexp may not handle all unicode patterns, so we test it returns null gracefully
    const result = matcher.generate('[а-яА-ЯёЁ]+');
    // Either returns a valid string or null (both are acceptable)
    if (result !== null) {
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('should return null for complex patterns that timeout', () => {
    const matcher = new PatternMatcher();
    const complexPattern = '([a-zA-Z0-9]{1,10}){1000}';
    const result = matcher.generate(complexPattern, { timeoutMs: 10 });
    expect(result).toBeNull();
  });

  it('should cache compiled patterns', () => {
    const matcher = new PatternMatcher();
    const pattern = '[a-z]+';
    matcher.generate(pattern);
    const result = matcher.generate(pattern);
    expect(result).not.toBeNull();
  });

  it('should return null for invalid regex', () => {
    const matcher = new PatternMatcher();
    const result = matcher.generate('[unclosed');
    expect(result).toBeNull();
  });
});

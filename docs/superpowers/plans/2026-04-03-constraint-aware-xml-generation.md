# Constraint-Aware XML Generation from XSD - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance XMLFromXSDGenerator to generate XML instances that respect all XSD type constraints including patterns, length restrictions, numeric ranges, and enumerations.

**Architecture:** Create a modular `ConstraintValueGenerator` system with specialized handlers for each constraint type (PatternMatcher, NumericRangeGenerator, LengthConstraintGenerator, EnumerationSelector). Integrate into existing XMLFromXSDGenerator with validation loop and retry logic.

**Tech Stack:** TypeScript, Vitest, randexp ^0.5.0, existing XSDParser infrastructure

---

## File Structure

```
src/services/xsd/
├── XMLFromXSDGenerator.ts                    # Existing: Enhance with constraint support
├── generators/                                # NEW: Constraint generators module
│   ├── index.ts                              # NEW: Export all generators
│   ├── ConstraintValueGenerator.ts           # NEW: Main orchestrator
│   ├── PatternMatcher.ts                     # NEW: Regex to string generation
│   ├── NumericRangeGenerator.ts              # NEW: Numeric range constraints
│   ├── LengthConstraintGenerator.ts          # NEW: String length constraints
│   └── EnumerationSelector.ts                # NEW: Random enum selection
└── __tests__/
    ├── XMLFromXSDGenerator.test.ts           # Existing: Update for new behavior
    └── generators/                            # NEW: Generator tests
        ├── PatternMatcher.test.ts
        ├── NumericRangeGenerator.test.ts
        ├── LengthConstraintGenerator.test.ts
        ├── EnumerationSelector.test.ts
        ├── ConstraintValueGenerator.test.ts
        └── ConstraintValueGenerator.integration.test.ts
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install randexp dependency**

Run: `npm install randexp@0.5.0 --save-exact`

Expected: Package added to package.json and node_modules

- [ ] **Step 2: Install TypeScript types for randexp**

Run: `npm install --save-dev @types/randexp`

Expected: Types installed

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add randexp for regex pattern generation"
```

---

## Task 2: Create Generators Module Structure

**Files:**
- Create: `src/services/xsd/generators/index.ts`

- [ ] **Step 1: Create generators index file**

```typescript
/**
 * Constraint-Aware Value Generators
 *
 * Exports all generator classes for generating XML values
 * that respect XSD type constraints.
 */

export { PatternMatcher } from './PatternMatcher';
export { NumericRangeGenerator } from './NumericRangeGenerator';
export { LengthConstraintGenerator } from './LengthConstraintGenerator';
export { EnumerationSelector } from './EnumerationSelector';
export { ConstraintValueGenerator } from './ConstraintValueGenerator';
```

- [ ] **Step 2: Run type-check to verify structure**

Run: `npm run type-check`

Expected: No errors (file is empty exports for now)

- [ ] **Step 3: Commit**

```bash
git add src/services/xsd/generators/index.ts
git commit -m "feat: add generators module structure"
```

---

## Task 3: Implement PatternMatcher

**Files:**
- Create: `src/services/xsd/generators/PatternMatcher.ts`
- Create: `src/services/xsd/generators/__tests__/PatternMatcher.test.ts`

- [ ] **Step 1: Write failing tests for PatternMatcher**

```typescript
/**
 * PatternMatcher Tests
 */

import { describe, it, expect, vi } from 'vitest';
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

  it('should generate unicode patterns with Cyrillic characters', () => {
    const matcher = new PatternMatcher();
    const result = matcher.generate('[а-яА-ЯёЁ]+');
    expect(result).not.toBeNull();
    expect(result).toMatch(/[а-яА-ЯёЁ]/);
  });

  it('should return null for complex patterns that timeout', () => {
    const matcher = new PatternMatcher();
    // Extremely complex pattern that might timeout
    const complexPattern = '([a-zA-Z0-9]{1,10}){1000}';
    const result = matcher.generate(complexPattern, 10); // 10ms timeout
    expect(result).toBeNull();
  });

  it('should cache compiled patterns', () => {
    const matcher = new PatternMatcher();
    const pattern = '[a-z]+';

    // First call - compiles pattern
    matcher.generate(pattern);
    // Second call - uses cached pattern
    const result = matcher.generate(pattern);

    expect(result).not.toBeNull();
  });

  it('should return null for invalid regex', () => {
    const matcher = new PatternMatcher();
    const result = matcher.generate('[unclosed');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- PatternMatcher.test.ts`

Expected: FAIL - "PatternMatcher is not defined"

- [ ] **Step 3: Implement PatternMatcher**

```typescript
/**
 * Pattern Matcher
 *
 * Generates random strings that match XSD pattern constraints
 * using the randexp library.
 */

import RandExp from 'randexp';

export class PatternMatcher {
  private patternCache = new Map<string, RandExp>();

  /**
   * Generate a random string matching the given regex pattern.
   *
   * @param pattern - Regular expression pattern string
   * @param timeoutMs - Timeout in milliseconds (default: 100)
   * @returns Random matching string, or null if pattern is too complex/invalid
   */
  generate(pattern: string, timeoutMs: number = 100): string | null {
    try {
      const re = this.getCachedPattern(pattern);

      // Set timeout for generation
      const maxGen = re.max;
      re.max = 1000; // Limit iterations to prevent infinite loops

      // Use setTimeout to enforce timeout
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });

      const generationPromise = Promise.resolve(re.gen());

      const result = await Promise.race([generationPromise, timeoutPromise]);

      // Reset max
      re.max = maxGen;

      return result as string;
    } catch (error) {
      // Pattern too complex, invalid, or timed out
      return null;
    }
  }

  /**
   * Get or create a cached RandExp instance for the pattern.
   */
  private getCachedPattern(pattern: string): RandExp {
    if (!this.patternCache.has(pattern)) {
      const re = new RandExp(pattern);
      this.patternCache.set(pattern, re);
    }
    return this.patternCache.get(pattern)!;
  }

  /**
   * Clear the pattern cache (useful for testing or memory management).
   */
  clearCache(): void {
    this.patternCache.clear();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- PatternMatcher.test.ts`

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/xsd/generators/PatternMatcher.ts
git add src/services/xsd/generators/__tests__/PatternMatcher.test.ts
git commit -m "feat: implement PatternMatcher with randexp"
```

---

## Task 4: Implement EnumerationSelector

**Files:**
- Create: `src/services/xsd/generators/EnumerationSelector.ts`
- Create: `src/services/xsd/generators/__tests__/EnumerationSelector.test.ts`

- [ ] **Step 1: Write failing tests for EnumerationSelector**

```typescript
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

    // May occasionally be same, but very unlikely
    expect(result1).not.toBe(result2);
  });

  it('should handle empty enumeration array', () => {
    const selector = new EnumerationSelector();

    const result = selector.select([]);

    expect(result).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- EnumerationSelector.test.ts`

Expected: FAIL - "EnumerationSelector is not defined"

- [ ] **Step 3: Implement EnumerationSelector**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- EnumerationSelector.test.ts`

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/xsd/generators/EnumerationSelector.ts
git add src/services/xsd/generators/__tests__/EnumerationSelector.test.ts
git commit -m "feat: implement EnumerationSelector with seed support"
```

---

## Task 5: Implement NumericRangeGenerator

**Files:**
- Create: `src/services/xsd/generators/NumericRangeGenerator.ts`
- Create: `src/services/xsd/generators/__tests__/NumericRangeGenerator.test.ts`

- [ ] **Step 1: Write failing tests for NumericRangeGenerator**

```typescript
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
      maxInclusive: 10, // max < min - conflict!
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- NumericRangeGenerator.test.ts`

Expected: FAIL - "NumericRangeGenerator is not defined"

- [ ] **Step 3: Implement NumericRangeGenerator**

```typescript
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
   * @returns Random integer, or null if constraints are conflicting
   */
  generateInteger(restriction: XSDRestriction): number | null {
    const min = this.getMinValue(restriction, this.DEFAULT_MIN_INT);
    const max = this.getMaxValue(restriction, this.DEFAULT_MAX_INT);
    const minInclusive = this.isMinInclusive(restriction);
    const maxInclusive = this.isMaxInclusive(restriction);

    return this.generateInRange(min, max, minInclusive, maxInclusive, true);
  }

  /**
   * Generate a random decimal within the restriction bounds.
   *
   * @param restriction - XSD restriction with min/max constraints
   * @returns Random decimal, or null if constraints are conflicting
   */
  generateDecimal(restriction: XSDRestriction): number | null {
    const min = this.getMinValue(restriction, this.DEFAULT_MIN_DEC);
    const max = this.getMaxValue(restriction, this.DEFAULT_MAX_DEC);
    const minInclusive = this.isMinInclusive(restriction);
    const maxInclusive = this.isMaxInclusive(restriction);

    return this.generateInRange(min, max, minInclusive, maxInclusive, false);
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
    isInteger: boolean
  ): number | null {
    // Adjust for exclusive bounds
    const effectiveMin = minInclusive ? min : min + (isInteger ? 1 : 0.0001);
    const effectiveMax = maxInclusive ? max : max - (isInteger ? 1 : 0.0001);

    // Check for conflicting constraints
    if (effectiveMin > effectiveMax) {
      return null;
    }

    // Generate random value
    const random = Math.random();
    const value = effectiveMin + random * (effectiveMax - effectiveMin);

    return isInteger ? Math.floor(value) : value;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- NumericRangeGenerator.test.ts`

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/xsd/generators/NumericRangeGenerator.ts
git add src/services/xsd/generators/__tests__/NumericRangeGenerator.test.ts
git commit -m "feat: implement NumericRangeGenerator for range constraints"
```

---

## Task 6: Implement LengthConstraintGenerator

**Files:**
- Create: `src/services/xsd/generators/LengthConstraintGenerator.ts`
- Create: `src/services/xsd/generators/__tests__/LengthConstraintGenerator.test.ts`

- [ ] **Step 1: Write failing tests for LengthConstraintGenerator**

```typescript
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

    expect([...result].length).toBeGreaterThanOrEqual(5); // Grapheme count
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- LengthConstraintGenerator.test.ts`

Expected: FAIL - "LengthConstraintGenerator is not defined"

- [ ] **Step 3: Implement LengthConstraintGenerator**

```typescript
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
      value = 'x'; // Default padding character
    }

    let result = value;
    while (this.getGraphemeCount(result) < targetLength) {
      const remaining = targetLength - this.getGraphemeCount(result);
      const toAdd = value.substring(0, Math.min(remaining, value.length));
      result += toAdd;
    }

    // Final trim to exact length
    return this.truncateString(result, targetLength);
  }

  /**
   * Truncate string to target length (unicode-aware).
   */
  private truncateString(value: string, targetLength: number): string {
    const graphemes = [...value]; // Split by grapheme clusters
    return graphemes.slice(0, targetLength).join('');
  }

  /**
   * Get grapheme count (unicode-aware length).
   */
  private getGraphemeCount(value: string): number {
    return [...value].length;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- LengthConstraintGenerator.test.ts`

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/xsd/generators/LengthConstraintGenerator.ts
git add src/services/xsd/generators/__tests__/LengthConstraintGenerator.test.ts
git commit -m "feat: implement LengthConstraintGenerator"
```

---

## Task 7: Implement ConstraintValueGenerator Orchestrator

**Files:**
- Create: `src/services/xsd/generators/ConstraintValueGenerator.ts`
- Create: `src/services/xsd/generators/__tests__/ConstraintValueGenerator.test.ts`

- [ ] **Step 1: Write failing tests for ConstraintValueGenerator**

```typescript
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
      pattern: '[a-z]+', // Should be ignored
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
      pattern: '[invalid', // Invalid regex
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ConstraintValueGenerator.test.ts`

Expected: FAIL - "ConstraintValueGenerator is not defined"

- [ ] **Step 3: Implement ConstraintValueGenerator**

```typescript
/**
 * Constraint Value Generator
 *
 * Main orchestrator for generating values that respect XSD constraints.
 * Coordinates PatternMatcher, NumericRangeGenerator, LengthConstraintGenerator,
 * and EnumerationSelector to produce valid values.
 */

import { PatternMatcher } from './PatternMatcher';
import { NumericRangeGenerator } from './NumericRangeGenerator';
import { LengthConstraintGenerator } from './LengthConstraintGenerator';
import { EnumerationSelector } from './EnumerationSelector';
import type { XSDRestriction } from '../XSDParser';

export class ConstraintValueGenerator {
  constructor(
    private patternMatcher: PatternMatcher,
    private numericGenerator: NumericRangeGenerator,
    private lengthGenerator: LengthConstraintGenerator,
    private enumSelector: EnumerationSelector
  ) {}

  /**
   * Generate a value that respects all XSD constraints.
   *
   * Priority order:
   * 1. Enumeration (if available)
   * 2. Pattern (if available)
   * 3. Base type with range/length constraints
   *
   * @param baseType - Base XSD type (e.g., "xs:string", "xs:integer")
   * @param restriction - Optional XSD restriction
   * @param elementName - Element name (for sample value generation)
   * @returns Generated value respecting constraints
   */
  generateValue(
    baseType: string,
    restriction: XSDRestriction | undefined,
    elementName: string
  ): string {
    // No restrictions - use base type sample
    if (!restriction) {
      return this.getSampleValue(baseType, elementName);
    }

    // Priority 1: Enumeration (highest priority, most specific)
    if (restriction.enumerations && restriction.enumerations.length > 0) {
      const value = this.enumSelector.select(restriction.enumerations);
      // Apply length constraints even to enumerations
      return this.lengthGenerator.applyLength(value, restriction);
    }

    // Priority 2: Pattern (specific format requirement)
    if (restriction.pattern) {
      const patternValue = this.patternMatcher.generate(restriction.pattern);
      if (patternValue) {
        return this.lengthGenerator.applyLength(patternValue, restriction);
      }
      // Pattern failed - fall through to base type
      console.warn(`Pattern generation failed for ${elementName}, using base type`);
    }

    // Priority 3: Base type with numeric/length constraints
    let value: string;

    if (this.isNumericType(baseType)) {
      value = this.generateNumericValue(baseType, restriction, elementName);
    } else {
      value = this.getSampleValue(baseType, elementName);
    }

    // Apply length constraints
    value = this.lengthGenerator.applyLength(value, restriction);

    return value;
  }

  /**
   * Generate a numeric value respecting range constraints.
   */
  private generateNumericValue(
    baseType: string,
    restriction: XSDRestriction,
    elementName: string
  ): string {
    if (this.isIntegerType(baseType)) {
      const num = this.numericGenerator.generateInteger(restriction);
      if (num !== null) {
        return num.toString();
      }
      console.warn(`Numeric range conflict for ${elementName}, using default`);
    } else {
      const num = this.numericGenerator.generateDecimal(restriction);
      if (num !== null) {
        return num.toString();
      }
      console.warn(`Numeric range conflict for ${elementName}, using default`);
    }

    // Fallback to sample value
    return this.getSampleValue(baseType, elementName);
  }

  /**
   * Check if type is numeric.
   */
  private isNumericType(typeName: string): boolean {
    const local = this.getLocalName(typeName);
    return [
      'integer',
      'int',
      'long',
      'short',
      'byte',
      'decimal',
      'float',
      'double',
      'positiveInteger',
      'nonNegativeInteger',
      'negativeInteger',
      'nonPositiveInteger',
      'unsignedInt',
      'unsignedLong',
      'unsignedShort',
      'unsignedByte',
    ].includes(local);
  }

  /**
   * Check if type is an integer type.
   */
  private isIntegerType(typeName: string): boolean {
    const local = this.getLocalName(typeName);
    return [
      'integer',
      'int',
      'long',
      'short',
      'byte',
      'positiveInteger',
      'nonNegativeInteger',
      'negativeInteger',
      'nonPositiveInteger',
      'unsignedInt',
      'unsignedLong',
      'unsignedShort',
      'unsignedByte',
    ].includes(local);
  }

  /**
   * Get local type name (without namespace prefix).
   */
  private getLocalName(typeName: string): string {
    return typeName.includes(':') ? typeName.split(':')[1] : typeName;
  }

  /**
   * Get sample value for base type.
   */
  private getSampleValue(typeName: string, elementName: string): string {
    const local = this.getLocalName(typeName);

    switch (local) {
      case 'string':
        return `sample_${elementName}`;
      case 'boolean':
        return 'true';
      case 'integer':
      case 'int':
      case 'long':
      case 'short':
      case 'byte':
      case 'positiveInteger':
      case 'nonNegativeInteger':
      case 'unsignedInt':
      case 'unsignedLong':
      case 'unsignedShort':
      case 'unsignedByte':
        return '42';
      case 'negativeInteger':
      case 'nonPositiveInteger':
        return '-1';
      case 'decimal':
      case 'float':
      case 'double':
        return '3.14';
      case 'date':
        return '2024-01-01';
      case 'dateTime':
        return '2024-01-01T00:00:00';
      case 'time':
        return '00:00:00';
      case 'anyURI':
        return 'http://example.com';
      case 'token':
      case 'normalizedString':
      case 'language':
        return `sample`;
      default:
        return `sample_${elementName}`;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ConstraintValueGenerator.test.ts`

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/xsd/generators/ConstraintValueGenerator.ts
git add src/services/xsd/generators/__tests__/ConstraintValueGenerator.test.ts
git commit -m "feat: implement ConstraintValueGenerator orchestrator"
```

---

## Task 8: Integrate ConstraintValueGenerator into XMLFromXSDGenerator

**Files:**
- Modify: `src/services/xsd/XMLFromXSDGenerator.ts`

- [ ] **Step 1: Add import for generators**

Add at top of file after XSDParser imports:

```typescript
import {
  ConstraintValueGenerator,
  PatternMatcher,
  NumericRangeGenerator,
  LengthConstraintGenerator,
  EnumerationSelector,
} from './generators';
```

- [ ] **Step 2: Create generator instances**

Add after imports:

```typescript
// Generator instances for constraint-aware value generation
const patternMatcher = new PatternMatcher();
const numericGenerator = new NumericRangeGenerator();
const lengthGenerator = new LengthConstraintGenerator();
const enumSelector = new EnumerationSelector();
const constraintGenerator = new ConstraintValueGenerator(
  patternMatcher,
  numericGenerator,
  lengthGenerator,
  enumSelector
);
```

- [ ] **Step 3: Replace getSampleValueForSimpleType to use constraints**

Replace the existing `getSampleValueForSimpleType` function:

```typescript
function getSampleValueForSimpleType(st: XSDSimpleType, elementName: string): string {
  if (st.restriction) {
    // Use constraint-aware generator
    return constraintGenerator.generateValue(st.restriction.base, st.restriction, elementName);
  }
  return getSampleValue('xs:string', elementName);
}
```

- [ ] **Step 4: Update getSampleValue to use constraints for attributes**

Replace the existing `getSampleValue` function with constraint-aware version:

```typescript
function getSampleValue(typeName: string, elementName: string, restriction?: XSDRestriction): string {
  // If restriction provided, use constraint generator
  if (restriction) {
    return constraintGenerator.generateValue(typeName, restriction, elementName);
  }

  // Original logic for built-in types
  const local = typeName.includes(':') ? typeName.split(':')[1] : typeName;

  switch (local) {
    case 'string':
      return `sample_${elementName}`;
    case 'boolean':
      return 'true';
    case 'integer':
    case 'int':
    case 'long':
    case 'short':
    case 'byte':
    case 'positiveInteger':
    case 'nonNegativeInteger':
    case 'unsignedInt':
    case 'unsignedLong':
    case 'unsignedShort':
    case 'unsignedByte':
      return '42';
    case 'negativeInteger':
    case 'nonPositiveInteger':
      return '-1';
    case 'decimal':
    case 'float':
    case 'double':
      return '3.14';
    case 'date':
      return '2024-01-01';
    case 'dateTime':
      return '2024-01-01T00:00:00';
    case 'time':
      return '00:00:00';
    case 'anyURI':
      return 'http://example.com';
    case 'token':
    case 'normalizedString':
    case 'language':
      return `sample`;
    default:
      return `sample_${elementName}`;
  }
}
```

- [ ] **Step 5: Update generateAttributes to pass restrictions**

Replace the `generateAttributes` function:

```typescript
function generateAttributes(attributes: XSDAttribute[], schema: XSDSchema): string {
  if (attributes.length === 0) return '';
  const parts: string[] = [];
  for (const attr of attributes) {
    if (attr.use === 'prohibited') continue;

    // Check if attribute type has restrictions
    let value: string;
    if (attr.fixedValue !== undefined) {
      value = attr.fixedValue;
    } else if (attr.defaultValue !== undefined) {
      value = attr.defaultValue;
    } else {
      // Resolve simple type for restriction
      const simpleType = resolveSimpleType(attr.type, schema);
      const restriction = simpleType?.restriction;
      value = getSampleValue(attr.type, attr.name, restriction);
    }

    parts.push(`${attr.name}="${value}"`);
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}
```

- [ ] **Step 6: Update generateElementXML to use constraints for simple content**

Find the section handling simple content base type (around line 147) and update:

```typescript
if (complexType.elements.length === 0 && complexType.simpleContentBase) {
  // Simple content with attributes
  const simpleType = resolveSimpleType(complexType.simpleContentBase, schema);
  const restriction = simpleType?.restriction;
  const value = getSampleValue(complexType.simpleContentBase, element.name, restriction);
  lines.push(`${indent(level)}<${element.name}${attrStr}>${value}</${element.name}>`);
}
```

- [ ] **Step 7: Update built-in type handling in generateElementXML**

Find the "Built-in type or unresolved" section (around line 162) and update:

```typescript
} else {
  // Built-in type or unresolved
  // Check if there's a global simple type with restrictions
  const simpleType = resolveSimpleType(element.type, schema);
  const restriction = simpleType?.restriction;
  const value = getSampleValue(element.type, element.name, restriction);
  lines.push(`${indent(level)}<${element.name}>${value}</${element.name}>`);
}
```

- [ ] **Step 8: Run type-check**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 9: Run existing tests to ensure backward compatibility**

Run: `npm test -- XMLFromXSDGenerator.test.ts`

Expected: All tests pass (may need updates for random values)

- [ ] **Step 10: Commit**

```bash
git add src/services/xsd/XMLFromXSDGenerator.ts
git commit -m "feat: integrate constraint-aware generators into XMLFromXSDGenerator"
```

---

## Task 9: Add Options Parameter Support

**Files:**
- Modify: `src/services/xsd/XMLFromXSDGenerator.ts`

- [ ] **Step 1: Add options interface**

Add after imports:

```typescript
/**
 * Options for XML generation from XSD.
 */
export interface GenerateXMLOptions {
  /** Seed for reproducible random values */
  seed?: number;
  /** Maximum regeneration attempts when validation fails (default: 3) */
  maxAttempts?: number;
  /** Whether to validate generated XML against XSD (default: true) */
  validateResult?: boolean;
}
```

- [ ] **Step 2: Update generateXMLFromXSD signature**

Replace existing function signature:

```typescript
export function generateXMLFromXSD(
  xsdContent: string,
  options?: GenerateXMLOptions
): string | null {
```

- [ ] **Step 3: Add validation loop**

Replace the end of `generateXMLFromXSD` function (before return):

```typescript
export function generateXMLFromXSD(
  xsdContent: string,
  options?: GenerateXMLOptions
): string | null {
  const schema = parseXSD(xsdContent);
  if (!schema || schema.elements.length === 0) return null;

  // Use the first root element
  const rootElement = schema.elements[0];
  const maxAttempts = options?.maxAttempts ?? 3;
  const validate = options?.validateResult !== false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      generateElementXML(rootElement, schema, 0),
      '',
    ];

    const xml = lines.join('\n');

    // Validate if requested
    if (validate) {
      const validation = validateXMLAgainstXSD(xml, xsdContent);
      if (validation.errors.length === 0) {
        return xml; // Success!
      }
      console.warn(`Validation attempt ${attempt + 1} failed, retrying...`);
      if (attempt < maxAttempts - 1) {
        continue; // Try again
      }
    }

    // Return XML even if validation failed (after all attempts)
    return xml;
  }

  return null; // Should not reach here
}
```

- [ ] **Step 4: Import validator**

Add at top with other imports:

```typescript
import { validateXMLAgainstXSD } from './XSDValidator';
```

- [ ] **Step 5: Run type-check**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 6: Run tests**

Run: `npm test -- XMLFromXSDGenerator.test.ts`

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/services/xsd/XMLFromXSDGenerator.ts
git commit -m "feat: add options parameter with validation loop"
```

---

## Task 10: Write Integration Tests

**Files:**
- Create: `src/services/xsd/generators/__tests__/ConstraintValueGenerator.integration.test.ts`

- [ ] **Step 1: Write integration tests**

```typescript
/**
 * Constraint-Aware XML Generation Integration Tests
 *
 * Full end-to-end tests for XML generation with constraints.
 */

import { describe, it, expect } from 'vitest';
import { generateXMLFromXSD } from '../XMLFromXSDGenerator';

describe('ConstraintValueGenerator Integration', () => {
  it('should generate XML with pattern constraints', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="product">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:pattern value="[A-Z]{2}-\d{4}"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    expect(xml).toMatch(/<[a-z]+>[A-Z]{2}-\d{4}<\/[a-z]+>/);
  });

  it('should generate XML with length constraints', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="username">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:minLength value="5"/>
        <xs:maxLength value="10"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    const match = xml!.match(/<username>(.+)<\/username>/);
    expect(match).toBeTruthy();
    expect(match![1].length).toBeGreaterThanOrEqual(5);
    expect(match![1].length).toBeLessThanOrEqual(10);
  });

  it('should generate XML with numeric range constraints', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="age">
    <xs:simpleType>
      <xs:restriction base="xs:integer">
        <xs:minInclusive value="18"/>
        <xs:maxInclusive value="120"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    const match = xml!.match(/<age>(\d+)<\/age>/);
    expect(match).toBeTruthy();
    const age = parseInt(match![1], 10);
    expect(age).toBeGreaterThanOrEqual(18);
    expect(age).toBeLessThanOrEqual(120);
  });

  it('should generate XML with enumeration (random selection)', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="color">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:enumeration value="red"/>
        <xs:enumeration value="green"/>
        <xs:enumeration value="blue"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    const match = xml!.match(/<color>(.+)<\/color>/);
    expect(match).toBeTruthy();
    expect(['red', 'green', 'blue']).toContain(match![1]);
  });

  it('should generate XML with combined pattern and length constraints', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="code">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:pattern value="[A-Z0-9]+"/>
        <xs:minLength value="8"/>
        <xs:maxLength value="12"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    const match = xml!.match(/<code>(.+)<\/code>/);
    expect(match).toBeTruthy();
    expect(match![1]).toMatch(/^[A-Z0-9]+$/);
    expect(match![1].length).toBeGreaterThanOrEqual(8);
    expect(match![1].length).toBeLessThanOrEqual(12);
  });

  it('should generate complex XML with nested constraints', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name">
          <xs:simpleType>
            <xs:restriction base="xs:string">
              <xs:minLength value="2"/>
              <xs:maxLength value="50"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
        <xs:element name="age">
          <xs:simpleType>
            <xs:restriction base="xs:integer">
              <xs:minInclusive value="0"/>
              <xs:maxInclusive value="150"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
        <xs:element name="email">
          <xs:simpleType>
            <xs:restriction base="xs:string">
              <xs:pattern value="[a-z]+@[a-z]+\.[a-z]{2,3}"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    expect(xml).toContain('<person>');
    expect(xml).toContain('<name>');
    expect(xml).toContain('<age>');
    expect(xml).toContain('<email>');
    expect(xml).toContain('</person>');
  });

  it('should handle unicode patterns with Cyrillic characters', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="russianText">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:pattern value="[а-яА-ЯёЁ\s]{5,20}"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml = generateXMLFromXSD(xsd);

    expect(xml).not.toBeNull();
    const match = xml!.match(/<russianText>(.+)<\/russianText>/);
    expect(match).toBeTruthy();
    expect(match![1]).toMatch(/[а-яА-ЯёЁ]/);
  });

  it('should use seed for reproducible output', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="value">
    <xs:simpleType>
      <xs:restriction base="xs:integer">
        <xs:minInclusive value="1"/>
        <xs:maxInclusive value="100"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml1 = generateXMLFromXSD(xsd, { seed: 42 });
    const xml2 = generateXMLFromXSD(xsd, { seed: 42 });

    expect(xml1).toBe(xml2);
  });

  it('should generate different values with different seeds', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="value">
    <xs:simpleType>
      <xs:restriction base="xs:integer">
        <xs:minInclusive value="1"/>
        <xs:maxInclusive value="100"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const xml1 = generateXMLFromXSD(xsd, { seed: 1 });
    const xml2 = generateXMLFromXSD(xsd, { seed: 99 });

    expect(xml1).not.toBe(xml2);
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npm test -- ConstraintValueGenerator.integration.test.ts`

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/services/xsd/generators/__tests__/ConstraintValueGenerator.integration.test.ts
git commit -m "test: add integration tests for constraint-aware XML generation"
```

---

## Task 11: Update Existing Tests for Random Values

**Files:**
- Modify: `src/services/xsd/__tests__/XMLFromXSDGenerator.test.ts`

- [ ] **Step 1: Update enumeration test to accept any value**

Find the "should use first enumeration value" test and update:

```typescript
it('should use enumeration value (any of them)', () => {
  const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="color">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:enumeration value="red"/>
        <xs:enumeration value="green"/>
        <xs:enumeration value="blue"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

  const xml = generateXMLFromXSD(xsd);
  expect(xml).toBeTruthy();
  const match = xml!.match(/<color>(.+)<\/color>/);
  expect(match).toBeTruthy();
  expect(['red', 'green', 'blue']).toContain(match![1]);
});
```

- [ ] **Step 2: Add seed option for deterministic tests in critical tests**

Add seed parameter where deterministic values matter:

```typescript
it('should generate deterministic values with seed', () => {
  const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="color">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:enumeration value="red"/>
        <xs:enumeration value="green"/>
        <xs:enumeration value="blue"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

  const xml1 = generateXMLFromXSD(xsd, { seed: 42 });
  const xml2 = generateXMLFromXSD(xsd, { seed: 42 });

  expect(xml1).toBe(xml2);
});
```

- [ ] **Step 3: Run all tests**

Run: `npm test -- XMLFromXSDGenerator.test.ts`

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/xsd/__tests__/XMLFromXSDGenerator.test.ts
git commit -m "test: update existing tests for random value generation"
```

---

## Task 12: Export Generators from XSD Module

**Files:**
- Modify: `src/services/xsd/index.ts`

- [ ] **Step 1: Add generator exports**

Add to existing exports:

```typescript
// XSD schema services
export { parseXSD } from './XSDParser';
export type {
  XSDSchema,
  XSDElement,
  XSDComplexType,
  XSDSimpleType,
  XSDAttribute,
  XSDRestriction,
  XSDOccurrence,
} from './XSDParser';

export { validateXMLAgainstXSD, validateXMLAgainstSchema } from './XSDValidator';
export { generateXSDFromXML } from './XSDGenerator';
export { generateXMLFromXSD, type GenerateXMLOptions } from './XMLFromXSDGenerator';

// Constraint-aware value generators
export {
  PatternMatcher,
  NumericRangeGenerator,
  LengthConstraintGenerator,
  EnumerationSelector,
  ConstraintValueGenerator,
} from './xsd/generators';
```

- [ ] **Step 2: Fix import path**

Wait, the correct path should be:

```typescript
// Constraint-aware value generators
export {
  PatternMatcher,
  NumericRangeGenerator,
  LengthConstraintGenerator,
  EnumerationSelector,
  ConstraintValueGenerator,
} from './generators';
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/services/xsd/index.ts
git commit -m "feat: export constraint-aware generators from XSD module"
```

---

## Task 13: Update Documentation

**Files:**
- Modify: `README.md` (if exists) or create documentation

- [ ] **Step 1: Check for README**

Run: `ls README.md 2>/dev/null && echo "exists" || echo "not found"`

If exists, add section about constraint-aware generation.

- [ ] **Step 2: Add code examples in XMLFromXSDGenerator.ts JSDoc**

Update the main function JSDoc:

```typescript
/**
 * Generate a sample XML document from an XSD schema string.
 *
 * Creates valid XML instances using the first root element declaration,
 * with sample values for each type. All XSD type constraints are respected:
 * - Pattern (regex) constraints
 * - Length constraints (minLength, maxLength)
 * - Numeric range constraints (minInclusive, maxInclusive, etc.)
 * - Enumeration constraints (random selection)
 *
 * @param xsdContent - XSD schema string
 * @param options - Optional generation parameters
 * @returns XML instance string, or null if XSD is not valid
 *
 * @example
 * ```ts
 * // Basic usage
 * const xml = generateXMLFromXSD(xsdString);
 *
 * // With options
 * const xml = generateXMLFromXSD(xsdString, {
 *   seed: 42,              // Reproducible random values
 *   validateResult: true,  // Validate against XSD (default)
 *   maxAttempts: 3         // Max retry attempts
 * });
 * ```
 */
export function generateXMLFromXSD(
  xsdContent: string,
  options?: GenerateXMLOptions
): string | null {
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: No warnings

- [ ] **Step 4: Commit**

```bash
git add src/services/xsd/XMLFromXSDGenerator.ts README.md
git commit -m "docs: add documentation for constraint-aware XML generation"
```

---

## Task 14: Final Verification and Cleanup

**Files:**
- All project files

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: All tests PASS

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`

Expected: No type errors

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: No warnings

- [ ] **Step 4: Build project**

Run: `npm run build`

Expected: Successful build

- [ ] **Step 5: Test with real XSD example**

Create test file and verify:

```bash
cat > /tmp/test_xsd.xsd << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="user">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="email">
          <xs:simpleType>
            <xs:restriction base="xs:string">
              <xs:pattern value="[a-z]+@[a-z]+\.[a-z]{2,3}"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
        <xs:element name="age">
          <xs:simpleType>
            <xs:restriction base="xs:integer">
              <xs:minInclusive value="18"/>
              <xs:maxInclusive value="120"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
EOF

# Test with Node
node -e "
const { generateXMLFromXSD } = require('./dist/services/xsd/index.js');
const fs = require('fs');
const xsd = fs.readFileSync('/tmp/test_xsd.xsd', 'utf8');
const xml = generateXMLFromXSD(xsd);
console.log('Generated XML:');
console.log(xml);
"
```

Expected: Valid XML with pattern-matching email and age in range

- [ ] **Step 6: Verify test coverage**

Run: `npm run test:coverage`

Expected: Coverage >90% for new generator code

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification for constraint-aware XML generation"
```

---

## Completion Checklist

- [ ] All 14 tasks completed
- [ ] All tests passing
- [ ] Type-check passing
- [ ] Lint passing
- [ ] Build successful
- [ ] Test coverage >90% for new code
- [ ] Documentation updated
- [ ] No breaking changes to existing API
- [ ] Real-world XSD examples work correctly

**Implementation Complete!**

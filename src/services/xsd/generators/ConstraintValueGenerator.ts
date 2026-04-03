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
   * @param seed - Optional seed for deterministic generation
   * @returns Generated value respecting constraints
   */
  generateValue(
    baseType: string,
    restriction: XSDRestriction | undefined,
    elementName: string,
    seed?: number
  ): string {
    // No restrictions - use base type sample
    if (!restriction) {
      return this.getSampleValue(baseType, elementName);
    }

    // Priority 1: Enumeration (highest priority, most specific)
    if (restriction.enumerations && restriction.enumerations.length > 0) {
      const value = this.enumSelector.select(restriction.enumerations, seed);
      return this.lengthGenerator.applyLength(value, restriction);
    }

    // Priority 2: Pattern (specific format requirement)
    if (restriction.pattern) {
      const patternValue = this.patternMatcher.generate(restriction.pattern);
      if (patternValue) {
        return this.lengthGenerator.applyLength(patternValue, restriction);
      }
      console.warn(`Pattern generation failed for ${elementName}, using base type`);
    }

    // Priority 3: Base type with numeric/length constraints
    let value: string;

    if (this.isNumericType(baseType)) {
      value = this.generateNumericValue(baseType, restriction, elementName, seed);
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
    elementName: string,
    seed?: number
  ): string {
    if (this.isIntegerType(baseType)) {
      const num = this.numericGenerator.generateInteger(restriction, seed);
      if (num !== null) {
        return num.toString();
      }
      console.warn(`Numeric range conflict for ${elementName}, using default`);
    } else {
      const num = this.numericGenerator.generateDecimal(restriction, seed);
      if (num !== null) {
        return num.toString();
      }
      console.warn(`Numeric range conflict for ${elementName}, using default`);
    }

    return this.getSampleValue(baseType, elementName);
  }

  /**
   * Check if type is numeric.
   */
  private isNumericType(typeName: string): boolean {
    const local = this.getLocalName(typeName);
    return [
      'integer', 'int', 'long', 'short', 'byte',
      'decimal', 'float', 'double',
      'positiveInteger', 'nonNegativeInteger',
      'negativeInteger', 'nonPositiveInteger',
      'unsignedInt', 'unsignedLong', 'unsignedShort', 'unsignedByte',
    ].includes(local);
  }

  /**
   * Check if type is an integer type.
   */
  private isIntegerType(typeName: string): boolean {
    const local = this.getLocalName(typeName);
    return [
      'integer', 'int', 'long', 'short', 'byte',
      'positiveInteger', 'nonNegativeInteger',
      'negativeInteger', 'nonPositiveInteger',
      'unsignedInt', 'unsignedLong', 'unsignedShort', 'unsignedByte',
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

# Constraint-Aware XML Generation from XSD - Design Document

**Date:** 2026-04-03
**Status:** Approved
**Author:** Claude Code + User Collaboration

## Overview

Enhance the XML generation from XSD to respect all type constraints including patterns, length restrictions, numeric ranges, and enumerations. The system will generate valid XML instances where all values comply with their XSD type definitions.

## Problem Statement

The current `XMLFromXSDGenerator` creates sample XML from XSD schemas but does not properly respect type constraints:

- Pattern restrictions (regex) are ignored
- Length constraints (minLength, maxLength) are not enforced
- Numeric ranges (minInclusive, maxInclusive, etc.) are not applied
- Only enumerations are partially supported

This results in generated XML that often fails validation against the source XSD.

## Requirements

### Functional Requirements

1. **Pattern Matching**: Generate random strings that match `xs:pattern` regex constraints
2. **Length Constraints**: Respect `minLength`, `maxLength`, and `length` restrictions
3. **Numeric Ranges**: Generate values within `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive` bounds
4. **Enumerations**: Randomly select from enumeration values (not just first value)
5. **Validation**: Generated XML must validate against the source XSD
6. **Fallback**: Use sensible defaults when constraints cannot be satisfied

### Non-Functional Requirements

- **Random Values**: Generate random values within constraints (not deterministic)
- **Performance**: Pattern generation timeout of 100ms to prevent hangs
- **Compatibility**: No breaking changes to existing API
- **Testability**: All components independently testable
- **Error Handling**: Never throw exceptions - always return XML or null with warnings

## Architecture

### Component Diagram

```
XMLFromXSDGenerator (existing, enhanced)
    ↓
ConstraintValueGenerator (new - main orchestrator)
    ├── PatternMatcher (new) - regex to string generation
    ├── NumericRangeGenerator (new) - numeric range constraints
    ├── LengthConstraintGenerator (new) - string length constraints
    └── EnumerationSelector (new) - enum value selection
```

### Data Flow

```
generateElementXML()
    ↓
For each element/attribute:
    1. Resolve type and check for restrictions
    2. If restrictions exist:
       - Pass to ConstraintValueGenerator
       - Generate value respecting all constraints
       - If generation fails, use fallback + log warning
    3. Validate generated value against constraints
    4. If validation fails, regenerate (max 3 attempts)
    5. Add value to XML output
    ↓
After full XML generation:
    - Validate complete XML against XSD
    - Retry if validation fails (max 3 attempts)
    - Return valid XML or XML with warnings
```

## Components

### 1. ConstraintValueGenerator

**Purpose**: Main orchestrator for constraint-aware value generation

**Responsibilities**:
- Coordinate all constraint handlers
- Apply constraints in priority order (enumeration > pattern > range/length)
- Handle fallback values when generation fails
- Log warnings for unsatisfiable constraints

**Interface**:
```typescript
class ConstraintValueGenerator {
  constructor(
    private patternMatcher: PatternMatcher,
    private numericGenerator: NumericRangeGenerator,
    private lengthGenerator: LengthConstraintGenerator,
    private enumSelector: EnumerationSelector
  ) {}

  generateValue(
    baseType: string,
    restriction: XSDRestriction | undefined,
    elementName: string
  ): string;

  private selectRandomEnumeration(enums: string[]): string;
  private applyNumericConstraints(value: string, restriction: XSDRestriction): string;
  private applyLengthConstraints(value: string, restriction: XSDRestriction): string;
}
```

**Generation Priority**:
1. **Enumeration** (if available) - highest priority, most specific
2. **Pattern** (if available) - specific format requirement
3. **Base type** with range/length constraints - general case

### 2. PatternMatcher

**Purpose**: Generate random strings matching regex patterns

**Responsibilities**:
- Compile and cache regex patterns
- Generate random matching strings using `randexp`
- Handle unicode patterns (including Cyrillic)
- Timeout protection for complex patterns

**Interface**:
```typescript
class PatternMatcher {
  private patternCache = new Map<string, RandExp>();

  generate(pattern: string, timeoutMs: number = 100): string | null {
    try {
      const re = this.getCachedPattern(pattern);
      return re.gen(); // randexp method
    } catch {
      return null; // Pattern too complex or timeout
    }
  }

  private getCachedPattern(pattern: string): RandExp;
}
```

**Dependencies**:
- `randexp` ^0.5.0 - Regular expression generator

**Error Handling**:
- Returns `null` on timeout or complex patterns
- Caller should fall back to base type value

### 3. NumericRangeGenerator

**Purpose**: Generate random numeric values within range constraints

**Responsibilities**:
- Generate random integers/decimals within inclusive/exclusive bounds
- Handle edge cases (minExclusive = maxExclusive, etc.)
- Parse and format numeric values correctly

**Interface**:
```typescript
class NumericRangeGenerator {
  generateInteger(restriction: XSDRestriction): number | null;
  generateDecimal(restriction: XSDRestriction): number | null;

  private generateInRange(
    min: number,
    max: number,
    minInclusive: boolean,
    maxInclusive: boolean,
    isInteger: boolean
  ): number;
}
```

**Constraint Logic**:
- Default range if no constraints: `0` to `100` for integers, `0.0` to `100.0` for decimals
- `minInclusive`/`maxInclusive`: Include boundary values
- `minExclusive`/`maxExclusive`: Exclude boundary values
- Conflicting ranges (min > max): Return `null` to trigger fallback

### 4. LengthConstraintGenerator

**Purpose**: Adjust string values to meet length constraints

**Responsibilities**:
- Pad or truncate strings to meet `minLength`/`maxLength`
- Generate strings of exact `length` when specified
- Handle unicode characters correctly

**Interface**:
```typescript
class LengthConstraintGenerator {
  applyLength(value: string, restriction: XSDRestriction): string {
    if (restriction.length) {
      return this.setToExactLength(value, restriction.length);
    }
    if (restriction.minLength || restriction.maxLength) {
      return this.adjustToRange(value, restriction.minLength, restriction.maxLength);
    }
    return value;
  }

  private setToExactLength(value: string, length: number): string;
  private adjustToRange(value: string, min?: number, max?: number): string;
}
```

**Strategy**:
- **Too short**: Repeat value or pad with spaces
- **Too long**: Truncate to max length
- **Exact length**: Pad or truncate as needed

### 5. EnumerationSelector

**Purpose**: Randomly select values from enumerations

**Responsibilities**:
- Random selection from enumeration array
- Deterministic selection when seed is provided

**Interface**:
```typescript
class EnumerationSelector {
  select(enums: string[], seed?: number): string {
    const index = seed
      ? this.seededRandom(enums.length, seed)
      : Math.floor(Math.random() * enums.length);
    return enums[index];
  }

  private seededRandom(max: number, seed: number): number;
}
```

## API Changes

### Public API (Backward Compatible)

```typescript
export function generateXMLFromXSD(
  xsdContent: string,
  options?: {
    seed?: number;           // For reproducible random values (optional)
    maxAttempts?: number;    // Max regeneration attempts (default: 3)
    validateResult?: boolean; // Validate after generation (default: true)
  }
): string | null
```

**Usage Examples**:

```typescript
// Basic usage (unchanged)
const xml = generateXMLFromXSD(xsdContent);

// With validation disabled (faster)
const xml = generateXMLFromXSD(xsdContent, { validateResult: false });

// With seed for reproducible values (useful for testing)
const xml = generateXMLFromXSD(xsdContent, { seed: 42 });
```

## Error Handling

### Generation Failures

| Scenario | Action | User Impact |
|----------|--------|-------------|
| Pattern too complex | Use base type sample value, log warning | XML still generated |
| Conflicting constraints (min > max) | Use base type value, log warning | XML still generated |
| Empty enumeration | Use base type value, log error | XML still generated |
| Pattern generation timeout | Use base type value, log warning | XML still generated |

### Validation Failures

1. **First failure**: Regenerate with new random seed
2. **Second failure**: Regenerate again with different seed
3. **Third failure**: Return XML anyway, include validation warnings in logs

**Never** throw exceptions or return `null` due to constraint issues - always attempt to generate valid XML.

## Implementation Phases

### Phase 1: Core Infrastructure
- Install `randexp` dependency
- Create `generators/` directory structure
- Implement `PatternMatcher` class
- Add basic pattern generation tests

### Phase 2: Constraint Handlers
- Implement `NumericRangeGenerator`
- Implement `LengthConstraintGenerator`
- Refactor enumeration handling into `EnumerationSelector`
- Add unit tests for each handler

### Phase 3: Integration
- Implement `ConstraintValueGenerator` orchestrator
- Integrate into `XMLFromXSDGenerator`
- Add validation loop with retry logic
- Update existing tests for new behavior

### Phase 4: Edge Cases & Polish
- Handle conflicting constraints
- Implement timeout protection
- Add comprehensive logging/warnings
- Performance testing with large schemas
- Documentation updates

## Testing Strategy

### Unit Tests

**PatternMatcher**:
- Simple regex patterns (`[a-z]+`, `\d{3}`)
- Character classes with unicode (Cyrillic, emoji)
- Quantifiers (`{1,5}`, `*`, `+`, `?`)
- Complex patterns (groups, alternation)
- Timeout handling

**NumericRangeGenerator**:
- Integer generation within ranges
- Decimal generation with precision
- Inclusive vs exclusive boundaries
- Edge cases (min = max, negative ranges)

**LengthConstraintGenerator**:
- Exact length specification
- Min/max length combinations
- Unicode character handling
- Empty string handling

**ConstraintValueGenerator**:
- Priority ordering (enum > pattern > base)
- Combined constraints (pattern + length)
- Fallback value generation
- Warning logging

### Integration Tests

- Full XSD with multiple constraint types
- Nested complex types with restrictions
- Attributes with constraints
- Validation of generated XML
- Retry logic on validation failure

### Test Coverage Target

- **Unit tests**: >90% coverage
- **Integration tests**: All major scenarios
- **No breaking changes**: All existing tests pass

## Dependencies

```json
{
  "randexp": "^0.5.0"
}
```

**Rationale**: `randexp` is a mature, well-maintained library that generates random strings matching regex patterns. It supports:
- Character classes (`[a-z]`, `[0-9]`, `[^\\s]`)
- Quantifiers (`{min,max}`, `*`, `+`, `?`)
- Groups and alternation
- Unicode patterns
- Reasonable performance for typical XSD patterns

## File Structure

```
src/services/xsd/
├── XMLFromXSDGenerator.ts                    # Main generator (enhanced)
├── generators/
│   ├── index.ts                              # Public exports
│   ├── ConstraintValueGenerator.ts           # Main orchestrator
│   ├── PatternMatcher.ts                     # Regex generation
│   ├── NumericRangeGenerator.ts              # Numeric constraints
│   ├── LengthConstraintGenerator.ts          # Length constraints
│   └── EnumerationSelector.ts                # Enum handling
└── __tests__/
    ├── XMLFromXSDGenerator.test.ts           # Existing tests (update)
    └── generators/
        ├── PatternMatcher.test.ts
        ├── NumericRangeGenerator.test.ts
        ├── LengthConstraintGenerator.test.ts
        ├── EnumerationSelector.test.ts
        ├── ConstraintValueGenerator.test.ts
        └── ConstraintValueGenerator.integration.test.ts
```

## Performance Considerations

### Optimization Strategies

1. **Pattern Caching**: Compile each regex pattern once per schema
2. **Timeout Protection**: 100ms limit per pattern generation
3. **Lazy Validation**: Make validation optional via parameter
4. **Efficient Random**: Use `Math.random()` (fast) vs crypto API (slow)

### Performance Targets

- Generate simple XSD (10 elements): <100ms
- Generate complex XSD (100 elements, patterns): <500ms
- Generate with validation disabled: 50% faster
- Pattern generation timeout: 100ms max per pattern

## Migration Path

### For Existing Users

**No changes required** - the existing API remains fully compatible:
```typescript
// This continues to work exactly as before
const xml = generateXMLFromXSD(xsdContent);
```

**New capabilities are opt-in**:
```typescript
// Enable constraint-aware generation with options
const xml = generateXMLFromXSD(xsdContent, {
  validateResult: true  // Ensure generated XML validates
});
```

### For Developers

1. Update tests to expect random values (not deterministic)
2. Use `seed` option for reproducible test values
3. Update documentation with constraint support examples

## Success Criteria

- ✅ All XSD restriction types are respected
- ✅ Generated XML validates against source XSD (99%+ cases)
- ✅ No breaking changes to existing API
- ✅ All existing tests pass
- ✅ Test coverage >90% for new code
- ✅ Performance meets targets (<500ms for complex schemas)
- ✅ Comprehensive error handling with fallbacks

## Open Questions

None - all design decisions have been validated.

## References

- [XSD Restriction Facets](https://www.w3.org/TR/xmlschema-2/#rf-facets)
- [randexp library](https://www.npmjs.com/package/randexp)
- Existing `XMLFromXSDGenerator.ts` implementation
- Existing `XSDParser.ts` with `XSDRestriction` interface

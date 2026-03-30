# XMLValidator Usage Guide

## Overview

The XMLValidator provides comprehensive XML syntax validation with debounced real-time validation and rich error reporting. It integrates with the XMLParser core engine for syntax checking.

## Features

- **Syntax Validation**: Validates XML syntax using browser's DOMParser
- **Debounced Real-Time Validation**: 300ms debounce for editor integration
- **Rich Error Reporting**: Line/column numbers, clear messages, and suggestions
- **Warning System**: Non-critical issues like missing encoding attributes
- **Line-by-Line Validation**: Validate individual lines for editor feedback

## Basic Usage

```typescript
import { xmlValidator } from '@/core/validatorEngine';

// Validate XML
const result = xmlValidator.validateXML('<root><child>Content</child></root>');

if (result.valid) {
  console.log('XML is valid!');
} else {
  result.errors.forEach(error => {
    console.error(`Line ${error.line}, Column ${error.column}: ${error.message}`);
  });
}

// Check warnings
result.warnings.forEach(warning => {
  console.warn(`Line ${warning.line}: ${warning.message}`);
});
```

## Real-Time Validation

For editor integration with debouncing:

```typescript
import { xmlValidator } from '@/core/validatorEngine';

// In your editor's onChange handler
function handleEditorChange(content: string) {
  const errors = xmlValidator.validateRealTime(content);

  // Update UI with errors
  updateErrorMarkers(errors);
}

// Cancel pending validation when needed
function onEditorClose() {
  xmlValidator.cancelPendingValidation();
}
```

## Error Formatting

Get formatted error messages with suggestions:

```typescript
const result = xmlValidator.validateXML(invalidXML);

result.errors.forEach(error => {
  const formatted = xmlValidator.formatErrorMessage(error);
  console.error(formatted);
  // Output:
  // Line 5, Column 10: Unclosed tag.
  //
  // Suggestion: Ensure all opening tags have corresponding closing tags
});
```

## Line-by-Line Validation

Validate individual lines:

```typescript
const line = '<child>Content';
const lineNumber = 5;
const errors = xmlValidator.validateLine(line, lineNumber);

errors.forEach(error => {
  console.error(`${error.message} at line ${error.line}`);
});
```

## Quick Validation Check

For simple true/false validation:

```typescript
if (xmlValidator.isValid(xmlContent)) {
  // XML is valid
} else {
  // XML has errors
}
```

## API Reference

### XMLValidator Class

#### Methods

##### `validateXML(xmlString: string): ValidationResult`

Validates XML syntax and returns detailed validation result.

**Parameters:**
- `xmlString` - XML content to validate

**Returns:** `ValidationResult`
```typescript
interface ValidationResult {
  valid: boolean;           // true if XML is valid
  errors: ValidationError[]; // Array of validation errors
  warnings: ValidationWarning[]; // Array of warnings
}
```

##### `validateRealTime(xmlString: string): ValidationError[]`

Validates XML with debouncing (300ms delay). Returns cached errors immediately for UI responsiveness.

**Parameters:**
- `xmlString` - XML content to validate

**Returns:** `ValidationError[]`

##### `formatErrorMessage(error: ValidationError): string`

Formats error message with line/column info and suggestions.

**Parameters:**
- `error` - Validation error to format

**Returns:** Formatted error message string

##### `validateLine(lineContent: string, lineNumber: number): ValidationError[]`

Validates a single line of XML.

**Parameters:**
- `lineContent` - Single line of XML content
- `lineNumber` - Line number (1-based)

**Returns:** Array of validation errors for this line

##### `isValid(xmlString: string): boolean`

Quick validation check (returns true/false only).

**Parameters:**
- `xmlString` - XML content to validate

**Returns:** `true` if XML is valid, `false` otherwise

##### `cancelPendingValidation(): void`

Cancels any pending debounced validation.

##### `reset(): void`

Resets validator state and cancels pending validation.

## Type Definitions

```typescript
interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  path?: string;  // Optional XPath (Phase 2)
}

interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  suggestion?: string;
}
```

## Error Codes

The validator provides specific error codes for common issues:

- `SYNTAX_ERROR_UNCLOSED_TAG` - Unclosed or missing closing tag
- `SYNTAX_ERROR_UNEXPECTED_TOKEN` - Mismatched or unexpected tag
- `SYNTAX_ERROR_NOT_WELL_FORMED` - General well-formedness issue
- `SYNTAX_ERROR_INVALID` - Invalid XML syntax
- `SYNTAX_ERROR_GENERAL` - Other syntax errors

## Integration Example

```typescript
import { xmlValidator } from '@/core/validatorEngine';
import type { ValidationError } from '@/types/document';

class XmlEditor {
  private editor: Monaco.editor.IStandaloneCodeEditor;

  constructor() {
    this.setupValidation();
  }

  private setupValidation() {
    this.editor.onDidChangeModelContent(() => {
      const content = this.editor.getValue();
      const errors = xmlValidator.validateRealTime(content);

      // Clear previous markers
      monaco.editor.setModelMarkers(this.editor.getModel()!, 'xml-validator', []);

      // Add new markers
      const markers = errors.map(error => ({
        severity: monaco.MarkerSeverity.Error,
        message: xmlValidator.formatErrorMessage(error),
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.line,
        endColumn: error.column + 1,
      }));

      monaco.editor.setModelMarkers(this.editor.getModel()!, 'xml-validator', markers);
    });
  }

  dispose() {
    xmlValidator.cancelPendingValidation();
  }
}
```

## Phase 1 Scope

Current implementation (Phase 1) includes:
- XML syntax validation
- Error detection and reporting
- Debounced real-time validation
- Warning system for common issues

**Phase 2 will add:**
- XSD schema validation
- XPath-based error locations
- Schema-based suggestions

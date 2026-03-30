/**
 * XMLValidator
 *
 * Provides XML validation functionality with debounced real-time validation.
 * Integrates with XMLParser for syntax validation and provides rich error reporting.
 */

import { xmlParser } from '../parserEngine/index.js';
import type { ValidationError } from '../../types/document.js';

/**
 * Validation warning interface
 * Represents a non-critical validation issue
 */
export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  suggestion?: string;
}

/**
 * Validation result interface
 * Contains the overall validation status and detailed errors/warnings
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Debounce state for real-time validation
 */
interface DebounceState {
  timeoutId: ReturnType<typeof setTimeout> | null;
  lastXmlString: string;
  pendingErrors: ValidationError[];
}

/**
 * XMLValidator class
 * Handles XML validation with syntax checking and debounced real-time validation
 */
export class XMLValidator {
  private debounceState: DebounceState = {
    timeoutId: null,
    lastXmlString: '',
    pendingErrors: [],
  };

  /**
   * Validate XML syntax and return detailed validation result
   * @param xmlString - XML content to validate
   * @returns ValidationResult with valid status and errors/warnings
   */
  validateXML(xmlString: string): ValidationResult {
    const parseErrors = xmlParser.validateSyntax(xmlString);

    // Convert ParseError[] to ValidationError[]
    const errors: ValidationError[] = parseErrors.map((error) => ({
      line: error.line,
      column: error.column,
      message: error.message,
      severity: 'error' as const,
      path: undefined,
    }));

    // Generate warnings based on common XML issues
    const warnings = this.generateWarnings(xmlString);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate XML in real-time with debouncing (300ms delay)
   * Returns errors immediately for the current state, using cached results if within debounce window
   * @param xmlString - XML content to validate
   * @returns Array of validation errors (for editor feedback)
   */
  validateRealTime(xmlString: string): ValidationError[] {
    // Clear any pending timeout
    if (this.debounceState.timeoutId !== null) {
      clearTimeout(this.debounceState.timeoutId);
      this.debounceState.timeoutId = null;
    }

    // Store current XML string
    this.debounceState.lastXmlString = xmlString;

    // Return cached errors immediately (for UI responsiveness)
    if (this.debounceState.pendingErrors.length > 0) {
      const cachedErrors = [...this.debounceState.pendingErrors];

      // Schedule new validation
      this.scheduleValidation(xmlString);

      return cachedErrors;
    }

    // Perform immediate validation
    const result = this.validateXML(xmlString);
    this.debounceState.pendingErrors = result.errors;

    return result.errors;
  }

  /**
   * Schedule debounced validation
   * @param xmlString - XML content to validate
   */
  private scheduleValidation(xmlString: string): void {
    this.debounceState.timeoutId = setTimeout(() => {
      const result = this.validateXML(xmlString);
      this.debounceState.pendingErrors = result.errors;
      this.debounceState.timeoutId = null;
    }, 300);
  }

  /**
   * Generate warnings based on common XML issues
   * @param xmlString - XML content to analyze
   * @returns Array of validation warnings
   */
  private generateWarnings(xmlString: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!xmlString || xmlString.trim().length === 0) {
      return warnings;
    }

    const lines = xmlString.split('\n');

    // Check for common issues
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // Warn about XML declaration without encoding
      if (trimmedLine.startsWith('<?xml') && !trimmedLine.includes('encoding')) {
        warnings.push({
          line: lineNum,
          column: trimmedLine.indexOf('<?xml') + 1,
          message: 'XML declaration missing encoding attribute',
          suggestion: 'Add encoding="UTF-8" to your XML declaration',
        });
      }

      // Warn about self-closing tags that could be expanded
      // Skip XML declaration itself but check other tags on the same line
      const selfClosingMatches = trimmedLine.matchAll(/<(\w+)([^>]*)\/>/g);
      for (const match of selfClosingMatches) {
        const tagName = match[1];
        // Skip XML declaration
        if (tagName !== 'xml') {
          warnings.push({
            line: lineNum,
            column: match.index! + 1,
            message: `Self-closing tag <${tagName}> detected`,
            suggestion: 'Consider expanding to explicit opening and closing tags for clarity',
          });
        }
      }

      // Warn about very long lines
      if (line.length > 120) {
        warnings.push({
          line: lineNum,
          column: 120,
          message: `Line exceeds 120 characters (${line.length} total)`,
          suggestion: 'Consider breaking long lines for better readability',
        });
      }
    });

    return warnings;
  }

  /**
   * Format error message with helpful suggestions
   * @param error - Validation error to format
   * @returns Formatted error message with suggestions
   */
  formatErrorMessage(error: ValidationError): string {
    let formatted = `Line ${error.line}, Column ${error.column}: ${error.message}`;

    // Add suggestions for common errors
    const suggestion = this.getSuggestionForError(error);
    if (suggestion) {
      formatted += `\n\nSuggestion: ${suggestion}`;
    }

    return formatted;
  }

  /**
   * Get suggestion for fixing a specific error
   * @param error - Validation error
   * @returns Suggestion string or undefined
   */
  private getSuggestionForError(error: ValidationError): string | undefined {
    const message = error.message.toLowerCase();

    if (message.includes('unclosed') || message.includes('not closed')) {
      return 'Ensure all opening tags have corresponding closing tags';
    }

    if (message.includes('mismatch') || message.includes('unexpected')) {
      return 'Check for mismatched tags or incorrect tag nesting order';
    }

    if (message.includes('not well-formed')) {
      return 'Verify XML syntax: tags must be properly nested and closed';
    }

    if (message.includes('invalid')) {
      return 'Check for invalid characters or incorrect XML syntax';
    }

    return undefined;
  }

  /**
   * Cancel any pending debounced validation
   */
  cancelPendingValidation(): void {
    if (this.debounceState.timeoutId !== null) {
      clearTimeout(this.debounceState.timeoutId);
      this.debounceState.timeoutId = null;
    }
    this.debounceState.pendingErrors = [];
  }

  /**
   * Reset validator state
   */
  reset(): void {
    this.cancelPendingValidation();
    this.debounceState.lastXmlString = '';
  }

  /**
   * Validate a specific line of XML
   * Useful for line-by-line validation in editors
   * @param lineContent - Single line of XML content
   * @param lineNumber - Line number (1-based)
   * @returns Array of validation errors for this line
   */
  validateLine(lineContent: string, lineNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for unclosed opening tags
    const openTagMatch = lineContent.match(/<(\w+)[^>]*>/g);
    if (openTagMatch) {
      openTagMatch.forEach((tag) => {
        if (!tag.endsWith('/>')) {
          // Check if closing tag exists on the same line
          const tagName = tag.match(/<(\w+)/)?.[1];
          if (tagName) {
            const closeTagRegex = new RegExp(`</${tagName}>`);
            if (!lineContent.match(closeTagRegex)) {
              // This might be an error, but could also span multiple lines
              // We'll flag it as a potential error
              errors.push({
                line: lineNumber,
                column: lineContent.indexOf(tag) + 1,
                message: `Potentially unclosed tag <${tagName}>`,
                severity: 'warning',
              });
            }
          }
        }
      });
    }

    // Check for closing tags without opening tags
    const closeTagMatch = lineContent.match(/<\/(\w+)>/g);
    if (closeTagMatch) {
      closeTagMatch.forEach((tag) => {
        const tagName = tag.match(/<\/(\w+)>/)?.[1];
        if (tagName) {
          const openTagRegex = new RegExp(`<${tagName}[\\s>]`);
          if (!lineContent.match(openTagRegex)) {
            errors.push({
              line: lineNumber,
              column: lineContent.indexOf(tag) + 1,
              message: `Closing tag </${tagName}> without matching opening tag`,
              severity: 'error',
            });
          }
        }
      });
    }

    return errors;
  }

  /**
   * Get quick validation status (valid/invalid) without detailed errors
   * @param xmlString - XML content to validate
   * @returns true if XML is valid, false otherwise
   */
  isValid(xmlString: string): boolean {
    const result = this.validateXML(xmlString);
    return result.valid;
  }
}

// Export singleton instance
export const xmlValidator = new XMLValidator();

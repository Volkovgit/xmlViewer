/**
 * SchemaDecorationProvider
 *
 * Converts XSD validation errors into Monaco editor decorations.
 * Provides live visual feedback in the text editor with wavy underlines
 * and hover messages showing schema validation issues.
 */

import type { IModelDecoration, IModelDeltaDecoration } from 'monaco-editor';
import { validateXMLAgainstSchema } from '../XSDValidator';
import type { XSDSchema } from '../XSDParser';
import type { ValidationError } from '@/types';

/**
 * Provider class for creating and managing Monaco editor decorations
 * based on XSD schema validation errors.
 */
export class SchemaDecorationProvider {
  /**
   * Current decorations applied to the editor
   * Stored for potential future use (clearing, tracking, etc.)
   */
  private currentDecorations: string[] = [];

  /**
   * Get decorations for XML content based on schema validation.
   *
   * @param xmlContent - The XML document content to validate
   * @param schema - The parsed XSD schema to validate against
   * @returns Array of Monaco editor decorations
   */
  getDecorations(
    xmlContent: string,
    schema: XSDSchema
  ): IModelDeltaDecoration[] {
    // Validate the XML against the schema
    const errors = validateXMLAgainstSchema(xmlContent, schema);

    // Convert each error to a decoration
    const decorations: IModelDeltaDecoration[] = errors.map((error) =>
      this.errorToDecoration(error, xmlContent)
    );

    // Store decorations for tracking
    this.currentDecorations = decorations.map(() => 'decoration');

    return decorations;
  }

  /**
   * Convert a ValidationError to a Monaco IModelDeltaDecoration.
   *
   * @param error - The validation error to convert
   * @param xmlContent - The XML content (for line calculation)
   * @returns Monaco editor decoration object
   */
  private errorToDecoration(
    error: ValidationError,
    xmlContent: string
  ): IModelDeltaDecoration {
    // Calculate line/column position
    // Monaco uses 0-based line numbers, but our errors use 1-based
    const lineNumber = error.line - 1;

    // Get the line content to calculate the column range
    const lines = xmlContent.split('\n');
    const lineContent = lines[lineNumber] || '';

    // For now, highlight the entire line
    // TODO: In the future, we could highlight just the specific element/attribute
    const startColumn = error.column || 1;
    const endColumn = lineContent.length + 1;

    return {
      range: {
        startLineNumber: lineNumber,
        startColumn: startColumn - 1, // Monaco uses 0-based column
        endLineNumber: lineNumber,
        endColumn: endColumn,
      },
      options: {
        className: this.getClassName(error.severity),
        hoverMessage: {
          value: this.formatHoverMessage(error),
          isTrusted: true,
        },
        stickiness: 1, // NeverGrowsWhenTypingAtEdges
      },
    };
  }

  /**
   * Get the CSS class name for a given error severity.
   *
   * @param severity - The error severity ('error' | 'warning')
   * @returns CSS class name for styling
   */
  getClassName(severity: ValidationError['severity']): string {
    return severity === 'error' ? 'xml-schema-error' : 'xml-schema-warning';
  }

  /**
   * Format a validation error as a hover message.
   *
   * @param error - The validation error to format
   * @returns Formatted HTML message
   */
  private formatHoverMessage(error: ValidationError): string {
    const severityIcon = error.severity === 'error' ? '❌' : '⚠️';
    const pathInfo = error.path ? `<br/><small>Path: ${error.path}</small>` : '';

    return `**${severityIcon} Schema ${error.severity}**<br/>
${error.message}${pathInfo}`;
  }

  /**
   * Clear all current decorations.
   * Useful when switching documents or closing files.
   */
  clearDecorations(): void {
    this.currentDecorations = [];
  }

  /**
   * Get the current decorations count.
   *
   * @returns Number of active decorations
   */
  getDecorationsCount(): number {
    return this.currentDecorations.length;
  }
}

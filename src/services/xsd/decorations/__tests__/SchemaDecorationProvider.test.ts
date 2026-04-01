/**
 * Tests for SchemaDecorationProvider
 *
 * Verifies that validation errors are converted to Monaco editor decorations
 * with appropriate styling and hover messages.
 */

import { describe, it, expect } from 'vitest';
import { SchemaDecorationProvider } from '../SchemaDecorationProvider';
import type { XSDSchema } from '@/services/xsd/XSDParser';
import type { ValidationError } from '@/types';

describe('SchemaDecorationProvider', () => {
  it('should create decorations for missing required attribute', () => {
    const provider = new SchemaDecorationProvider();

    const xmlContent = `<book>
  <title>XML Guide</title>
</book>`;

    const schema: XSDSchema = {
      targetNamespace: '',
      elements: [
        {
          name: 'book',
          type: 'bookType',
          complexType: {
            name: 'bookType',
            attributes: [
              {
                name: 'isbn',
                type: 'string',
                use: 'required',
              },
            ],
            elements: [
              {
                name: 'title',
                type: 'string',
                occurrence: { minOccurs: 1, maxOccurs: 1 },
              },
            ],
          },
        },
      ],
      complexTypes: [],
      simpleTypes: [],
    };

    const decorations = provider.getDecorations(xmlContent, schema);

    // Should have at least one decoration for missing required attribute
    expect(decorations.length).toBeGreaterThanOrEqual(1);

    // Find the missing required attribute error
    const missingAttrError = decorations.find((d) =>
      d.options.hoverMessage?.value.includes('Missing required attribute "isbn"')
    );

    expect(missingAttrError).toBeDefined();
    expect(missingAttrError?.options.className).toBe('xml-schema-error');
  });

  it('should return empty array when no validation issues', () => {
    const provider = new SchemaDecorationProvider();

    const xmlContent = `<book isbn="1234567890">
  <title>XML Guide</title>
</book>`;

    const schema: XSDSchema = {
      targetNamespace: '',
      elements: [
        {
          name: 'book',
          type: 'bookType',
          complexType: {
            name: 'bookType',
            attributes: [
              {
                name: 'isbn',
                type: 'string',
                use: 'required',
              },
            ],
            elements: [
              {
                name: 'title',
                type: 'string',
                occurrence: { minOccurs: 1, maxOccurs: 1 },
              },
            ],
          },
        },
      ],
      complexTypes: [],
      simpleTypes: [],
    };

    const decorations = provider.getDecorations(xmlContent, schema);

    // Should have no decorations when all validation passes
    expect(decorations).toHaveLength(0);
  });

  it('should use warning class for warning severity', () => {
    const provider = new SchemaDecorationProvider();

    const error: ValidationError = {
      line: 1,
      column: 1,
      message: 'Unexpected attribute',
      severity: 'warning',
    };

    const className = provider.getClassName(error.severity);
    expect(className).toBe('xml-schema-warning');
  });

  it('should use error class for error severity', () => {
    const provider = new SchemaDecorationProvider();

    const error: ValidationError = {
      line: 1,
      column: 1,
      message: 'Missing required attribute',
      severity: 'error',
    };

    const className = provider.getClassName(error.severity);
    expect(className).toBe('xml-schema-error');
  });
});

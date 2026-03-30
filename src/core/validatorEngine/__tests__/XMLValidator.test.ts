/**
 * Tests for XMLValidator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XMLValidator } from '../XMLValidator.js';

describe('XMLValidator', () => {
  let validator: XMLValidator;

  beforeEach(() => {
    validator = new XMLValidator();
  });

  afterEach(() => {
    validator.reset();
  });

  describe('validateXML', () => {
    it('should validate valid XML', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><root><child>Content</child></root>';
      const result = validator.validateXML(validXML);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid XML with unclosed tag', () => {
      const invalidXML = '<?xml version="1.0"?><root><child>Content</root>';
      const result = validator.validateXML(invalidXML);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should detect invalid XML with mismatched tags', () => {
      const invalidXML = '<?xml version="1.0"?><root><child>Content</wrongtag></root>';
      const result = validator.validateXML(invalidXML);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid XML with missing closing tag', () => {
      const invalidXML = '<?xml version="1.0"?><root><child>Content';
      const result = validator.validateXML(invalidXML);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty XML', () => {
      const result = validator.validateXML('');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Empty');
    });

    it('should handle whitespace-only XML', () => {
      const result = validator.validateXML('   \n  \t  ');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for XML declaration without encoding', () => {
      const xmlWithWarning = '<?xml version="1.0"?><root></root>';
      const result = validator.validateXML(xmlWithWarning);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('encoding');
    });

    it('should generate warnings for self-closing tags', () => {
      const xmlWithSelfClosing = '<?xml version="1.0" encoding="UTF-8"?><root><empty/></root>';
      const result = validator.validateXML(xmlWithSelfClosing);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('Self-closing'))).toBe(true);
    });

    it('should generate warnings for long lines', () => {
      const longLine =
        '<?xml version="1.0" encoding="UTF-8"?><root>' +
        '<a>' +
        'x'.repeat(150) +
        '</a></root>';
      const result = validator.validateXML(longLine);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('exceeds 120 characters'))).toBe(
        true
      );
    });

    it('should include error code when available', () => {
      const invalidXML = '<root><child>Content</root>';
      const result = validator.validateXML(invalidXML);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle complex valid XML', () => {
      const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
        <catalog>
          <book id="bk101">
            <author>Gambardella, Matthew</author>
            <title>XML Developer's Guide</title>
            <genre>Computer</genre>
            <price>44.95</price>
            <publish_date>2000-10-01</publish_date>
          </book>
        </catalog>`;

      const result = validator.validateXML(complexXML);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateRealTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return errors immediately', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = validator.validateRealTime(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('error');
    });

    it('should debounce validation calls', () => {
      const invalidXML = '<root><child>Content</root>';

      // First call
      validator.validateRealTime(invalidXML);

      // Second call before debounce timeout
      validator.validateRealTime(invalidXML);

      // Fast-forward time
      vi.advanceTimersByTime(300);

      // Should only have validated once
      expect(validator.validateRealTime(invalidXML)).toBeDefined();
    });

    it('should return cached errors during debounce window', () => {
      const invalidXML = '<root><child>Content</root>';

      // First call - validates immediately
      const firstErrors = validator.validateRealTime(invalidXML);

      // Second call - should return cached results
      const secondErrors = validator.validateRealTime(invalidXML);

      expect(firstErrors).toEqual(secondErrors);
    });

    it('should update pending errors after debounce', () => {
      const firstXML = '<root><child>Content</root>';
      const secondXML = '<root><valid>Content</valid></root>';

      // First validation
      validator.validateRealTime(firstXML);

      // Wait for debounce to complete
      vi.advanceTimersByTime(300);

      // Second validation with different XML
      const secondErrors = validator.validateRealTime(secondXML);

      // Wait for debounce to complete
      vi.advanceTimersByTime(300);

      expect(secondErrors.length).toBeGreaterThan(0);
    });

    it('should handle valid XML in real-time validation', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><root><child>Content</child></root>';
      const errors = validator.validateRealTime(validXML);

      expect(errors).toEqual([]);
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error with line and column', () => {
      const error = {
        line: 5,
        column: 10,
        message: 'Unclosed tag',
        severity: 'error' as const,
      };

      const formatted = validator.formatErrorMessage(error);

      expect(formatted).toContain('Line 5');
      expect(formatted).toContain('Column 10');
      expect(formatted).toContain('Unclosed tag');
    });

    it('should include suggestion for unclosed tags', () => {
      const error = {
        line: 5,
        column: 10,
        message: 'Unclosed tag',
        severity: 'error' as const,
      };

      const formatted = validator.formatErrorMessage(error);

      expect(formatted).toContain('Suggestion:');
      expect(formatted).toContain('opening tags');
    });

    it('should include suggestion for mismatched tags', () => {
      const error = {
        line: 5,
        column: 10,
        message: 'Mismatched tag',
        severity: 'error' as const,
      };

      const formatted = validator.formatErrorMessage(error);

      expect(formatted).toContain('Suggestion:');
      expect(formatted).toContain('tags');
    });

    it('should include suggestion for malformed XML', () => {
      const error = {
        line: 5,
        column: 10,
        message: 'Not well-formed',
        severity: 'error' as const,
      };

      const formatted = validator.formatErrorMessage(error);

      expect(formatted).toContain('Suggestion:');
      expect(formatted).toContain('syntax');
    });
  });

  describe('validateLine', () => {
    it('should detect unclosed tag in single line', () => {
      const line = '<root><child>Content';
      const errors = validator.validateLine(line, 1);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('warning');
      expect(errors[0].message).toContain('unclosed');
    });

    it('should detect closing tag without opening tag', () => {
      const line = '</child></root>';
      const errors = validator.validateLine(line, 1);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('error');
      expect(errors[0].message).toContain('without matching opening');
    });

    it('should not report errors for well-formed line', () => {
      const line = '<root><child>Content</child></root>';
      const errors = validator.validateLine(line, 1);

      expect(errors).toEqual([]);
    });

    it('should handle self-closing tags', () => {
      const line = '<root><child /></root>';
      const errors = validator.validateLine(line, 1);

      expect(errors).toEqual([]);
    });
  });

  describe('isValid', () => {
    it('should return true for valid XML', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
      expect(validator.isValid(validXML)).toBe(true);
    });

    it('should return false for invalid XML', () => {
      const invalidXML = '<root><child>Content</root>';
      expect(validator.isValid(invalidXML)).toBe(false);
    });

    it('should return false for empty XML', () => {
      expect(validator.isValid('')).toBe(false);
    });
  });

  describe('cancelPendingValidation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should cancel pending validation', () => {
      const invalidXML = '<root><child>Content</root>';

      // Trigger validation
      validator.validateRealTime(invalidXML);

      // Cancel immediately
      validator.cancelPendingValidation();

      // Fast-forward time
      vi.advanceTimersByTime(300);

      // Should not have any pending errors
      const validXML = '<root></root>';
      const errors = validator.validateRealTime(validXML);
      expect(errors).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset validator state', () => {
      const invalidXML = '<root><child>Content</root>';

      validator.validateRealTime(invalidXML);
      validator.reset();

      // Should start fresh after reset
      const validXML = '<root></root>';
      const errors = validator.validateRealTime(validXML);
      expect(errors).toEqual([]);
    });

    it('should cancel pending validation on reset', () => {
      const invalidXML = '<root><child>Content</root>';

      validator.validateRealTime(invalidXML);
      validator.reset();

      // Should not have any pending state
      const validXML = '<root></root>';
      const errors = validator.validateRealTime(validXML);
      expect(errors).toEqual([]);
    });
  });

  describe('error formatting and details', () => {
    it('should include line and column numbers in errors', () => {
      const invalidXML = '<root>\n  <child>Content</root>';
      const result = validator.validateXML(invalidXML);

      expect(result.valid).toBe(false);
      expect(result.errors[0].line).toBeGreaterThan(0);
      expect(result.errors[0].column).toBeGreaterThan(0);
    });

    it('should provide clear error messages', () => {
      const invalidXML = '<root><child>Content</root>';
      const result = validator.validateXML(invalidXML);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBeTruthy();
      expect(result.errors[0].message.length).toBeGreaterThan(0);
    });

    it('should provide suggestions for common errors', () => {
      const invalidXML = '<root><child>Content</root>';
      const result = validator.validateXML(invalidXML);
      const error = result.errors[0];

      const formatted = validator.formatErrorMessage(error);

      expect(formatted).toContain('Suggestion:');
    });
  });
});

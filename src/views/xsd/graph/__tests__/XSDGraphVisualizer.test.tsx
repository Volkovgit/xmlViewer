import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { XSDGraphVisualizer } from '../XSDGraphVisualizer';
import type { XSDSchema } from '@/services/xsd';

describe('XSDGraphVisualizer', () => {
  const mockSchema: XSDSchema = {
    targetNamespace: 'http://example.com',
    elements: [
      {
        name: 'TestElement',
        type: 'TestType',
        occurrence: { minOccurs: 1, maxOccurs: 1 }
      }
    ],
    complexTypes: [
      {
        name: 'TestType',
        elements: [],
        attributes: [],
        mixed: false
      }
    ],
    simpleTypes: [],
    raw: ''
  };

  it('should render graph controls', () => {
    render(<XSDGraphVisualizer schema={mockSchema} />);
    expect(screen.getByText('Element:')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
  });

  it('should show empty state when schema has no elements', () => {
    const emptySchema: XSDSchema = {
      ...mockSchema,
      elements: []
    };
    render(<XSDGraphVisualizer schema={emptySchema} />);
    expect(screen.getByText('No elements found in schema')).toBeInTheDocument();
  });

  it('should populate element dropdown', () => {
    render(<XSDGraphVisualizer schema={mockSchema} />);
    const select = screen.getByLabelText('Element:');
    expect(select).toBeInTheDocument();
    expect(select.innerHTML).toContain('TestElement');
  });

  it('should build graph when element is selected', () => {
    const { container } = render(<XSDGraphVisualizer schema={mockSchema} />);
    const select = screen.getByLabelText('Element:');
    fireEvent.change(select, { target: { value: 'TestElement' } });
    const reactFlowContainer = container.querySelector('.react-flow');
    expect(reactFlowContainer).toBeInTheDocument();
  });

  it('should filter nodes on search', () => {
    render(<XSDGraphVisualizer schema={mockSchema} />);
    const searchInput = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    expect(searchInput).toHaveValue('Test');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TreeSearch } from '../TreeSearch';
import { XMLNode } from '@/services/xml/TreeBuilder';

describe('TreeSearch', () => {
  const mockTree: XMLNode = {
    id: 'root-1',
    name: 'root',
    attributes: {},
    children: [
      { id: 'child-1', name: 'firstName', value: 'John', attributes: {}, children: [], type: 'element' },
      { id: 'child-2', name: 'lastName', value: 'Doe', attributes: {}, children: [], type: 'element' },
      { id: 'child-3', name: 'email', value: 'john@example.com', attributes: {}, children: [], type: 'element' }
    ],
    type: 'element'
  };

  it('should render search input', () => {
    render(<TreeSearch tree={mockTree} onSearchResults={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search nodes...')).toBeInTheDocument();
  });

  it('should filter nodes based on search query', async () => {
    const onSearchResults = vi.fn();
    render(<TreeSearch tree={mockTree} onSearchResults={onSearchResults} />);

    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'john' } });

    await waitFor(() => {
      expect(onSearchResults).toHaveBeenCalled();
      const calls = onSearchResults.mock.calls;
      const lastCall = calls[calls.length - 1];
      const matchedIds = lastCall[0];

      expect(matchedIds).toContain('child-1');
      expect(matchedIds).toContain('child-3');
    });
  });

  it('should clear search when input is empty', () => {
    const onSearchResults = vi.fn();
    render(<TreeSearch tree={mockTree} onSearchResults={onSearchResults} />);

    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(onSearchResults).toHaveBeenCalledWith([]);
  });

  it('should show clear button when query exists', () => {
    render(<TreeSearch tree={mockTree} onSearchResults={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search nodes...');

    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    // After typing, clear button appears
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();

    // After clearing, button disappears
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });
});

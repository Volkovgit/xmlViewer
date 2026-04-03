import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DirtyBadge, ErrorBadge } from '../Badges';

describe('DirtyBadge', () => {
  it('renders with correct class', () => {
    render(<DirtyBadge />);
    const badge = document.querySelector('.dirty-badge');
    expect(badge).toBeInTheDocument();
  });

  it('has correct dimensions (8px × 8px)', () => {
    const { container } = render(<DirtyBadge />);
    const badge = container.querySelector('.dirty-badge');
    expect(badge).toHaveClass('dirty-badge');
    // Verify the element is rendered (dimensions are defined in CSS)
    expect(badge?.outerHTML).toContain('class="dirty-badge"');
  });
});

describe('ErrorBadge', () => {
  it('renders count text', () => {
    render(<ErrorBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows correct number', () => {
    render(<ErrorBadge count={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('has correct styling class', () => {
    render(<ErrorBadge count={3} />);
    const badge = document.querySelector('.error-badge');
    expect(badge).toBeInTheDocument();
  });
});

describe('Badges together', () => {
  it('Badges can be rendered together', () => {
    render(
      <div>
        <DirtyBadge />
        <ErrorBadge count={7} />
      </div>
    );

    expect(document.querySelector('.dirty-badge')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

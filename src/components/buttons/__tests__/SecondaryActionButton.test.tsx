import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecondaryActionButton } from '../SecondaryActionButton';

describe('SecondaryActionButton', () => {
  it('renders button text', () => {
    render(
      <SecondaryActionButton icon="FileText" onClick={() => {}}>
        Cancel
      </SecondaryActionButton>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Cancel');
  });

  it('renders icon', () => {
    render(
      <SecondaryActionButton icon="FileText" onClick={() => {}}>
        Cancel
      </SecondaryActionButton>
    );

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(button).toContainElement(svg);
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <SecondaryActionButton icon="FileText" onClick={handleClick}>
        Cancel
      </SecondaryActionButton>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state when disabled prop is true', () => {
    render(
      <SecondaryActionButton icon="FileText" onClick={() => {}} disabled>
        Cancel
      </SecondaryActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <SecondaryActionButton icon="FileText" onClick={handleClick} disabled>
        Cancel
      </SecondaryActionButton>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has correct CSS classes', () => {
    render(
      <SecondaryActionButton icon="FileText" onClick={() => {}}>
        Cancel
      </SecondaryActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('secondary-action-button');
  });
});

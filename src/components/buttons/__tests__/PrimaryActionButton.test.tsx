import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryActionButton } from '../PrimaryActionButton';

describe('PrimaryActionButton', () => {
  it('renders button text', () => {
    render(
      <PrimaryActionButton icon="Circle" onClick={() => {}}>
        Click Me
      </PrimaryActionButton>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('renders icon', () => {
    render(
      <PrimaryActionButton icon="Circle" onClick={() => {}}>
        Click Me
      </PrimaryActionButton>
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
      <PrimaryActionButton icon="Circle" onClick={handleClick}>
        Click Me
      </PrimaryActionButton>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state when disabled prop is true', () => {
    render(
      <PrimaryActionButton icon="Circle" onClick={() => {}} disabled>
        Click Me
      </PrimaryActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <PrimaryActionButton icon="Circle" onClick={handleClick} disabled>
        Click Me
      </PrimaryActionButton>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has correct CSS classes', () => {
    render(
      <PrimaryActionButton icon="Circle" onClick={() => {}}>
        Click Me
      </PrimaryActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('primary-action-button');
  });
});

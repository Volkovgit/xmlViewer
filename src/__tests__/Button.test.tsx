import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Simple test component
function Button({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} type="button">
      {children}
    </button>
  );
}

describe('Button Component', () => {
  it('renders button with text', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders children correctly', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
});

describe('DOM Testing', () => {
  it('creates and manipulates DOM elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Test content';
    expect(div.textContent).toBe('Test content');
  });

  it('checks element attributes', () => {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('disabled', 'true');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});

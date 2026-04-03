import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationPanel } from '../ValidationPanel';
import { ValidationError } from '@/types';

describe('ValidationPanel', () => {
  const mockErrors: ValidationError[] = [
    {
      path: '/root/child',
      message: 'Element is required',
      line: 10,
      column: 5,
      severity: 'error'
    },
    {
      path: '/root/@attr',
      message: 'Invalid attribute value',
      line: 0,
      column: 0,
      severity: 'warning'
    }
  ];

  it('should not render when not visible', () => {
    const { container } = render(
      <ValidationPanel errors={mockErrors} visible={false} />
    );

    expect(container.querySelector('.validation-panel')).not.toBeInTheDocument();
  });

  it('should not render when no errors', () => {
    const { container } = render(
      <ValidationPanel errors={[]} visible={true} />
    );

    expect(container.querySelector('.validation-panel')).not.toBeInTheDocument();
  });

  it('should render errors when visible', () => {
    render(<ValidationPanel errors={mockErrors} visible={true} />);

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/root/child')).toBeInTheDocument();
    expect(screen.getByText('Element is required')).toBeInTheDocument();
    expect(screen.getByText('Line 10')).toBeInTheDocument();
  });

  it('should call onErrorClick when error is clicked', () => {
    const handleErrorClick = vi.fn();

    render(
      <ValidationPanel
        errors={mockErrors}
        visible={true}
        onErrorClick={handleErrorClick}
      />
    );

    const errorItems = screen.getAllByText(/Element is required|Invalid attribute value/);
    fireEvent.click(errorItems[0]);

    expect(handleErrorClick).toHaveBeenCalledTimes(1);
    expect(handleErrorClick).toHaveBeenCalledWith(mockErrors[0]);
  });
});

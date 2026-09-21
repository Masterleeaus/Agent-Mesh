import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);
    fireEvent.click(screen.getByText('Save'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Save</Button>);
    fireEvent.click(screen.getByText('Save'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders spinner when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });

  it('applies fullWidth style', () => {
    render(<Button fullWidth>Full</Button>);
    const button = screen.getByText('Full').closest('button');
    expect(button?.style.width).toBe('100%');
  });

  it('renders icon on left by default', () => {
    render(<Button icon={<span data-testid="icon" />}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('has correct type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText('Submit').closest('button')?.type).toBe('submit');
  });
});

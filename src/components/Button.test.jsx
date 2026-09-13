import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText(/click me/i);
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement.tagName).toBe('BUTTON');
    expect(buttonElement).toHaveStyle('background-color: var(--color-primary)');
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const buttonElement = screen.getByText(/secondary/i);
    expect(buttonElement).toHaveStyle('background-color: rgba(0, 0, 0, 0)');
  });

  it('renders with utility variant', () => {
    render(<Button variant="utility">Utility</Button>);
    const buttonElement = screen.getByText(/utility/i);
    expect(buttonElement).toHaveStyle('background-color: var(--color-ink)');
    expect(buttonElement).toHaveStyle('padding: 8px 15px');
  });

  it('handles clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const buttonElement = screen.getByText(/clickable/i);
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire click when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    const buttonElement = screen.getByText(/disabled/i);
    expect(buttonElement).toBeDisabled();
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
    expect(buttonElement).toHaveStyle('opacity: 0.5');
    expect(buttonElement).toHaveStyle('cursor: not-allowed');
  });

  it('changes scale on mousedown and mouseup', () => {
    render(<Button>Scaling</Button>);
    const buttonElement = screen.getByText(/scaling/i);
    fireEvent.mouseDown(buttonElement);
    expect(buttonElement.style.transform).toBe('scale(0.95)');
    fireEvent.mouseUp(buttonElement);
    expect(buttonElement.style.transform).toBe('scale(1)');
    fireEvent.mouseLeave(buttonElement);
    expect(buttonElement.style.transform).toBe('scale(1)');
  });

  it('does not scale when disabled', () => {
    render(<Button disabled>Scaling Disabled</Button>);
    const buttonElement = screen.getByText(/scaling disabled/i);
    fireEvent.mouseDown(buttonElement);
    expect(buttonElement.style.transform).not.toBe('scale(0.95)');
  });
});

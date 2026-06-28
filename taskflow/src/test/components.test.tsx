/// <reference types="vitest/globals" />
import { render, screen } from './testUtils';
import { ThemeToggle } from '../components/ui/ThemeToggle';

describe('ThemeToggle', () => {
  it('renders a button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows current theme label', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/Light|Dark|Auto/);
  });
});

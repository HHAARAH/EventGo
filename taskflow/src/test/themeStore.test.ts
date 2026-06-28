import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../stores/useThemeStore';

// Reset store between tests
beforeEach(() => {
  useThemeStore.setState({ theme: 'system' });
  localStorage.clear();
});

describe('useThemeStore', () => {
  it('starts with system theme', () => {
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('setTheme changes theme and persists to localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('eventgo-theme')).toBe('dark');
  });

  it('setTheme applies dark class to document', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setTheme removes dark class for light theme', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

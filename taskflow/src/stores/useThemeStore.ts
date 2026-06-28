import { create } from 'zustand';
import type { Theme } from '../types';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'eventgo-theme';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const saved = (localStorage.getItem(THEME_KEY) as Theme) || 'system';
  applyTheme(saved);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (get().theme === 'system') applyTheme('system');
  });

  return {
    theme: saved,
    setTheme: (theme: Theme) => {
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
      set({ theme });
    },
  };
});

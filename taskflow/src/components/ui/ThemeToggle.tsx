import { useThemeStore } from '../../stores/useThemeStore';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const next: 'light' | 'dark' | 'system' =
    theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

  const labels: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'Auto',
  };

  const icons: Record<string, string> = {
    light: '☀',
    dark: '☾',
    system: '⟳',
  };

  return (
    <button
      onClick={() => setTheme(next)}
      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Current: ${labels[theme]}, click to switch to ${labels[next]}`}
    >
      <span className="mr-1">{icons[theme]}</span>
      {labels[theme]}
    </button>
  );
}

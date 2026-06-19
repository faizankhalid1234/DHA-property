import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ inverted = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();

  const iconClass = inverted
    ? 'text-white'
    : theme === 'dark'
      ? 'text-gold'
      : 'text-slate-600 dark:text-gold';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10 ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className={iconClass} />
      ) : (
        <Moon size={20} className={iconClass} />
      )}
    </button>
  );
}

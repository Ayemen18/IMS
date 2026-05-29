import { Icon } from './Icon'
import { useTheme } from '../../lib/theme'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors ${className}`}
      aria-label="Toggle theme"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
    </button>
  )
}

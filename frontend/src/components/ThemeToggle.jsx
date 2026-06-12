import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../context/DarkModeContext'

export default function ThemeToggle({ variant = 'switch', className = '' }) {
  const { darkMode, toggleDarkMode } = useDarkMode()

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`relative w-9 h-9 rounded-xl border border-border bg-surface hover:bg-surface-2 hover:border-border-strong flex items-center justify-center text-text-secondary transition-all duration-200 hover:text-text-primary active:scale-95 ${className}`}
      >
        <Sun size={15} className={`absolute transition-all duration-300 ${darkMode ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
        <Moon size={15} className={`absolute transition-all duration-300 ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group relative inline-flex items-center w-[64px] h-8 rounded-full border border-border bg-surface-2 hover:bg-surface-3 transition-colors duration-200 ${className}`}
    >
      <Sun size={12} className="absolute left-2 text-amber-500 opacity-80" />
      <Moon size={11} className="absolute right-2.5 text-brand-400 opacity-80" />
      <span className={`absolute top-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 shadow-md border border-border transition-transform duration-300 ease-spring flex items-center justify-center ${darkMode ? 'translate-x-[33px]' : 'translate-x-0.5'}`}>
        {darkMode ? <Moon size={12} className="text-brand-400" /> : <Sun size={12} className="text-amber-500" />}
      </span>
    </button>
  )
}

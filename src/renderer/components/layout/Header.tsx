import { ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import clsx from 'clsx'


interface HeaderProps {
  whatsappStatus?: 'connected' | 'disconnected' | 'connecting'
  onThemeToggle?: () => void
  isDark?: boolean
}

export function Header({
  whatsappStatus = 'connected',
  onThemeToggle,
  isDark = false,
}: HeaderProps): ReactNode {
  const statusConfig = {

    connected: { color: 'success', label: 'Conectado', dot: '🟢' },
    connecting: { color: 'warning', label: 'Conectando...', dot: '🟡' },
    disconnected: { color: 'danger', label: 'Desconectado', dot: '🔴' },
  }

  const status = statusConfig[whatsappStatus]

  return (
    <header className="fixed top-0 left-sidebar right-0 h-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between px-6 z-40">
      {/* Left - Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{status.dot}</span>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</p>
            <p
              className={clsx('text-xs font-semibold', {
                'text-green-600 dark:text-green-400': status.color === 'success',
                'text-yellow-600 dark:text-yellow-400': status.color === 'warning',
                'text-red-600 dark:text-red-400': status.color === 'danger',
              })}
            >
              {status.label}
            </p>
          </div>
        </div>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Alternar tema"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

    </header>
  )
}

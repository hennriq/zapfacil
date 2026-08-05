import { ReactNode } from 'react'
import {
  BarChart3,
  Users,
  MessageSquare,
  BarChart2,

  Settings,
  Lock,
} from 'lucide-react'

import clsx from 'clsx'

interface SidebarProps {
  currentPage?: string
  onNavigate?: (page: string) => void
}

const menuItems = [
  { id: 'mensageria', label: 'Mensageria', icon: MessageSquare },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'contacts', label: 'Contatos', icon: Users },

  { id: 'templates', label: 'Templates', icon: MessageSquare },

  { id: 'reports', label: 'Relatórios', icon: BarChart2 },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'license', label: 'Licença', icon: Lock },

]


export function Sidebar({ currentPage = 'dashboard', onNavigate }: SidebarProps): ReactNode {
  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar bg-gray-900 dark:bg-gray-950 text-white shadow-lg pt-6 overflow-y-auto border-r border-gray-800">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-lg">
            Z
          </div>
          <div>
            <h1 className="text-xl font-bold">ZapFacil</h1>
            <p className="text-xs text-gray-400">Automação WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-0 right-0 px-4 space-y-4 border-t border-gray-800 pt-4 mx-3">
        <div className="text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-300">Versão 2.0.0</p>
          <p>© 2026 ZapFacil Team</p>
        </div>
      </div>
    </aside>
  )
}

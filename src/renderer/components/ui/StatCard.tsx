import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  color?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

const colorClasses = {
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-700 dark:text-red-300',
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  className,
}: StatCardProps): ReactNode {
  const colors = colorClasses[color]

  return (
    <div className={clsx('card-md flex items-start justify-between', className)}>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {trend && (
          <div className={clsx('text-xs font-semibold', colors.text)}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      {Icon && (
        <div className={clsx('p-3 rounded-lg', colors.bg)}>
          <Icon className={clsx('w-6 h-6', colors.icon)} />
        </div>
      )}
    </div>
  )
}

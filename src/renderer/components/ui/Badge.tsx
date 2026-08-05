import { ReactNode } from 'react'
import clsx from 'clsx'

type BadgeColor = 'primary' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  variant?: 'solid' | 'outline'
  className?: string
}

const colorClasses = {
  primary: {
    solid: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
    outline: 'border border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300',
  },
  success: {
    solid: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
    outline: 'border border-success-300 text-success-700 dark:border-success-700 dark:text-success-300',
  },
  warning: {
    solid: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    outline: 'border border-warning-300 text-warning-700 dark:border-warning-700 dark:text-warning-300',
  },
  danger: {
    solid: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200',
    outline: 'border border-danger-300 text-danger-700 dark:border-danger-700 dark:text-danger-300',
  },
}

export function Badge({
  children,
  color = 'primary',
  variant = 'solid',
  className,
}: BadgeProps): ReactNode {
  return (
    <span className={clsx('badge', colorClasses[color][variant], className)}>
      {children}
    </span>
  )
}

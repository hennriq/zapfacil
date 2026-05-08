export interface AppSettings {
  general: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    autoUpdateCheckInterval: number
    enableNotifications: boolean
    betaUpdates: boolean
    telemetryEnabled: boolean
  }
  whatsapp: {
    autoReconnect: boolean
    reconnectDelay: number
    sessionTimeout: number
    enableAutoRead: boolean
  }
  chrome: {
    autoUpdate: boolean
    checkInterval: number
    version: string
  }
  backup: {
    autoBackup: boolean
    backupInterval: number
    backupPath: string
  }
}

export interface TelemetryEvent {
  name: string
  properties?: Record<string, string | number | boolean | null>
  timestamp?: string
}

export interface TelemetrySummary {
  totalEvents: number
  eventsByName: Record<string, number>
  lastEventAt?: string
}

export interface PerformanceSummary {
  timestamp: string
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  cpuUsageMs: number
}

export type FeedbackCategory = 'bug' | 'idea' | 'question' | 'other'

export interface FeedbackEntry {
  id?: string
  category: FeedbackCategory
  message: string
  email?: string
  createdAt?: string
  appVersion?: string
}

export const defaultAppSettings: AppSettings = {
  general: {
    theme: 'auto',
    language: 'pt-BR',
    autoUpdateCheckInterval: 24,
    enableNotifications: true,
    betaUpdates: false,
    telemetryEnabled: true,
  },
  whatsapp: {
    autoReconnect: true,
    reconnectDelay: 5000,
    sessionTimeout: 60000,
    enableAutoRead: false,
  },
  chrome: {
    autoUpdate: true,
    checkInterval: 24,
    version: '',
  },
  backup: {
    autoBackup: true,
    backupInterval: 7,
    backupPath: '',
  },
}

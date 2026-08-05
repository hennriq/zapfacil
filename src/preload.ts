import { contextBridge, ipcRenderer } from 'electron'
import { IContact, ISendResult, IValidationResult } from './shared/interfaces'
import { AppSettings, FeedbackEntry, PerformanceSummary, TelemetryEvent, TelemetrySummary } from './shared/appTypes'
import { LogEntry } from './main/services/LoggerService'

export interface AppStatus {
  ready: boolean
  chromeDriverPath: string
  chromeDriverVersion: string
  whatsappStatus: 'connected' | 'disconnected' | 'connecting'
}

export interface ChromeDriverUpdateStatus {
  updateAvailable?: boolean
  updated?: boolean
  currentVersion: string
  targetVersion?: string
  driverPath: string
  isDownloading?: boolean
  isInstalling?: boolean
}

export interface ElectronAPI {
  app: {
    getStatus: () => Promise<AppStatus>
    getSettings: () => Promise<AppSettings>
    saveSettings: (settings: AppSettings) => Promise<AppSettings>
    checkForUpdates: () => Promise<{ success: boolean }>
    installUpdate: () => Promise<{ installed: boolean }>
    getPerformanceSummary: () => Promise<PerformanceSummary>
    shutdown: () => Promise<{ ready: boolean }>
    onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void
    onLog: (callback: (entry: LogEntry) => void) => () => void
  }
  telemetry: {
    track: (event: TelemetryEvent) => Promise<{ recorded: boolean }>
    getSummary: () => Promise<TelemetrySummary>
  }
  feedback: {
    submit: (entry: FeedbackEntry) => Promise<FeedbackEntry>
    list: () => Promise<FeedbackEntry[]>
  }
  contacts: {
    importCsv: () => Promise<{
      canceled: boolean
      contacts: IContact[]
      validation?: IValidationResult
    }>
    exportCsv: (contacts: IContact[]) => Promise<{
      canceled: boolean
      filePath?: string
    }>
  }
  chromeDriver: {
    checkUpdate: () => Promise<ChromeDriverUpdateStatus>
    update: () => Promise<ChromeDriverUpdateStatus>
    onUpdateAvailable: (callback: (status: ChromeDriverUpdateStatus) => void) => () => void
  }
  whatsApp: {
    initialize: () => Promise<{ ready: boolean }>
    sendMessages: (contacts: IContact[], message: string) => Promise<{
      results: ISendResult[]
      canceled?: boolean
    }>
    cancelSending: () => Promise<{ canceled: boolean }>
    onAuthStatusChange?: (
      callback: (status: 'authenticated' | 'error' | 'pending') => void
    ) => () => void
  }
  backup: {
    selectDirectory: () => Promise<{ canceled: boolean; directoryPath: string }>
  }
}


const api: ElectronAPI = {
  app: {
    getStatus: () => ipcRenderer.invoke('app:get-status'),
    getSettings: () => ipcRenderer.invoke('app:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('app:save-settings', settings),
    checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('app:install-update'),
    getPerformanceSummary: () => ipcRenderer.invoke('app:get-performance-summary'),
    shutdown: () => ipcRenderer.invoke('app:shutdown'),
    onSettingsChanged: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings) => callback(settings)
      ipcRenderer.on('app:settings-changed', listener)
      return () => ipcRenderer.removeListener('app:settings-changed', listener)
    },
    onLog: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, entry: LogEntry) => callback(entry)
      ipcRenderer.on('app:log', listener)
      return () => ipcRenderer.removeListener('app:log', listener)
    },
  },
  telemetry: {
    track: (event) => ipcRenderer.invoke('telemetry:track', event),
    getSummary: () => ipcRenderer.invoke('telemetry:get-summary'),
  },
  feedback: {
    submit: (entry) => ipcRenderer.invoke('feedback:submit', entry),
    list: () => ipcRenderer.invoke('feedback:list'),
  },
  contacts: {
    importCsv: () => ipcRenderer.invoke('contacts:import-csv'),
    exportCsv: (contacts) => ipcRenderer.invoke('contacts:export-csv', contacts),
  },
  chromeDriver: {
    checkUpdate: () => ipcRenderer.invoke('chrome-driver:check-update'),
    update: () => ipcRenderer.invoke('chrome-driver:update'),
    onUpdateAvailable: (callback) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        status: ChromeDriverUpdateStatus
      ) => callback(status)
      ipcRenderer.on('chrome-driver:update-available', listener)
      return () => ipcRenderer.removeListener('chrome-driver:update-available', listener)
    },
  },
  whatsApp: {
    initialize: () => ipcRenderer.invoke('whatsapp:initialize'),
    sendMessages: (contacts, message) => ipcRenderer.invoke('whatsapp:send-messages', {
      contacts,
      message,
    }),
    cancelSending: () => ipcRenderer.invoke('whatsapp:cancel-send'),
  },
  backup: {
    selectDirectory: () => ipcRenderer.invoke('backup:select-directory'),
  },
}


contextBridge.exposeInMainWorld('electronAPI', api)

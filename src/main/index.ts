import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { logger, onLog } from './services/LoggerService'
import { getBootstrapService } from './services/BootstrapService'
import { IContact } from '../shared/interfaces'
import { AppSettings, FeedbackEntry, TelemetryEvent } from '../shared/appTypes'
import { SettingsService } from './services/SettingsService'
import { TelemetryService } from './services/TelemetryService'
import { FeedbackService } from './services/FeedbackService'
import { PerformanceService } from './services/PerformanceService'

const isDev = process.env.NODE_ENV === 'development'
const CHROME_DRIVER_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

let mainWindow: BrowserWindow | null = null
let ipcReady = false
let chromeDriverCheckTimer: NodeJS.Timeout | null = null
let autoUpdateCheckTimer: NodeJS.Timeout | null = null
let isCheckingChromeDriver = false
let settingsService: SettingsService | null = null
let telemetryService: TelemetryService | null = null
let feedbackService: FeedbackService | null = null
let performanceService: PerformanceService | null = null
let cachedAppSettings: AppSettings | null = null

interface ChromeDriverUpdatePayload {
  updateAvailable: boolean
  currentVersion: string
  targetVersion?: string
  driverPath: string
}

/**
 * Criar a janela principal da aplicação
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  })

  // Em produção, usar loadFile evita problemas com paths absolutos (ex.: /assets/* gerados pelo Vite)
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      startChromeDriverBackgroundChecks()
    }, 30000)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Criar menu
  createMenu()

  // Setup IPC listeners
  setupIPC()
}

/**
 * Criar menu da aplicação
 */
function createMenu(): void {
  const menu = Menu.buildFromTemplate([])
  Menu.setApplicationMenu(menu)
}

/**
 * Setup listeners IPC para comunicação com renderer
 */
function setupIPC(): void {
  if (ipcReady) {
    return
  }

  ipcReady = true
  const bootstrap = getBootstrapService()
  const settings = getSettingsService()
  const telemetry = getTelemetryService()
  const feedback = getFeedbackService()

  onLog((entry) => {
    mainWindow?.webContents.send('app:log', entry)
  })

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timer: NodeJS.Timeout | null = null
    try {
      return await new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms)
        promise.then(resolve).catch(() => resolve(fallback))
      })
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  ipcMain.handle('app:get-status', async () => {
    const chromeUpdater = bootstrap.getChromeUpdater()

    // Evita travar o renderer em Windows (algumas detecções podem demorar indefinidamente)
    const whatsappStatus = await withTimeout(
      bootstrap.getWhatsAppAutomation().getWhatsAppConnectionStatus(),
      8000,
      'connecting'
    )

    const chromeDriverVersion = await withTimeout(
      chromeUpdater.getCurrentVersion(),
      8000,
      'Nao instalado'
    )

    return {
      ready: bootstrap.isReady(),
      chromeDriverPath: chromeUpdater.getDriverPath(),
      chromeDriverVersion,
      whatsappStatus,
    }
  })

  ipcMain.handle('app:get-settings', async () => settings.getSettings())

  ipcMain.handle('app:save-settings', async (_event, appSettings: AppSettings) => {
    const normalized = await settings.saveSettings(appSettings)
    setAppSettings(normalized)
    if (mainWindow) {
      mainWindow.webContents.send('app:settings-changed', normalized)
    }
    return normalized
  })

  ipcMain.handle('app:check-for-updates', async () => {
    await checkAppUpdates()
    return { success: true }
  })

  ipcMain.handle('app:install-update', async () => {
    autoUpdater.quitAndInstall()
    return { installed: true }
  })

  ipcMain.handle('app:get-performance-summary', async () => getPerformanceService().getSummary())

  ipcMain.handle('telemetry:track', async (_event, event: TelemetryEvent) => {
    await telemetry.track(event)
    return { recorded: true }
  })

  ipcMain.handle('telemetry:get-summary', async () => telemetry.getSummary())

  ipcMain.handle('feedback:submit', async (_event, entry: FeedbackEntry) => feedback.submit(entry))

  ipcMain.handle('feedback:list', async () => feedback.list())

  ipcMain.handle('contacts:import-csv', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Importar contatos',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, contacts: [] }
    }

    const contacts = await bootstrap.getContactImporter().importFromCSV(result.filePaths[0])
    const validation = bootstrap.getContactImporter().validateContacts(contacts)
    return { canceled: false, contacts, validation }
  })

  ipcMain.handle('contacts:export-csv', async (_event, contacts: IContact[]) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Exportar contatos',
      defaultPath: `contacts_${Date.now()}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    await bootstrap.getContactImporter().exportToCSV(contacts, result.filePath)
    return { canceled: false, filePath: result.filePath }
  })

  console.log('IPC setup: registering backup:select-directory handler')
  ipcMain.handle('backup:select-directory', async () => {
    const settings = await getAppSettings()
    const initialPath = settings.backup.backupPath || app.getPath('home')

    logger.info('backup:select-directory - opening directory picker', { initialPath })

    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Selecionar pasta de backup',
      defaultPath: initialPath,
      properties: ['openDirectory'],
    })

    logger.info('backup:select-directory - result', {
      canceled: result.canceled,
      directoryPath: result.filePaths?.[0] || '',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, directoryPath: '' }
    }

    return { canceled: false, directoryPath: result.filePaths[0] }
  })

  ipcMain.handle('chrome-driver:check-update', async () => {
    return checkChromeDriverUpdates(false)
  })

  ipcMain.handle('chrome-driver:update', async () => {
    const chromeUpdater = bootstrap.getChromeUpdater()
    const driverPath = await chromeUpdater.downloadLatestDriver()
    return {
      updated: true,
      currentVersion: await chromeUpdater.getCurrentVersion(),
      driverPath,
    }
  })

  ipcMain.handle('whatsapp:initialize', async () => {
    await bootstrap.initialize()
    return { ready: bootstrap.isReady() }
  })

  ipcMain.handle(
    'whatsapp:send-messages',
    async (_event, payload: { contacts: IContact[]; message: string }) => {
      await bootstrap.ensureAutomationWindow()

      const automation = bootstrap.getWhatsAppAutomation()
      const results = await automation.sendMessageToContacts(payload.contacts, payload.message)

      return { results, canceled: automation.wasLastSendCanceled() }
    }
  )

  ipcMain.handle('whatsapp:cancel-send', async () => {
    bootstrap.getWhatsAppAutomation().cancelSending()
    return { canceled: true }
  })

  ipcMain.handle('app:shutdown', async () => {
    await bootstrap.shutdown()
    return { ready: bootstrap.isReady() }
  })
}

function getSettingsService(): SettingsService {
  if (!settingsService) {
    settingsService = new SettingsService(app.getPath('userData'), logger)
  }
  return settingsService
}

async function getAppSettings(): Promise<AppSettings> {
  if (!cachedAppSettings) {
    cachedAppSettings = await getSettingsService().getSettings()
  }
  return cachedAppSettings
}

function setAppSettings(settings: AppSettings): void {
  cachedAppSettings = settings
  configureAutoUpdater(settings)
  startAutoUpdateBackgroundChecks(settings.general.autoUpdateCheckInterval)
}

function getTelemetryService(): TelemetryService {
  if (!telemetryService) {
    telemetryService = new TelemetryService(app.getPath('userData'), getSettingsService(), logger)
  }
  return telemetryService
}

function getFeedbackService(): FeedbackService {
  if (!feedbackService) {
    feedbackService = new FeedbackService(app.getPath('userData'), logger)
  }
  return feedbackService
}

function getPerformanceService(): PerformanceService {
  if (!performanceService) {
    performanceService = new PerformanceService(logger)
  }
  return performanceService
}

function configureAutoUpdater(settings: AppSettings): void {
  autoUpdater.autoDownload = false
  autoUpdater.allowPrerelease = settings.general.betaUpdates
  autoUpdater.channel = settings.general.betaUpdates ? 'beta' : 'latest'
  logger.info(`Auto-updater configured for channel: ${autoUpdater.channel}`)
}

async function checkAppUpdates(): Promise<void> {
  try {
    const updateCheck = await autoUpdater.checkForUpdates()
    logger.info('App update check completed', updateCheck)
  } catch (error) {
    logger.warn('App update check failed', error)
  }
}

function startAutoUpdateBackgroundChecks(intervalHours: number): void {
  if (autoUpdateCheckTimer) {
    clearInterval(autoUpdateCheckTimer)
  }

  autoUpdateCheckTimer = setInterval(() => {
    checkAppUpdates().catch((error) => logger.warn('Background app update check failed', error))
  }, Math.max(1, intervalHours) * 60 * 60 * 1000)
}

async function checkChromeDriverUpdates(notifyRenderer: boolean): Promise<ChromeDriverUpdatePayload> {
  const settings = await getAppSettings()
  const chromeUpdater = getBootstrapService().getChromeUpdater()

  if (!settings.chrome.autoUpdate) {
    return {
      updateAvailable: false,
      currentVersion: await chromeUpdater.getCurrentVersion(),
      targetVersion: chromeUpdater.getTargetVersion(),
      driverPath: chromeUpdater.getDriverPath(),
    }
  }

  if (isCheckingChromeDriver) {
    return {
      updateAvailable: false,
      currentVersion: await chromeUpdater.getCurrentVersion(),
      targetVersion: chromeUpdater.getTargetVersion(),
      driverPath: chromeUpdater.getDriverPath(),
    }
  }

  isCheckingChromeDriver = true

  try {
    const updateAvailable = await chromeUpdater.checkForUpdates()
    
    const payload = {
      updateAvailable,
      currentVersion: await chromeUpdater.getCurrentVersion(),
      targetVersion: chromeUpdater.getTargetVersion(),
      driverPath: chromeUpdater.getDriverPath(),
    }

    // Notify renderer if update is available
    if (notifyRenderer && updateAvailable && mainWindow) {
      mainWindow.webContents.send('chrome-driver:update-available', payload)
      logger.info(`Update notification sent to renderer: ${payload.currentVersion} -> ${payload.targetVersion}`)
    }

    return payload
  } finally {
    isCheckingChromeDriver = false
  }
}

function startChromeDriverBackgroundChecks(): void {
  if (chromeDriverCheckTimer) {
    return
  }

  checkChromeDriverUpdates(true)
    .catch((error) => logger.warn('ChromeDriver update check failed', error))

  chromeDriverCheckTimer = setInterval(() => {
    checkChromeDriverUpdates(true)
      .catch((error) => logger.warn('ChromeDriver background update check failed', error))
  }, CHROME_DRIVER_CHECK_INTERVAL_MS)
}

function registerAutoUpdaterEvents(): void {
  autoUpdater.on('checking-for-update', () => {
    logger.info('Auto-updater: checking for update')
  })

  autoUpdater.on('update-available', (info) => {
    logger.info('Auto-updater: update available', info)
    mainWindow?.webContents.send('app:update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Auto-updater: no update available', info)
    mainWindow?.webContents.send('app:update-not-available', info)
  })

  autoUpdater.on('error', (error) => {
    logger.warn('Auto-updater error', error)
    mainWindow?.webContents.send('app:update-error', { message: String(error) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Auto-updater: update downloaded', info)
    mainWindow?.webContents.send('app:update-downloaded', info)
  })
}

/**
 * Inicializar app quando Electron estiver pronto
 */
app.on('ready', async () => {
  try {
    const settings = await getAppSettings()
    setAppSettings(settings)
    registerAutoUpdaterEvents()
  } catch (error) {
    logger.warn('Failed to load application settings on startup', error)
  }

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
      .catch((error) => logger.warn('Auto updater check failed', error))
  }

  // Não verificar ChromeDriver imediatamente no startup para evitar execuções visíveis do Chrome
  createWindow()
})

/**
 * Sair quando todas as janelas forem fechadas (exceto em macOS)
 */
app.on('window-all-closed', () => {
  if (chromeDriverCheckTimer) {
    clearInterval(chromeDriverCheckTimer)
    chromeDriverCheckTimer = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * Re-criar janela quando app é ativado (macOS)
 */
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error)
})

export { mainWindow }

import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { logger } from './services/LoggerService'
import { ChromeDriverService } from './services/ChromeDriverService'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

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
      contextIsolation: true,
      enableRemoteModule: false,
    },
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../renderer/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

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
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            logger.info('About clicked')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * Setup listeners IPC para comunicação com renderer
 */
function setupIPC(): void {
  // Exemplo de listener IPC
  ipcMain.on('app:ready', async (event) => {
    try {
      logger.info('App ready received from renderer')
      event.reply('app:ready-response', { success: true })
    } catch (error) {
      logger.error('Error handling app:ready', error)
      event.reply('app:ready-response', { success: false, error })
    }
  })
}

/**
 * Inicializar app quando Electron estiver pronto
 */
app.on('ready', () => {
  // Inicializar auto-updater
  autoUpdater.checkForUpdatesAndNotify()

  // Inicializar ChromeDriver
  ChromeDriverService.initialize()
    .then(() => logger.info('ChromeDriver initialized'))
    .catch((error) => logger.error('Failed to initialize ChromeDriver', error))

  createWindow()
})

/**
 * Sair quando todas as janelas forem fechadas (exceto em macOS)
 */
app.on('window-all-closed', () => {
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

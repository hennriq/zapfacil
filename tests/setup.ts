import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills para ambiente de teste
Object.assign(global, {
  TextEncoder,
  TextDecoder,
})

// Mock de variáveis de ambiente
process.env.NODE_ENV = 'test'
process.env.DEBUG = 'false'

// Mock de módulos que requerem runtime node
jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
    isQuit: jest.fn(() => false),
    getName: jest.fn(() => 'zapfacil'),
    getPath: jest.fn(() => 'C:\\Users\\test\\AppData\\Roaming\\ZapFacil'),
  },
  BrowserWindow: jest.fn(() => {
    let currentUrl = process.env.DEV_SERVER_URL || 'file://test'
    const webContents = {
      openDevTools: jest.fn(),
      once: jest.fn((_event, callback) => callback()),
      on: jest.fn(),
      getURL: jest.fn(() => currentUrl),
      executeJavaScript: jest.fn((script: string) => {
        if (script.includes('typeof window.api.importContacts')) return Promise.resolve(true)
        if (script.includes('window.api.getStatus')) return Promise.resolve({ ready: true })
        return Promise.resolve(true)
      }),
    }

    return {
      loadURL: jest.fn((url: string) => {
        currentUrl = url
        return Promise.resolve()
      }),
      isDestroyed: jest.fn(() => false),
      destroy: jest.fn(),
      webContents,
      on: jest.fn(),
    }
  }),
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn(),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
}))

jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
  },
}))

// Silence console methods unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Aumentar timeout de testes para operações assincronas
jest.setTimeout(10000)

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
    quit: jest.fn(),
    getName: jest.fn(() => 'zapfacil'),
  },
  BrowserWindow: jest.fn(() => ({
    loadURL: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
    },
    on: jest.fn(),
  })),
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

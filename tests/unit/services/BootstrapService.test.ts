/// <reference types="jest" />

import { BootstrapService, getBootstrapService } from '../../../src/main/services/BootstrapService'
import { LoggerService } from '../../../src/main/services/LoggerService'
import { ChromeDriverService } from '../../../src/main/services/ChromeDriverService'
import { WhatsAppAutomationService } from '../../../src/main/services/WhatsAppAutomationService'
import { ContactImportService } from '../../../src/main/services/ContactImportService'
import { ChromeUpdateService } from '../../../src/main/services/ChromeUpdateService'
import { PhoneValidationService } from '../../../src/main/services/PhoneValidationService'

// Mock all services
jest.mock('../../../src/main/services/LoggerService')
jest.mock('../../../src/main/services/ChromeDriverService')
jest.mock('../../../src/main/services/WhatsAppAutomationService')
jest.mock('../../../src/main/services/ContactImportService')
jest.mock('../../../src/main/services/ChromeUpdateService')
jest.mock('../../../src/main/services/PhoneValidationService')

describe('BootstrapService', () => {
  let service: BootstrapService
  let mockLogger: jest.Mocked<LoggerService>
  let mockChromeDriver: jest.Mocked<ChromeDriverService>
  let mockWhatsAppAutomation: jest.Mocked<WhatsAppAutomationService>
  let mockContactImporter: jest.Mocked<ContactImportService>
  let mockChromeUpdater: jest.Mocked<ChromeUpdateService>
  let mockPhoneValidator: jest.Mocked<PhoneValidationService>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock instances
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>

    mockPhoneValidator = {
      validate: jest.fn(),
    } as unknown as jest.Mocked<PhoneValidationService>

    mockChromeDriver = {
      initialize: jest.fn().mockResolvedValue(undefined),
      isSessionActive: jest.fn().mockResolvedValue(false),
      stop: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ChromeDriverService>

    mockWhatsAppAutomation = {
      openWhatsAppWeb: jest.fn().mockResolvedValue(undefined),
      waitForQRCodeScan: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<WhatsAppAutomationService>

    mockContactImporter = {
      importFromCSV: jest.fn(),
      validateContacts: jest.fn(),
    } as unknown as jest.Mocked<ContactImportService>

    mockChromeUpdater = {
      checkForUpdates: jest.fn().mockResolvedValue(false),
      downloadLatestDriver: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ChromeUpdateService>

    // Mock constructors
    ;(LoggerService as jest.Mock).mockReturnValue(mockLogger)
    ;(PhoneValidationService as jest.Mock).mockReturnValue(mockPhoneValidator)
    ;(ChromeDriverService.getInstance as jest.Mock).mockReturnValue(mockChromeDriver)
    ;(WhatsAppAutomationService as jest.Mock).mockReturnValue(mockWhatsAppAutomation)
    ;(ContactImportService as jest.Mock).mockReturnValue(mockContactImporter)
    ;(ChromeUpdateService as jest.Mock).mockReturnValue(mockChromeUpdater)

    service = new BootstrapService()
  })

  describe('constructor', () => {
    it('should create BootstrapService instance with all services', () => {
      expect(service).toBeDefined()
      expect(LoggerService).toHaveBeenCalledWith('BootstrapService')
      expect(PhoneValidationService).toHaveBeenCalledWith(mockLogger)
      expect(ChromeDriverService.getInstance).toHaveBeenCalledWith(mockLogger)
    })

    it('should initialize with uninitialized state', () => {
      expect(service.isReady()).toBe(false)
    })
  })

  describe('initialize', () => {
    it('should initialize all services in correct order', async () => {
      await service.initialize()

      expect(mockLogger.info).toHaveBeenCalledWith('Starting application initialization...')
      expect(mockChromeUpdater.checkForUpdates).toHaveBeenCalled()
      expect(mockChromeDriver.initialize).toHaveBeenCalled()
      expect(mockWhatsAppAutomation.openWhatsAppWeb).toHaveBeenCalled()
      expect(mockWhatsAppAutomation.waitForQRCodeScan).toHaveBeenCalledWith(120000)
      expect(mockLogger.info).toHaveBeenCalledWith('Application initialized successfully!')
    })

    it('should download update if available', async () => {
      ;(mockChromeUpdater.checkForUpdates as jest.Mock).mockResolvedValue(true)

      await service.initialize()

      expect(mockChromeUpdater.downloadLatestDriver).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Downloading ChromeDriver update...')
    })

    it('should not download update if not available', async () => {
      ;(mockChromeUpdater.checkForUpdates as jest.Mock).mockResolvedValue(false)

      await service.initialize()

      expect(mockChromeUpdater.downloadLatestDriver).not.toHaveBeenCalled()
    })

    it('should handle QR code scan timeout gracefully', async () => {
      ;(mockWhatsAppAutomation.waitForQRCodeScan as jest.Mock).mockRejectedValue(
        new Error('Timeout')
      )

      await service.initialize()

      expect(mockLogger.warn).toHaveBeenCalledWith('QR Code scan timeout - user may need to scan again')
      expect(service.isReady()).toBe(true)
    })

    it('should set isInitialized to true on success', async () => {
      expect(service.isReady()).toBe(false)

      await service.initialize()

      expect(service.isReady()).toBe(true)
    })

    it('should throw error if initialization fails', async () => {
      const error = new Error('Initialization failed')
      ;(mockChromeDriver.initialize as jest.Mock).mockRejectedValue(error)

      await expect(service.initialize()).rejects.toThrow('Initialization failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize application',
        error
      )
    })

    it('should log initialization steps', async () => {
      await service.initialize()

      expect(mockLogger.info).toHaveBeenCalledWith('Checking for ChromeDriver updates...')
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing ChromeDriver...')
      expect(mockLogger.info).toHaveBeenCalledWith('Opening WhatsApp Web...')
      expect(mockLogger.info).toHaveBeenCalledWith('Waiting for QR Code scan (2 minutes timeout)...')
    })
  })

  describe('shutdown', () => {
    it('should stop chrome driver and reset initialized state', async () => {
      await service.initialize()
      expect(service.isReady()).toBe(true)

      await service.shutdown()

      expect(mockChromeDriver.stop).toHaveBeenCalled()
      expect(service.isReady()).toBe(false)
      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down application...')
      expect(mockLogger.info).toHaveBeenCalledWith('Application shutdown complete')
    })

    it('should handle shutdown errors gracefully', async () => {
      const error = new Error('Shutdown failed')
      ;(mockChromeDriver.stop as jest.Mock).mockRejectedValue(error)

      await service.shutdown()

      expect(mockLogger.error).toHaveBeenCalledWith('Error during shutdown', error)
    })
  })

  describe('getters', () => {
    it('should return logger instance', () => {
      const logger = service.getLogger()
      expect(logger).toBe(mockLogger)
    })

    it('should return chrome driver instance', () => {
      const driver = service.getChromeDriver()
      expect(driver).toBe(mockChromeDriver)
    })

    it('should return whatsapp automation instance', () => {
      const automation = service.getWhatsAppAutomation()
      expect(automation).toBe(mockWhatsAppAutomation)
    })

    it('should return contact importer instance', () => {
      const importer = service.getContactImporter()
      expect(importer).toBe(mockContactImporter)
    })

    it('should return chrome updater instance', () => {
      const updater = service.getChromeUpdater()
      expect(updater).toBe(mockChromeUpdater)
    })

    it('should return correct initialization state', () => {
      expect(service.isReady()).toBe(false)
    })
  })
})

describe('getBootstrapService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return singleton instance', () => {
    const instance1 = getBootstrapService()
    const instance2 = getBootstrapService()

    expect(instance1).toBe(instance2)
  })

  it('should return BootstrapService instance', () => {
    const instance = getBootstrapService()
    expect(instance).toBeInstanceOf(BootstrapService)
  })
})

import { ILogger } from '../../shared/interfaces'
import { LoggerService } from './LoggerService'
import { ChromeDriverService } from './ChromeDriverService'
import { WhatsAppAutomationService } from './WhatsAppAutomationService'
import { ContactImportService } from './ContactImportService'
import { ChromeUpdateService } from './ChromeUpdateService'
import { PhoneValidationService } from './PhoneValidationService'

/**
 * BootstrapService - Coordena inicialização de todos os serviços
 * Segue Facade Pattern - fornece interface única para múltiplos serviços
 * Segue Single Responsibility - apenas coordena inicialização
 */
export class BootstrapService {
  private readonly logger: ILogger
  private chromeDriver: ChromeDriverService
  private whatsAppAutomation: WhatsAppAutomationService
  private contactImporter: ContactImportService
  private chromeUpdater: ChromeUpdateService
  private phoneValidator: PhoneValidationService
  private isInitialized = false

  constructor() {
    this.logger = new LoggerService('BootstrapService')
    this.phoneValidator = new PhoneValidationService(this.logger)
    this.chromeDriver = ChromeDriverService.getInstance(this.logger)
    this.whatsAppAutomation = new WhatsAppAutomationService(
      this.chromeDriver,
      this.logger,
      this.phoneValidator
    )
    this.contactImporter = new ContactImportService(this.logger, this.phoneValidator)
    this.chromeUpdater = new ChromeUpdateService(this.logger)
  }

  /**
   * Inicializar todos os serviços
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized && await this.chromeDriver.isSessionActive()) {
        this.logger.info('Application already initialized')
        return
      }

      this.logger.info('Starting application initialization...')

      // 1. Verificar e atualizar ChromeDriver se necessário
      this.logger.info('Checking for ChromeDriver updates...')
      const hasUpdate = await this.chromeUpdater.checkForUpdates()
      if (hasUpdate) {
        this.logger.info('Downloading ChromeDriver update...')
        await this.chromeUpdater.downloadLatestDriver()
        this.logger.info('ChromeDriver successfully updated')
      } else {
        this.logger.info('ChromeDriver is up to date')
      }

      // 2. Inicializar ChromeDriver
      this.logger.info('Initializing ChromeDriver...')
      await this.chromeDriver.initialize()

      // 3. Abrir WhatsApp Web
      this.logger.info('Opening WhatsApp Web...')
      await this.whatsAppAutomation.openWhatsAppWeb()

      // 4. Aguardar QR Code scan
      this.logger.info('Waiting for QR Code scan (2 minutes timeout)...')
      try {
        await this.whatsAppAutomation.waitForQRCodeScan(120000)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message === 'QR_LOGIN_REQUIRED') {
          this.isInitialized = false
          this.logger.warn('WhatsApp login required - user must link device before sending')
          throw new Error('Faça login no WhatsApp Web para continuar o envio')
        }

        this.logger.warn('QR Code scan timeout - user may need to scan again')
      }

      this.isInitialized = true
      this.logger.info('Application initialized successfully!')
    } catch (error) {
      this.logger.error('Failed to initialize application', error)
      throw error
    }
  }

  /**
   * Shutdown gracioso de todos os serviços
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down application...')
      await this.chromeDriver.stop()
      this.isInitialized = false
      this.logger.info('Application shutdown complete')
    } catch (error) {
      this.logger.error('Error during shutdown', error)
    }
  }

  async ensureAutomationWindow(): Promise<void> {
    if (this.isInitialized && await this.chromeDriver.isSessionActive()) {
      return
    }

    await this.initialize()
  }

  /**
   * Getters para acessar serviços
   */
  getLogger(): ILogger {
    return this.logger
  }

  getChromeDriver(): ChromeDriverService {
    return this.chromeDriver
  }

  getWhatsAppAutomation(): WhatsAppAutomationService {
    return this.whatsAppAutomation
  }

  getContactImporter(): ContactImportService {
    return this.contactImporter
  }

  getChromeUpdater(): ChromeUpdateService {
    return this.chromeUpdater
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

// Singleton instance
let bootstrapInstance: BootstrapService | null = null

export function getBootstrapService(): BootstrapService {
  if (!bootstrapInstance) {
    bootstrapInstance = new BootstrapService()
  }
  return bootstrapInstance
}

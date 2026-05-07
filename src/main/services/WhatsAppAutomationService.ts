import {
  IWhatsAppAutomation,
  IChromeDriverManager,
  ILogger,
  IContact,
  ISendResult,
} from '@shared/interfaces'
import { LoggerService } from './LoggerService'
import { PhoneValidationService } from './PhoneValidationService'
import { v4 as uuidv4 } from 'uuid'
import { WebUtility } from '@shared/utils/WebUtility'

/**
 * WhatsAppAutomationService implementa IWhatsAppAutomation
 * Segue Single Responsibility Principle - apenas automação WhatsApp
 * Segue Dependency Injection - recebe dependências (ChromeDriver, Logger, Phone Validator)
 * Segue Open/Closed Principle - aberto para extensão (novos métodos), fechado para modificação
 */
export class WhatsAppAutomationService implements IWhatsAppAutomation {
  private readonly chromeDriver: IChromeDriverManager
  private readonly logger: ILogger
  private readonly phoneValidator: PhoneValidationService
  private readonly whatsAppURL = 'https://web.whatsapp.com/'

  constructor(
    chromeDriver: IChromeDriverManager,
    logger?: ILogger,
    phoneValidator?: PhoneValidationService
  ) {
    this.chromeDriver = chromeDriver
    this.logger = logger || new LoggerService('WhatsAppAutomationService')
    this.phoneValidator = phoneValidator || new PhoneValidationService(this.logger)
  }

  /**
   * Envia mensagem para um único contato
   */
  async sendMessage(phone: string, message: string): Promise<void> {
    try {
      if (!this.validatePhoneNumber(phone)) {
        throw new Error(`Invalid phone number: ${phone}`)
      }

      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty')
      }

      const formattedPhone = this.phoneValidator.format(phone)
      const encodedMessage = WebUtility.encodeURLComponent(message)
      const url = `${this.whatsAppURL}send?phone=${formattedPhone}&text=${encodedMessage}`

      await this.chromeDriver.navigateTo(url)

      // Aguardar botão de envio aparecer
      const sendButton = await this.chromeDriver.findElement(
        "//span[@data-testid='send']",
        10000
      )

      if (sendButton) {
        await sendButton.click()
        this.logger.info(`Message sent to ${phone}`)
      }
    } catch (error) {
      this.logger.error(`Failed to send message to ${phone}`, error)
      throw error
    }
  }

  /**
   * Envia mensagem para múltiplos contatos
   * Segue o padrão de retornar resultados detalhados
   */
  async sendMessageToContacts(
    contacts: IContact[],
    message: string
  ): Promise<ISendResult[]> {
    const results: ISendResult[] = []

    for (const contact of contacts) {
      try {
        await this.sendMessage(contact.phone, message)
        results.push({
          contactId: contact.id,
          success: true,
          timestamp: new Date(),
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        results.push({
          contactId: contact.id,
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        })
        this.logger.error(`Error sending to contact ${contact.id}:`, error)
      }
    }

    this.logger.info(
      `Send operation completed. Success: ${results.filter((r) => r.success).length}/${results.length}`
    )
    return results
  }

  /**
   * Valida número de telefone
   */
  validatePhoneNumber(phone: string): boolean {
    return this.phoneValidator.validate(phone)
  }

  /**
   * Abre WhatsApp Web
   */
  async openWhatsAppWeb(): Promise<void> {
    try {
      await this.chromeDriver.navigateTo(this.whatsAppURL)
      this.logger.info('WhatsApp Web opened')
    } catch (error) {
      this.logger.error('Failed to open WhatsApp Web', error)
      throw error
    }
  }

  /**
   * Aguarda QR Code ser escaneado
   */
  async waitForQRCodeScan(timeoutMs: number = 120000): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Verificar se chat list está carregado (indica que foi autenticado)
        const chatList = await this.chromeDriver.findElement(
          "//div[@data-testid='chat-list']",
          3000
        )

        if (chatList) {
          this.logger.info('QR Code scanned successfully')
          return
        }
      } catch {
        // Continuar tentando
      }

      await this.delay(1000)
    }

    throw new Error('QR Code scan timeout')
  }

  /**
   * Helper para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

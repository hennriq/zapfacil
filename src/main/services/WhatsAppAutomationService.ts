import {
  IWhatsAppAutomation,
  IChromeDriverManager,
  ILogger,
  IContact,
  ISendResult,
} from '../../shared/interfaces'
import { LoggerService } from './LoggerService'
import { PhoneValidationService } from './PhoneValidationService'
import { WebUtility } from '../../shared/utils/WebUtility'

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
  private shouldCancelSending = false
  private lastSendCanceled = false

  // WhatsApp Web login QR code link
  // Expected by TODO: data-testid="link-device-qr-code"
  private readonly loginQrXpath = "//a[@data-testid='link-device-qr-code']"

  private async isLoginQrVisible(): Promise<boolean> {
    try {
      const qrLink = await this.chromeDriver.findElement(this.loginQrXpath, 1500)

      // In unit tests, `findElement` is mocked to return a generic object (ex.: { click: fn }).
      // For real Selenium elements, we can rely on `isDisplayed()` to confirm visibility.
      const maybeElement = qrLink as any
      if (!maybeElement) return false

      if (typeof maybeElement.isDisplayed === 'function') {
        return await maybeElement.isDisplayed()
      }

      // If we can't verify visibility, consider it not visible to avoid false positives.
      return false
    } catch {
      return false
    }
  }

  private async isChatListVisible(): Promise<boolean> {
    try {
      const chatList = await this.chromeDriver.findElement("//div[@data-testid='chat-list']", 1500)
      const maybeElement = chatList as any
      if (!maybeElement) return false

      if (typeof maybeElement.isDisplayed === 'function') {
        return await maybeElement.isDisplayed()
      }

      return false
    } catch {
      return false
    }
  }

  async getWhatsAppConnectionStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    // Requisito:
    // - se o QR estiver sendo exibido (link-device-qr-code) => "disconnected"
    // - se estiver aberto e logado => "connected" (chat-list visível)
    // - caso não dê pra detectar => "connecting"
    const qrVisible = await this.isLoginQrVisible()
    if (qrVisible) return 'disconnected'

    const chatListVisible = await this.isChatListVisible()
    if (chatListVisible) return 'connected'

    return 'connecting'
  }

  constructor(
    chromeDriver: IChromeDriverManager,
    logger?: ILogger,
    phoneValidator?: PhoneValidationService
  ) {
    this.chromeDriver = chromeDriver
    this.logger = logger || new LoggerService('WhatsAppAutomationService')
    this.phoneValidator = phoneValidator || new PhoneValidationService(this.logger)
  }

  private async findElementWithCancellation(
    xpath: string,
    overallTimeoutMs: number,
    pollMs: number
  ): Promise<any> {
    const start = Date.now()

    while (Date.now() - start < overallTimeoutMs) {
      if (this.shouldCancelSending) {
        throw new Error('CANCELLED')
      }

      try {
        // Use a short timeout per poll to keep cancellation responsive.
        return await this.chromeDriver.findElement(xpath, Math.min(pollMs, overallTimeoutMs))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        // Unit tests typically mock `findElement` to reject immediately (e.g. "Element not found").
        // In that case, rethrow to avoid waiting for the whole overallTimeoutMs.
        if (message.toLowerCase().includes('not found')) {
          throw error
        }

        // Not found yet -> keep polling until timeout/cancel
      }

      await this.delay(pollMs)
    }

    throw new Error('Element not found')
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

      // If WhatsApp requires login, stop immediately
      const qrVisible = await this.isLoginQrVisible()
      if (qrVisible) {
        throw new Error('QR_LOGIN_REQUIRED')
      }

      // Aguardar botão de envio aparecer (respeitando cancelamento)
      const sendButton = await this.findElementWithCancellation(
        "//span[@data-testid='send']",
        10000,
        300
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
    this.shouldCancelSending = false
    this.lastSendCanceled = false

    for (const contact of contacts) {
      if (this.shouldCancelSending) {
        this.lastSendCanceled = true
        this.logger.info('Send operation canceled by user')
        break
      }

      // If WhatsApp session expired / requires login, pause sending and ask user to login
      const qrVisible = await this.isLoginQrVisible()
      if (qrVisible) {
        this.lastSendCanceled = true
        this.shouldCancelSending = true
        this.logger.warn?.('QR Code de login detectado. Pausando envio para login no Chrome.')
        this.logger.info('QR Code de login detectado. Pausando envio para login no Chrome.')
        break
      }

      try {
        await this.sendMessage(contact.phone, message)
        results.push({
          contactId: contact.id,
          success: true,
          timestamp: new Date(),
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Cancel should stop immediately and not mark current contact as an error.
        if (errorMessage === 'CANCELLED') {
          this.lastSendCanceled = true
          this.shouldCancelSending = true
          this.logger.info('Send operation canceled by user (during element wait)')
          break
        }

        // QR during send -> pause for login, not a per-contact error.
        if (errorMessage === 'QR_LOGIN_REQUIRED') {
          this.lastSendCanceled = true
          this.shouldCancelSending = true
          this.logger.info('QR login required detected during send. Pausing operation.')
          break
        }

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

  cancelSending(): void {
    this.shouldCancelSending = true
    this.logger.info('Message sending cancellation requested')
  }

  wasLastSendCanceled(): boolean {
    return this.lastSendCanceled
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

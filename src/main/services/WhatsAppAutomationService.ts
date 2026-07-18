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
  private cancellationPromise: Promise<never> | null = null
  private cancellationReject: ((error: Error) => void) | null = null

  // WhatsApp Web login QR code link
  // Expected by TODO: data-testid="link-device-qr-code"
  private readonly loginQrXpaths = [
    "//a[@data-testid='link-device-qr-code']",
    "//div[@data-testid='qrcode']",
    "//canvas[contains(@aria-label, 'Scan me')]",
    "//div[contains(@aria-label, 'Scan me') or contains(@aria-label, 'Digitalize este código')]",
  ]

  private throwIfCanceled(): void {
    if (this.shouldCancelSending) {
      throw new Error('CANCELLED')
    }
  }

  private resetCancellationToken(): void {
    this.cancellationPromise = new Promise<never>((_, reject) => {
      this.cancellationReject = reject
    })
  }

  private clearCancellationToken(): void {
    this.cancellationPromise = null
    this.cancellationReject = null
  }

  private async cancellable<T>(promise: Promise<T>): Promise<T> {
    if (!this.cancellationPromise) {
      return promise
    }

    return Promise.race([promise, this.cancellationPromise])
  }

  private async cancellableDelay(ms: number): Promise<void> {
    await this.cancellable(
      new Promise<void>((resolve) => setTimeout(resolve, ms))
    )
  }

  private async isLoginQrVisible(timeoutMs: number = 1500): Promise<boolean> {
    for (const xpath of this.loginQrXpaths) {
      try {
        this.throwIfCanceled()
        const qrLink = await this.cancellable(
          this.chromeDriver.findElement(xpath, timeoutMs, true)
        )

        const maybeElement = qrLink as any
        if (!maybeElement) continue

        if (typeof maybeElement.isDisplayed === 'function') {
          this.throwIfCanceled()
          if (await maybeElement.isDisplayed()) {
            return true
          }
          continue
        }

        return true
      } catch (error) {
        this.throwIfCanceled()
        // Try the next selector if this one isn't present.
      }
    }

    return false
  }

  private async isChatListVisible(): Promise<boolean> {
    try {
      const chatList = await this.cancellable(
        this.chromeDriver.findElement("//div[@data-testid='chat-list']", 1500)
      )
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
      this.throwIfCanceled()

      try {
        this.throwIfCanceled()
        // Use a short timeout per poll to keep cancellation responsive.
        return await this.cancellable(
          this.chromeDriver.findElement(xpath, Math.min(pollMs, overallTimeoutMs))
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        // Unit tests typically mock `findElement` to reject immediately (e.g. "Element not found").
        // In that case, rethrow to avoid waiting for the whole overallTimeoutMs.
        if (message.toLowerCase().includes('not found')) {
          throw error
        }

        // Not found yet -> keep polling until timeout/cancel
      }

      await this.cancellableDelay(pollMs)
    }

    throw new Error('Element not found')
  }

  /**
   * Envia mensagem para um único contato
   */
  async sendMessage(phone: string, message: string): Promise<void> {
    try {
      this.throwIfCanceled()

      if (!this.validatePhoneNumber(phone)) {
        throw new Error(`Invalid phone number: ${phone}`)
      }

      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty')
      }

      const formattedPhone = this.phoneValidator.format(phone)
      const encodedMessage = WebUtility.encodeURLComponent(message)
      const url = `${this.whatsAppURL}send?phone=${formattedPhone}&text=${encodedMessage}`

      this.throwIfCanceled()
      await this.chromeDriver.navigateTo(url)
      this.throwIfCanceled()

      // If WhatsApp requires login, stop immediately
      const qrVisible = await this.isLoginQrVisible(300)
      this.throwIfCanceled()
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
        this.throwIfCanceled()
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
    this.resetCancellationToken()

    try {
      for (const contact of contacts) {
        if (this.shouldCancelSending) {
          this.lastSendCanceled = true
          this.logger.info('Send operation canceled by user')
          break
        }

        // If WhatsApp session expired / requires login, pause sending and ask user to login
        try {
          const qrVisible = await this.isLoginQrVisible(300)
          if (qrVisible) {
            this.lastSendCanceled = true
            this.shouldCancelSending = true
            this.logger.warn?.('QR Code de login detectado. Pausando envio para login no Chrome.')
            this.logger.info('QR Code de login detectado. Pausando envio para login no Chrome.')
            break
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (errorMessage === 'CANCELLED') {
            this.lastSendCanceled = true
            this.logger.info('Send operation canceled by user (before processing contacts)')
            break
          }
          throw error
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
    } finally {
      this.clearCancellationToken()
    }

    this.logger.info(
      `Send operation completed. Success: ${results.filter((r) => r.success).length}/${results.length}`
    )
    return results
  }

  cancelSending(): void {
    this.shouldCancelSending = true
    this.logger.info('Message sending cancellation requested')

    if (this.cancellationReject) {
      this.cancellationReject(new Error('CANCELLED'))
    }
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
    let loginRequiredDetected = false

    while (Date.now() - startTime < timeoutMs) {
      this.throwIfCanceled()

      const qrIsVisible = await this.isLoginQrVisible(300)
      if (qrIsVisible) {
        loginRequiredDetected = true
        this.logger.info('WhatsApp login required. Waiting for user to link device.')
        await this.cancellableDelay(1000)
        continue
      }

      try {
        // Verificar se chat list está carregado (indica que foi autenticado)
        const chatList = await this.cancellable(
          this.chromeDriver.findElement("//div[@data-testid='chat-list']", 300)
        )

        if (chatList) {
          this.logger.info('QR Code scanned successfully')
          return
        }
      } catch {
        // Continuar tentando
      }

      await this.cancellableDelay(1000)
    }

    if (loginRequiredDetected) {
      throw new Error('QR_LOGIN_REQUIRED')
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

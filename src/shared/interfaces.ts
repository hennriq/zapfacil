/**
 * Interface para logging - Dependency Injection Pattern
 * Segue Interface Segregation Principle (ISP)
 */
export interface ILogger {
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: any): void
  debug(message: string, data?: any): void
}

/**
 * Interface para gerenciamento do ChromeDriver
 * Segue Single Responsibility Principle (SRP)
 */
export interface IChromeDriverManager {
  initialize(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  navigateTo(url: string): Promise<void>
  findElement(selector: string, timeout?: number, suppressNotFoundErrors?: boolean): Promise<any>
  executeScript(script: string): Promise<any>
}

/**
 * Interface para automação WhatsApp
 * Segue Interface Segregation Principle
 */
export interface IWhatsAppAutomation {
  sendMessage(phone: string, message: string): Promise<void>
  sendMessageToContacts(contacts: IContact[], message: string): Promise<ISendResult[]>
  cancelSending(): void
  wasLastSendCanceled(): boolean
  validatePhoneNumber(phone: string): boolean
}

/**
 * Interface para importação de contatos
 * Segue Single Responsibility Principle
 */
export interface IContactImporter {
  importFromCSV(filePath: string): Promise<IContact[]>
  exportToCSV(contacts: IContact[], filePath: string): Promise<void>
  validateContacts(contacts: IContact[]): IValidationResult
}

/**
 * Interface para auto-update do Chrome
 */
export interface IChromeUpdateManager {
  checkForUpdates(): Promise<boolean>
  downloadLatestDriver(): Promise<string>
  getCurrentVersion(): Promise<string>
}

/**
 * Model: Contato (SOLID Compliant)
 */
export interface IContact {
  id: string
  name: string
  phone: string
  status?: 'pendente' | 'enviado' | 'erro'
}

/**
 * Model: Resultado de envio
 */
export interface ISendResult {
  contactId: string
  success: boolean
  error?: string
  timestamp: Date
}

/**
 * Resultado de validação
 */
export interface IValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

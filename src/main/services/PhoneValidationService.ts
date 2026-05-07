import { ILogger } from '@shared/interfaces'
import { LoggerService } from './LoggerService'

/**
 * PhoneValidationService - Valida e formata números de telefone
 * Segue Single Responsibility Principle - responsável apenas por validação de telefone
 * Segue DRY - reutilizável em toda a aplicação
 */
export class PhoneValidationService {
  private readonly logger: ILogger

  constructor(logger?: ILogger) {
    this.logger = logger || new LoggerService('PhoneValidationService')
  }

  /**
   * Valida se um número de telefone é válido
   * Aceita formatos: 11999999999, +5511999999999, (11)99999999
   */
  validate(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false
    }

    // Remover caracteres não-numéricos
    const cleaned = phone.replace(/\D/g, '')

    // Validar comprimento (11 a 15 dígitos - padrão internacional)
    if (cleaned.length < 10 || cleaned.length > 15) {
      this.logger.debug(`Invalid phone length: ${phone}`)
      return false
    }

    return true
  }

  /**
   * Formata número para o padrão WhatsApp
   * Retorna: 5511999999999
   */
  format(phone: string): string {
    if (!phone) {
      throw new Error('Phone number cannot be empty')
    }

    // Remover caracteres não-numéricos
    const cleaned = phone.replace(/\D/g, '')

    // Se não começar com código de país, adicionar 55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      return '55' + cleaned
    }

    if (!cleaned.startsWith('55') && cleaned.length < 11) {
      throw new Error('Invalid phone number format')
    }

    return cleaned
  }

  /**
   * Remove formatação de um número de telefone
   */
  unformat(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  /**
   * Extrai código de país de um número
   */
  extractCountryCode(phone: string): string {
    const cleaned = this.unformat(phone)

    // Assumindo Brasil por padrão se não houver prefixo +
    if (cleaned.startsWith('55')) {
      return '55'
    }

    return 'BR' // Padrão Brasil
  }
}

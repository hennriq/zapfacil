import {
  IContactImporter,
  IContact,
  IValidationResult,
  ILogger,
} from '../../shared/interfaces';
import { LoggerService } from './LoggerService';
import { PhoneValidationService } from './PhoneValidationService';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto'

/**
 * ContactImportService implementa IContactImporter
 * Segue Single Responsibility Principle - apenas importação/exportação de contatos
 * Segue Dependency Injection - recebe Logger e PhoneValidator como dependências
 */
export class ContactImportService implements IContactImporter {
  private readonly logger: ILogger
  private readonly phoneValidator: PhoneValidationService

  constructor(logger?: ILogger, phoneValidator?: PhoneValidationService) {
    this.logger = logger || new LoggerService('ContactImportService')
    this.phoneValidator = phoneValidator || new PhoneValidationService(this.logger)
  }

  /**
   * Importa contatos de arquivo CSV
   * Espera formato: name,phone (sem cabeçalho ou com cabeçalho na primeira linha)
   */
  async importFromCSV(filePath: string): Promise<IContact[]> {
    try {
      this.logger.info(`Importing contacts from ${filePath}`)

      const fileContent = await fs.readFile(filePath, 'utf-8')
      const lines = fileContent.split('\n').filter((line) => line.trim())

      const contacts: IContact[] = []
      let skipFirstLine = false

      // Verificar se primeira linha é cabeçalho
      const firstLine = lines[0]
      if (
        firstLine.toLowerCase().includes('name') ||
        firstLine.toLowerCase().includes('phone')
      ) {
        skipFirstLine = true
      }

      for (let i = skipFirstLine ? 1 : 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [name, phone] = line
          .split(',')
          .map((s) => s.trim().replace(/^"|"$/g, ''))

        if (name && phone) {
          if (this.phoneValidator.validate(phone)) {
            contacts.push({
              id: uuidv4(),
              name,
              phone,
              status: 'pendente',
            })
          } else {
            this.logger.warn(`Invalid phone number: ${phone} for contact ${name}`)
          }
        }
      }

      this.logger.info(`Imported ${contacts.length} contacts from ${filePath}`)
      return contacts
    } catch (error) {
      this.logger.error(`Failed to import contacts from ${filePath}`, error)
      throw error
    }
  }

  /**
   * Exporta contatos para arquivo CSV
   */
  async exportToCSV(contacts: IContact[], filePath: string): Promise<void> {
    try {
      this.logger.info(`Exporting ${contacts.length} contacts to ${filePath}`)

      const csvContent = [
        'name,phone,status',
        ...contacts.map(
          (c) => `"${c.name}","${c.phone}","${c.status || 'pendente'}"`
        ),
      ].join('\n')

      await fs.writeFile(filePath, csvContent, 'utf-8')

      this.logger.info(`Exported ${contacts.length} contacts to ${filePath}`)
    } catch (error) {
      this.logger.error(`Failed to export contacts to ${filePath}`, error)
      throw error
    }
  }

  /**
   * Valida lista de contatos
   */
  validateContacts(contacts: IContact[]): IValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!contacts || contacts.length === 0) {
      errors.push('No contacts provided')
      return {
        isValid: false,
        errors,
        warnings,
      }
    }

    for (const contact of contacts) {
      // Validar nome
      if (!contact.name || contact.name.trim().length === 0) {
        errors.push(`Contact ${contact.id} has no name`)
      }

      // Validar telefone
      if (!this.phoneValidator.validate(contact.phone)) {
        errors.push(`Contact ${contact.name} has invalid phone: ${contact.phone}`)
      }

      // Validar status
      if (contact.status && !['pendente', 'enviado', 'erro'].includes(contact.status)) {
        warnings.push(`Contact ${contact.name} has unknown status: ${contact.status}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
function uuidv4(): string {
  return randomUUID()
}


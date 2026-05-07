import { ContactImportService } from '@main/services/ContactImportService'
import { LoggerService } from '@main/services/LoggerService'
import { IContact } from '@shared/interfaces'
import { promises as fs } from 'fs'
import path from 'path'

// Mock fs.readFile e fs.writeFile
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}))

describe('ContactImportService', () => {
  let service: ContactImportService
  let logger: LoggerService

  beforeEach(() => {
    logger = new LoggerService('ContactImportService-Test')
    service = new ContactImportService(logger)
    jest.clearAllMocks()
  })

  describe('importFromCSV', () => {
    it('should import contacts from CSV without header', async () => {
      const csvContent = 'João Silva,11999999999\nMaria Santos,21888888888'
      ;(fs.readFile as jest.Mock).mockResolvedValue(csvContent)

      const result = await service.importFromCSV('test.csv')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('João Silva')
      expect(result[0].phone).toBe('11999999999')
      expect(result[0].status).toBe('pendente')
      expect(result[0].id).toBeDefined()
    })

    it('should import contacts from CSV with header', async () => {
      const csvContent = 'name,phone\nJoão Silva,11999999999'
      ;(fs.readFile as jest.Mock).mockResolvedValue(csvContent)

      const result = await service.importFromCSV('test.csv')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('João Silva')
    })

    it('should skip invalid phone numbers', async () => {
      const csvContent = 'João Silva,11999999999\nInvalid Person,123'
      ;(fs.readFile as jest.Mock).mockResolvedValue(csvContent)

      const result = await service.importFromCSV('test.csv')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('João Silva')
    })

    it('should skip empty lines', async () => {
      const csvContent = 'João Silva,11999999999\n\n\nMaria Santos,21888888888'
      ;(fs.readFile as jest.Mock).mockResolvedValue(csvContent)

      const result = await service.importFromCSV('test.csv')

      expect(result).toHaveLength(2)
    })

    it('should generate unique IDs for each contact', async () => {
      const csvContent = 'João Silva,11999999999\nMaria Santos,21888888888'
      ;(fs.readFile as jest.Mock).mockResolvedValue(csvContent)

      const result = await service.importFromCSV('test.csv')

      expect(result[0].id).not.toBe(result[1].id)
    })

    it('should throw on file read error', async () => {
      ;(fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'))

      await expect(service.importFromCSV('nonexistent.csv')).rejects.toThrow(
        'File not found'
      )
    })
  })

  describe('exportToCSV', () => {
    it('should export contacts to CSV', async () => {
      const contacts: IContact[] = [
        {
          id: '1',
          name: 'João Silva',
          phone: '11999999999',
          status: 'enviado',
        },
        {
          id: '2',
          name: 'Maria Santos',
          phone: '21888888888',
          status: 'pendente',
        },
      ]

      await service.exportToCSV(contacts, 'output.csv')

      expect(fs.writeFile).toHaveBeenCalled()
      const [filePath, content] = (fs.writeFile as jest.Mock).mock.calls[0]

      expect(filePath).toBe('output.csv')
      expect(content).toContain('name,phone,status')
      expect(content).toContain('João Silva')
      expect(content).toContain('Maria Santos')
      expect(content).toContain('enviado')
    })

    it('should use "pendente" as default status', async () => {
      const contacts: IContact[] = [
        {
          id: '1',
          name: 'João Silva',
          phone: '11999999999',
        },
      ]

      await service.exportToCSV(contacts, 'output.csv')

      const [_, content] = (fs.writeFile as jest.Mock).mock.calls[0]
      expect(content).toContain('pendente')
    })

    it('should throw on file write error', async () => {
      ;(fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write error'))

      const contacts: IContact[] = [
        {
          id: '1',
          name: 'Test',
          phone: '11999999999',
        },
      ]

      await expect(service.exportToCSV(contacts, 'output.csv')).rejects.toThrow(
        'Write error'
      )
    })
  })

  describe('validateContacts', () => {
    it('should validate list of valid contacts', () => {
      const contacts: IContact[] = [
        {
          id: '1',
          name: 'João Silva',
          phone: '11999999999',
          status: 'pendente',
        },
      ]

      const result = service.validateContacts(contacts)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should reject empty contact list', () => {
      const result = service.validateContacts([])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('No contacts provided')
    })

    it('should reject contacts with no name', () => {
      const contacts: IContact[] = [
        {
          id: '1',
          name: '',
          phone: '11999999999',
          status: 'pendente',
        },
      ]

      const result = service.validateContacts(contacts)

      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('no name')
    })

    it('should reject contacts with invalid phone', () => {
      const contacts: IContact[] = [
        {
          id: '1',
          name: 'João Silva',
          phone: '123',
          status: 'pendente',
        },
      ]

      const result = service.validateContacts(contacts)

      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('invalid phone')
    })

    it('should warn on unknown status', () => {
      const contacts: IContact[] = [
        {
          id: '1',
          name: 'João Silva',
          phone: '11999999999',
          status: 'unknown' as any,
        },
      ]

      const result = service.validateContacts(contacts)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('unknown status')
    })

    it('should handle null input', () => {
      const result = service.validateContacts(null as any)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('No contacts provided')
    })
  })
})

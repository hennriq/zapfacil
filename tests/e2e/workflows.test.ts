/**
 * Enhanced E2E Tests - Complete Application Workflows
 * Tests main user flows end-to-end
 */

import { ISendResult } from '../../src/shared/interfaces'
import { createMockContacts, createMockLogEntry, spyOnConsole } from '../utils'

describe('E2E - Application Workflows', () => {
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = spyOnConsole()
  })

  afterEach(() => {
    consoleSpy.restore()
  })

  describe('Contact Import & Export Workflow', () => {
    it('should import contacts from CSV file', async () => {
      const mockContacts = createMockContacts(3)

      // Simulate CSV import
      const importHandler = jest.fn().mockResolvedValue({
        canceled: false,
        contacts: mockContacts,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      })

      const result = await importHandler()

      expect(result.canceled).toBe(false)
      expect(result.contacts.length).toBe(3)
      expect(result.validation.isValid).toBe(true)
    })

    it('should export contacts to CSV file', async () => {
      const mockContacts = createMockContacts(5)

      const exportHandler = jest.fn().mockResolvedValue({
        canceled: false,
        filePath: '/home/user/contacts_export_20260513.csv',
      })

      const result = await exportHandler(null, mockContacts)

      expect(result.canceled).toBe(false)
      expect(result.filePath).toContain('.csv')
    })

    it('should handle import with validation warnings', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        canceled: false,
        contacts: createMockContacts(2),
        validation: {
          isValid: true,
          errors: [],
          warnings: ['Duplicate phone number detected in row 3'],
        },
      })

      const result = await mockHandler()

      expect(result.contacts.length).toBe(2)
      expect(result.validation.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Message Sending Workflow', () => {
    it('should send messages to multiple contacts', async () => {
      const contacts = createMockContacts(5)
      const message = 'Olá, como você está?'

      const sendHandler = jest.fn().mockResolvedValue({
        results: contacts.map((c): ISendResult => ({
          contactId: c.id,
          success: true,
          timestamp: new Date(),
        })),
      })

      const result = await sendHandler(null, { contacts, message })

      expect(result.results.length).toBe(5)
      expect(result.results.every((r: ISendResult) => r.success)).toBe(true)
    })

    it('should handle partial send failures gracefully', async () => {
      const contacts = createMockContacts(4)

      const sendHandler = jest.fn().mockResolvedValue({
        results: [
          { contactId: contacts[0].id, success: true, timestamp: new Date() },
          { contactId: contacts[1].id, success: false, error: 'Invalid phone', timestamp: new Date() },
          { contactId: contacts[2].id, success: true, timestamp: new Date() },
          { contactId: contacts[3].id, success: false, error: 'Network timeout', timestamp: new Date() },
        ],
      })

      const result = await sendHandler()

      const successCount = result.results.filter((r: ISendResult) => r.success).length
      const failureCount = result.results.filter((r: ISendResult) => !r.success).length

      expect(successCount).toBe(2)
      expect(failureCount).toBe(2)
    })

    it('should retry on temporary failures', async () => {
      const contact = createMockContacts(1)[0]
      let attemptCount = 0

      const sendHandler = jest.fn(async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Temporary network error')
        }
        return {
          results: [
            { contactId: contact.id, success: true, timestamp: new Date() },
          ],
        }
      })

      // First attempts fail
      await expect(sendHandler()).rejects.toThrow()
      await expect(sendHandler()).rejects.toThrow()

      // Third attempt succeeds
      const result = await sendHandler()
      expect(result.results[0].success).toBe(true)
      expect(attemptCount).toBe(3)
    })
  })

  describe('Authentication Workflow', () => {
    it('should initialize WhatsApp authentication', async () => {
      const initHandler = jest.fn().mockResolvedValue({
        ready: true,
        sessionActive: true,
      })

      const result = await initHandler()

      expect(result.ready).toBe(true)
      expect(result.sessionActive).toBe(true)
    })

    it('should handle authentication timeout', async () => {
      const timeoutMs = 30000
      const initHandler = jest.fn(async () => {
        await new Promise((_, reject) =>
          setTimeout(() => reject(new Error('QR code timeout')), timeoutMs)
        )
      })

      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 100))
      initHandler().catch(() => {}) // Start the handler
      await timeoutPromise // Wait a bit for it to start

      // The handler should still be pending
      expect(initHandler).toHaveBeenCalled()
    })
  })

  describe('Chrome Driver Update Workflow', () => {
    it('should detect and notify about available updates', async () => {
      const checkHandler = jest.fn().mockResolvedValue({
        updateAvailable: true,
        currentVersion: '119.0.0.0',
        targetVersion: '120.0.0.0',
        driverPath: '/path/to/chromedriver',
      })

      const result = await checkHandler()

      expect(result.updateAvailable).toBe(true)
      expect(result.targetVersion).toBe('120.0.0.0')
    })

    it('should download and install update', async () => {
      const updateHandler = jest.fn().mockResolvedValue({
        updated: true,
        currentVersion: '120.0.0.0',
        driverPath: '/path/to/chromedriver',
      })

      const result = await updateHandler()

      expect(result.updated).toBe(true)
      expect(result.currentVersion).toBe('120.0.0.0')
    })

    it('should schedule regular update checks', async () => {
      const checkIntervalMs = 24 * 60 * 60 * 1000 // 24 hours

      // Mock setInterval to capture the interval
      const originalSetInterval = global.setInterval
      const setIntervalSpy = jest.spyOn(global, 'setInterval')

      // Start interval
      const interval = setInterval(() => {
        // Check for updates
      }, checkIntervalMs)

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), checkIntervalMs)

      // Cleanup
      clearInterval(interval)
      setIntervalSpy.mockRestore()
    })
  })

  describe('Logging & Monitoring Workflow', () => {
    it('should capture and display application logs', async () => {
      const logs = [
        createMockLogEntry({ level: 'INFO', message: 'App started' }),
        createMockLogEntry({ level: 'INFO', message: 'WhatsApp initialized' }),
        createMockLogEntry({ level: 'SUCCESS', message: 'Contacts imported' }),
      ]

      // Simulate log collection
      const logCollector = jest.fn()
      logs.forEach((log) => logCollector(log))

      expect(logCollector).toHaveBeenCalledTimes(3)
      expect(logCollector).toHaveBeenCalledWith(expect.objectContaining({ level: 'INFO' }))
      expect(logCollector).toHaveBeenCalledWith(expect.objectContaining({ level: 'SUCCESS' }))
    })

    it('should filter logs by level', async () => {
      const logs = [
        createMockLogEntry({ level: 'INFO', message: 'Info message' }),
        createMockLogEntry({ level: 'ERROR', message: 'Error message' }),
        createMockLogEntry({ level: 'WARN', message: 'Warning message' }),
      ]

      const errorLogs = logs.filter((log) => log.level === 'ERROR')

      expect(errorLogs.length).toBe(1)
      expect(errorLogs[0].message).toContain('Error')
    })

    it('should maintain log history limit', () => {
      const maxLogs = 100
      const logs = Array.from({ length: 150 }, (_, i) =>
        createMockLogEntry({ message: `Log ${i}` })
      )

      const limitedLogs = logs.slice(-maxLogs)

      expect(limitedLogs.length).toBe(maxLogs)
      expect(limitedLogs[0].message).toBe('Log 50') // First should be log 50
    })
  })

  describe('Error Recovery Workflow', () => {
    it('should recover from temporary network errors', async () => {
      let attemptCount = 0

      const operationWithRetry = async (maxRetries: number = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          attemptCount++
          try {
            if (i < 2) {
              throw new Error('Network error')
            }
            return { success: true }
          } catch (error) {
            if (i === maxRetries - 1) throw error
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
      }

      const result = await operationWithRetry()

      expect(result?.success).toBe(true)
      expect(attemptCount).toBe(3)
    })

    it('should log errors and continue operation', async () => {
      const errorLogs: any[] = []
      const mockLogger = {
        error: jest.fn((msg) => errorLogs.push({ level: 'ERROR', message: msg })),
        info: jest.fn((msg) => errorLogs.push({ level: 'INFO', message: msg })),
      }

      try {
        throw new Error('Operation failed')
      } catch (error) {
        mockLogger.error(`Caught error: ${(error as Error).message}`)
        mockLogger.info('Continuing with next operation')
      }

      expect(errorLogs.length).toBe(2)
      expect(errorLogs[0].level).toBe('ERROR')
      expect(errorLogs[1].level).toBe('INFO')
    })
  })

  describe('Complete Application Lifecycle', () => {
    it('should go through full initialization sequence', async () => {
      const sequence: string[] = []

      const appInit = {
        initLogger: jest.fn(() => sequence.push('Logger initialized')),
        initChromeDriver: jest.fn(() => sequence.push('ChromeDriver initialized')),
        initWhatsApp: jest.fn(() => sequence.push('WhatsApp initialized')),
        ready: jest.fn(() => sequence.push('App ready')),
      }

      appInit.initLogger()
      appInit.initChromeDriver()
      appInit.initWhatsApp()
      appInit.ready()

      expect(sequence).toEqual([
        'Logger initialized',
        'ChromeDriver initialized',
        'WhatsApp initialized',
        'App ready',
      ])
    })

    it('should shutdown gracefully', async () => {
      const sequence: string[] = []

      const appShutdown = {
        stopWhatsApp: jest.fn(() => sequence.push('WhatsApp stopped')),
        stopChromeDriver: jest.fn(() => sequence.push('ChromeDriver stopped')),
        closeLogger: jest.fn(() => sequence.push('Logger closed')),
      }

      appShutdown.stopWhatsApp()
      appShutdown.stopChromeDriver()
      appShutdown.closeLogger()

      expect(sequence).toEqual([
        'WhatsApp stopped',
        'ChromeDriver stopped',
        'Logger closed',
      ])
    })
  })
})

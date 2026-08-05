/// <reference types="jest" />

import { WhatsAppAutomationService } from '../../../src/main/services/WhatsAppAutomationService'
import { IChromeDriverManager, IContact } from '../../../src/shared/interfaces'
import { LoggerService } from '../../../src/main/services/LoggerService'
import { PhoneValidationService } from '../../../src/main/services/PhoneValidationService'

describe('WhatsAppAutomationService', () => {
  let service: WhatsAppAutomationService
  let mockChromeDriver: jest.Mocked<IChromeDriverManager>
  let logger: LoggerService
  let phoneValidator: PhoneValidationService

  beforeEach(() => {
    logger = new LoggerService('WhatsAppAutomationService-Test')
    phoneValidator = new PhoneValidationService(logger)

    mockChromeDriver = {
      initialize: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      navigateTo: jest.fn(),
      findElement: jest.fn(),
      executeScript: jest.fn(),
    }

    service = new WhatsAppAutomationService(mockChromeDriver, logger, phoneValidator)
  })

  describe('validatePhoneNumber', () => {
    it('should validate valid phone numbers', () => {
      expect(service.validatePhoneNumber('11999999999')).toBe(true)
      expect(service.validatePhoneNumber('5511999999999')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(service.validatePhoneNumber('123')).toBe(false)
      expect(service.validatePhoneNumber('')).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('should send message to valid contact', async () => {
      const mockButton = {
        click: jest.fn(),
      }

      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock).mockResolvedValue(mockButton)

      await service.sendMessage('11999999999', 'Hello')

      expect(mockChromeDriver.navigateTo).toHaveBeenCalled()
      expect(mockChromeDriver.findElement).toHaveBeenCalled()
      expect(mockButton.click).toHaveBeenCalled()
    })

    it('should throw on invalid phone number', async () => {
      await expect(service.sendMessage('123', 'Hello')).rejects.toThrow(
        'Invalid phone number'
      )
    })

    it('should throw on empty message', async () => {
      await expect(service.sendMessage('11999999999', '')).rejects.toThrow(
        'Message cannot be empty'
      )

      await expect(service.sendMessage('11999999999', '   ')).rejects.toThrow(
        'Message cannot be empty'
      )
    })

    it('should format phone number correctly in URL', async () => {
      const mockButton = { click: jest.fn() }
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock).mockResolvedValue(mockButton)

      await service.sendMessage('11999999999', 'Hello')

      const callArgs = (mockChromeDriver.navigateTo as jest.Mock).mock.calls[0][0]
      expect(callArgs).toContain('5511999999999')
      expect(callArgs).toContain('web.whatsapp.com')
    })

    it('should handle findElement timeout', async () => {
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )

      await expect(service.sendMessage('11999999999', 'Hello')).rejects.toThrow(
        'Element not found'
      )
    })
  })

  describe('sendMessageToContacts', () => {
    it('should send messages to multiple contacts', async () => {
      const contacts: IContact[] = [
        { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
        { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
      ]

      const mockButton = { click: jest.fn() }
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock).mockResolvedValue(mockButton)

      const results = await service.sendMessageToContacts(
        contacts,
        'Hello everyone'
      )

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(mockChromeDriver.navigateTo).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures', async () => {
      const contacts: IContact[] = [
        { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
        { id: '2', name: 'Invalid', phone: '123', status: 'pendente' },
      ]

      const mockButton = { click: jest.fn() }
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock).mockResolvedValue(mockButton)

      const results = await service.sendMessageToContacts(
        contacts,
        'Hello'
      )

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBeDefined()
    })

    it('should include timestamp in results', async () => {
      const contacts: IContact[] = [
        { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
      ]

      const mockButton = { click: jest.fn() }
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock).mockResolvedValue(mockButton)

      const results = await service.sendMessageToContacts(contacts, 'Hello')

      expect(results[0].timestamp).toBeInstanceOf(Date)
    })

    it('should continue sending even if one fails', async () => {
      const contacts: IContact[] = [
        { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
        { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
      ]

      let callCount = 0
      ;(mockChromeDriver.navigateTo as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new Error('Network error')
        }
        return Promise.resolve()
      })

      const mockButton = { click: jest.fn() }
      ;(mockChromeDriver.findElement as jest.Mock).mockResolvedValue(mockButton)

      const results = await service.sendMessageToContacts(contacts, 'Hello')

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(false)
      expect(results[1].success).toBe(true)
    })

    it('should stop sending after cancellation is requested', async () => {
      const contacts: IContact[] = [
        { id: '1', name: 'JoÃ£o', phone: '11999999999', status: 'pendente' },
        { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
      ]

      jest.spyOn(service, 'sendMessage').mockImplementation(async () => {
        service.cancelSending()
      })

      const results = await service.sendMessageToContacts(contacts, 'Hello')

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(service.wasLastSendCanceled()).toBe(true)
    })

    it('should cancel sendMessageToContacts immediately during Selenium wait', async () => {
      const contacts: IContact[] = [
        { id: '1', name: 'JoÃ£o', phone: '11999999999', status: 'pendente' },
        { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
      ]

      const mockButtonPromise = new Promise(() => {})
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)
      ;(mockChromeDriver.findElement as jest.Mock)
        .mockRejectedValueOnce(new Error('Not found'))
        .mockReturnValue(mockButtonPromise)

      const resultsPromise = service.sendMessageToContacts(contacts, 'Hello')
      await new Promise((resolve) => process.nextTick(resolve))
      service.cancelSending()

      const results = await resultsPromise

      expect(results).toHaveLength(0)
      expect(service.wasLastSendCanceled()).toBe(true)
    })
  })

  describe('openWhatsAppWeb', () => {
    it('should navigate to WhatsApp Web', async () => {
      ;(mockChromeDriver.navigateTo as jest.Mock).mockResolvedValue(undefined)

      await service.openWhatsAppWeb()

      expect(mockChromeDriver.navigateTo).toHaveBeenCalledWith('https://web.whatsapp.com/')
    })

    it('should throw on navigation error', async () => {
      ;(mockChromeDriver.navigateTo as jest.Mock).mockRejectedValue(
        new Error('Navigation failed')
      )

      await expect(service.openWhatsAppWeb()).rejects.toThrow('Navigation failed')
    })
  })

  describe('waitForQRCodeScan', () => {
    it('should wait for QR code scan', async () => {
      const mockChatList = {}
      ;(mockChromeDriver.findElement as jest.Mock)
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValue(mockChatList)

      await service.waitForQRCodeScan(10000)

      expect(mockChromeDriver.findElement).toHaveBeenCalled()
    })

    it('should timeout waiting for QR code', async () => {
      ;(mockChromeDriver.findElement as jest.Mock).mockRejectedValue(
        new Error('Not found')
      )

      await expect(service.waitForQRCodeScan(100)).rejects.toThrow('QR Code scan timeout')
    }, 5000)

    it('should require login when link device QR is visible', async () => {
      const qrLink = { isDisplayed: jest.fn().mockResolvedValue(true) }
      ;(mockChromeDriver.findElement as jest.Mock).mockImplementation((xpath: string) => {
        if (xpath.includes('link-device-qr-code')) {
          return Promise.resolve(qrLink)
        }

        return Promise.reject(new Error('Not found'))
      })

      await expect(service.waitForQRCodeScan(100)).rejects.toThrow('QR_LOGIN_REQUIRED')
    }, 5000)
  })
})

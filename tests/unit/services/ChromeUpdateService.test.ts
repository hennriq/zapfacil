import { ChromeUpdateService } from '../../../src/main/services/ChromeUpdateService'
import { LoggerService } from '../../../src/main/services/LoggerService'
import { promises as fs } from 'fs'
import { execFile } from 'child_process'

// Mock modules
jest.mock('fs')
jest.mock('child_process')
jest.mock('axios')

describe('ChromeUpdateService', () => {
  let service: ChromeUpdateService
  let logger: LoggerService

  beforeEach(() => {
    logger = new LoggerService('ChromeUpdateService-Test')
    service = new ChromeUpdateService(logger)
    jest.clearAllMocks()
  })

  describe('getCurrentVersion', () => {
    it('should return ChromeDriver version when driver exists', async () => {
      ;(fs.access as jest.Mock).mockResolvedValue(undefined)
      ;(execFile as jest.Mock).mockImplementation((cmd, args, cb) => {
        cb(null, { stdout: 'ChromeDriver 118.0.5993.70' }, '')
      })

      const version = await service.getCurrentVersion()

      expect(version).toBe('118.0.5993.70')
    })

    it('should return cached version on second call', async () => {
      ;(fs.access as jest.Mock).mockResolvedValue(undefined)
      ;(execFile as jest.Mock).mockImplementation((cmd, args, cb) => {
        cb(null, { stdout: 'ChromeDriver 118.0.5993.70' }, '')
      })

      await service.getCurrentVersion()
      const version2 = await service.getCurrentVersion()

      expect(version2).toBe('118.0.5993.70')
      expect(execFile).toHaveBeenCalledTimes(1) // Only called once due to cache
    })

    it('should return empty string when driver not found', async () => {
      ;(fs.access as jest.Mock).mockRejectedValue(new Error('Not found'))

      const version = await service.getCurrentVersion()

      expect(version).toBe('')
    })

    it('should handle version parsing errors', async () => {
      ;(fs.access as jest.Mock).mockResolvedValue(undefined)
      ;(execFile as jest.Mock).mockImplementation((cmd, args, cb) => {
        cb(null, { stdout: 'Invalid output' }, '')
      })

      const version = await service.getCurrentVersion()

      expect(version).toBe('')
    })
  })

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      // Usar method privado através de reflexão
      const compareVersions = (service as any).compareVersions.bind(service)

      expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1)
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1)
      expect(compareVersions('118.0', '117.9.9')).toBe(1)
    })
  })

  describe('checkForUpdates', () => {
    it('should return true when update is available', async () => {
      ;(fs.access as jest.Mock).mockResolvedValue(undefined)
      ;(execFile as jest.Mock).mockImplementation((cmd, args, cb) => {
        if (cmd.includes('chromedriver')) {
          cb(null, { stdout: 'ChromeDriver 117.0.0000.00' }, '')
        } else {
          // Chrome version call
          cb(null, { stdout: 'Chrome 118.0.0000.00' }, '')
        }
      })

      const hasUpdate = await service.checkForUpdates()

      expect(hasUpdate).toBe(true)
    })

    it('should return false when no update available', async () => {
      ;(fs.access as jest.Mock).mockResolvedValue(undefined)
      ;(execFile as jest.Mock).mockImplementation((cmd, args, cb) => {
        if (cmd.includes('chromedriver')) {
          cb(null, { stdout: 'ChromeDriver 118.0.0000.00' }, '')
        } else {
          cb(null, { stdout: 'Chrome 118.0.0000.00' }, '')
        }
      })

      const hasUpdate = await service.checkForUpdates()

      expect(hasUpdate).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      ;(fs.access as jest.Mock).mockRejectedValue(new Error('Error'))

      const hasUpdate = await service.checkForUpdates()

      expect(hasUpdate).toBe(false)
    })
  })
})

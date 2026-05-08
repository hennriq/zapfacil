/// <reference types="jest" />

import { promises as fs } from 'fs'
import { ChromeDriverService } from '../../../src/main/services/ChromeDriverService'
import { ILogger } from '../../../src/shared/interfaces'

const mockDriver = {
  quit: jest.fn(),
  get: jest.fn(),
  getWindowHandle: jest.fn(),
  wait: jest.fn(),
  executeScript: jest.fn(),
}

const mockBuilder = {
  forBrowser: jest.fn().mockReturnThis(),
  setChromeOptions: jest.fn().mockReturnThis(),
  setChromeService: jest.fn().mockReturnThis(),
  build: jest.fn(),
}

const mockAddArguments = jest.fn()

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
  },
}))

jest.mock('selenium-webdriver', () => ({
  Builder: jest.fn(() => mockBuilder),
  By: {
    xpath: jest.fn((selector: string) => ({ selector })),
  },
  until: {
    elementLocated: jest.fn((locator: unknown) => ({ locator })),
  },
}))

jest.mock('selenium-webdriver/chrome', () => ({
  Options: jest.fn(() => ({
    addArguments: mockAddArguments,
  })),
  ServiceBuilder: jest.fn((driverPath: string) => ({ driverPath })),
}))

function createLogger(): jest.Mocked<ILogger> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}

function resetSingleton(): void {
  ;(ChromeDriverService as unknown as { instance?: ChromeDriverService }).instance = undefined
}

describe('ChromeDriverService', () => {
  let logger: jest.Mocked<ILogger>
  let service: ChromeDriverService

  beforeEach(() => {
    jest.clearAllMocks()
    resetSingleton()
    logger = createLogger()
    service = ChromeDriverService.getInstance(logger)
    ;(fs.mkdir as jest.Mock).mockResolvedValue(undefined)
    ;(fs.access as jest.Mock).mockResolvedValue(undefined)
    mockDriver.quit.mockResolvedValue(undefined)
    mockDriver.get.mockResolvedValue(undefined)
    mockDriver.getWindowHandle.mockResolvedValue('window-handle')
    mockDriver.wait.mockResolvedValue({ id: 'element' })
    mockDriver.executeScript.mockResolvedValue('script-result')
    mockBuilder.build.mockResolvedValue(mockDriver)
  })

  it('should keep a singleton instance', () => {
    const sameService = ChromeDriverService.getInstance(createLogger())

    expect(sameService).toBe(service)
  })

  it('should initialize ChromeDriver with managed driver when available', async () => {
    await service.initialize()

    expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('ZapFacil'), { recursive: true })
    expect(mockAddArguments).toHaveBeenCalledWith(
      expect.stringContaining('--user-data-dir='),
      '--profile-directory=ZapFacil',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--no-first-run',
      '--no-default-browser-check'
    )
    expect(mockBuilder.forBrowser).toHaveBeenCalledWith('chrome')
    expect(mockBuilder.setChromeOptions).toHaveBeenCalled()
    expect(mockBuilder.setChromeService).toHaveBeenCalled()
    expect(mockBuilder.build).toHaveBeenCalled()
    expect(service.getDriver()).toBe(mockDriver)
    expect(logger.info).toHaveBeenCalledWith('ChromeDriver initialized successfully')
  })

  it('should reject initialization when managed driver is missing', async () => {
    ;(fs.access as jest.Mock).mockRejectedValue(new Error('missing'))

    await expect(service.initialize()).rejects.toThrow('missing')

    expect(mockBuilder.setChromeService).not.toHaveBeenCalled()
  })

  it('should log and rethrow initialization failures', async () => {
    const error = new Error('build failed')
    mockBuilder.build.mockRejectedValue(error)

    await expect(service.initialize()).rejects.toThrow('build failed')
    expect(logger.error).toHaveBeenCalledWith('Failed to initialize ChromeDriver', error)
  })

  it('should initialize on start when driver is not ready', async () => {
    await service.start()

    expect(mockBuilder.build).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('ChromeDriver started')
  })

  it('should stop an active driver', async () => {
    await service.initialize()
    await service.stop()

    expect(mockDriver.quit).toHaveBeenCalled()
    expect(service.getDriver()).toBeNull()
    expect(logger.info).toHaveBeenCalledWith('ChromeDriver stopped')
  })

  it('should log and rethrow stop failures', async () => {
    const error = new Error('quit failed')
    mockDriver.quit.mockRejectedValue(error)

    await service.initialize()

    await expect(service.stop()).rejects.toThrow('quit failed')
    expect(logger.error).toHaveBeenCalledWith('Error stopping ChromeDriver', error)
  })

  it('should reject browser actions before initialization', async () => {
    await expect(service.navigateTo('https://example.com')).rejects.toThrow(
      'ChromeDriver not initialized'
    )
    await expect(service.findElement('//button')).rejects.toThrow('ChromeDriver not initialized')
    await expect(service.executeScript('return true')).rejects.toThrow('ChromeDriver not initialized')
  })

  it('should navigate with an initialized driver', async () => {
    await service.initialize()
    await service.navigateTo('https://example.com')

    expect(mockDriver.get).toHaveBeenCalledWith('https://example.com')
    expect(logger.debug).toHaveBeenCalledWith('Navigated to https://example.com')
  })

  it('should log and rethrow navigation failures', async () => {
    const error = new Error('navigation failed')
    mockDriver.get.mockRejectedValue(error)

    await service.initialize()

    await expect(service.navigateTo('https://example.com')).rejects.toThrow('navigation failed')
    expect(logger.error).toHaveBeenCalledWith('Failed to navigate to https://example.com', error)
  })

  it('should find elements with the configured timeout', async () => {
    await service.initialize()

    const element = await service.findElement('//button', 2500)

    expect(element).toEqual({ id: 'element' })
    expect(mockDriver.wait).toHaveBeenCalledWith(expect.any(Object), 2500)
    expect(logger.debug).toHaveBeenCalledWith('Found element with selector: //button')
  })

  it('should log and rethrow find element failures', async () => {
    const error = new Error('not found')
    mockDriver.wait.mockRejectedValue(error)

    await service.initialize()

    await expect(service.findElement('//button')).rejects.toThrow('not found')
    expect(logger.error).toHaveBeenCalledWith('Failed to find element with selector: //button', error)
  })

  it('should execute scripts with an initialized driver', async () => {
    await service.initialize()

    const result = await service.executeScript('return true')

    expect(result).toBe('script-result')
    expect(mockDriver.executeScript).toHaveBeenCalledWith('return true')
    expect(logger.debug).toHaveBeenCalledWith('Script executed successfully')
  })

  it('should log and rethrow script execution failures', async () => {
    const error = new Error('script failed')
    mockDriver.executeScript.mockRejectedValue(error)

    await service.initialize()

    await expect(service.executeScript('return true')).rejects.toThrow('script failed')
    expect(logger.error).toHaveBeenCalledWith('Failed to execute script', error)
  })
})

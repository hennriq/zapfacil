import { IChromeDriverManager, ILogger } from '@shared/interfaces'
import { webdriver } from 'selenium-webdriver'
import { Builder, WebDriver, By, until } from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import { LoggerService } from './LoggerService'
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'

/**
 * ChromeDriverService implementa IChromeDriverManager
 * Segue Single Responsibility Principle - gerencia apenas o Chrome WebDriver
 * Segue Dependency Injection - recebe logger como dependência
 */
export class ChromeDriverService implements IChromeDriverManager {
  private driver: WebDriver | null = null
  private readonly logger: ILogger
  private static instance: ChromeDriverService

  private constructor(logger: ILogger) {
    this.logger = logger
  }

  /**
   * Padrão Singleton - garante uma única instância
   * Segue o Dependency Injection Pattern
   */
  static getInstance(logger?: ILogger): ChromeDriverService {
    if (!ChromeDriverService.instance) {
      ChromeDriverService.instance = new ChromeDriverService(
        logger || new LoggerService('ChromeDriverService')
      )
    }
    return ChromeDriverService.instance
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing ChromeDriver...')
      
      // Obter caminho do user data
      const userDataPath = path.join(
        os.homedir(),
        'AppData',
        'Local',
        'ZapFacil',
        'User Data'
      )

      // Criar diretório se não existir
      await fs.mkdir(userDataPath, { recursive: true })

      // Configurar opções do Chrome
      const options = new Options()
      options.addArguments(
        `--user-data-dir=${userDataPath}`,
        '--profile-directory=ZapFacil',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      )
      options.addArgument('--disable-extensions')

      // Construir driver
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()

      this.logger.info('ChromeDriver initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize ChromeDriver', error)
      throw error
    }
  }

  async start(): Promise<void> {
    if (!this.driver) {
      await this.initialize()
    }
    this.logger.info('ChromeDriver started')
  }

  async stop(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.quit()
        this.driver = null
        this.logger.info('ChromeDriver stopped')
      } catch (error) {
        this.logger.error('Error stopping ChromeDriver', error)
        throw error
      }
    }
  }

  async navigateTo(url: string): Promise<void> {
    if (!this.driver) {
      throw new Error('ChromeDriver not initialized')
    }

    try {
      await this.driver.get(url)
      this.logger.debug(`Navigated to ${url}`)
    } catch (error) {
      this.logger.error(`Failed to navigate to ${url}`, error)
      throw error
    }
  }

  async findElement(selector: string, timeout: number = 10000): Promise<any> {
    if (!this.driver) {
      throw new Error('ChromeDriver not initialized')
    }

    try {
      const element = await this.driver.wait(
        until.elementLocated(By.xpath(selector)),
        timeout
      )
      this.logger.debug(`Found element with selector: ${selector}`)
      return element
    } catch (error) {
      this.logger.error(`Failed to find element with selector: ${selector}`, error)
      throw error
    }
  }

  async executeScript(script: string): Promise<any> {
    if (!this.driver) {
      throw new Error('ChromeDriver not initialized')
    }

    try {
      const result = await this.driver.executeScript(script)
      this.logger.debug('Script executed successfully')
      return result
    } catch (error) {
      this.logger.error('Failed to execute script', error)
      throw error
    }
  }

  getDriver(): WebDriver | null {
    return this.driver
  }
}

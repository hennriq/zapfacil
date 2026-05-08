import { IChromeUpdateManager, ILogger } from '@shared/interfaces'
import { LoggerService } from './LoggerService'
import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'
import os from 'os'

const execFileAsync = promisify(execFile)

/**
 * ChromeUpdateService - Gerencia download e atualização do ChromeDriver
 * Segue Single Responsibility Principle - apenas gerencia updates de Chrome
 * Segue Dependency Injection
 */
export class ChromeUpdateService implements IChromeUpdateManager {
  private readonly logger: ILogger
  private chromeDriverPath: string
  private currentVersion: string = ''

  constructor(logger?: ILogger) {
    this.logger = logger || new LoggerService('ChromeUpdateService')

    // Determinar caminho do ChromeDriver baseado no SO
    const platform = os.platform()
    const fileName = platform === 'win32' ? 'chromedriver.exe' : 'chromedriver'
    
    this.chromeDriverPath = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'ZapFacil',
      'chromedriver',
      fileName
    )
  }

  /**
   * Obtém versão atual do ChromeDriver
   */
  async getCurrentVersion(): Promise<string> {
    if (this.currentVersion) {
      return this.currentVersion
    }

    try {
      if (!(await this.driverExists())) {
        this.logger.warn('ChromeDriver not found, returning empty version')
        return ''
      }

      const { stdout } = await execFileAsync(this.chromeDriverPath, ['--version'])
      const match = stdout.match(/ChromeDriver (\d+\.\d+\.\d+\.\d+)/)
      
      if (match) {
        this.currentVersion = match[1]
        this.logger.info(`Current ChromeDriver version: ${this.currentVersion}`)
        return this.currentVersion
      }

      return ''
    } catch (error) {
      this.logger.error('Failed to get ChromeDriver version', error)
      return ''
    }
  }

  /**
   * Verifica se há atualizações disponíveis
   */
  async checkForUpdates(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion()
      const chromeVersion = await this.getChromeVersion()

      if (!currentVersion || !chromeVersion) {
        this.logger.warn('Could not determine versions for comparison')
        return false
      }

      const isUpdateNeeded = this.compareVersions(currentVersion, chromeVersion) < 0
      
      if (isUpdateNeeded) {
        this.logger.info(
          `Update available: ${currentVersion} -> ${chromeVersion}`
        )
      }

      return isUpdateNeeded
    } catch (error) {
      this.logger.error('Failed to check for updates', error)
      return false
    }
  }

  /**
   * Download da versão mais recente do ChromeDriver
   */
  async downloadLatestDriver(): Promise<string> {
    try {
      const chromeVersion = await this.getChromeVersion()
      this.logger.info(`Downloading ChromeDriver for Chrome ${chromeVersion}`)

      // Construir URL de download
      const url = this.buildDownloadUrl(chromeVersion)
      
      // Criar diretório se não existir
      const driverDir = path.dirname(this.chromeDriverPath)
      await fs.mkdir(driverDir, { recursive: true })

      // Download (simplificado - em produção usar stream)
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      await fs.writeFile(this.chromeDriverPath, response.data)

      // Tornar executável no Unix
      if (process.platform !== 'win32') {
        await execFileAsync('chmod', ['+x', this.chromeDriverPath])
      }

      this.currentVersion = chromeVersion
      this.logger.info(`ChromeDriver downloaded successfully: ${this.chromeDriverPath}`)

      return this.chromeDriverPath
    } catch (error) {
      this.logger.error('Failed to download ChromeDriver', error)
      throw error
    }
  }

  /**
   * Obtém versão do Chrome instalado no sistema
   */
  private async getChromeVersion(): Promise<string> {
    try {
      let chromePath = ''

      if (process.platform === 'win32') {
        // Windows
        chromePath = path.join(
          process.env.ProgramFiles || 'C:\\Program Files',
          'Google',
          'Chrome',
          'Application',
          'chrome.exe'
        )
      } else if (process.platform === 'darwin') {
        // macOS
        chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      } else {
        // Linux
        chromePath = '/usr/bin/google-chrome'
      }

      const { stdout } = await execFileAsync(chromePath, ['--version'])
      const match = stdout.match(/Chrome ([\d.]+)/)
      
      if (match) {
        return match[1]
      }

      throw new Error('Could not parse Chrome version')
    } catch (error) {
      this.logger.error('Failed to get Chrome version', error)
      throw error
    }
  }

  /**
   * Constrói URL de download do ChromeDriver
   */
  private buildDownloadUrl(version: string): string {
    const platform = process.platform
    let filename = ''

    if (platform === 'win32') {
      filename = 'chromedriver_win32.zip'
    } else if (platform === 'darwin') {
      filename = 'chromedriver_mac64.zip'
    } else {
      filename = 'chromedriver_linux64.zip'
    }

    return `https://googlechromelabs.github.io/chrome-for-testing/${version}/${platform}/${filename}`
  }

  /**
   * Verifica se o ChromeDriver existe
   */
  private async driverExists(): Promise<boolean> {
    try {
      await fs.access(this.chromeDriverPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Compara duas versões (semver)
   * Retorna: -1 se v1 < v2, 0 se v1 == v2, 1 se v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0

      if (p1 < p2) return -1
      if (p1 > p2) return 1
    }

    return 0
  }

  /**
   * Getter para caminho do driver (útil para testes)
   */
  getDriverPath(): string {
    return this.chromeDriverPath
  }
}

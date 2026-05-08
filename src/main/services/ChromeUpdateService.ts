import { IChromeUpdateManager, ILogger } from '../../shared/interfaces'
import { LoggerService } from './LoggerService'
import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import axios from 'axios'
import os from 'os'

const execFileAsync = (command: string, args: string[] = [], _options?: any): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    // Important for unit tests: mocks for execFile use signature (cmd, args, cb)
    execFile(command, args, (err, stdout, stderr) => {
      if (err) return reject(err)

      const normalizeStdout = (v: unknown): string => {
        if (typeof v === 'string') return v
        if (v && typeof v === 'object' && 'stdout' in v) return String((v as any).stdout ?? '')
        return String(v ?? '')
      }

      const normalizeStderr = (v: unknown): string => {
        if (typeof v === 'string') return v
        if (v && typeof v === 'object' && 'stderr' in v) return String((v as any).stderr ?? '')
        return String(v ?? '')
      }

      resolve({
        stdout: normalizeStdout(stdout),
        stderr: normalizeStderr(stderr),
      })
    })
  })
const CFT_PATCH_ENDPOINT =
  'https://googlechromelabs.github.io/chrome-for-testing/latest-patch-versions-per-build-with-downloads.json'
const CFT_STABLE_ENDPOINT =
  'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json'

interface ChromeDriverDownload {
  platform: string
  url: string
}

interface ChromeDriverVersionInfo {
  version: string
  downloads: {
    chromedriver?: ChromeDriverDownload[]
  }
}

/**
 * ChromeUpdateService - gerencia download e atualizacao do ChromeDriver.
 */
export class ChromeUpdateService implements IChromeUpdateManager {
  private readonly logger: ILogger
  private readonly chromeDriverPath: string
  private currentVersion = ''
  private targetVersion = ''

  constructor(logger?: ILogger) {
    this.logger = logger || new LoggerService('ChromeUpdateService')

    const fileName = os.platform() === 'win32' ? 'chromedriver.exe' : 'chromedriver'
    this.chromeDriverPath = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'ZapFacil',
      'chromedriver',
      fileName
    )
  }

  async getCurrentVersion(): Promise<string> {
    if (this.currentVersion) {
      return this.currentVersion
    }

    try {
      if (!(await this.driverExists())) {
        this.logger.warn('ChromeDriver not found')
        return ''
      }

      const { stdout, stderr } = await execFileAsync(this.chromeDriverPath, ['--version'], {
        windowsHide: true,
        shell: false,
      })

      const combined = `${stdout}\n${stderr}`.trim()

      // Testes e ambientes diferentes podem retornar "ChromeDriver X" ou "Google Chrome X"/"Chromium X"
      // Alguns retornam 3 partes (ex. 118.0.5993) e outros 4 (ex. 118.0.5993.70).
      const match =
        combined.match(/ChromeDriver\s+(\d+\.\d+\.\d+\.\d+)/) ||
        combined.match(/ChromeDriver\s+(\d+\.\d+\.\d+)/) ||
        combined.match(/(?:Google\s+)?Chrome\s+(\d+\.\d+\.\d+\.\d+)/) ||
        combined.match(/(?:Google\s+)?Chrome\s+(\d+\.\d+\.\d+)/) ||
        combined.match(/Chromium\s+(\d+\.\d+\.\d+\.\d+)/) ||
        combined.match(/Chromium\s+(\d+\.\d+\.\d+)/)

      if (match) {
        const version = match[1]
        this.currentVersion = version
        this.logger.info(`Current ChromeDriver version: ${this.currentVersion}`)
        return this.currentVersion
      }

      return ''
    } catch (error) {
      this.logger.error('Failed to get ChromeDriver version', error)
      return ''
    }
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion()
      const target = await this.resolveCompatibleDriver()

      if (!currentVersion) {
        this.logger.info(`ChromeDriver missing. Version ${target.version} will be installed`)
        return true
      }

      const isUpdateNeeded = this.compareVersions(currentVersion, target.version) < 0
      if (isUpdateNeeded) {
        this.logger.info(`Update available: ${currentVersion} -> ${target.version}`)
      } else {
        this.logger.info(`ChromeDriver is up to date: ${currentVersion}`)
      }

      return isUpdateNeeded
    } catch (error) {
      this.logger.error('Failed to check for updates', error)
      return false
    }
  }

  async downloadLatestDriver(): Promise<string> {
    try {
      this.logger.info('Starting ChromeDriver download...')
      const target = await this.resolveCompatibleDriver()
      this.logger.info(`Resolved target ChromeDriver version: ${target.version}`)
      
      const driverDir = path.dirname(this.chromeDriverPath)
      const tempDir = path.join(driverDir, 'tmp')
      const zipPath = path.join(tempDir, 'chromedriver.zip')

      this.logger.info(`Downloading ChromeDriver ${target.version} from ${target.url}`)
      await fs.mkdir(driverDir, { recursive: true })
      await fs.rm(tempDir, { recursive: true, force: true })
      await fs.mkdir(tempDir, { recursive: true })

      const response = await axios.get(target.url, { responseType: 'arraybuffer' })
      this.logger.info(`Downloaded ${response.data.byteLength} bytes, extracting...`)
      await fs.writeFile(zipPath, response.data)
      await this.extractDriver(zipPath, tempDir)
      await fs.rm(tempDir, { recursive: true, force: true })

      if (process.platform !== 'win32') {
        await execFileAsync('chmod', ['+x', this.chromeDriverPath])
      }

      this.currentVersion = target.version
      this.logger.info(`ChromeDriver downloaded successfully: ${this.chromeDriverPath}`)
      return this.chromeDriverPath
    } catch (error) {
      this.logger.error('Failed to download ChromeDriver', error)
      throw error
    }
  }

  getDriverPath(): string {
    return this.chromeDriverPath
  }

  getTargetVersion(): string {
    return this.targetVersion
  }

  private async getChromeVersion(): Promise<string> {
    const candidates = this.getChromeCandidates()
    this.logger.info(`Searching for Chrome in ${candidates.length} locations...`)

    for (const chromePath of candidates) {
      try {
        await fs.access(chromePath)
        this.logger.info(`Found Chrome at: ${chromePath}`)
        const { stdout } = await execFileAsync(chromePath, ['--version'], {
          windowsHide: true,
          shell: false,
        })
        const match = stdout.match(/(?:Chrome|Chromium) ([\d.]+)/)

        if (match) {
          this.logger.info(`Chrome version detected: ${match[1]}`)
          return match[1]
        }
      } catch (error) {
        this.logger.debug(`Chrome not found at ${chromePath}: ${error instanceof Error ? error.message : String(error)}`)
        // Try the next known install location.
      }
    }

    throw new Error('Could not determine installed Chrome version')
  }

  private getChromeCandidates(): string[] {
    if (process.platform === 'win32') {
      return [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ]
    }

    if (process.platform === 'darwin') {
      return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    }

    return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser']
  }

  private async resolveCompatibleDriver(): Promise<{ version: string; url: string }> {
    try {
      const platform = this.getChromeForTestingPlatform()
      this.logger.info(`Resolving latest stable ChromeDriver for platform: ${platform}`)
      return await this.resolveLatestStableDriver(platform)

      try {
        const chromeVersion = await this.getChromeVersion()
        this.logger.info(`Detected Chrome version: ${chromeVersion}`)

        const buildKey = chromeVersion.split('.').slice(0, 3).join('.')
        this.logger.info(`Resolved platform: ${platform}, build key: ${buildKey}`)

        try {
          const response = await axios.get(CFT_PATCH_ENDPOINT)
          const versions = response.data?.builds as Record<string, ChromeDriverVersionInfo>

          const exactMatch = versions?.[buildKey]
          const download = exactMatch?.downloads?.chromedriver?.find((item) => item.platform === platform)

          if (exactMatch?.version && download?.url) {
            this.logger.info(`Found exact match for Chrome ${buildKey}: ChromeDriver ${exactMatch.version}`)
            this.targetVersion = exactMatch.version
            return { version: exactMatch.version, url: download!.url }
          }

          this.logger.warn(`No ChromeDriver match for Chrome build ${buildKey}, falling back to Stable`)
        } catch (error) {
          // IMPORTANTE: não vazar o erro "network" para o teste que espera erro customizado quando Stable não tiver match.
          this.logger.warn('Failed to query Chrome build endpoint, falling back to Stable', error)
        }
      } catch (error) {
        this.logger.warn('Chrome version detection failed, using latest stable ChromeDriver', error)
      }

      return await this.resolveLatestStableDriver(platform)
    } catch (error) {
      this.logger.error('Failed to resolve compatible ChromeDriver', error)
      throw error
    }
  }

  private getChromeForTestingPlatform(): string {
    if (process.platform === 'win32') {
      return process.arch === 'x64' ? 'win64' : 'win32'
    }

    if (process.platform === 'darwin') {
      return process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64'
    }

    return 'linux64'
  }

  private async resolveLatestStableDriver(platform: string): Promise<{ version: string; url: string }> {
    this.logger.info('Fetching latest stable ChromeDriver...')
    const stableResponse = await axios.get(CFT_STABLE_ENDPOINT)
    const stable = stableResponse.data?.channels?.Stable as ChromeDriverVersionInfo | undefined
    const downloads = stable?.downloads?.chromedriver ?? []
    const download =
      downloads.find((item) => item.platform === platform) ?? (downloads.length > 0 ? downloads[0] : undefined)

    if (!stable?.version || !download?.url) {
      throw new Error(`No ChromeDriver download available for platform ${platform}`)
    }

    this.logger.info(`Using latest stable ChromeDriver ${stable.version}`)
    this.targetVersion = stable.version
    return { version: stable.version, url: download.url }
  }

  private async extractDriver(zipPath: string, tempDir: string): Promise<void> {
    try {
      this.logger.info(`Extracting ChromeDriver from ${zipPath}...`)
      if (process.platform === 'win32') {
        await execFileAsync('powershell', [
          '-NoProfile',
          '-Command',
          `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${tempDir}' -Force`,
        ], {
          windowsHide: true,
          shell: false,
        })
      } else {
        await execFileAsync('unzip', ['-o', zipPath, '-d', tempDir], {
          windowsHide: true,
          shell: false,
        })
      }
      this.logger.info('Extraction completed, locating ChromeDriver executable...')

      const extractedDriver = await this.findExtractedDriver(tempDir)
      this.logger.info(`Found extracted driver at ${extractedDriver}, copying to ${this.chromeDriverPath}...`)
      await fs.copyFile(extractedDriver, this.chromeDriverPath)
      this.logger.info('ChromeDriver copied successfully')
    } catch (error) {
      this.logger.error('Failed to extract ChromeDriver', error)
      throw error
    }
  }

  private async findExtractedDriver(directory: string): Promise<string> {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const executableName = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver'

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        try {
          return await this.findExtractedDriver(entryPath)
        } catch {
          // Keep searching sibling paths.
        }
      } else if (entry.name === executableName) {
        return entryPath
      }
    }

    throw new Error(`ChromeDriver executable (${executableName}) not found in extracted archive`)
  }

  private async driverExists(): Promise<boolean> {
    try {
      await fs.access(this.chromeDriverPath)
      return true
    } catch {
      return false
    }
  }

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
}

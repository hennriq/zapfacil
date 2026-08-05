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

interface ChromeDownload {
  platform: string
  url: string
}

interface ChromeVersionInfo {
  version: string
  downloads: {
    chrome?: ChromeDownload[]
    chromedriver?: ChromeDownload[]
  }
}

interface ChromeBundleTarget {
  version: string
  chromeUrl: string
  driverUrl: string
}

interface ManagedChromeMetadata {
  version: string
  updatedAt: string
}

/**
 * ChromeUpdateService - gerencia o Chrome for Testing e o ChromeDriver baixados pelo app.
 */
export class ChromeUpdateService implements IChromeUpdateManager {
  private readonly logger: ILogger
  private readonly chromeDir: string
  private readonly chromeMetadataPath: string
  private readonly chromePath: string
  private readonly chromeDriverPath: string
  private currentVersion = ''
  private targetVersion = ''

  constructor(logger?: ILogger) {
    this.logger = logger || new LoggerService('ChromeUpdateService')

    const baseDir = path.join(os.homedir(), 'AppData', 'Local', 'ZapFacil')
    const driverFileName = os.platform() === 'win32' ? 'chromedriver.exe' : 'chromedriver'
    const chromeExecutableName = os.platform() === 'win32'
      ? 'chrome.exe'
      : os.platform() === 'darwin'
        ? path.join('Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
        : 'chrome'

    this.chromeDir = path.join(baseDir, 'chrome')
    this.chromeMetadataPath = path.join(baseDir, 'chrome-version.json')
    this.chromePath = path.join(this.chromeDir, chromeExecutableName)
    this.chromeDriverPath = path.join(baseDir, 'chromedriver', driverFileName)
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

      const version = this.parseVersion(`${stdout}\n${stderr}`)
      if (version) {
        this.currentVersion = version
        this.logger.info(`Current ChromeDriver version: ${this.currentVersion}`)
      }

      return version
    } catch (error) {
      this.logger.error('Failed to get ChromeDriver version', error)
      return ''
    }
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      const currentDriverVersion = await this.getCurrentVersion()
      const managedChromeVersion = await this.getManagedChromeVersion()
      const latestBundle = await this.resolveLatestStableBundle(this.getChromeForTestingPlatform())

      if (!managedChromeVersion) {
        this.logger.info(`Managed Chrome missing. Version ${latestBundle.version} will be installed`)
        return true
      }

      if (this.compareVersions(managedChromeVersion, latestBundle.version) < 0) {
        this.logger.info(`Managed Chrome update available: ${managedChromeVersion} -> ${latestBundle.version}`)
        return true
      }

      const targetDriver = await this.resolveCompatibleDriver(managedChromeVersion)

      if (!currentDriverVersion) {
        this.logger.info(`ChromeDriver missing. Version ${targetDriver.version} will be installed`)
        return true
      }

      const isUpdateNeeded =
        this.getMajorVersion(currentDriverVersion) !== this.getMajorVersion(managedChromeVersion) ||
        this.compareVersions(currentDriverVersion, targetDriver.version) < 0

      if (isUpdateNeeded) {
        this.logger.info(`ChromeDriver update available: ${currentDriverVersion} -> ${targetDriver.version}`)
      } else {
        this.logger.info(`Managed Chrome and ChromeDriver are up to date: ${managedChromeVersion}`)
      }

      return isUpdateNeeded
    } catch (error) {
      this.logger.error('Failed to check for updates', error)
      return false
    }
  }

  async downloadLatestDriver(): Promise<string> {
    try {
      this.logger.info('Starting managed Chrome and ChromeDriver download...')
      const target = await this.resolveLatestStableBundle(this.getChromeForTestingPlatform())
      this.logger.info(`Resolved target Chrome/ChromeDriver version: ${target.version}`)

      await this.downloadManagedChrome(target)
      await this.downloadManagedDriver(target)
      await this.writeManagedChromeMetadata(target.version)

      if (process.platform !== 'win32') {
        await execFileAsync('chmod', ['+x', this.chromeDriverPath])
        await execFileAsync('chmod', ['+x', this.chromePath])
      }

      this.currentVersion = target.version
      this.logger.info(`Managed Chrome and ChromeDriver downloaded successfully`)
      return this.chromeDriverPath
    } catch (error) {
      this.logger.error('Failed to download managed Chrome/ChromeDriver', error)
      throw error
    }
  }

  getDriverPath(): string {
    return this.chromeDriverPath
  }

  getChromePath(): string {
    return this.chromePath
  }

  getTargetVersion(): string {
    return this.targetVersion
  }

  private async getManagedChromeVersion(): Promise<string> {
    try {
      await fs.access(this.chromePath)
      this.logger.info(`Found managed Chrome at: ${this.chromePath}`)

      const metadataVersion = await this.readManagedChromeMetadata()
      if (metadataVersion) {
        this.logger.info(`Managed Chrome version from metadata: ${metadataVersion}`)
        return metadataVersion
      }

      if (process.platform === 'win32') {
        this.logger.warn('Managed Chrome metadata is missing; skipping chrome.exe --version to avoid opening a browser window')
        return ''
      }

      const { stdout, stderr } = await execFileAsync(this.chromePath, ['--version'], {
        windowsHide: true,
        shell: false,
      })
      const version = this.parseVersion(`${stdout}\n${stderr}`)

      if (version) {
        this.logger.info(`Managed Chrome version detected: ${version}`)
      }

      return version
    } catch (error) {
      this.logger.debug(`Managed Chrome not available: ${error instanceof Error ? error.message : String(error)}`)
      return ''
    }
  }

  private async readManagedChromeMetadata(): Promise<string> {
    try {
      const content = await fs.readFile(this.chromeMetadataPath, 'utf-8')
      const metadata = JSON.parse(content) as Partial<ManagedChromeMetadata>
      return typeof metadata.version === 'string' ? metadata.version : ''
    } catch {
      return ''
    }
  }

  private async writeManagedChromeMetadata(version: string): Promise<void> {
    const metadata: ManagedChromeMetadata = {
      version,
      updatedAt: new Date().toISOString(),
    }

    await fs.writeFile(this.chromeMetadataPath, JSON.stringify(metadata, null, 2))
  }

  private async resolveCompatibleDriver(chromeVersion?: string): Promise<{ version: string; url: string }> {
    try {
      const platform = this.getChromeForTestingPlatform()
      const detectedChromeVersion = chromeVersion || await this.getManagedChromeVersion()

      if (!detectedChromeVersion) {
        this.logger.warn('Managed Chrome version unavailable, using latest stable ChromeDriver')
        return await this.resolveLatestStableDriver(platform)
      }

      const buildKey = detectedChromeVersion.split('.').slice(0, 3).join('.')
      this.logger.info(`Resolving ChromeDriver for managed Chrome build ${buildKey}`)

      try {
        const response = await axios.get(CFT_PATCH_ENDPOINT)
        const versions = response.data?.builds as Record<string, ChromeVersionInfo>
        const exactMatch = versions?.[buildKey]
        const download = exactMatch?.downloads?.chromedriver?.find((item) => item.platform === platform)

        if (exactMatch?.version && download?.url) {
          this.logger.info(`Found exact match for managed Chrome ${buildKey}: ChromeDriver ${exactMatch.version}`)
          this.targetVersion = exactMatch.version
          return { version: exactMatch.version, url: download.url }
        }

        this.logger.warn(`No ChromeDriver match for managed Chrome build ${buildKey}, falling back to Stable`)
      } catch (error) {
        this.logger.warn('Failed to query Chrome build endpoint, falling back to Stable', error)
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
    const target = await this.resolveLatestStableBundle(platform)
    return { version: target.version, url: target.driverUrl }
  }

  private async resolveLatestStableBundle(platform: string): Promise<ChromeBundleTarget> {
    this.logger.info('Fetching latest stable Chrome for Testing bundle...')
    const stableResponse = await axios.get(CFT_STABLE_ENDPOINT)
    const stable = stableResponse.data?.channels?.Stable as ChromeVersionInfo | undefined
    const chromeDownload = this.findPlatformDownload(stable?.downloads?.chrome ?? [], platform)
    const driverDownload = this.findPlatformDownload(stable?.downloads?.chromedriver ?? [], platform)

    if (!stable?.version || !chromeDownload?.url || !driverDownload?.url) {
      throw new Error(`No managed Chrome/ChromeDriver download available for platform ${platform}`)
    }

    this.targetVersion = stable.version
    return {
      version: stable.version,
      chromeUrl: chromeDownload.url,
      driverUrl: driverDownload.url,
    }
  }

  private findPlatformDownload(downloads: ChromeDownload[], platform: string): ChromeDownload | undefined {
    return downloads.find((item) => item.platform === platform) ?? (downloads.length > 0 ? downloads[0] : undefined)
  }

  private async downloadManagedChrome(target: ChromeBundleTarget): Promise<void> {
    const parentDir = path.dirname(this.chromeDir)
    const tempDir = path.join(parentDir, 'chrome-tmp')
    const zipPath = path.join(tempDir, 'chrome.zip')

    this.logger.info(`Downloading managed Chrome ${target.version} from ${target.chromeUrl}`)
    await fs.mkdir(parentDir, { recursive: true })
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(tempDir, { recursive: true })

    const response = await axios.get(target.chromeUrl, { responseType: 'arraybuffer' })
    await fs.writeFile(zipPath, response.data)
    await this.extractChrome(zipPath, tempDir)
    await fs.rm(tempDir, { recursive: true, force: true })
  }

  private async downloadManagedDriver(target: ChromeBundleTarget): Promise<void> {
    const driverDir = path.dirname(this.chromeDriverPath)
    const tempDir = path.join(driverDir, 'tmp')
    const zipPath = path.join(tempDir, 'chromedriver.zip')

    this.logger.info(`Downloading ChromeDriver ${target.version} from ${target.driverUrl}`)
    await fs.mkdir(driverDir, { recursive: true })
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(tempDir, { recursive: true })

    const response = await axios.get(target.driverUrl, { responseType: 'arraybuffer' })
    await fs.writeFile(zipPath, response.data)
    await this.extractDriver(zipPath, tempDir)
    await fs.rm(tempDir, { recursive: true, force: true })
  }

  private async extractChrome(zipPath: string, tempDir: string): Promise<void> {
    try {
      await this.extractArchive(zipPath, tempDir)
      const extractedChrome = await this.findExtractedChrome(tempDir)
      const extractedChromeDir = this.getChromeRootDirectory(extractedChrome)

      await fs.rm(this.chromeDir, { recursive: true, force: true })
      await fs.mkdir(this.chromeDir, { recursive: true })
      await fs.cp(extractedChromeDir, this.chromeDir, { recursive: true })
    } catch (error) {
      this.logger.error('Failed to extract managed Chrome', error)
      throw error
    }
  }

  private async extractDriver(zipPath: string, tempDir: string): Promise<void> {
    try {
      this.logger.info(`Extracting ChromeDriver from ${zipPath}...`)
      await this.extractArchive(zipPath, tempDir)
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

  private async extractArchive(zipPath: string, tempDir: string): Promise<void> {
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
  }

  private async findExtractedChrome(directory: string): Promise<string> {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const executableName = process.platform === 'win32'
      ? 'chrome.exe'
      : process.platform === 'darwin'
        ? 'Google Chrome for Testing'
        : 'chrome'

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        try {
          return await this.findExtractedChrome(entryPath)
        } catch {
          // Keep searching sibling paths.
        }
      } else if (entry.name === executableName) {
        return entryPath
      }
    }

    throw new Error(`Managed Chrome executable (${executableName}) not found in extracted archive`)
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

  private getChromeRootDirectory(executablePath: string): string {
    if (process.platform === 'darwin') {
      const appMarker = `${path.sep}Google Chrome for Testing.app${path.sep}`
      const appIndex = executablePath.indexOf(appMarker)
      if (appIndex >= 0) {
        return executablePath.slice(0, appIndex)
      }
    }

    return path.dirname(executablePath)
  }

  private async driverExists(): Promise<boolean> {
    try {
      await fs.access(this.chromeDriverPath)
      return true
    } catch {
      return false
    }
  }

  private parseVersion(output: string): string {
    const match =
      output.match(/ChromeDriver\s+(\d+\.\d+\.\d+\.\d+)/) ||
      output.match(/ChromeDriver\s+(\d+\.\d+\.\d+)/) ||
      output.match(/(?:Google\s+)?Chrome(?:\s+for\s+Testing)?\s+(\d+\.\d+\.\d+\.\d+)/) ||
      output.match(/(?:Google\s+)?Chrome(?:\s+for\s+Testing)?\s+(\d+\.\d+\.\d+)/) ||
      output.match(/Chromium\s+(\d+\.\d+\.\d+\.\d+)/) ||
      output.match(/Chromium\s+(\d+\.\d+\.\d+)/)

    return match?.[1] ?? ''
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

  private getMajorVersion(version: string): number {
    return Number(version.split('.')[0] || 0)
  }
}

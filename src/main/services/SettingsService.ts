import path from 'path'
import { AppSettings, defaultAppSettings } from '../../shared/appTypes'
import { ILogger } from '../../shared/interfaces'
import { JsonFileStore } from './JsonFileStore'
import { LoggerService } from './LoggerService'

export class SettingsService {
  private readonly store: JsonFileStore<AppSettings>
  private readonly logger: ILogger

  constructor(storageDir: string, logger: ILogger = new LoggerService('SettingsService')) {
    this.logger = logger
    this.store = new JsonFileStore(path.join(storageDir, 'settings.json'), defaultAppSettings)
  }

  async getSettings(): Promise<AppSettings> {
    const settings = await this.store.read()
    return this.mergeWithDefaults(settings)
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const normalized = this.mergeWithDefaults(settings)
    await this.store.write(normalized)
    this.logger.info('Application settings saved')
    return normalized
  }

  private mergeWithDefaults(settings: Partial<AppSettings>): AppSettings {
    return {
      general: { ...defaultAppSettings.general, ...settings.general },
      whatsapp: { ...defaultAppSettings.whatsapp, ...settings.whatsapp },
      chrome: { ...defaultAppSettings.chrome, ...settings.chrome },
      backup: { ...defaultAppSettings.backup, ...settings.backup },
    }
  }
}

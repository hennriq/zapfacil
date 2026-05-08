import { promises as fs } from 'fs'
import path from 'path'
import { TelemetryEvent, TelemetrySummary } from '../../shared/appTypes'
import { ILogger } from '../../shared/interfaces'
import { LoggerService } from './LoggerService'
import { SettingsService } from './SettingsService'

export class TelemetryService {
  private readonly eventsPath: string
  private readonly logger: ILogger
  private readonly settingsService: SettingsService

  constructor(
    storageDir: string,
    settingsService: SettingsService,
    logger: ILogger = new LoggerService('TelemetryService')
  ) {
    this.eventsPath = path.join(storageDir, 'telemetry-events.jsonl')
    this.logger = logger
    this.settingsService = settingsService
  }

  async track(event: TelemetryEvent): Promise<void> {
    const settings = await this.settingsService.getSettings()
    if (!settings.general.telemetryEnabled) {
      this.logger.debug('Telemetry event skipped because telemetry is disabled')
      return
    }

    if (!event.name.trim()) {
      throw new Error('Telemetry event name is required')
    }

    const entry: TelemetryEvent = {
      ...event,
      name: event.name.trim(),
      timestamp: event.timestamp || new Date().toISOString(),
    }

    await fs.mkdir(path.dirname(this.eventsPath), { recursive: true })
    await fs.appendFile(this.eventsPath, `${JSON.stringify(entry)}\n`, 'utf-8')
    this.logger.debug(`Telemetry event tracked: ${entry.name}`)
  }

  async getSummary(): Promise<TelemetrySummary> {
    const events = await this.readEvents()
    const eventsByName = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1
      return acc
    }, {})

    const lastEvent = events.length > 0 ? events[events.length - 1] : undefined

    return {
      totalEvents: events.length,
      eventsByName,
      lastEventAt: lastEvent?.timestamp,
    }
  }

  private async readEvents(): Promise<TelemetryEvent[]> {
    try {
      const raw = await fs.readFile(this.eventsPath, 'utf-8')
      return raw
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as TelemetryEvent)
    } catch {
      return []
    }
  }
}

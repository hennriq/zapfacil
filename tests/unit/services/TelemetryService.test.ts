/// <reference types="jest" />

import { promises as fs } from 'fs'
import path from 'path'
import { TelemetryService } from '../../../src/main/services/TelemetryService'

const testDir = path.join(process.cwd(), 'run', 'tests', 'telemetry-service')

const mockSettingsService = {
  getSettings: async () => ({
    general: {
      // TelemetryService depende deste flag
      telemetryEnabled: true,
    },
  }),
}

describe('TelemetryService', () => {
  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should track events and summarize them', async () => {
    const service = new TelemetryService(testDir, mockSettingsService as any)

    await service.track({ name: 'app_opened', timestamp: '2026-05-15T10:00:00.000Z' })
    await service.track({ name: 'messages_sent', properties: { total: 3 } })
    await service.track({ name: 'messages_sent', properties: { total: 2 } })

    const summary = await service.getSummary()

    expect(summary.totalEvents).toBe(3)
    expect(summary.eventsByName).toEqual({ app_opened: 1, messages_sent: 2 })
    expect(summary.lastEventAt).toBeDefined()
  })

  it('should reject empty event names', async () => {
    const service = new TelemetryService(testDir, mockSettingsService as any)

    await expect(service.track({ name: '   ' })).rejects.toThrow('Telemetry event name is required')
  })

  it('should return an empty summary when no events exist', async () => {
    const service = new TelemetryService(testDir, mockSettingsService as any)

    await expect(service.getSummary()).resolves.toEqual({
      totalEvents: 0,
      eventsByName: {},
      lastEventAt: undefined,
    })
  })
})


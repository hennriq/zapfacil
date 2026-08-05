/// <reference types="jest" />

import { promises as fs } from 'fs'
import path from 'path'
import { SettingsService } from '../../../src/main/services/SettingsService'
import { defaultAppSettings } from '../../../src/shared/appTypes'

const testDir = path.join(process.cwd(), 'run', 'tests', 'settings-service')

describe('SettingsService', () => {
  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should return default settings when no file exists', async () => {
    const service = new SettingsService(testDir)

    await expect(service.getSettings()).resolves.toEqual(defaultAppSettings)
  })

  it('should persist and reload settings', async () => {
    const service = new SettingsService(testDir)
    const saved = await service.saveSettings({
      ...defaultAppSettings,
      general: {
        ...defaultAppSettings.general,
        betaUpdates: true,
        telemetryEnabled: false,
      },
    })

    const reloaded = await service.getSettings()

    expect(saved.general.betaUpdates).toBe(true)
    expect(reloaded.general.telemetryEnabled).toBe(false)
  })

  it('should merge older settings files with new defaults', async () => {
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(
      path.join(testDir, 'settings.json'),
      JSON.stringify({ general: { language: 'en-US' } }),
      'utf-8'
    )

    const service = new SettingsService(testDir)
    const settings = await service.getSettings()

    expect(settings.general.language).toBe('en-US')
    expect(settings.general.betaUpdates).toBe(false)
    expect(settings.whatsapp.autoReconnect).toBe(true)
  })
})

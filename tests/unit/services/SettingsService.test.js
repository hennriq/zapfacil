"use strict";
/// <reference types="jest" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const SettingsService_1 = require("../../../src/main/services/SettingsService");
const appTypes_1 = require("../../../src/shared/appTypes");
const testDir = path_1.default.join(process.cwd(), 'run', 'tests', 'settings-service');
describe('SettingsService', () => {
    beforeEach(async () => {
        await fs_1.promises.rm(testDir, { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs_1.promises.rm(testDir, { recursive: true, force: true });
    });
    it('should return default settings when no file exists', async () => {
        const service = new SettingsService_1.SettingsService(testDir);
        await expect(service.getSettings()).resolves.toEqual(appTypes_1.defaultAppSettings);
    });
    it('should persist and reload settings', async () => {
        const service = new SettingsService_1.SettingsService(testDir);
        const saved = await service.saveSettings({
            ...appTypes_1.defaultAppSettings,
            general: {
                ...appTypes_1.defaultAppSettings.general,
                betaUpdates: true,
                telemetryEnabled: false,
            },
        });
        const reloaded = await service.getSettings();
        expect(saved.general.betaUpdates).toBe(true);
        expect(reloaded.general.telemetryEnabled).toBe(false);
    });
    it('should merge older settings files with new defaults', async () => {
        await fs_1.promises.mkdir(testDir, { recursive: true });
        await fs_1.promises.writeFile(path_1.default.join(testDir, 'settings.json'), JSON.stringify({ general: { language: 'en-US' } }), 'utf-8');
        const service = new SettingsService_1.SettingsService(testDir);
        const settings = await service.getSettings();
        expect(settings.general.language).toBe('en-US');
        expect(settings.general.betaUpdates).toBe(false);
        expect(settings.whatsapp.autoReconnect).toBe(true);
    });
});
//# sourceMappingURL=SettingsService.test.js.map
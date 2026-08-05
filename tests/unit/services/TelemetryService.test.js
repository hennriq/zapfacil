"use strict";
/// <reference types="jest" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const TelemetryService_1 = require("../../../src/main/services/TelemetryService");
const testDir = path_1.default.join(process.cwd(), 'run', 'tests', 'telemetry-service');
const mockSettingsService = {
    getSettings: async () => ({
        general: {
            // TelemetryService depende deste flag
            telemetryEnabled: true,
        },
    }),
};
describe('TelemetryService', () => {
    beforeEach(async () => {
        await fs_1.promises.rm(testDir, { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs_1.promises.rm(testDir, { recursive: true, force: true });
    });
    it('should track events and summarize them', async () => {
        const service = new TelemetryService_1.TelemetryService(testDir, mockSettingsService);
        await service.track({ name: 'app_opened', timestamp: '2026-05-15T10:00:00.000Z' });
        await service.track({ name: 'messages_sent', properties: { total: 3 } });
        await service.track({ name: 'messages_sent', properties: { total: 2 } });
        const summary = await service.getSummary();
        expect(summary.totalEvents).toBe(3);
        expect(summary.eventsByName).toEqual({ app_opened: 1, messages_sent: 2 });
        expect(summary.lastEventAt).toBeDefined();
    });
    it('should reject empty event names', async () => {
        const service = new TelemetryService_1.TelemetryService(testDir, mockSettingsService);
        await expect(service.track({ name: '   ' })).rejects.toThrow('Telemetry event name is required');
    });
    it('should return an empty summary when no events exist', async () => {
        const service = new TelemetryService_1.TelemetryService(testDir, mockSettingsService);
        await expect(service.getSummary()).resolves.toEqual({
            totalEvents: 0,
            eventsByName: {},
            lastEventAt: undefined,
        });
    });
});
//# sourceMappingURL=TelemetryService.test.js.map
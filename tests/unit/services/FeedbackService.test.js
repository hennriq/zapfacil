"use strict";
/// <reference types="jest" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const FeedbackService_1 = require("../../../src/main/services/FeedbackService");
const testDir = path_1.default.join(process.cwd(), 'run', 'tests', 'feedback-service');
describe('FeedbackService', () => {
    beforeEach(async () => {
        await fs_1.promises.rm(testDir, { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs_1.promises.rm(testDir, { recursive: true, force: true });
    });
    it('should store feedback entries', async () => {
        const service = new FeedbackService_1.FeedbackService(testDir);
        const entry = await service.submit({
            category: 'idea',
            message: 'Add campaign scheduling',
            email: 'user@example.com',
            appVersion: '2.0.0',
        });
        const entries = await service.list();
        expect(entry.id).toBeDefined();
        expect(entries).toHaveLength(1);
        expect(entries[0].message).toBe('Add campaign scheduling');
    });
    it('should reject blank feedback', async () => {
        const service = new FeedbackService_1.FeedbackService(testDir);
        await expect(service.submit({ category: 'bug', message: '  ' })).rejects.toThrow('Feedback message is required');
    });
});
//# sourceMappingURL=FeedbackService.test.js.map
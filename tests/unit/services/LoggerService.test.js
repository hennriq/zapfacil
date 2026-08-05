"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LoggerService_1 = require("../../../src/main/services/LoggerService");
describe('LoggerService', () => {
    let logger;
    beforeEach(() => {
        logger = new LoggerService_1.LoggerService('Test-Context');
        // Mock console methods
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'debug').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('info', () => {
        it('should log info messages', () => {
            logger.info('Test message');
            expect(console.log).toHaveBeenCalled();
            const calls = console.log.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toContain('INFO');
            expect(call).toContain('Test message');
            expect(call).toContain('Test-Context');
        });
        it('should include data in log', () => {
            const testData = { key: 'value' };
            logger.info('Test message', testData);
            expect(console.log).toHaveBeenCalled();
            const calls = console.log.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toContain('key');
        });
    });
    describe('warn', () => {
        it('should log warning messages', () => {
            logger.warn('Warning message');
            expect(console.warn).toHaveBeenCalled();
            const calls = console.warn.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toContain('WARN');
            expect(call).toContain('Warning message');
        });
    });
    describe('error', () => {
        it('should log error messages', () => {
            logger.error('Error message');
            expect(console.error).toHaveBeenCalled();
            const calls = console.error.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toContain('ERROR');
            expect(call).toContain('Error message');
        });
        it('should handle Error objects', () => {
            const error = new Error('Test error');
            logger.error('Error occurred', error);
            expect(console.error).toHaveBeenCalled();
            const calls = console.error.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toContain('Test error');
        });
        it('should handle string errors', () => {
            logger.error('Error occurred', 'String error');
            expect(console.error).toHaveBeenCalled();
        });
    });
    describe('debug', () => {
        it('should not log debug when DEBUG is not set', () => {
            process.env.DEBUG = undefined;
            logger.debug('Debug message');
            expect(console.debug).not.toHaveBeenCalled();
        });
        it('should log debug when DEBUG is true', () => {
            process.env.DEBUG = 'true';
            logger.debug('Debug message');
            expect(console.debug).toHaveBeenCalled();
            const calls = console.debug.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toContain('DEBUG');
            expect(call).toContain('Debug message');
        });
    });
    describe('timestamp', () => {
        it('should include timestamp in all logs', () => {
            logger.info('Test');
            const calls = console.log.mock.calls;
            const call = calls[calls.length - 1][0];
            expect(call).toMatch(/\d{4}-\d{2}-\d{2}T/);
        });
    });
});
//# sourceMappingURL=LoggerService.test.js.map
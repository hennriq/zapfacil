"use strict";
/// <reference types="jest" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChromeUpdateService_1 = require("../../../src/main/services/ChromeUpdateService");
const LoggerService_1 = require("../../../src/main/services/LoggerService");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const axios_1 = __importDefault(require("axios"));
// Mock modules
jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        mkdir: jest.fn(),
        rm: jest.fn(),
        writeFile: jest.fn(),
        copyFile: jest.fn(),
        readdir: jest.fn(),
    },
}));
jest.mock('child_process');
// Note: ChromeUpdateService uses `util.promisify(execFile)`.
// For the promisified version to work, the mock must call the last argument (callback)
// with the standard `(error, stdoutObj, stderr)` signature.
jest.mock('axios');
const chromeDownloadPayload = {
    channels: {
        Stable: {
            version: '118.0.0000.00',
            downloads: {
                chromedriver: [
                    {
                        platform: 'win64',
                        url: 'https://example.com/chromedriver.zip',
                    },
                ],
            },
        },
    },
};
describe('ChromeUpdateService', () => {
    let service;
    let logger;
    const originalPlatform = process.platform;
    const originalArch = process.arch;
    beforeEach(() => {
        logger = new LoggerService_1.LoggerService('ChromeUpdateService-Test');
        service = new ChromeUpdateService_1.ChromeUpdateService(logger);
        jest.clearAllMocks();
    });
    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
        Object.defineProperty(process, 'arch', { value: originalArch });
    });
    describe('getCurrentVersion', () => {
        it('should return ChromeDriver version when driver exists', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            child_process_1.execFile.mockImplementation((cmd, args, cb) => {
                cb(null, { stdout: 'ChromeDriver 118.0.5993.70' }, '');
            });
            const version = await service.getCurrentVersion();
            expect(version).toBe('118.0.5993.70');
        });
        it('should return cached version on second call', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            child_process_1.execFile.mockImplementation((cmd, args, cb) => {
                cb(null, { stdout: 'ChromeDriver 118.0.5993.70' }, '');
            });
            await service.getCurrentVersion();
            const version2 = await service.getCurrentVersion();
            expect(version2).toBe('118.0.5993.70');
            expect(child_process_1.execFile).toHaveBeenCalledTimes(1); // Only called once due to cache
        });
        it('should return empty string when driver not found', async () => {
            fs_1.promises.access.mockRejectedValue(new Error('Not found'));
            const version = await service.getCurrentVersion();
            expect(version).toBe('');
        });
        it('should handle version parsing errors', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            child_process_1.execFile.mockImplementation((cmd, args, cb) => {
                cb(null, { stdout: 'Invalid output' }, '');
            });
            const version = await service.getCurrentVersion();
            expect(version).toBe('');
        });
    });
    describe('compareVersions', () => {
        it('should compare versions correctly', () => {
            // Usar method privado através de reflexão
            const compareVersions = service.compareVersions.bind(service);
            expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
            expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
            expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
            expect(compareVersions('118.0', '117.9.9')).toBe(1);
        });
    });
    describe('checkForUpdates', () => {
        it('should return true when update is available', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            child_process_1.execFile.mockImplementation((cmd, args, cb) => {
                cb(null, { stdout: 'ChromeDriver 117.0.0000.00' }, '');
            });
            axios_1.default.get.mockResolvedValue({ data: chromeDownloadPayload });
            const hasUpdate = await service.checkForUpdates();
            expect(hasUpdate).toBe(true);
        });
        it('should return false when no update available', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            child_process_1.execFile.mockImplementation((cmd, args, cb) => {
                cb(null, { stdout: 'ChromeDriver 118.0.0000.00' }, '');
            });
            ;
            axios_1.default.get.mockResolvedValue({ data: chromeDownloadPayload });
            const hasUpdate = await service.checkForUpdates();
            expect(hasUpdate).toBe(false);
        });
        it('should handle errors gracefully', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            child_process_1.execFile.mockImplementation((cmd, args, cb) => {
                cb(null, { stdout: 'ChromeDriver 118.0.0000.00' }, '');
            });
            ;
            axios_1.default.get.mockRejectedValue(new Error('network'));
            const hasUpdate = await service.checkForUpdates();
            expect(hasUpdate).toBe(false);
        });
        it('should return true when ChromeDriver is missing', async () => {
            fs_1.promises.access.mockImplementation((filePath) => {
                if (filePath.includes('chromedriver')) {
                    return Promise.reject(new Error('driver missing'));
                }
                return Promise.resolve();
            });
            axios_1.default.get.mockResolvedValue({ data: chromeDownloadPayload });
            const hasUpdate = await service.checkForUpdates();
            expect(hasUpdate).toBe(true);
        });
    });
    describe('resolveCompatibleDriver', () => {
        it('should resolve the latest stable ChromeDriver without reading installed Chrome', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            axios_1.default.get.mockResolvedValueOnce({
                data: {
                    channels: {
                        Stable: {
                            version: '120.0.0000.00',
                            downloads: {
                                chromedriver: [{ platform: 'win64', url: 'https://example.com/stable.zip' }],
                            },
                        },
                    },
                },
            });
            const target = await service.resolveCompatibleDriver();
            expect(target).toEqual({
                version: '120.0.0000.00',
                url: 'https://example.com/stable.zip',
            });
            expect(service.getTargetVersion()).toBe('120.0.0000.00');
            expect(child_process_1.execFile).not.toHaveBeenCalled();
        });
        it('should throw when Stable has no matching download', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            axios_1.default.get.mockResolvedValueOnce({
                data: {
                    channels: {
                        Stable: {
                            version: '120.0.0000.00',
                            downloads: { chromedriver: [] },
                        },
                    },
                },
            });
            await expect(service.resolveCompatibleDriver()).rejects.toThrow('No ChromeDriver download available');
        });
    });
    describe('downloadLatestDriver', () => {
        it('should download, extract and return the managed driver path', async () => {
            fs_1.promises.access.mockResolvedValue(undefined);
            fs_1.promises.mkdir.mockResolvedValue(undefined);
            fs_1.promises.rm.mockResolvedValue(undefined);
            fs_1.promises.writeFile.mockResolvedValue(undefined);
            fs_1.promises.copyFile.mockResolvedValue(undefined);
            fs_1.promises.readdir.mockResolvedValue([
                { name: 'chromedriver.exe', isDirectory: () => false },
            ]);
            axios_1.default.get
                .mockResolvedValueOnce({ data: chromeDownloadPayload })
                .mockResolvedValueOnce({ data: Buffer.from('zip-data') });
            const driverPath = await service.downloadLatestDriver();
            expect(driverPath).toContain('chromedriver');
            expect(fs_1.promises.writeFile).toHaveBeenCalledWith(expect.stringContaining('chromedriver.zip'), Buffer.from('zip-data'));
            expect(fs_1.promises.copyFile).toHaveBeenCalled();
        });
    });
    describe('platform and archive helpers', () => {
        it.each([
            ['win32', 'x64', 'win64'],
            ['win32', 'ia32', 'win32'],
            ['darwin', 'arm64', 'mac-arm64'],
            ['darwin', 'x64', 'mac-x64'],
            ['linux', 'x64', 'linux64'],
        ])('should resolve Chrome for Testing platform for %s/%s', (platform, arch, expected) => {
            Object.defineProperty(process, 'platform', { value: platform });
            Object.defineProperty(process, 'arch', { value: arch });
            service = new ChromeUpdateService_1.ChromeUpdateService(logger);
            expect(service.getChromeForTestingPlatform()).toBe(expected);
        });
        it('should find extracted driver in nested directories', async () => {
            ;
            fs_1.promises.readdir
                .mockResolvedValueOnce([{ name: 'chromedriver-win64', isDirectory: () => true }])
                .mockResolvedValueOnce([{ name: 'chromedriver.exe', isDirectory: () => false }]);
            const driverPath = await service.findExtractedDriver('tmp');
            expect(driverPath).toContain('chromedriver.exe');
        });
        it('should continue searching when nested directories do not contain the driver', async () => {
            ;
            fs_1.promises.readdir
                .mockResolvedValueOnce([
                { name: 'empty-folder', isDirectory: () => true },
                { name: 'chromedriver.exe', isDirectory: () => false },
            ])
                .mockResolvedValueOnce([]);
            const driverPath = await service.findExtractedDriver('tmp');
            expect(driverPath).toContain('chromedriver.exe');
        });
        it('should throw when extracted driver is not found', async () => {
            ;
            fs_1.promises.readdir.mockResolvedValue([{ name: 'notes.txt', isDirectory: () => false }]);
            await expect(service.findExtractedDriver('tmp')).rejects.toThrow('ChromeDriver executable');
        });
    });
});
//# sourceMappingURL=ChromeUpdateService.test.js.map
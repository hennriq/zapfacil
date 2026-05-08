"use strict";
/// <reference types="jest" />
Object.defineProperty(exports, "__esModule", { value: true });
const BootstrapService_1 = require("../../../src/main/services/BootstrapService");
const LoggerService_1 = require("../../../src/main/services/LoggerService");
const ChromeDriverService_1 = require("../../../src/main/services/ChromeDriverService");
const WhatsAppAutomationService_1 = require("../../../src/main/services/WhatsAppAutomationService");
const ContactImportService_1 = require("../../../src/main/services/ContactImportService");
const ChromeUpdateService_1 = require("../../../src/main/services/ChromeUpdateService");
const PhoneValidationService_1 = require("../../../src/main/services/PhoneValidationService");
// Mock all services
jest.mock('../../../src/main/services/LoggerService');
jest.mock('../../../src/main/services/ChromeDriverService');
jest.mock('../../../src/main/services/WhatsAppAutomationService');
jest.mock('../../../src/main/services/ContactImportService');
jest.mock('../../../src/main/services/ChromeUpdateService');
jest.mock('../../../src/main/services/PhoneValidationService');
describe('BootstrapService', () => {
    let service;
    let mockLogger;
    let mockChromeDriver;
    let mockWhatsAppAutomation;
    let mockContactImporter;
    let mockChromeUpdater;
    let mockPhoneValidator;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Create mock instances
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        mockPhoneValidator = {
            validate: jest.fn(),
        };
        mockChromeDriver = {
            initialize: jest.fn().mockResolvedValue(undefined),
            isSessionActive: jest.fn().mockResolvedValue(false),
            stop: jest.fn().mockResolvedValue(undefined),
        };
        mockWhatsAppAutomation = {
            openWhatsAppWeb: jest.fn().mockResolvedValue(undefined),
            waitForQRCodeScan: jest.fn().mockResolvedValue(true),
        };
        mockContactImporter = {
            importFromCSV: jest.fn(),
            validateContacts: jest.fn(),
        };
        mockChromeUpdater = {
            checkForUpdates: jest.fn().mockResolvedValue(false),
            downloadLatestDriver: jest.fn().mockResolvedValue(undefined),
        };
        LoggerService_1.LoggerService.mockReturnValue(mockLogger);
        PhoneValidationService_1.PhoneValidationService.mockReturnValue(mockPhoneValidator);
        ChromeDriverService_1.ChromeDriverService.getInstance.mockReturnValue(mockChromeDriver);
        WhatsAppAutomationService_1.WhatsAppAutomationService.mockReturnValue(mockWhatsAppAutomation);
        ContactImportService_1.ContactImportService.mockReturnValue(mockContactImporter);
        ChromeUpdateService_1.ChromeUpdateService.mockReturnValue(mockChromeUpdater);
        service = new BootstrapService_1.BootstrapService();
    });
    describe('constructor', () => {
        it('should create BootstrapService instance with all services', () => {
            expect(service).toBeDefined();
            expect(LoggerService_1.LoggerService).toHaveBeenCalledWith('BootstrapService');
            expect(PhoneValidationService_1.PhoneValidationService).toHaveBeenCalledWith(mockLogger);
            expect(ChromeDriverService_1.ChromeDriverService.getInstance).toHaveBeenCalledWith(mockLogger);
        });
        it('should initialize with uninitialized state', () => {
            expect(service.isReady()).toBe(false);
        });
    });
    describe('initialize', () => {
        it('should initialize all services in correct order', async () => {
            await service.initialize();
            expect(mockLogger.info).toHaveBeenCalledWith('Starting application initialization...');
            expect(mockChromeUpdater.checkForUpdates).toHaveBeenCalled();
            expect(mockChromeDriver.initialize).toHaveBeenCalled();
            expect(mockWhatsAppAutomation.openWhatsAppWeb).toHaveBeenCalled();
            expect(mockWhatsAppAutomation.waitForQRCodeScan).toHaveBeenCalledWith(120000);
            expect(mockLogger.info).toHaveBeenCalledWith('Application initialized successfully!');
        });
        it('should download update if available', async () => {
            ;
            mockChromeUpdater.checkForUpdates.mockResolvedValue(true);
            await service.initialize();
            expect(mockChromeUpdater.downloadLatestDriver).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Downloading ChromeDriver update...');
        });
        it('should not download update if not available', async () => {
            ;
            mockChromeUpdater.checkForUpdates.mockResolvedValue(false);
            await service.initialize();
            expect(mockChromeUpdater.downloadLatestDriver).not.toHaveBeenCalled();
        });
        it('should handle QR code scan timeout gracefully', async () => {
            ;
            mockWhatsAppAutomation.waitForQRCodeScan.mockRejectedValue(new Error('Timeout'));
            await service.initialize();
            expect(mockLogger.warn).toHaveBeenCalledWith('QR Code scan timeout - user may need to scan again');
            expect(service.isReady()).toBe(true);
        });
        it('should set isInitialized to true on success', async () => {
            expect(service.isReady()).toBe(false);
            await service.initialize();
            expect(service.isReady()).toBe(true);
        });
        it('should throw error if initialization fails', async () => {
            const error = new Error('Initialization failed');
            mockChromeDriver.initialize.mockRejectedValue(error);
            await expect(service.initialize()).rejects.toThrow('Initialization failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize application', error);
        });
        it('should log initialization steps', async () => {
            await service.initialize();
            expect(mockLogger.info).toHaveBeenCalledWith('Checking for ChromeDriver updates...');
            expect(mockLogger.info).toHaveBeenCalledWith('Initializing ChromeDriver...');
            expect(mockLogger.info).toHaveBeenCalledWith('Opening WhatsApp Web...');
            expect(mockLogger.info).toHaveBeenCalledWith('Waiting for QR Code scan (2 minutes timeout)...');
        });
    });
    describe('shutdown', () => {
        it('should stop chrome driver and reset initialized state', async () => {
            await service.initialize();
            expect(service.isReady()).toBe(true);
            await service.shutdown();
            expect(mockChromeDriver.stop).toHaveBeenCalled();
            expect(service.isReady()).toBe(false);
            expect(mockLogger.info).toHaveBeenCalledWith('Shutting down application...');
            expect(mockLogger.info).toHaveBeenCalledWith('Application shutdown complete');
        });
        it('should handle shutdown errors gracefully', async () => {
            const error = new Error('Shutdown failed');
            mockChromeDriver.stop.mockRejectedValue(error);
            await service.shutdown();
            expect(mockLogger.error).toHaveBeenCalledWith('Error during shutdown', error);
        });
    });
    describe('getters', () => {
        it('should return logger instance', () => {
            const logger = service.getLogger();
            expect(logger).toBe(mockLogger);
        });
        it('should return chrome driver instance', () => {
            const driver = service.getChromeDriver();
            expect(driver).toBe(mockChromeDriver);
        });
        it('should return whatsapp automation instance', () => {
            const automation = service.getWhatsAppAutomation();
            expect(automation).toBe(mockWhatsAppAutomation);
        });
        it('should return contact importer instance', () => {
            const importer = service.getContactImporter();
            expect(importer).toBe(mockContactImporter);
        });
        it('should return chrome updater instance', () => {
            const updater = service.getChromeUpdater();
            expect(updater).toBe(mockChromeUpdater);
        });
        it('should return correct initialization state', () => {
            expect(service.isReady()).toBe(false);
        });
    });
});
describe('getBootstrapService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return singleton instance', () => {
        const instance1 = (0, BootstrapService_1.getBootstrapService)();
        const instance2 = (0, BootstrapService_1.getBootstrapService)();
        expect(instance1).toBe(instance2);
    });
    it('should return BootstrapService instance', () => {
        const instance = (0, BootstrapService_1.getBootstrapService)();
        expect(instance).toBeInstanceOf(BootstrapService_1.BootstrapService);
    });
});
//# sourceMappingURL=BootstrapService.test.js.map
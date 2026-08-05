"use strict";
/// <reference types="jest" />
Object.defineProperty(exports, "__esModule", { value: true });
const WhatsAppAutomationService_1 = require("../../../src/main/services/WhatsAppAutomationService");
const LoggerService_1 = require("../../../src/main/services/LoggerService");
const PhoneValidationService_1 = require("../../../src/main/services/PhoneValidationService");
describe('WhatsAppAutomationService', () => {
    let service;
    let mockChromeDriver;
    let logger;
    let phoneValidator;
    beforeEach(() => {
        logger = new LoggerService_1.LoggerService('WhatsAppAutomationService-Test');
        phoneValidator = new PhoneValidationService_1.PhoneValidationService(logger);
        mockChromeDriver = {
            initialize: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            navigateTo: jest.fn(),
            findElement: jest.fn(),
            executeScript: jest.fn(),
        };
        service = new WhatsAppAutomationService_1.WhatsAppAutomationService(mockChromeDriver, logger, phoneValidator);
    });
    describe('validatePhoneNumber', () => {
        it('should validate valid phone numbers', () => {
            expect(service.validatePhoneNumber('11999999999')).toBe(true);
            expect(service.validatePhoneNumber('5511999999999')).toBe(true);
        });
        it('should reject invalid phone numbers', () => {
            expect(service.validatePhoneNumber('123')).toBe(false);
            expect(service.validatePhoneNumber('')).toBe(false);
        });
    });
    describe('sendMessage', () => {
        it('should send message to valid contact', async () => {
            const mockButton = {
                click: jest.fn(),
            };
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            mockChromeDriver.findElement.mockResolvedValue(mockButton);
            await service.sendMessage('11999999999', 'Hello');
            expect(mockChromeDriver.navigateTo).toHaveBeenCalled();
            expect(mockChromeDriver.findElement).toHaveBeenCalled();
            expect(mockButton.click).toHaveBeenCalled();
        });
        it('should throw on invalid phone number', async () => {
            await expect(service.sendMessage('123', 'Hello')).rejects.toThrow('Invalid phone number');
        });
        it('should throw on empty message', async () => {
            await expect(service.sendMessage('11999999999', '')).rejects.toThrow('Message cannot be empty');
            await expect(service.sendMessage('11999999999', '   ')).rejects.toThrow('Message cannot be empty');
        });
        it('should format phone number correctly in URL', async () => {
            const mockButton = { click: jest.fn() };
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            mockChromeDriver.findElement.mockResolvedValue(mockButton);
            await service.sendMessage('11999999999', 'Hello');
            const callArgs = mockChromeDriver.navigateTo.mock.calls[0][0];
            expect(callArgs).toContain('5511999999999');
            expect(callArgs).toContain('web.whatsapp.com');
        });
        it('should handle findElement timeout', async () => {
            ;
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            mockChromeDriver.findElement.mockRejectedValue(new Error('Element not found'));
            await expect(service.sendMessage('11999999999', 'Hello')).rejects.toThrow('Element not found');
        });
    });
    describe('sendMessageToContacts', () => {
        it('should send messages to multiple contacts', async () => {
            const contacts = [
                { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
                { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
            ];
            const mockButton = { click: jest.fn() };
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            mockChromeDriver.findElement.mockResolvedValue(mockButton);
            const results = await service.sendMessageToContacts(contacts, 'Hello everyone');
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
            expect(mockChromeDriver.navigateTo).toHaveBeenCalledTimes(2);
        });
        it('should handle partial failures', async () => {
            const contacts = [
                { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
                { id: '2', name: 'Invalid', phone: '123', status: 'pendente' },
            ];
            const mockButton = { click: jest.fn() };
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            mockChromeDriver.findElement.mockResolvedValue(mockButton);
            const results = await service.sendMessageToContacts(contacts, 'Hello');
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(results[1].error).toBeDefined();
        });
        it('should include timestamp in results', async () => {
            const contacts = [
                { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
            ];
            const mockButton = { click: jest.fn() };
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            mockChromeDriver.findElement.mockResolvedValue(mockButton);
            const results = await service.sendMessageToContacts(contacts, 'Hello');
            expect(results[0].timestamp).toBeInstanceOf(Date);
        });
        it('should continue sending even if one fails', async () => {
            const contacts = [
                { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
                { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
            ];
            let callCount = 0;
            mockChromeDriver.navigateTo.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Network error');
                }
                return Promise.resolve();
            });
            const mockButton = { click: jest.fn() };
            mockChromeDriver.findElement.mockResolvedValue(mockButton);
            const results = await service.sendMessageToContacts(contacts, 'Hello');
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(false);
            expect(results[1].success).toBe(true);
        });
        it('should stop sending after cancellation is requested', async () => {
            const contacts = [
                { id: '1', name: 'JoÃ£o', phone: '11999999999', status: 'pendente' },
                { id: '2', name: 'Maria', phone: '21888888888', status: 'pendente' },
            ];
            jest.spyOn(service, 'sendMessage').mockImplementation(async () => {
                service.cancelSending();
            });
            const results = await service.sendMessageToContacts(contacts, 'Hello');
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(service.wasLastSendCanceled()).toBe(true);
        });
    });
    describe('openWhatsAppWeb', () => {
        it('should navigate to WhatsApp Web', async () => {
            ;
            mockChromeDriver.navigateTo.mockResolvedValue(undefined);
            await service.openWhatsAppWeb();
            expect(mockChromeDriver.navigateTo).toHaveBeenCalledWith('https://web.whatsapp.com/');
        });
        it('should throw on navigation error', async () => {
            ;
            mockChromeDriver.navigateTo.mockRejectedValue(new Error('Navigation failed'));
            await expect(service.openWhatsAppWeb()).rejects.toThrow('Navigation failed');
        });
    });
    describe('waitForQRCodeScan', () => {
        it('should wait for QR code scan', async () => {
            const mockChatList = {};
            mockChromeDriver.findElement
                .mockRejectedValueOnce(new Error('Not found'))
                .mockRejectedValueOnce(new Error('Not found'))
                .mockResolvedValue(mockChatList);
            await service.waitForQRCodeScan(10000);
            expect(mockChromeDriver.findElement).toHaveBeenCalled();
        });
        it('should timeout waiting for QR code', async () => {
            ;
            mockChromeDriver.findElement.mockRejectedValue(new Error('Not found'));
            await expect(service.waitForQRCodeScan(100)).rejects.toThrow('QR Code scan timeout');
        }, 5000);
    });
});
//# sourceMappingURL=WhatsAppAutomationService.test.js.map
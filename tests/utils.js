"use strict";
/**
 * Test Utilities and Helpers
 * Common testing utilities for unit, integration, and E2E tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockIPC = exports.TEST_DATA = void 0;
exports.createMockContact = createMockContact;
exports.createMockContacts = createMockContacts;
exports.createMockValidationResult = createMockValidationResult;
exports.createMockSendResult = createMockSendResult;
exports.createMockLogEntry = createMockLogEntry;
exports.waitFor = waitFor;
exports.createDelayedPromise = createDelayedPromise;
exports.mockFetch = mockFetch;
exports.expectErrorMessage = expectErrorMessage;
exports.expectObjectShape = expectObjectShape;
exports.spyOnConsole = spyOnConsole;
exports.resetAllMocks = resetAllMocks;
exports.createTestContext = createTestContext;
/**
 * Create mock contact for testing
 */
function createMockContact(overrides) {
    return {
        id: 'contact-1',
        name: 'João Silva',
        phone: '11999999999',
        status: 'pendente',
        ...overrides,
    };
}
/**
 * Create array of mock contacts
 */
function createMockContacts(count = 5) {
    return Array.from({ length: count }, (_, i) => ({
        id: `contact-${i + 1}`,
        name: `Contato ${i + 1}`,
        phone: `1199999999${String(i).padStart(2, '0')}`,
        status: 'pendente',
    }));
}
/**
 * Create mock validation result
 */
function createMockValidationResult(overrides) {
    return {
        isValid: true,
        errors: [],
        warnings: [],
        ...overrides,
    };
}
/**
 * Create mock send result
 */
function createMockSendResult(overrides) {
    return {
        contactId: 'contact-1',
        success: true,
        timestamp: new Date(),
        ...overrides,
    };
}
/**
 * Create mock log entry
 */
function createMockLogEntry(overrides) {
    return {
        timestamp: new Date(),
        level: 'INFO',
        context: 'Test',
        message: 'Test message',
        ...overrides,
    };
}
/**
 * Wait for condition to be true
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (!condition()) {
        if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for condition');
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
}
/**
 * Create async function that resolves after delay
 */
function createDelayedPromise(value, delay = 100) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), delay);
    });
}
/**
 * Mock fetch for testing HTTP requests
 */
function mockFetch(response, status = 200, delay = 0) {
    return jest.fn(() => createDelayedPromise({
        ok: status < 400,
        status,
        json: () => createDelayedPromise(response, delay),
        text: () => createDelayedPromise(JSON.stringify(response), delay),
    }, delay));
}
/**
 * Test data sets for parameterized tests
 */
exports.TEST_DATA = {
    validPhones: [
        '11999999999',
        '5511999999999',
        '+55 11 99999-9999',
        '(11) 99999-9999',
    ],
    invalidPhones: [
        '',
        '123',
        'abc',
        null,
        undefined,
    ],
    validEmails: [
        'test@example.com',
        'user.name@company.co.br',
        'contact+tag@domain.org',
    ],
    invalidEmails: [
        '',
        'invalid',
        '@example.com',
        'test@',
    ],
    validCSVContent: `name,phone
João Silva,11999999999
Maria Santos,11988888888
Pedro Costa,11977777777`,
    invalidCSVContent: `name,phone
,11999999999
Maria Santos,invalid`,
};
/**
 * Assert error message contains expected text
 */
function expectErrorMessage(error, expectedText) {
    const message = error?.message || String(error);
    expect(message).toContain(expectedText);
}
/**
 * Assert object matches shape (duck typing)
 */
function expectObjectShape(obj, shape) {
    Object.entries(shape).forEach(([key, value]) => {
        if (value === expect.any(Function)) {
            expect(typeof obj[key]).toBe('function');
        }
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            expectObjectShape(obj[key], value);
        }
        else {
            expect(obj).toHaveProperty(key);
        }
    });
}
/**
 * Create spy for console methods
 */
function spyOnConsole() {
    const spies = {
        log: jest.spyOn(console, 'log').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
    };
    return {
        spies,
        restore: () => {
            Object.values(spies).forEach((spy) => spy.mockRestore());
        },
    };
}
/**
 * Create mock IPC handlers
 */
exports.mockIPC = {
    invoke: jest.fn(),
    handle: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    once: jest.fn(),
};
/**
 * Reset all mocks
 */
function resetAllMocks() {
    jest.clearAllMocks();
    jest.restoreAllMocks();
}
/**
 * Create test transaction context
 */
function createTestContext() {
    return {
        startTime: Date.now(),
        logs: [],
        addLog: function (message, level = 'INFO') {
            this.logs.push({
                timestamp: new Date(),
                level,
                message,
            });
        },
        getLogs: function () {
            return this.logs;
        },
        getDuration: function () {
            return Date.now() - this.startTime;
        },
    };
}
//# sourceMappingURL=utils.js.map
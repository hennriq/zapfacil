/**
 * Test Utilities and Helpers
 * Common testing utilities for unit, integration, and E2E tests
 */
import { IContact, IValidationResult, ISendResult } from '../src/shared/interfaces';
/**
 * Create mock contact for testing
 */
export declare function createMockContact(overrides?: Partial<IContact>): IContact;
/**
 * Create array of mock contacts
 */
export declare function createMockContacts(count?: number): IContact[];
/**
 * Create mock validation result
 */
export declare function createMockValidationResult(overrides?: Partial<IValidationResult>): IValidationResult;
/**
 * Create mock send result
 */
export declare function createMockSendResult(overrides?: Partial<ISendResult>): ISendResult;
/**
 * Create mock log entry
 */
export declare function createMockLogEntry(overrides?: any): any;
/**
 * Wait for condition to be true
 */
export declare function waitFor(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
/**
 * Create async function that resolves after delay
 */
export declare function createDelayedPromise<T>(value: T, delay?: number): Promise<T>;
/**
 * Mock fetch for testing HTTP requests
 */
export declare function mockFetch(response: any, status?: number, delay?: number): jest.Mock<Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<any>;
    text: () => Promise<string>;
}>, [], any>;
/**
 * Test data sets for parameterized tests
 */
export declare const TEST_DATA: {
    validPhones: string[];
    invalidPhones: (string | null | undefined)[];
    validEmails: string[];
    invalidEmails: string[];
    validCSVContent: string;
    invalidCSVContent: string;
};
/**
 * Assert error message contains expected text
 */
export declare function expectErrorMessage(error: any, expectedText: string): void;
/**
 * Assert object matches shape (duck typing)
 */
export declare function expectObjectShape(obj: any, shape: Record<string, any>): void;
/**
 * Create spy for console methods
 */
export declare function spyOnConsole(): {
    spies: {
        log: jest.SpyInstance<void, any[], any>;
        error: jest.SpyInstance<void, any[], any>;
        warn: jest.SpyInstance<void, any[], any>;
    };
    restore: () => void;
};
/**
 * Create mock IPC handlers
 */
export declare const mockIPC: {
    invoke: jest.Mock<any, any, any>;
    handle: jest.Mock<any, any, any>;
    on: jest.Mock<any, any, any>;
    emit: jest.Mock<any, any, any>;
    removeListener: jest.Mock<any, any, any>;
    once: jest.Mock<any, any, any>;
};
/**
 * Reset all mocks
 */
export declare function resetAllMocks(): void;
/**
 * Create test transaction context
 */
export declare function createTestContext(): {
    startTime: number;
    logs: any[];
    addLog: (message: string, level?: string) => void;
    getLogs: () => any[];
    getDuration: () => number;
};
//# sourceMappingURL=utils.d.ts.map
/**
 * Test Utilities and Helpers
 * Common testing utilities for unit, integration, and E2E tests
 */

import { IContact, IValidationResult, ISendResult } from '../src/shared/interfaces'

/**
 * Create mock contact for testing
 */
export function createMockContact(overrides?: Partial<IContact>): IContact {
  return {
    id: 'contact-1',
    name: 'João Silva',
    phone: '11999999999',
    status: 'pendente',
    ...overrides,
  }
}

/**
 * Create array of mock contacts
 */
export function createMockContacts(count: number = 5): IContact[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `contact-${i + 1}`,
    name: `Contato ${i + 1}`,
    phone: `1199999999${String(i).padStart(2, '0')}`,
    status: 'pendente' as const,
  }))
}

/**
 * Create mock validation result
 */
export function createMockValidationResult(overrides?: Partial<IValidationResult>): IValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    ...overrides,
  }
}

/**
 * Create mock send result
 */
export function createMockSendResult(overrides?: Partial<ISendResult>): ISendResult {
  return {
    contactId: 'contact-1',
    success: true,
    timestamp: new Date(),
    ...overrides,
  }
}

/**
 * Create mock log entry
 */
export function createMockLogEntry(overrides?: any) {
  return {
    timestamp: new Date(),
    level: 'INFO',
    context: 'Test',
    message: 'Test message',
    ...overrides,
  }
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

/**
 * Create async function that resolves after delay
 */
export function createDelayedPromise<T>(value: T, delay: number = 100): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay)
  })
}

/**
 * Mock fetch for testing HTTP requests
 */
export function mockFetch(response: any, status: number = 200, delay: number = 0) {
  return jest.fn(() =>
    createDelayedPromise(
      {
        ok: status < 400,
        status,
        json: () => createDelayedPromise(response, delay),
        text: () => createDelayedPromise(JSON.stringify(response), delay),
      },
      delay
    )
  )
}

/**
 * Test data sets for parameterized tests
 */
export const TEST_DATA = {
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
}

/**
 * Assert error message contains expected text
 */
export function expectErrorMessage(error: any, expectedText: string): void {
  const message = error?.message || String(error)
  expect(message).toContain(expectedText)
}

/**
 * Assert object matches shape (duck typing)
 */
export function expectObjectShape(obj: any, shape: Record<string, any>): void {
  Object.entries(shape).forEach(([key, value]) => {
    if (value === expect.any(Function)) {
      expect(typeof obj[key]).toBe('function')
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      expectObjectShape(obj[key], value)
    } else {
      expect(obj).toHaveProperty(key)
    }
  })
}

/**
 * Create spy for console methods
 */
export function spyOnConsole() {
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
  }

  return {
    spies,
    restore: () => {
      Object.values(spies).forEach((spy) => spy.mockRestore())
    },
  }
}

/**
 * Create mock IPC handlers
 */
export const mockIPC = {
  invoke: jest.fn(),
  handle: jest.fn(),
  on: jest.fn(),
  emit: jest.fn(),
  removeListener: jest.fn(),
  once: jest.fn(),
}

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks()
  jest.restoreAllMocks()
}

/**
 * Create test transaction context
 */
export function createTestContext() {
  return {
    startTime: Date.now(),
    logs: [] as any[],
    addLog: function (message: string, level: string = 'INFO') {
      this.logs.push({
        timestamp: new Date(),
        level,
        message,
      })
    },
    getLogs: function () {
      return this.logs
    },
    getDuration: function () {
      return Date.now() - this.startTime
    },
  }
}

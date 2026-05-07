import { ILogger } from '@shared/interfaces'

/**
 * LoggerService implementa ILogger
 * Segue Single Responsibility Principle - responsável apenas por logging
 * Segue Dependency Injection - pode ser injetado em outras classes
 */
export class LoggerService implements ILogger {
  private readonly context: string

  constructor(context: string) {
    this.context = context
  }

  info(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: 'INFO',
      context: this.context,
      message,
      data,
    }
    console.log(JSON.stringify(logEntry))
  }

  warn(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: 'WARN',
      context: this.context,
      message,
      data,
    }
    console.warn(JSON.stringify(logEntry))
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: 'ERROR',
      context: this.context,
      message,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error(JSON.stringify(logEntry))
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG === 'true') {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level: 'DEBUG',
        context: this.context,
        message,
        data,
      }
      console.debug(JSON.stringify(logEntry))
    }
  }
}

/**
 * Singleton para logger da aplicação
 * Garante uma única instância de logger
 */
export const logger = new LoggerService('ZapFacil')

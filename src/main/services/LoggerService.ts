import { ILogger } from '../../shared/interfaces'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: any
  error?: any
  stack?: string
}

type LogListener = (entry: LogEntry) => void

const listeners = new Set<LogListener>()

function emit(entry: LogEntry): void {
  for (const listener of listeners) {
    listener(entry)
  }
}

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
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context: this.context,
      message,
      data,
    }
    console.log(JSON.stringify(logEntry))
    emit(logEntry)
  }

  warn(message: string, data?: any): void {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      context: this.context,
      message,
      data,
    }
    console.warn(JSON.stringify(logEntry))
    emit(logEntry)
  }

  error(message: string, error?: any): void {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      context: this.context,
      message,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error(JSON.stringify(logEntry))
    emit(logEntry)
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG === 'true') {
      const logEntry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        context: this.context,
        message,
        data,
      }
      console.debug(JSON.stringify(logEntry))
      emit(logEntry)
    }
  }
}

export function onLog(listener: LogListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Singleton para logger da aplicação
 * Garante uma única instância de logger
 */
export const logger = new LoggerService('ZapFacil')

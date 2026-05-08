import { ILogger } from '../../shared/interfaces'
import { LoggerService } from './LoggerService'

export interface PerformanceSummary {
  timestamp: string
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  cpuUsageMs: number
}

export class PerformanceService {
  private readonly logger: ILogger

  constructor(logger: ILogger = new LoggerService('PerformanceService')) {
    this.logger = logger
  }

  async getSummary(): Promise<PerformanceSummary> {
    const memory = process.memoryUsage()
    const cpu = process.cpuUsage()
    const cpuUsageMs = Number(((cpu.user + cpu.system) / 1000).toFixed(2))

    const summary: PerformanceSummary = {
      timestamp: new Date().toISOString(),
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
      cpuUsageMs,
    }

    this.logger.debug('Performance summary captured', summary)
    return summary
  }
}

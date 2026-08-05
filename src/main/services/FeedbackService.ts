import path from 'path'
import { FeedbackEntry } from '../../shared/appTypes'
import { ILogger } from '../../shared/interfaces'
import { JsonFileStore } from './JsonFileStore'
import { LoggerService } from './LoggerService'

export class FeedbackService {
  private readonly store: JsonFileStore<FeedbackEntry[]>
  private readonly logger: ILogger

  constructor(storageDir: string, logger: ILogger = new LoggerService('FeedbackService')) {
    this.logger = logger
    this.store = new JsonFileStore(path.join(storageDir, 'feedback.json'), [])
  }

  async submit(feedback: FeedbackEntry): Promise<FeedbackEntry> {
    if (!feedback.message.trim()) {
      throw new Error('Feedback message is required')
    }

    const entry: FeedbackEntry = {
      ...feedback,
      id: feedback.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: feedback.message.trim(),
      createdAt: feedback.createdAt || new Date().toISOString(),
    }

    const entries = await this.store.read()
    await this.store.write([...entries, entry])
    this.logger.info(`Feedback captured: ${entry.category}`)
    return entry
  }

  async list(): Promise<FeedbackEntry[]> {
    return this.store.read()
  }
}

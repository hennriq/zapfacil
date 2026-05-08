import { promises as fs } from 'fs'
import path from 'path'

export class JsonFileStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly fallbackValue: T
  ) {}

  async read(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(raw) as T
    } catch {
      return this.fallbackValue
    }
  }

  async write(value: T): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(value, null, 2), 'utf-8')
  }
}

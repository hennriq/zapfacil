/// <reference types="jest" />

import { promises as fs } from 'fs'
import path from 'path'
import { FeedbackService } from '../../../src/main/services/FeedbackService'

const testDir = path.join(process.cwd(), 'run', 'tests', 'feedback-service')

describe('FeedbackService', () => {
  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should store feedback entries', async () => {
    const service = new FeedbackService(testDir)

    const entry = await service.submit({
      category: 'idea',
      message: 'Add campaign scheduling',
      email: 'user@example.com',
      appVersion: '2.0.0',
    })
    const entries = await service.list()

    expect(entry.id).toBeDefined()
    expect(entries).toHaveLength(1)
    expect(entries[0].message).toBe('Add campaign scheduling')
  })

  it('should reject blank feedback', async () => {
    const service = new FeedbackService(testDir)

    await expect(service.submit({ category: 'bug', message: '  ' })).rejects.toThrow(
      'Feedback message is required'
    )
  })
})

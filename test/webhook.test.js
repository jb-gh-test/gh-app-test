import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { Webhooks } from '@octokit/webhooks'

const TESTDATA_DIR = path.resolve(process.cwd(), '__testdata__')

describe('saved webhook testdata signature validation', async () => {
  it('verifies signatures for each saved event', async () => {
    const files = await fs.readdir(TESTDATA_DIR)
    const headersFiles = files.filter((f) => f.endsWith('.headers.json'))

    if (headersFiles.length === 0) {
      // no testdata to validate; make the test a no-op (or fail if you prefer)
      return
    }

    const secret = process.env.WEBHOOK_SECRET || 'test'
    const webhooks = new Webhooks({ secret })

    for (const hf of headersFiles) {
      const base = hf.replace('.headers.json', '')
      const headersRaw = await fs.readFile(path.join(TESTDATA_DIR, hf), 'utf8')
      const headers = JSON.parse(headersRaw)
      const bodyPath = path.join(TESTDATA_DIR, base + '.body.txt')
      const body = await fs.readFile(bodyPath, 'utf8')

      const signature = headers['x-hub-signature-256'] || headers['x-hub-signature']
      expect(signature, `missing signature header for ${base}`).toBeTruthy()

      const valid = await webhooks.verify(String(body), signature)
      expect(valid, `signature verification failed for ${base}`).toBe(true)
    }
  })
})

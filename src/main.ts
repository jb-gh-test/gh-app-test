import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import fs from 'fs/promises'

const app = new Hono()

app.post('/', async (c) => {
  const rawBody = await c.req.text()
  const headers = c.req.header()

  const delivery = headers['x-github-delivery'] ?? Date.now().toString()
  const event = headers['x-github-event'] ?? 'unknown'
  const safeDelivery = String(delivery).replace(/[^a-zA-Z0-9_-]/g, '_')
  const base = `__testdata__/${safeDelivery}.${event}`

  await fs.mkdir('__testdata__', { recursive: true })
  await fs.writeFile(base + '.body.txt', rawBody)
  await fs.writeFile(base + '.headers.json', JSON.stringify(headers, null, 2))

  try {
    const parsed = JSON.parse(rawBody)
    console.log('event:', parsed?.action ?? event)
  } catch (e) {
    // ignore parse errors
  }

  return c.json({ ok: true })
})

serve(app, (info) => {
  console.log(`Hono server listening on http://localhost:${info.port}`)
})

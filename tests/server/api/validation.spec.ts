import { Buffer } from 'node:buffer'
import { createEvent } from 'h3'
import { createRequest, createResponse } from 'node-mock-http'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import loginHandler from '@/server/api/v1/auth/login.post'
import signupHandler from '@/server/api/v1/auth/signup.post'
import proxyChatHandler from '@/server/api/v1/chats/index.post'

const resetDb = (globalThis as any).__NUXT_RESET_DB__ as (() => void) | undefined

function createPostEvent(path: string, body: unknown) {
  const payload = JSON.stringify(body)
  const req = createRequest({
    method: 'POST',
    url: path,
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload).toString(),
    },
  })
  req.write(payload)
  req.end()
  const res = createResponse()
  return createEvent(req, res)
}

describe('aPI input validation', () => {
  let originalRuntimeConfig: any

  beforeAll(() => {
    originalRuntimeConfig = (globalThis as any).useRuntimeConfig
    ;(globalThis as any).useRuntimeConfig = () => ({ jwtSecret: 'test-secret', public: {} })
  })

  beforeEach(() => {
    resetDb?.()
  })

  afterAll(() => {
    if (originalRuntimeConfig)
      (globalThis as any).useRuntimeConfig = originalRuntimeConfig
    else
      delete (globalThis as any).useRuntimeConfig
  })

  it('rejects signup with invalid email or short password', async () => {
    const badEmailEvent = createPostEvent('/api/v1/auth/signup', {
      email: 'not-an-email',
      name: 'User',
      password: '123456',
    })

    await expect(signupHandler(badEmailEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid email',
    })

    const shortPasswordEvent = createPostEvent('/api/v1/auth/signup', {
      email: 'valid@example.com',
      name: 'User',
      password: '123',
    })

    await expect(signupHandler(shortPasswordEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Password too short',
    })
  })

  it('rejects login attempts with invalid email formats', async () => {
    const event = createPostEvent('/api/v1/auth/login', {
      email: 'test@example.com\' OR \'1\'=\'1',
      password: 'irrelevant',
    })

    await expect(loginHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid email',
    })
  })

  it('rejects chat proxy requests with invalid providers or message payloads', async () => {
    const invalidProviderEvent = createPostEvent('/api/v1/chats', {
      provider: 'unknown',
      messages: [{ role: 'user', content: 'Hi' }],
    })
    invalidProviderEvent.context.user = { id: 'user', email: 'user@example.com' }

    await expect(proxyChatHandler(invalidProviderEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid provider',
    })

    const invalidRoleEvent = createPostEvent('/api/v1/chats', {
      provider: 'openai',
      messages: [{ role: 'attacker', content: 'Hi' }],
    })
    invalidRoleEvent.context.user = { id: 'user', email: 'user@example.com' }

    await expect(proxyChatHandler(invalidRoleEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid message role',
    })

    const blankContentEvent = createPostEvent('/api/v1/chats', {
      provider: 'openai',
      messages: [{ role: 'user', content: '   ' }],
    })
    blankContentEvent.context.user = { id: 'user', email: 'user@example.com' }

    await expect(proxyChatHandler(blankContentEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid message content',
    })
  })
})

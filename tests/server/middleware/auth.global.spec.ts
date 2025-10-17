import { createEvent } from 'h3'
import { createRequest, createResponse } from 'node-mock-http'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import authMiddleware from '@/server/middleware/auth.global'
import { signJWT } from '@/server/utils/jwt'

const SECRET = 'test-secret'

function runMiddleware(eventUrl: string, headers: Record<string, string | undefined> = {}) {
  const req = createRequest({
    method: 'GET',
    url: eventUrl,
    headers,
  })
  const res = createResponse()
  return createEvent(req, res)
}

describe('auth.global middleware', () => {
  let originalRuntimeConfig: any

  beforeAll(() => {
    originalRuntimeConfig = (globalThis as any).useRuntimeConfig
    ;(globalThis as any).useRuntimeConfig = () => ({ jwtSecret: SECRET, public: {} })
  })

  afterAll(() => {
    if (originalRuntimeConfig)
      (globalThis as any).useRuntimeConfig = originalRuntimeConfig
    else
      delete (globalThis as any).useRuntimeConfig
  })

  it('allows public API routes without a token', async () => {
    const event = runMiddleware('/api/v1/auth/login')
    await expect(authMiddleware(event)).resolves.toBeUndefined()
    expect(event.context.user).toBeUndefined()
  })

  it('rejects missing credentials on protected routes', async () => {
    const event = runMiddleware('/api/v1/chats')
    await expect(authMiddleware(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Missing token',
    })
  })

  it('attaches user context when Authorization header includes a valid token', async () => {
    const token = signJWT({ sub: 'user_id', email: 'user@example.com' }, { secret: SECRET, expiresInSec: 60, issuer: 'nuxt-ai-chat' })
    const event = runMiddleware('/api/v1/chats', { authorization: `Bearer ${token}` })

    await expect(authMiddleware(event)).resolves.toBeUndefined()
    expect(event.context.user).toEqual({ id: 'user_id', email: 'user@example.com' })
  })

  it('rejects invalid tokens from cookies', async () => {
    const token = signJWT({ sub: 'user_id', email: 'user@example.com' }, { secret: 'wrong-secret', expiresInSec: 60, issuer: 'nuxt-ai-chat' })
    const event = runMiddleware('/api/v1/chats', { cookie: `access_token=${token}` })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(authMiddleware(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid or expired token',
    })

    errorSpy.mockRestore()
  })
})

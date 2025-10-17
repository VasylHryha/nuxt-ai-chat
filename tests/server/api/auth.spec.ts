import { Buffer } from 'node:buffer'
import { createEvent } from 'h3'
import { createRequest, createResponse } from 'node-mock-http'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import loginHandler from '@/server/api/v1/auth/login.post'
import logoutHandler from '@/server/api/v1/auth/logout.post'
import meHandler from '@/server/api/v1/auth/me.get'
import signupHandler from '@/server/api/v1/auth/signup.post'
import { insertUser, listUsers, upsertPasswordCredential } from '@/server/db/users'
import { hashPassword } from '@/server/utils/password'

const JWT_SECRET = 'test-secret'

function createJsonEvent(path: string, body: unknown, headers: Record<string, string> = {}) {
  const payload = JSON.stringify(body)
  const req = createRequest({
    method: 'POST',
    url: path,
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload).toString(),
      ...headers,
    },
  })
  req.write(payload)
  req.end()
  const res = createResponse()
  return createEvent(req, res)
}

function createGetEvent(path: string, headers: Record<string, string> = {}) {
  const req = createRequest({
    method: 'GET',
    url: path,
    headers,
  })
  req.end()
  const res = createResponse()
  return createEvent(req, res)
}

describe('auth API routes', () => {
  let originalRuntimeConfig: any

  beforeAll(() => {
    originalRuntimeConfig = (globalThis as any).useRuntimeConfig
    ;(globalThis as any).useRuntimeConfig = () => ({
      jwtSecret: JWT_SECRET,
      public: {},
    })
  })

  beforeEach(() => {
    const reset = (globalThis as any).__NUXT_RESET_DB__
    reset?.()
  })

  afterAll(() => {
    if (originalRuntimeConfig)
      (globalThis as any).useRuntimeConfig = originalRuntimeConfig
    else
      delete (globalThis as any).useRuntimeConfig
  })

  it('registers a user via signup and sets access cookie', async () => {
    const event = createJsonEvent('/api/v1/auth/signup', {
      email: 'alice@example.com',
      name: 'Alice',
      password: 'safe',
    })

    const result = await signupHandler(event)

    expect(result.user.email).toBe('alice@example.com')
    expect(typeof result.token).toBe('string')
    expect(listUsers().length).toBe(1)
    const cookieHeader = event.node.res.getHeader('set-cookie')
    expect(cookieHeader).toBeDefined()
    expect(String(cookieHeader)).toContain('access_token=')
  })

  it('rejects duplicate signup attempts', async () => {
    const event1 = createJsonEvent('/api/v1/auth/signup', {
      email: 'bob@example.com',
      name: 'Bob',
      password: 'safe',
    })
    await signupHandler(event1)

    const event2 = createJsonEvent('/api/v1/auth/signup', {
      email: 'bob@example.com',
      name: 'Other Bob',
      password: 'safe',
    })

    await expect(signupHandler(event2)).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Email already exists',
    })
  })

  it('logs in an existing user and returns token payload', async () => {
    const inserted = insertUser({ email: 'carol@example.com', name: 'Carol' })
    const hash = await hashPassword('letmein')
    upsertPasswordCredential(inserted.id, hash)

    const event = createJsonEvent('/api/v1/auth/login', {
      email: 'carol@example.com',
      password: 'letmein',
    })

    const res = await loginHandler(event)
    expect(res.user.id).toBe(inserted.id)
    expect(res.expiresIn).toBe(3600)
    expect(res.token).toBeTruthy()

    const cookieHeader = event.node.res.getHeader('set-cookie')
    expect(String(cookieHeader)).toContain('access_token=')
  })

  it('rejects login with wrong password', async () => {
    const inserted = insertUser({ email: 'dave@example.com', name: 'Dave' })
    const hash = await hashPassword('super-secret')
    upsertPasswordCredential(inserted.id, hash)

    const event = createJsonEvent('/api/v1/auth/login', {
      email: 'dave@example.com',
      password: 'wrong',
    })

    await expect(loginHandler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  })

  it('returns current user on /me when context user is present', async () => {
    const signupEvent = createJsonEvent('/api/v1/auth/signup', {
      email: 'erin@example.com',
      name: 'Erin',
      password: 'pw',
    })
    const { user } = await signupHandler(signupEvent)

    const event = createGetEvent('/api/v1/auth/me')
    event.context.user = { id: user.id, email: user.email }

    const result = await meHandler(event)
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      createdAt: expect.any(String),
    })
  })

  it('rejects /me when user is missing', async () => {
    const event = createGetEvent('/api/v1/auth/me')
    await expect(meHandler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  })

  it('clears access cookie on logout', async () => {
    const event = createJsonEvent('/api/v1/auth/logout', {})
    await logoutHandler(event)
    const cookieHeader = event.node.res.getHeader('set-cookie')
    expect(String(cookieHeader)).toContain('access_token=')
    expect(String(cookieHeader)).toContain('Max-Age=0')
  })
})

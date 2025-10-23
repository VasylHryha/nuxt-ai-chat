import type { Mock } from 'vitest'
import { Buffer } from 'node:buffer'
import { createError, createEvent } from 'h3'
import { createRequest, createResponse } from 'node-mock-http'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import aiChatsHandler from '@/server/api/v1/ai/chats/index.post'
import listChatsHandler from '@/server/api/v1/chats/index.get'
import proxyChatHandler from '@/server/api/v1/chats/index.post'
import { createChatForUser } from '@/server/db/chats'
import db from '@/server/db/main'
import { insertUser } from '@/server/db/users'

const streamTextMock = vi.fn()
vi.mock('ai', () => ({
  convertToModelMessages: (rows: any) => rows,
  streamText: streamTextMock,
}))

const getProviderMock = vi.fn(() => () => ({}))
vi.mock('@/server/utils/ai', () => ({
  getProvider: getProviderMock,
}))

const fetchMock = (globalThis as any).__NUXT_FETCH_MOCK__ as Mock
const resetDb = (globalThis as any).__NUXT_RESET_DB__ as (() => void) | undefined

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

function createPostEvent(path: string, body: unknown, headers: Record<string, string> = {}) {
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

describe('chat API endpoints', () => {
  let originalRuntimeConfig: any

  beforeAll(() => {
    originalRuntimeConfig = (globalThis as any).useRuntimeConfig
    ;(globalThis as any).useRuntimeConfig = () => ({
      jwtSecret: 'test-secret',
      openaiApiKey: 'openai-test-key',
      anthropicApiKey: 'anth-test-key',
      googleApiKey: 'google-test-key',
      public: {},
    })
  })

  beforeEach(() => {
    resetDb?.()
    fetchMock.mockClear()
    streamTextMock.mockReset()
    getProviderMock.mockClear()
  })

  afterAll(() => {
    if (originalRuntimeConfig)
      (globalThis as any).useRuntimeConfig = originalRuntimeConfig
    else
      delete (globalThis as any).useRuntimeConfig
  })

  it('lists chats filtered by user email', async () => {
    const user = insertUser({ email: 'list@example.com', name: 'Lister' })
    const chat = createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o',
      title: 'Session one',
    })

    const event = createGetEvent(`/api/v1/chats?email=${encodeURIComponent(user.email)}`)
    event.context.user = { id: user.id, email: user.email }
    const result = await listChatsHandler(event)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: chat.id,
      title: 'Session one',
      provider: 'openai',
      model: 'gpt-4o',
    })
    expect(result[0].createdAt).toBeDefined()
    expect(result[0].updatedAt).toBeDefined()
  })

  it('rejects requests without email query parameter', async () => {
    const event = createGetEvent('/api/v1/chats')
    event.context.user = { id: 'missing', email: 'missing@example.com' }
    await expect(listChatsHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'email is required',
    })
  })

  it('returns 404 when requesting chats for unknown user', async () => {
    const event = createGetEvent('/api/v1/chats?email=missing@example.com')
    event.context.user = { id: 'missing', email: 'missing@example.com' }
    await expect(listChatsHandler(event)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  })

  it('proxies chat POST requests to provider-specific endpoint', async () => {
    fetchMock.mockResolvedValueOnce({ content: 'ok' })
    const event = createPostEvent('/api/v1/chats', {
      provider: 'openrouter',
      messages: [{ role: 'user', content: 'Hello there' }],
      model: 'deepseek/deepseek-r1',
    })

    event.context.user = { id: 'proxy-user', email: 'proxy@example.com' }

    const response = await proxyChatHandler(event)

    expect(response).toEqual({ content: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/openrouter/chat')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: {
        provider: 'openrouter',
        messages: [{ role: 'user', content: 'Hello there' }],
        model: 'deepseek/deepseek-r1',
      },
    })
  })

  it('rejects chat POST without provider', async () => {
    const event = createPostEvent('/api/v1/chats', {
      messages: [{ role: 'user', content: 'Missing provider' }],
    })
    event.context.user = { id: 'proxy-user', email: 'proxy@example.com' }

    await expect(proxyChatHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'provider required',
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('streams provider responses and persists chat messages', async () => {
    const user = insertUser({ email: 'stream@example.com', name: 'Streamer' })
    const chat = createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
      title: 'Streaming demo',
    })

    streamTextMock.mockReturnValueOnce({
      toUIMessageStreamResponse: async ({ onFinish }) => {
        await onFinish({
          messages: [
            {
              id: 'msg-user',
              role: 'user',
              parts: [{ type: 'text', text: 'Test prompt' }],
            },
            {
              id: 'gen_123',
              role: 'assistant',
              parts: [{ type: 'text', text: 'Hello world' }],
            },
          ],
        })
        return { ok: true } as any
      },
    })

    const event = createPostEvent('/api/v1/ai/chats', {
      id: chat.id,
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          id: 'msg-user',
          role: 'user',
          parts: [{ type: 'text', text: 'Test prompt' }],
        },
      ],
    })
    event.context.user = { id: user.id, email: user.email }

    await aiChatsHandler(event)

    const messages = db.prepare('SELECT role, content, provider_generation_id FROM messages WHERE chat_id=? ORDER BY created_at ASC').all(chat.id) as Array<{ role: string, content: string, provider_generation_id: string | null }>
    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({ role: 'user', content: 'Test prompt' })
    expect(messages[1]).toMatchObject({ role: 'assistant', content: 'Hello world', provider_generation_id: 'gen_123' })

    expect(streamTextMock).toHaveBeenCalledTimes(1)
    expect(getProviderMock).toHaveBeenCalledWith({
      provider: 'openai',
      apiKey: 'openai-test-key',
      baseURL: undefined,
    })
  })

  it('propagates provider stream failures without storing assistant messages', async () => {
    const user = insertUser({ email: 'error@example.com', name: 'Error' })
    const chat = createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
      title: 'Will fail',
    })

    const streamError = new Error('stream boom')
    streamTextMock.mockReturnValueOnce({
      toUIMessageStreamResponse: () => {
        throw createError({ statusCode: 502, statusMessage: 'Provider stream failed', data: streamError })
      },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const event = createPostEvent('/api/v1/ai/chats', {
      id: chat.id,
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          id: 'msg-user',
          role: 'user',
          parts: [{ type: 'text', text: 'Trigger failure' }],
        },
      ],
    })
    event.context.user = { id: user.id, email: user.email }

    await expect(aiChatsHandler(event)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Provider stream failed',
    })

    const messages = db.prepare('SELECT role, content FROM messages WHERE chat_id=? ORDER BY created_at ASC').all(chat.id) as Array<{ role: string, content: string }>
    expect(messages).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})

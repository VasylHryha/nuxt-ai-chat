import type { Mock } from 'vitest'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'
import { createRequest, createResponse } from 'node-mock-http'
import listChatsHandler from '@/server/api/v1/chats/index.get'
import streamMessagesHandler from '@/server/api/v1/ai/chats/[id]/messages.post'
import { insertUser } from '@/server/db/users'
import { createChatForUser } from '@/server/db/chats'

const streamTextMock = vi.fn()
vi.mock('ai', () => ({
  convertToCoreMessages: (rows: any) => rows,
  streamText: streamTextMock,
}))

vi.mock('@/server/utils/ai', () => ({
  getProvider: () => () => ({}),
}))

const resetDb = (globalThis as any).__NUXT_RESET_DB__ as (() => void) | undefined
const fetchMock = (globalThis as any).__NUXT_FETCH_MOCK__ as Mock

function createGetEvent(path: string) {
  const req = createRequest({ method: 'GET', url: path })
  req.end()
  const res = createResponse()
  return createEvent(req, res)
}

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

describe('multi-user authorization', () => {
  let originalRuntimeConfig: any

  beforeAll(() => {
    originalRuntimeConfig = (globalThis as any).useRuntimeConfig
    ;(globalThis as any).useRuntimeConfig = () => ({
      jwtSecret: 'test-secret',
      openaiApiKey: 'key',
      anthropicApiKey: 'key',
      googleApiKey: 'key',
      public: {},
    })
  })

  afterAll(() => {
    if (originalRuntimeConfig)
      (globalThis as any).useRuntimeConfig = originalRuntimeConfig
    else
      delete (globalThis as any).useRuntimeConfig
  })

  beforeEach(() => {
    resetDb?.()
    fetchMock.mockReset()
    streamTextMock.mockReset()
  })

  it('prevents one user from listing another user’s chats', async () => {
    const alice = insertUser({ email: 'alice@example.com', name: 'Alice' })
    const bob = insertUser({ email: 'bob@example.com', name: 'Bob' })
    createChatForUser({ email: bob.email, provider: 'openai', model: 'gpt-4o', title: 'Bob chat' })

    const event = createGetEvent(`/api/v1/chats?email=${encodeURIComponent(bob.email)}`)
    event.context.user = { id: alice.id, email: alice.email }

    await expect(listChatsHandler(event)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  })

  it('prevents users from streaming messages into chats they do not own', async () => {
    const alice = insertUser({ email: 'alice2@example.com', name: 'Alice2' })
    const bob = insertUser({ email: 'bob2@example.com', name: 'Bob2' })
    const chat = createChatForUser({
      email: bob.email,
      provider: 'openai',
      model: 'gpt-4o',
      title: 'Bob stream chat',
    })

    const event = createPostEvent(`/api/v1/ai/chats/${chat.id}/messages`, {
      content: 'should fail',
      provider: 'openai',
      model: 'gpt-4o',
    })
    event.context.params = { id: chat.id }
    event.context.user = { id: alice.id, email: alice.email }

    await expect(streamMessagesHandler(event)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Chat not found',
    })
    expect(streamTextMock).not.toHaveBeenCalled()
  })
})

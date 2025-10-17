import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it } from 'vitest'
import { aiOpenAIProvider } from '@/app/services/providers/ai-openai'
import { createProxyProvider } from '@/app/services/providers/index'
import { openaiNativeProvider } from '@/app/services/providers/openai.native'

const fetchMock = (globalThis as any).__NUXT_FETCH_MOCK__ as Mock

describe('provider request builders', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('sends AI SDK provider payloads to the unified endpoint', async () => {
    fetchMock.mockResolvedValueOnce({ content: 'hello', reasoning: 'trace', model: 'gpt-4o' })
    const provider = aiOpenAIProvider()
    const controller = new AbortController()

    const response = await provider.chat.send({
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'gpt-4o',
      temperature: 0.2,
      signal: controller.signal,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/ai/chat')
    expect(fetchMock.mock.calls[0][1]).toMatchInlineSnapshot(`
      {
        "body": {
          "messages": [
            {
              "content": "Hi",
              "role": "user",
            },
          ],
          "model": "gpt-4o",
          "provider": "openai",
          "temperature": 0.2,
        },
        "method": "POST",
        "signal": AbortSignal {},
      }
    `)
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
    expect(response).toEqual({
      content: 'hello',
      reasoning: 'trace',
      provider: 'ai-openai',
      model: 'gpt-4o',
    })
  })

  it('sends native OpenAI provider payloads to the dedicated endpoint', async () => {
    fetchMock.mockResolvedValueOnce({ content: 'native', model: 'gpt-4o-mini' })
    const provider = openaiNativeProvider()

    const response = await provider.chat.send({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4o-mini',
      temperature: 0.5,
      signal: undefined,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/openai/chat')
    expect(fetchMock.mock.calls[0][1]).toMatchInlineSnapshot(`
      {
        "body": {
          "messages": [
            {
              "content": "Hello",
              "role": "user",
            },
          ],
          "model": "gpt-4o-mini",
          "temperature": 0.5,
        },
        "method": "POST",
        "signal": undefined,
      }
    `)

    expect(response).toEqual({
      content: 'native',
      reasoning: undefined,
      provider: 'openai',
      model: 'gpt-4o-mini',
    })
  })

  it('creates proxy providers targeting the correct REST endpoint', async () => {
    fetchMock.mockResolvedValueOnce({ content: 'proxied', model: 'claude' })
    const provider = createProxyProvider('anthropic', 'anthropic')
    const response = await provider.chat.send({
      messages: [{ role: 'user', content: 'Ping' }],
      model: 'claude',
      temperature: 0.1,
      signal: undefined,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/anthropic/chat')
    expect(fetchMock.mock.calls[0][1]).toMatchInlineSnapshot(`
      {
        "body": {
          "messages": [
            {
              "content": "Ping",
              "role": "user",
            },
          ],
          "model": "claude",
          "temperature": 0.1,
        },
        "method": "POST",
        "signal": undefined,
      }
    `)

    expect(response).toEqual({
      content: 'proxied',
      reasoning: undefined,
      provider: 'anthropic',
      model: 'claude',
    })
  })

  it('propagates abort errors for AI SDK provider', async () => {
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' })
    fetchMock.mockRejectedValueOnce(abortError)
    const provider = aiOpenAIProvider()
    const controller = new AbortController()
    controller.abort()

    const sendPromise = provider.chat.send({
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'gpt-4o',
      temperature: 0,
      signal: controller.signal,
    })

    await expect(sendPromise).rejects.toBe(abortError)
  })

  it('surfaces rate limit errors from proxy providers', async () => {
    const rateLimitError = Object.assign(new Error('Too Many Requests'), { statusCode: 429 })
    fetchMock.mockRejectedValueOnce(rateLimitError)
    const provider = createProxyProvider('openrouter', 'openrouter')

    await expect(provider.chat.send({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'deepseek/deepseek-r1',
      temperature: 0.2,
      signal: undefined,
    })).rejects.toBe(rateLimitError)
  })

  it('surfaces server errors from native provider', async () => {
    const serverError = Object.assign(new Error('Upstream failure'), { statusCode: 500 })
    fetchMock.mockRejectedValueOnce(serverError)
    const provider = openaiNativeProvider()

    await expect(provider.chat.send({
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'gpt-4o-mini',
      temperature: 0.3,
      signal: undefined,
    })).rejects.toBe(serverError)
  })

  it('handles malformed responses gracefully', async () => {
    fetchMock.mockResolvedValueOnce('garbled response')
    const provider = createProxyProvider('google', 'google')

    const result = await provider.chat.send({
      messages: [{ role: 'user', content: 'ping' }],
      model: 'gemini',
      temperature: undefined,
      signal: undefined,
    })

    expect(result).toEqual({
      content: 'garbled response',
      reasoning: undefined,
      provider: 'google',
      model: undefined,
    })
  })
})

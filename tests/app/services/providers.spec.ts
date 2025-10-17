import type { Mock } from 'vitest'
import { describe, expect, it } from 'vitest'
import { aiOpenAIProvider } from '@/app/services/providers/ai-openai'
import { openaiNativeProvider } from '@/app/services/providers/openai.native'
import { createProxyProvider } from '@/app/services/providers/index'

const fetchMock = (globalThis as any).__NUXT_FETCH_MOCK__ as Mock

describe('provider request builders', () => {
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
})

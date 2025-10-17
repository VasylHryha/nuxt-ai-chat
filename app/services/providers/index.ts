import type { ChatResponse, ProviderAdapter, ProviderInfo, ProviderKey, ProviderSendInput, ProviderType } from './types'
import { aiOpenAIProvider } from './ai-openai'
import { openaiNativeProvider } from './openai.native'
import { openrouterProvider } from './openrouter'

const registry: Record<ProviderKey, () => ProviderAdapter> = {
  'ai-openai': () => aiOpenAIProvider(),
  'openai': () => openaiNativeProvider(),
  'openrouter': () => openrouterProvider(),
  'anthropic': () => createProxyProvider('anthropic', 'anthropic'),
  'google': () => createProxyProvider('google', 'google'),
}

// Generic proxy provider factory for simple HTTP proxies
// This allows adding new providers without creating separate files
export function createProxyProvider(
  key: ProviderKey,
  endpoint: string,
  type: ProviderType = 'proxy',
): ProviderAdapter {
  return {
    key,
    type,
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        const r = await $fetch(`/api/v1/${endpoint}/chat`, {
          method: 'POST',
          body: { messages, model, temperature },
          signal,
        })
        return {
          content: String(r?.content ?? ''),
          reasoning: r?.reasoning,
          provider: key,
          model: r?.model ?? model,
        }
      },
    },
  }
}

export function getAdapter(key: ProviderKey): ProviderAdapter {
  const make = registry[key]
  if (!make)
    throw new Error(`Unknown provider: ${key}`)
  return make()
}

export const getProvider = (key: ProviderKey) => getAdapter(key).chat

// Provider metadata for UI
export const PROVIDER_INFO: Record<ProviderKey, ProviderInfo> = {
  'ai-openai': {
    key: 'ai-openai',
    name: 'OpenAI (AI SDK)',
    type: 'ai-sdk',
    description: 'OpenAI via AI SDK with streaming support',
    defaultModel: 'gpt-4o',
  },
  'openai': {
    key: 'openai',
    name: 'OpenAI (Native)',
    type: 'native',
    description: 'Direct OpenAI API integration',
    defaultModel: 'gpt-4o-mini',
  },
  'openrouter': {
    key: 'openrouter',
    name: 'OpenRouter',
    type: 'proxy',
    description: 'Multi-model proxy via OpenRouter',
    supportsReasoning: true,
    defaultModel: 'deepseek/deepseek-r1',
  },
  'anthropic': {
    key: 'anthropic',
    name: 'Anthropic Claude',
    type: 'proxy',
    description: 'Claude models via proxy',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  'google': {
    key: 'google',
    name: 'Google Gemini',
    type: 'proxy',
    description: 'Gemini models via proxy',
    defaultModel: 'gemini-2.0-flash-exp',
  },
}

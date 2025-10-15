import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
// server/utils/ai.ts
import { createOpenAI } from '@ai-sdk/openai'

type ProviderName = 'openai' | 'anthropic' | 'google' // add more as needed

export function getProvider(opts: {
  provider: ProviderName
  apiKey?: string
  baseURL?: string
}) {
  const { provider, apiKey, baseURL } = opts
  if (provider === 'openai')
    return createOpenAI({ apiKey, baseURL })
  if (provider === 'anthropic')
    return createAnthropic({ apiKey, baseURL })
  if (provider === 'google')
    return createGoogleGenerativeAI({ apiKey, baseURL })
  throw new Error(`Unknown provider: ${provider}`)
}

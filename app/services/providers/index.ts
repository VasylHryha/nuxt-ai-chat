// app/services/providers/index.ts
import type { ProviderAdapter, ProviderKey } from './types'
import { anthropicProvider } from './anthropic'
import { geminiProvider } from './gemini'
import { nuxtProvider } from './nuxt' // facade to /api/v1/chat

const registry: Record<ProviderKey, () => ProviderAdapter> = {
  openrouter: () => nuxtProvider('openrouter'), // send only, no directory
  openai: () => nuxtProvider('openai'), // send + directory
  anthropic: () => anthropicProvider(), // send only (for now)
  gemini: () => geminiProvider(), // send only (for now)
}

export function getAdapter(key: ProviderKey): ProviderAdapter {
  const f = registry[key]; if (!f)
    throw new Error(`Unknown provider: ${key}`)
  return f()
}
export const getProvider = (key: ProviderKey) => getAdapter(key).chat

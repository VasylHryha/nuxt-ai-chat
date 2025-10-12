import type { ChatProvider } from './types'
import { nuxtProvider } from './nuxt'
import { openrouterProvider } from './openrouter'

const registry: Record<string, () => ChatProvider> = {
  nuxt: nuxtProvider,
  openrouter: openrouterProvider,
  // add more later (openai, deepseek, etc.)
}

export function getProvider(name: string = 'nuxt'): ChatProvider {
  const factory = registry[name]
  if (!factory)
    throw new Error(`Unknown provider: ${name}`)
  return factory()
}

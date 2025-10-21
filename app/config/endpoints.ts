/**
 * Centralized endpoint configuration for different provider types
 * Reduces duplication and makes it easy to maintain endpoint paths
 */

export const PROVIDER_ENDPOINTS = {
  // Native providers (support both streaming and non-streaming)
  openai: {
    stream: '/api/v1/openai/chat.stream',
    nonStream: '/api/v1/openai/chat',
  },
  // Proxy providers (may or may not support streaming)
  openrouter: {
    stream: '/api/v1/openrouter/chat.stream',
    nonStream: '/api/v1/openrouter/chat',
  },
  anthropic: {
    stream: '/api/v1/anthropic/chat.stream',
    nonStream: '/api/v1/anthropic/chat',
  },
  google: {
    stream: '/api/v1/google/chat.stream',
    nonStream: '/api/v1/google/chat',
  },
} as const

export type ProviderType = keyof typeof PROVIDER_ENDPOINTS

/**
 * Get the streaming endpoint for a provider
 */
export function getStreamingEndpoint(provider: string): string | null {
  const config = PROVIDER_ENDPOINTS[provider as ProviderType]
  return config?.stream || null
}

/**
 * Get the non-streaming fallback endpoint for a provider
 */
export function getNonStreamingEndpoint(provider: string): string | null {
  const config = PROVIDER_ENDPOINTS[provider as ProviderType]
  return config?.nonStream || null
}

/**
 * Check if a provider has a non-streaming fallback
 */
export function hasNonStreamingFallback(provider: string): boolean {
  const config = PROVIDER_ENDPOINTS[provider as ProviderType]
  return config?.nonStream !== undefined
}

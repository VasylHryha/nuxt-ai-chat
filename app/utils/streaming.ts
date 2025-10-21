/**
 * Streaming utilities for handling SSE-based streaming responses
 */

export interface StreamOptions {
  endpoint: string
  body: Record<string, any>
  token: string
  onChunk: (chunk: string) => void
  signal?: AbortSignal
}

/**
 * Stream response from endpoint and call onChunk callback for each piece of text
 * Returns the full accumulated text when complete
 *
 * @throws Error if request fails or stream is not available
 */
export async function streamFromEndpoint(options: StreamOptions): Promise<string> {
  const resp = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.token}`,
    },
    body: JSON.stringify(options.body),
    signal: options.signal,
  })

  if (!resp.ok || !resp.body) {
    throw new Error(`Stream failed: ${resp.status} ${resp.statusText}`)
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break
      const chunk = decoder.decode(value)
      accumulated += chunk
      options.onChunk(chunk)
    }
  }
  finally {
    reader.releaseLock()
  }

  return accumulated
}

/**
 * Check if an endpoint URL exists by making a HEAD request
 * Useful for checking if fallback endpoints are available
 */
export async function endpointExists(endpoint: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(endpoint, {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return resp.ok || resp.status === 405 // 405 means endpoint exists but HEAD not allowed
  }
  catch {
    return false
  }
}

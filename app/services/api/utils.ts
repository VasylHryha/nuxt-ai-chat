/**
 * Shared API utilities for error handling and request wrapping
 * Used across all API clients
 */

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: any): never {
  if (error?.statusCode === 401) {
    throw new Error('Session expired. Please login again.')
  }
  if (error?.statusMessage) {
    throw new Error(error.statusMessage)
  }
  if (error?.message) {
    throw new Error(error.message)
  }
  throw new Error('API request failed')
}

/**
 * Wrapper for $fetch requests that automatically handles errors
 * Used for simple GET/POST requests without streaming
 */
export async function fetchApi<T>(
  url: string,
  options: Record<string, any> = {},
): Promise<T> {
  try {
    return await $fetch<T>(url, options)
  }
  catch (error: any) {
    handleApiError(error)
  }
}

/**
 * Wrapper for fetch requests (used for streaming)
 * Returns the raw Response object
 */
export async function fetchStream(
  url: string,
  options: Record<string, any> = {},
): Promise<Response> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json()
      handleApiError(error)
    }

    return response
  }
  catch (error: any) {
    handleApiError(error)
  }
}

/**
 * Wrapper for GET requests with ETag caching support
 * Returns data with ETag and cache status (HTTP 304 support)
 */
export interface FetchWithEtagOptions {
  ifNoneMatch?: string
  query?: Record<string, any>
}

export interface FetchWithEtagResult<T> {
  data: T
  etag?: string
  fromCache: boolean
}

export async function fetchWithEtag<T>(
  url: string,
  options: FetchWithEtagOptions = {},
): Promise<FetchWithEtagResult<T>> {
  try {
    const response = await $fetch.raw<T>(url, {
      query: options.query,
      headers: options.ifNoneMatch
        ? { 'If-None-Match': options.ifNoneMatch }
        : undefined,
    })

    // Handle 304 Not Modified
    if (response.status === 304) {
      return {
        data: [] as T,
        etag: options.ifNoneMatch,
        fromCache: true,
      }
    }

    const etag = response.headers.get('ETag') ?? undefined
    const data = response._data ?? ([] as T)

    return {
      data,
      etag,
      fromCache: false,
    }
  }
  catch (error: any) {
    handleApiError(error)
  }
}

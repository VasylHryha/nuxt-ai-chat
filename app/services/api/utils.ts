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

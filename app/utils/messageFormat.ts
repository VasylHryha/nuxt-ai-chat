/**
 * Message formatting utilities for converting between API and UI message formats
 */
import type { UIMessage } from 'ai'

export interface ApiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

/**
 * Convert API message format to UI message format
 * Maps API messages (with content as string) to UIMessage format (with parts array)
 */
export function convertApiToUIMessages(messages: ApiMessage[]): UIMessage[] {
  return messages.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  } as UIMessage))
}

/**
 * Convert UI messages to API message format
 * Extracts text content from message parts for API transmission
 */
export function convertUIMessagesToApi(messages: UIMessage[]): Array<{ role: string, content: string }> {
  return messages.map(m => ({
    role: m.role,
    content: m.parts
      .filter(p => p.type === 'text')
      .map((p) => {
        // Access text from the part safely
        const part = p as any
        return typeof part.text === 'string' ? part.text : ''
      })
      .join('\n'),
  }))
}

/**
 * Create a new UI message for optimistic UI updates
 */
export function createUIMessage(role: 'user' | 'assistant', content: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: 'text' as const, text: content }],
  }
}

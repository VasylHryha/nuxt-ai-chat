import { z } from 'zod'

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim().toLowerCase())
}

/**
 * Zod validation schemas for API endpoints
 * Auto-imported by Nuxt - use directly in handlers
 */

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email format').transform(e => e.trim().toLowerCase()),
  name: z.string().min(1, 'Name is required').transform(n => n.trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(e => e.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
})

// Chat schemas
export const createChatSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  title: z.string().optional(),
  ui: z.enum(['ai-sdk', 'native', 'proxy']).optional(),
})

export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant'], { errorMap: () => ({ message: 'Invalid message role' }) }),
  content: z.string().min(1, 'Message content is required').transform(c => c.trim()),
})

export const chatProxySchema = z.object({
  provider: z.enum(['openrouter', 'openai', 'anthropic', 'gemini', 'google'], {
    errorMap: () => ({ message: 'Invalid provider' }),
  }),
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const listChatsQuerySchema = z.object({
  email: z.string().email('Invalid email format').transform(e => e.trim().toLowerCase()),
  provider: z.string().optional(),
  model: z.string().optional(),
  startDate: z.coerce.number().optional(),
  endDate: z.coerce.number().optional(),
})

export const streamChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().optional(),
})

/**
 * Safe parse helper - validates and returns parsed data or throws createError
 * Usage:
 *   const data = await safeValidate(readBody(event), signupSchema)
 */
export async function safeValidate<T>(
  dataPromise: Promise<unknown>,
  schema: z.ZodSchema<T>,
): Promise<T> {
  try {
    const data = await dataPromise
    return schema.parse(data)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${message}`,
      })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request format',
    })
  }
}

/**
 * Query parameter validator
 * Usage:
 *   const query = safeValidateQuery(getQuery(event), listChatsQuerySchema)
 */
export function safeValidateQuery<T>(
  queryData: any,
  schema: z.ZodSchema<T>,
): T {
  try {
    return schema.parse(queryData)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      throw createError({
        statusCode: 400,
        statusMessage: `Query validation error: ${message}`,
      })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters',
    })
  }
}

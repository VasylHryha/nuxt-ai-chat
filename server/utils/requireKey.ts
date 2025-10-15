// server/utils/requireKey.ts
export function requireKey(value: string | undefined, name: string) {
  if (!value) {
    throw createError({ statusCode: 500, statusMessage: `${name} is not configured` })
  }
  return value
}

import { Buffer } from 'node:buffer'

export function rid(prefix = 'id') {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const id = Buffer.from(bytes).toString('base64url')
  return prefix ? `${prefix}_${id}` : id
}

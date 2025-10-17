// server/utils/jwt.ts
// Tiny HS256 JWT with Node/Bun crypto. No external libs.
import type { Buffer as BufferType } from 'node:buffer'

import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

type Payload = Record<string, any>

function b64url(input: BufferType | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlJson(obj: any) {
  return b64url(Buffer.from(JSON.stringify(obj)))
}

function hmacSHA256(secret: string, data: string) {
  return createHmac('sha256', secret).update(data).digest()
}

export function signJWT(payload: Payload, opts: { secret: string, expiresInSec: number, issuer?: string }) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = {
    iat: now,
    exp: now + opts.expiresInSec,
    iss: opts.issuer || 'nuxt-ai-chat',
    ...payload,
  }
  const head = b64urlJson(header)
  const payl = b64urlJson(body)
  const toSign = `${head}.${payl}`
  const sig = b64url(hmacSHA256(opts.secret, toSign))
  return `${toSign}.${sig}`
}

export function verifyJWT(token: string, secret: string, opts?: { issuer?: string }) {
  const [head, payl, sig] = token.split('.')
  if (!head || !payl || !sig)
    throw new Error('Malformed token')
  const expected = b64url(hmacSHA256(secret, `${head}.${payl}`))
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b))
    throw new Error('Bad signature')

  const json = JSON.parse(Buffer.from(payl.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  const now = Math.floor(Date.now() / 1000)
  if (json.exp && now >= json.exp)
    throw new Error('Token expired')
  if (opts?.issuer && json.iss !== opts.issuer)
    throw new Error('Bad issuer')
  return json as Payload
}

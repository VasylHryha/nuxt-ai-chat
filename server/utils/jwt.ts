// server/utils/jwt.ts
// JWT signing and verification using jose library (industry standard)
import { jwtVerify, SignJWT } from 'jose'

type Payload = Record<string, any>

export async function signJWT(payload: Payload, opts: { secret: string, expiresInSec: number, issuer?: string }): Promise<string> {
  const secret = new TextEncoder().encode(opts.secret)
  console.log('signJWT', opts.secret, '')
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(opts.issuer || 'nuxt-ai-chat')
    .setExpirationTime('15m')
    .sign(secret)
}

export async function verifyJWT(token: string, secret: string, opts?: { issuer?: string }): Promise<Payload> {
  const secretKey = new TextEncoder().encode(secret)

  const { payload } = await jwtVerify(token, secretKey, {
    issuer: opts?.issuer,
    algorithms: ['HS256'],
  })
  console.log('verifyJWT', secret, '')
  console.log('verifyJWT', payload, '')

  return payload as Payload
}

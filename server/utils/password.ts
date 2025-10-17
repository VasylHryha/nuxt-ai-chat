// server/utils/passwords.ts
import { hash, verify } from '@node-rs/argon2'

// Reasonable defaults for web auth (tune if needed)
const ARGON_OPTS = {
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
  variant: 2, // Argon2id
}

export async function hashPassword(plain: string) {
  // returns encoded string with parameters included, no need to store salt separately
  return await hash(plain, ARGON_OPTS)
}

export async function verifyPassword(encodedHash: string, plain: string) {
  return await verify(encodedHash, plain)
}

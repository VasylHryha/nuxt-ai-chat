import { Buffer } from 'node:buffer'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Database } from 'bun:sqlite'

const DEFAULT_DB = fileURLToPath(new URL('../sqlite/app.db', import.meta.url)) // abso
const DB_PATH = process.env.NUXT_DB_PATH ?? DEFAULT_DB
const db = new Database(DB_PATH)

function rid(prefix = '') {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const id = Buffer.from(bytes).toString('base64url')
  return prefix ? `${prefix}_${id}` : id
}

// Usage: bun run db/scripts/seed.js you@example.com
const emailArg = process.argv[2]
if (!emailArg) {
  console.error('Usage: bun run db/scripts/seed.js <email>')
  process.exit(1)
}
const email = String(emailArg).trim().toLowerCase()
if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)) {
  console.error('Invalid email')
  process.exit(1)
}

const now = Date.now()
const usrId = rid('usr')

db.query(`INSERT OR IGNORE INTO users (id,email,created_at) VALUES (?,?,?)`).run(usrId, email, now)
const row = db.query(`SELECT id,email FROM users WHERE email=?`).get(email)
console.log('Seeded user:', row)

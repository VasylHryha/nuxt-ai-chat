import { Buffer } from 'node:buffer'
import { randomBytes } from 'node:crypto'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Database } from 'bun:sqlite'

const DEFAULT_DB = fileURLToPath(new URL('../sqlite/app.db', import.meta.url)) // absolute
const DB_PATH = process.env.NUXT_DB_PATH ?? process.env.DB_PATH ?? DEFAULT_DB
const db = new Database(DB_PATH, { create: true })

try {
  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA busy_timeout = 3000')
}
catch (err) {
  console.error('PRAGMA setup failed:', err)
}

function rid(prefix = '') {
  const id = Buffer.from(randomBytes(16)).toString('base64url')
  return prefix ? `${prefix}_${id}` : id
}

// Usage: bun db:seed <email>
const emailArg = process.argv[2]
if (!emailArg) {
  console.error('Usage: bun db:seed <email>')
  process.exit(1)
}
const email = String(emailArg).trim().toLowerCase()
if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)) {
  console.error('Invalid email')
  process.exit(1)
}

const now = Date.now()
const usrId = rid('usr')

db.prepare(`INSERT OR IGNORE INTO users (id,email,name,created_at) VALUES (?,?,?,?)`).run(usrId, email, email.split('@')[0], now)
const row = db.prepare(`SELECT id,email,name,created_at FROM users WHERE email=?`).get(email)
db.close()
console.log('Seeded user:', row)

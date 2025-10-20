import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const BetterSqlite3 = require('better-sqlite3')

const DEFAULT_DB = fileURLToPath(new URL('../sqlite/app.db', import.meta.url)) // absolute
const DB_PATH = process.env.NUXT_DB_PATH ?? process.env.DB_PATH ?? DEFAULT_DB
const db = new BetterSqlite3(DB_PATH, { fileMustExist: false })

try {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 3000')
}
catch {}

function rid(prefix = '') {
  const id = Buffer.from(randomBytes(16)).toString('base64url')
  return prefix ? `${prefix}_${id}` : id
}

// Usage: node db/scripts/seed.js you@example.com
const emailArg = process.argv[2]
if (!emailArg) {
  console.error('Usage: node db/scripts/seed.js <email>')
  process.exit(1)
}
const email = String(emailArg).trim().toLowerCase()
if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)) {
  console.error('Invalid email')
  process.exit(1)
}

const now = Date.now()
const usrId = rid('usr')

db.prepare(`INSERT OR IGNORE INTO users (id,email,created_at) VALUES (?,?,?)`).run(usrId, email, now)
const row = db.prepare(`SELECT id,email FROM users WHERE email=?`).get(email)
console.log('Seeded user:', row)

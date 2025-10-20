import { mkdir, readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const BetterSqlite3 = require('better-sqlite3')

// Project root = two levels up from this script: db/scripts/ -> <root>
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..') // -> /your/project/db

function resolvePath(p, fallback) {
  if (p && path.isAbsolute(p))
    return p
  if (p)
    return path.resolve(ROOT, p) // relative to /your/project/db
  return fallback
}

// Defaults based on this file’s location
const DEFAULT_DB = fileURLToPath(new URL('../sqlite/app.db', import.meta.url)) // absolute
const DEFAULT_MIG = fileURLToPath(new URL('../migrations', import.meta.url)) // absolute

// Allow overrides via env; support both DB_PATH and NUXT_DB_PATH
const DB_PATH = resolvePath(process.env.DB_PATH ?? process.env.NUXT_DB_PATH, DEFAULT_DB)
const MIG_DIR = resolvePath(process.env.MIG_DIR, DEFAULT_MIG)

console.log(DB_PATH)

// 1) Ensure parent directory exists
await mkdir(path.dirname(DB_PATH), { recursive: true })

// 2) Open DB
const db = new BetterSqlite3(DB_PATH, { fileMustExist: false })
try {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 3000')
}
catch {}

// 3) _migrations table
db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
                                               id INTEGER PRIMARY KEY AUTOINCREMENT,
                                               name TEXT NOT NULL UNIQUE,
                                               applied_at INTEGER NOT NULL
    )
`)

// 4) Find applied
const appliedRows = db.prepare(`SELECT name FROM _migrations ORDER BY id`).all()
const applied = new Set(appliedRows.map(r => r.name))

// 5) Read *.sql and apply in order
const entries = await readdir(MIG_DIR, { withFileTypes: true })
const files = entries
  .filter(e => e.isFile() && e.name.endsWith('.sql'))
  .map(e => e.name)
  .sort()

const applyOne = db.transaction((name, sql) => {
  db.exec(sql)
  db.prepare(`INSERT INTO _migrations (name, applied_at) VALUES (?, ?)`).run(name, Date.now())
})

for (const name of files) {
  if (applied.has(name))
    continue
  const sql = await readFile(path.join(MIG_DIR, name), 'utf8')
  applyOne(name, sql)
  console.log('Applied', name)
}

console.log('Migrations complete at', DB_PATH)

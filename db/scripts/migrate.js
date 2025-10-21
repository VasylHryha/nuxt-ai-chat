import { mkdir, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Database } from 'bun:sqlite'

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

// Defaults based on this file's location
const DEFAULT_DB = fileURLToPath(new URL('../sqlite/app.db', import.meta.url)) // absolute
const DEFAULT_MIG = fileURLToPath(new URL('../migrations', import.meta.url)) // absolute

// Allow overrides via env; support both DB_PATH and NUXT_DB_PATH
const DB_PATH = resolvePath(process.env.DB_PATH ?? process.env.NUXT_DB_PATH, DEFAULT_DB)
const MIG_DIR = resolvePath(process.env.MIG_DIR, DEFAULT_MIG)

console.log(DB_PATH)

// 1) Ensure parent directory exists
await mkdir(path.dirname(DB_PATH), { recursive: true })

// 2) Open DB using Bun's native SQLite
const db = new Database(DB_PATH, { create: true })
try {
  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA busy_timeout = 3000')
}
catch (err) {
  console.error('PRAGMA setup failed:', err)
}

// 3) _migrations table
db.run(`
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

for (const name of files) {
  if (applied.has(name))
    continue
  const sql = await readFile(path.join(MIG_DIR, name), 'utf8')

  // Apply migration using transaction
  db.run('BEGIN TRANSACTION')
  try {
    db.exec(sql)
    db.run(`INSERT INTO _migrations (name, applied_at) VALUES (?, ?)`, [name, Date.now()])
    db.run('COMMIT')
    console.log('Applied', name)
  }
  catch (err) {
    db.run('ROLLBACK')
    console.error(`Failed to apply ${name}:`, err)
    throw err
  }
}

db.close()
console.log('Migrations complete at', DB_PATH)

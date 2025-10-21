import type { Database as BunDatabase } from 'bun:sqlite'
import process from 'node:process'
import { Database } from 'bun:sqlite'

type GlobalWithDb = typeof globalThis & { __NUXT_TEST_DB__?: BunDatabase }

// Resolve DB path from Nuxt runtime config
const cfg = useRuntimeConfig()
const dbPath = cfg.dbPath || 'db/sqlite/app.db'

const g = globalThis as GlobalWithDb
const db: BunDatabase = g.__NUXT_TEST_DB__ ?? new Database(dbPath, { create: true, readonly: false })

try {
  // sensible pragmas
  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA busy_timeout = 3000')
}
catch (err) {
  console.error('PRAGMA setup failed:', err)
}

if (process.env.NODE_ENV === 'test')
  g.__NUXT_TEST_DB__ = db

export default db

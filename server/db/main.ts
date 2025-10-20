import type Database from 'better-sqlite3'
// server/db/main.ts
import { createRequire } from 'node:module'
import process from 'node:process'

type GlobalWithDb = typeof globalThis & { __NUXT_TEST_DB__?: Database }

const req = createRequire(import.meta.url)
const Better = req('better-sqlite3') as typeof import('better-sqlite3').default

// Resolve DB path from Nuxt runtime config
const cfg = useRuntimeConfig()
const dbPath = cfg.dbPath || 'db/sqlite/app.db'

const g = globalThis as GlobalWithDb
const db: Database = g.__NUXT_TEST_DB__ ?? new Better(dbPath, { fileMustExist: false, readonly: false })

try {
  // sensible pragmas
  // @ts-expect-error runtime method
  db.pragma?.('journal_mode = WAL')
  // @ts-expect-error runtime method
  db.pragma?.('foreign_keys = ON')
  // @ts-expect-error runtime method
  db.pragma?.('busy_timeout = 3000')
}
catch {}

if (process.env.NODE_ENV === 'test')
  g.__NUXT_TEST_DB__ = db

export default db

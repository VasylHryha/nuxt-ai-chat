// server/db/main.ts
import { createRequire } from 'node:module'
import process from 'node:process'

interface Stmt {
  get: (...args: any[]) => any
  all: (...args: any[]) => any[]
  run: (...args: any[]) => any
}
type BunDB = any
type B3DB = any

type GlobalWithDb = typeof globalThis & {
  __NUXT_TEST_DB__?: BunDB | B3DB
}

const g = globalThis as GlobalWithDb
const isBun = typeof (globalThis as any).Bun !== 'undefined'
const req = createRequire(import.meta.url)

/**
 * Small facade that normalizes bun:sqlite and better-sqlite3.
 * - Keeps .query(sql).get/all/run and .prepare(sql).get/all/run
 * - Reuses g.__NUXT_TEST_DB__ when present (your test mode)
 */
class DBFacade {
  private driver: 'bun' | 'b3'
  private db: BunDB | B3DB

  constructor(dbPath: string) {
    // 1) Reuse global test DB if provided
    if (g.__NUXT_TEST_DB__) {
      this.db = g.__NUXT_TEST_DB__!
      this.driver = isBun ? 'bun' : 'b3'
      return
    }

    // 2) Open new connection by runtime
    if (isBun) {
      // Bun runtime: use native bun:sqlite
      // Note: Vite may warn "could not be resolved" but it works fine at runtime
      const { Database } = req('bun:sqlite')
      this.db = new Database(dbPath, { create: true, strict: true })
      this.driver = 'bun'
      try {
        this.db.run('PRAGMA journal_mode = WAL')
        this.db.run('PRAGMA foreign_keys = ON')
        this.db.run('PRAGMA busy_timeout = 3000')
      }
      catch {}
    }
    else {
      // Node runtime (tests, fallback): use better-sqlite3
      const Better = req('better-sqlite3')
      this.db = new Better(dbPath, { fileMustExist: false })
      this.driver = 'b3'
      try {
        this.db.pragma?.('journal_mode = WAL')
        this.db.pragma?.('foreign_keys = ON')
        this.db.pragma?.('busy_timeout = 3000')
      }
      catch {}
    }

    // 3) In test env, cache the handle globally for reuse (matches your old code)
    if (process.env.NODE_ENV === 'test')
      g.__NUXT_TEST_DB__ = this.db
  }

  /** Unify bun.query and b3.prepare */
  query(sql: string): Stmt {
    if (this.driver === 'bun') {
      const stmt = (this.db as any).query(sql)
      return {
        get: (...args: any[]) => stmt.get?.(...args),
        all: (...args: any[]) => stmt.all?.(...args),
        run: (...args: any[]) => stmt.run?.(...args),
      }
    }
    else {
      const stmt = (this.db as any).prepare(sql)
      return {
        get: (...args: any[]) => stmt.get?.(...args),
        all: (...args: any[]) => stmt.all?.(...args),
        run: (...args: any[]) => stmt.run?.(...args),
      }
    }
  }

  /** Alias to query for callers that used .prepare */
  prepare(sql: string): Stmt {
    return this.query(sql)
  }

  exec(sql: string) {
    return (this.db as any).exec(sql)
  }
}

// Resolve DB path from runtime config (works in both Node & Bun)
const cfg = useRuntimeConfig()
const dbPath = cfg.dbPath || 'db/sqlite/app.db'
const db = new DBFacade(dbPath)

export default db

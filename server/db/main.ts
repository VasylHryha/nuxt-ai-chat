import Database from 'better-sqlite3'

const DB_PATH = new URL('../../db/sqlite/app.db', import.meta.url).pathname

type GlobalWithDb = typeof globalThis & {
  __NUXT_TEST_DB__?: Database
}

const globalRef = globalThis as GlobalWithDb

// Reuse in-memory connection when tests preconfigure one; otherwise open file-backed DB.
const db = globalRef.__NUXT_TEST_DB__ ?? new Database(DB_PATH)

if (!globalRef.__NUXT_TEST_DB__ && process.env.NODE_ENV === 'test')
  globalRef.__NUXT_TEST_DB__ = db

export default db

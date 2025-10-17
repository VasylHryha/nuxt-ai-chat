import type { Mock } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { rid } from '../../server/utils/id'

type TestGlobals = typeof globalThis & {
  __NUXT_TEST_DB__?: Database
  __NUXT_RESET_DB__?: () => void
  __NUXT_FETCH_MOCK__?: Mock
}

const g = globalThis as TestGlobals
if (!(g as any).rid)
  (g as any).rid = rid

process.env.NODE_ENV ??= 'test'
process.env.NUXT_TELEMETRY_DISABLED = '1'
process.env.JWT_SECRET ??= 'test-secret'
process.env.OPENROUTER_API_KEY ??= 'test-openrouter-key'
process.env.OPENROUTER_BASE ??= 'https://openrouter.test/v1'
process.env.OPENROUTER_MODEL ??= 'mock-model'
process.env.OPENAI_API_KEY ??= 'test-openai-key'
process.env.APP_TITLE ??= 'Nuxt Chat Test Harness'

vi.mock('@node-rs/argon2', () => ({
  hash: async (plain: string) => `argon2:${plain}`,
  verify: async (encoded: string, plain: string) => encoded === `argon2:${plain}`,
}))

const migrationsDir = fileURLToPath(new URL('../../db/migrations', import.meta.url))
const db = g.__NUXT_TEST_DB__ ?? new Database(':memory:')

if (!g.__NUXT_TEST_DB__) {
  const migrations = readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort()
  for (const name of migrations) {
    const sql = readFileSync(join(migrationsDir, name), 'utf8')
    db.exec(sql)
  }
  g.__NUXT_TEST_DB__ = db
}

const tables = [
  'messages',
  'chats',
  'connections',
  'sessions',
  'password_resets',
  'credentials',
  'users',
]

function resetDb() {
  const statements = tables.map(table => `DELETE FROM ${table};`).join('\n')
  db.exec(statements)
}

g.__NUXT_RESET_DB__ = resetDb

const fetchMock: Mock = g.__NUXT_FETCH_MOCK__ ?? vi.fn(async (input: unknown) => {
  throw new Error(`Unhandled fetch call during test: ${String(input)}`)
})

if (!g.__NUXT_FETCH_MOCK__) {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('$fetch', fetchMock)
  g.__NUXT_FETCH_MOCK__ = fetchMock
}

beforeAll(() => {
  resetDb()
})

beforeEach(() => {
  resetDb()
  fetchMock.mockClear()
})

afterEach(() => {
  fetchMock.mockClear()
  vi.clearAllMocks()
})

afterAll(() => {
  fetchMock.mockReset()
  if (process.env.VITEST) {
    db.close()
    delete g.__NUXT_TEST_DB__
    delete g.__NUXT_RESET_DB__
    delete g.__NUXT_FETCH_MOCK__
  }
})

export {}

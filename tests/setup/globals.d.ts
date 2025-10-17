import type Database from 'better-sqlite3'
import type { Mock } from 'vitest'

declare global {
  // Provided by tests/setup/test-env.ts
  // eslint-disable-next-line vars-on-top
  var __NUXT_TEST_DB__: Database | undefined
  // eslint-disable-next-line vars-on-top
  var __NUXT_RESET_DB__: (() => void) | undefined
  // eslint-disable-next-line vars-on-top
  var __NUXT_FETCH_MOCK__: Mock | undefined
  // eslint-disable-next-line vars-on-top
  var $fetch: Mock
  // eslint-disable-next-line vars-on-top
  var rid: (prefix?: string) => string
}

export {}

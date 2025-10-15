import { Database } from 'bun:sqlite'

const DB_PATH = new URL('../../db/sqlite/app.db', import.meta.url).pathname

// Open a single connection. No migrations/DDL here.
const db = new Database(DB_PATH)

export default db

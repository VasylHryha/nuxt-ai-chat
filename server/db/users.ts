import type { User } from 'db/types'
import db from './main'

export function getUserByEmail(email: string): User | null {
  if (!email)
    return null
  const clean = String(email).trim().toLowerCase()
  const row = db.query(`SELECT * FROM users WHERE email = ?`).get(clean)
  return row || null
}

export function getAllUsers(): User[] | [] {
  const row = db.query(`SELECT * FROM users ORDER BY created_at desc`).all()
  return row || []
}

export function addUser(email: string): void {
  const now = Date.now()
  const clean = String(email).trim().toLowerCase()
  // id is redundant since email is unique; keep schema compatibility
  const id = rid('user')
  db.query(`INSERT OR IGNORE INTO users (id,email,created_at) VALUES (?,?,?)`).run(id, clean, now)
}

export function deleteUserById(id: string): boolean {
  if (!id)
    return false
  const res = db.query(`DELETE FROM users WHERE id = ?`).run(id)
  return res.changes > 0
}

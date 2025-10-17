import type { DbCredential, DbUser } from 'db/types'
// server/db/users.ts
import db from './main'

export function getUserByEmail(email: string): DbUser | null {
  const row = db.query<DbUser>(`SELECT id,email,name,created_at FROM users WHERE email=?`).get(email.trim().toLowerCase())
  return row || null
}
export function getUserById(id: string): DbUser | null {
  const row = db.query<DbUser>(`SELECT id,email,name,created_at FROM users WHERE id=?`).get(id)
  return row || null
}
export function listUsers(): DbUser[] {
  return db.query<DbUser>(`SELECT id,email,name,created_at FROM users ORDER BY created_at DESC`).all()
}

export function insertUser({ email, name }: { email: string, name: string }) {
  const id = rid('user')
  const now = Date.now()
  db.query(`INSERT INTO users (id,email,name,created_at) VALUES (?,?,?,?)`)
    .run(id, email.trim().toLowerCase(), name.trim(), now)
  return { id, email: email.trim().toLowerCase(), name: name.trim(), created_at: now }
}

// credentials
export function upsertPasswordCredential(userId: string, passwordHash: string) {
  const id = rid('cred')
  const now = Date.now()
  // ensure single password credential per user
  const existing = db.query<DbCredential>(`SELECT id FROM credentials WHERE user_id=? AND kind='password'`).get(userId)
  if (existing) {
    db.query(`UPDATE credentials SET password_hash=?, updated_at=? WHERE id=?`)
      .run(passwordHash, now, existing.id)
    return existing.id
  }
  db.query(`INSERT INTO credentials (id,user_id,kind,password_hash,created_at,updated_at)
            VALUES (?,?,?,?,?,?)`)
    .run(id, userId, 'password', passwordHash, now, now)
  return id
}

export function getPasswordHashByEmail(email: string): { user: DbUser, hash: string } | null {
  const row = db.query(`
    SELECT u.id as user_id, u.email, u.name, u.created_at, c.password_hash
    FROM users u
    JOIN credentials c ON c.user_id = u.id AND c.kind='password'
    WHERE u.email = ?
  `).get(email.trim().toLowerCase())
  if (!row)
    return null
  return {
    user: { id: row.user_id, email: row.email, name: row.name, created_at: row.created_at },
    hash: row.password_hash,
  }
}

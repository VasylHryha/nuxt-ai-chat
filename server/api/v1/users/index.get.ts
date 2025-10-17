import { listUsers } from '@/server/db/users'
// server/api/v1/users.get.ts

export default defineEventHandler((event) => {
  requireUser(event) // you may check roles here later
  const rows = listUsers()
  return rows.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: new Date(u.created_at).toISOString(),
  }))
})

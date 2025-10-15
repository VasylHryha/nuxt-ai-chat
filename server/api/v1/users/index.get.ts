import { getAllUsers } from '@/server/db/users'

export default defineEventHandler(async () => {
  return getAllUsers()
})

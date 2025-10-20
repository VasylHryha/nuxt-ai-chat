import type { DirectorySnapshot } from '~/types'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id || 'anonymous'
  const snapshot = await readBody<DirectorySnapshot>(event)

  // TODO: Save to database per user
  // For now, just acknowledge - client uses localStorage as primary storage
  console.log(`[PUT /api/v1/chats] User ${userId} saving snapshot with ${Object.keys(snapshot.profiles || {}).length} profiles`)

  return { success: true }
})

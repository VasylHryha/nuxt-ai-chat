export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') || ''
  const chat = id ? getChatById(id) : null
  if (!chat)
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  return chat
})

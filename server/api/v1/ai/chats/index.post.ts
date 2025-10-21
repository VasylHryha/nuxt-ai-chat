import type { UIMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'
import { getChatById, updateChatTimestamp } from '@/server/db/chats'
import { insertMessage } from '@/server/db/messages'

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey
  const defaultModel = useRuntimeConfig().public.openaiModel
  if (!apiKey)
    throw new Error('Missing OpenAI API key')
  const openai = createOpenAI({
    apiKey,
  })

  return defineEventHandler(async (event: any) => {
    const authUser = requireUser(event)
    const { messages, model: requestModel, id: chatId }: { messages: UIMessage[], model?: string, id?: string } = await readBody(event)

    // Use model from request, fallback to config
    const model = requestModel || defaultModel

    const result = streamText({
      model: openai(model),
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      async onFinish({ messages: finalMessages }) {
        // Only save if we have a chatId
        if (!chatId) {
          return
        }

        // Verify chat exists and user owns it
        const chat = getChatById(chatId, authUser.id)
        if (!chat) {
          console.error('[AI Chat] Chat not found or unauthorized:', chatId)
          return
        }

        try {
          // Save all messages to database
          // Calculate which messages are new (original messages + new assistant response)
          const existingMessages = messages.length - 1 // All messages except the new assistant response
          const newMessages = finalMessages.slice(existingMessages)

          for (const msg of newMessages) {
            if (msg.role !== 'user' && msg.role !== 'assistant') {
              continue
            }

            const content = msg.parts
              .filter(p => p.type === 'text')
              .map(p => (p as any).text)
              .join('\n')

            if (!content) {
              continue
            }

            insertMessage({
              chatId,
              role: msg.role,
              content,
              providerGenerationId: msg.id,
            })
          }

          // Update chat's updated_at timestamp
          updateChatTimestamp(chatId, authUser.id)
        }
        catch (error: unknown) {
          console.error('[AI Chat] Failed to save messages:', error)
        }
      },
    })
  })
})

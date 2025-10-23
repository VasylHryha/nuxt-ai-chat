// import { createOpenAI } from '@ai-sdk/openai'
// import { Experimental_Agent as Agent, convertToModelMessages, stepCountIs, validateUIMessages } from 'ai'
// /**
//  * Basic AI chat endpoint with streaming
//  * Endpoint: POST /api/v1/ai/chats
//  *
//  * Simple chat endpoint without tool calling.
//  * For advanced agent capabilities with tools, use /api/v1/ai/chats/[id]/agent
//  *
//  * @see docs/AI_AGENT_ENDPOINT.md for agent documentation
//  */
//
// import { getChatById, updateChatTimestamp } from '@/server/db/chats'
// import { insertMessage } from '@/server/db/messages'
// import { convertFahrenheitToCelsius, weather } from '@/server/tools/weather'
//
// const onFinish = async (finalMessages) => {
//     // Only save if we have a chatId
//     if (!chatId) {
//         return
//     }
//
//     // Verify chat exists and user owns it
//     const chat = getChatById(chatId, authUser.id)
//     if (!chat) {
//         console.error('[AI Chat] Chat not found or unauthorized:', chatId)
//         return
//     }
//
//     try {
//         // Save all messages to database
//         // Calculate which messages are new (original messages + new assistant response)
//         const existingMessages = messages.length - 1 // All messages except the new assistant response
//         const newMessages = finalMessages.slice(existingMessages)
//
//         for (const msg of newMessages) {
//             if (msg.role !== 'user' && msg.role !== 'assistant') {
//                 continue
//             }
//
//             const content = msg.parts
//                 .filter(p => p.type === 'text')
//                 .map(p => (p as any).text)
//                 .join('\n')
//
//             if (!content) {
//                 continue
//             }
//
//             insertMessage({
//                 chatId,
//                 role: msg.role,
//                 content,
//                 providerGenerationId: msg.id,
//             })
//         }
//
//         // Update chat's updated_at timestamp
//         updateChatTimestamp(chatId, authUser.id)
//     }
//     catch (error: unknown) {
//         console.error('[AI Chat] Failed to save messages:', error)
//     }
// },
//
// export default defineLazyEventHandler(async () => {
//   const apiKey = useRuntimeConfig().openaiApiKey
//   const defaultModel = useRuntimeConfig().public.openaiModel
//   if (!apiKey)
//     throw new Error('Missing OpenAI API key')
//   const openai = createOpenAI({
//     apiKey,
//   })
//
//   return defineEventHandler(async (event) => {
//     const authUser = requireUser(event)
//
//     // Read request body with proper typing
//     const {
//       messages,
//       model: requestModel,
//       id: chatId,
//     } = await readBody<AiChatRequestBody>(event)
//
//     // Use model from request, fallback to config
//     const model = requestModel || defaultModel
//
//     const weatherAgent = new Agent({
//       model: openai(model),
//       tools: {
//         weatherTool: weather,
//         convertFahrenheitToCelsius,
//       },
//       stopWhen: stepCountIs(20),
//     })
//
//     const response = weatherAgent.respond({
//       messages: await validateUIMessages({ messages }),
//     })
//     return response
// })

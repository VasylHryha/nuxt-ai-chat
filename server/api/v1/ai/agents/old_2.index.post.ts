// /**
//  * Advanced AI agent endpoint with streaming and tool calling (Tavily edition)
//  * Endpoint: POST /api/v1/ai/chats/[id]/agent
//  *
//  * - Multi-step agentic loops with stopWhen(stepCountIs)
//  * - Ready-made web search via Tavily (no custom scraper)
//  * - Streaming responses with tool call visibility
//  * - Message persistence with tool calls and results
//  */
//
// import type { AgentChatRequestBody } from '#shared/types/api'
// import type { TavilySearchResponse } from '@tavily/core'
// import type { UIMessage } from 'ai'
// import { createOpenAI } from '@ai-sdk/openai'
// import { tavily } from '@tavily/core'
// import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
// import { z } from 'zod'
// import { getChatById, updateChatTimestamp } from '@/server/db/chats'
// import { insertMessage } from '@/server/db/messages'
//
// type AgentMessage = UIMessage
// type AgentMessagePart = AgentMessage['parts'][number]
//
// function isTextPart(part: AgentMessagePart): part is Extract<AgentMessagePart, { type: 'text' }> {
//   return part.type === 'text'
// }
//
// function isToolCallPart(part: AgentMessagePart): part is Extract<AgentMessagePart, { type: 'tool-call' }> {
//   return part.type === 'tool-call'
// }
//
// function isToolResultPart(part: AgentMessagePart): part is Extract<AgentMessagePart, { type: 'tool-result' }> {
//   return part.type === 'tool-result'
// }
//
// // ----- Ready-made tool: Tavily Search (search + cleaned results) -----
// const tvly = tavily({ apiKey: useRuntimeConfig().tavilyApiKey || '' })
//
// type TavilySearchToolResult = TavilySearchResponse & { provider: 'tavily' }
//
// const tavilySearch = tool({
//   description: 'Web search using Tavily (fresh results with titles, URLs, and snippets).',
//   parameters: z.object({
//     q: z.string().describe('Search query'),
//     maxResults: z.number().int().min(1).max(8).default(4),
//   }),
//   execute: async ({ q, maxResults }): Promise<TavilySearchToolResult> => {
//     // Tavily returns structured results with links + snippets.
//     const res = await tvly.search(q, { maxResults })
//     return { provider: 'tavily', ...res }
//   },
// })
//
// // (Optional) tiny summarizer helper to keep outputs short on nano
// const summarize = tool({
//   description: 'Summarize provided text into concise bullets (final-step helper).',
//   parameters: z.object({
//     text: z.string(),
//     maxWords: z.number().int().min(40).max(250).default(150),
//   }),
//   execute: async ({ text, maxWords }): Promise<{ text: string, maxWords: number }> => ({ text, maxWords }),
// })
//
// const SYSTEM_PROMPT = `You are a concise assistant with tools.
// Rules:
// - For anything “latest” or info discovery, use Tavily: search, pick 1–3 best results, cite URLs.
// - Keep answers short and useful; prefer bullet points.
// - If Tavily key is missing or errors, say so and answer with best effort (no fake citations).
// - Avoid long step chains; finish once the user’s question is answered.`
//
// export default defineLazyEventHandler(async () => {
//   const apiKey = useRuntimeConfig().openaiApiKey
//   const defaultModel = useRuntimeConfig().public.openaiModel || 'gpt-5-nano'
//   if (!apiKey)
//     throw new Error('Missing OpenAI API key')
//   const openai = createOpenAI({ apiKey })
//
//   return defineEventHandler(async (event) => {
//     const authUser = requireUser(event)
//
//     const {
//       messages,
//       model: requestModel,
//       id: chatId,
//       maxSteps = 5, // good default for nano
//     } = await readBody<AgentChatRequestBody>(event)
//
//     if (!chatId) {
//       throw createError({
//         statusCode: 400,
//         statusMessage: 'Chat ID is required',
//       })
//     }
//
//     const model = requestModel || defaultModel
//
//     // Verify chat exists and user owns it (agent endpoint always tied to a chat)
//     const chat = getChatById(chatId, authUser.id)
//     if (!chat) {
//       throw createError({
//         statusCode: 404,
//         statusMessage: 'Chat not found or unauthorized',
//       })
//     }
//
//     const result = streamText({
//       model: openai(model),
//       messages: convertToModelMessages(messages),
//       system: SYSTEM_PROMPT,
//       tools: {
//         tavilySearch,
//         summarize,
//       },
//       toolChoice: 'auto',
//       // Use official loop control helper (prevents runaway loops cleanly)
//       stopWhen: stepCountIs(maxSteps),
//       // Optional step callback (debug/metrics)
//       onStepFinish: ({ toolCalls, toolResults, finishReason, usage }) => {
//         console.log('[AI Agent] Step:', {
//           toolCalls: toolCalls.length,
//           toolResults: toolResults.length,
//           finishReason,
//           usage,
//         })
//       },
//     })
//
//     return result.toUIMessageStreamResponse({
//       originalMessages: messages,
//       async onFinish({ messages: finalMessages }) {
//         try {
//           const existing = messages.length - 1
//           const newMessages = finalMessages.slice(existing)
//
//           for (const msg of newMessages) {
//             if (msg.role !== 'user' && msg.role !== 'assistant')
//               continue
//
//             // Gather text + tool parts so you can render badges later
//             const textContent = msg.parts.filter(isTextPart).map(part => part.text).join('\n')
//             const toolCalls = msg.parts.filter(isToolCallPart).map(part => ({
//               id: part.toolCallId,
//               name: part.toolName,
//               arguments: part.input,
//             }))
//             const toolResults = msg.parts.filter(isToolResultPart).map(part => ({
//               id: part.toolCallId,
//               name: part.toolName,
//               result: part.output,
//             }))
//
//             if (!textContent && toolCalls.length === 0 && toolResults.length === 0)
//               continue
//
//             insertMessage({
//               chatId,
//               role: msg.role,
//               content: textContent || '',
//               providerGenerationId: msg.id,
//             })
//           }
//
//           updateChatTimestamp(chatId, authUser.id)
//         }
//         catch (error: unknown) {
//           console.error('[AI Agent] Persist error:', error)
//         }
//       },
//       onError: (error: unknown) => {
//         console.error('[AI Agent] Stream error:', error)
//         return error instanceof Error ? error.message : String(error)
//       },
//     })
//   })
// })

// /**
//  * AI Agent endpoint with tool calling capabilities
//  * Endpoint: POST /api/v1/ai/chats/[id]/agent
//  *
//  * Advanced chat endpoint that supports:
//  * - Multi-step agentic reasoning (up to maxSteps iterations)
//  * - Automatic tool selection and execution
//  * - Web search, web fetch, calculator, date/time, summarization, knowledge base
//  *
//  * @see docs/AI_AGENT_ENDPOINT.md for detailed documentation
//  */
//
// import type { UIMessage } from 'ai'
// import { createOpenAI } from '@ai-sdk/openai'
// import { convertToModelMessages, streamText, tool } from 'ai'
// import { z } from 'zod'
// import { getChatById, updateChatTimestamp } from '@/server/db/chats'
// import { insertMessage } from '@/server/db/messages'
//
// interface BraveWebSearchItem {
//   title: string
//   url: string
//   description?: string
// }
//
// interface BraveWebSearchResponse {
//   web?: {
//     results?: BraveWebSearchItem[]
//   }
// }
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
// // ============================================================================
// // FREE TOOLS IMPLEMENTATION
// // ============================================================================
//
// // Web Search Tool (Brave Search Free API)
// const webSearchTool = tool({
//   description: 'Search the web for current information. Returns top search results with titles, URLs, and snippets.',
//   parameters: z.object({
//     query: z.string().describe('The search query'),
//     count: z.number().int().min(1).max(10).default(5).describe('Number of results (1-10)'),
//   }),
//   execute: async ({ query, count }): Promise<WebSearchResult> => {
//     try {
//       const braveApiKey = useRuntimeConfig().braveApiKey
//       if (!braveApiKey) {
//         return {
//           error: 'Brave API key not configured',
//           provider: 'brave',
//           tip: 'Get free key at https://brave.com/search/api/',
//         }
//       }
//
//       const data = await $fetch<BraveWebSearchResponse>(
//         `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
//         {
//           headers: {
//             'X-Subscription-Token': braveApiKey,
//             'Accept': 'application/json',
//           },
//         },
//       )
//       const results = data.web?.results ?? []
//
//       return {
//         results: results.map((result): NonNullable<WebSearchResult['results']>[number] => ({
//           title: result.title,
//           url: result.url,
//           snippet: result.description ?? '',
//         })),
//         query,
//         count: results.length,
//       }
//     }
//     catch (error) {
//       return {
//         error: `Search failed: ${error}`,
//         provider: 'brave',
//         query,
//       }
//     }
//   },
// })
//
// // Web Fetch Tool (free - native fetch + basic cleaning)
// const webFetchTool = tool({
//   description: 'Fetch and extract main content from a web page URL. Returns cleaned text content.',
//   parameters: z.object({
//     url: z.string().url().describe('The URL to fetch'),
//   }),
//   execute: async ({ url }): Promise<WebFetchResult> => {
//     try {
//       const html = await $fetch<string>(url, {
//         headers: {
//           'User-Agent': 'Mozilla/5.0 (compatible; AIBot/1.0)',
//         },
//         responseType: 'text',
//       })
//
//       // Enhanced cleaning: remove scripts, styles, noscript, template
//       const cleaned = html
//         .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
//         .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
//         .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
//         .replace(/<template\b[^<]*(?:(?!<\/template>)<[^<]*)*<\/template>/gi, '')
//         .replace(/<[^>]+>/g, ' ')
//         .replace(/\s+/g, ' ')
//         .trim()
//         .slice(0, 5000) // Keep 5k char limit
//
//       return {
//         url,
//         content: cleaned,
//         length: cleaned.length,
//       }
//     }
//     catch (error) {
//       return { error: `Failed to fetch: ${error}`, url }
//     }
//   },
// })
//
// // Calculator Tool (hardened - strict allow-list)
// const calculatorTool = tool({
//   description: 'Perform mathematical calculations. Supports: +, -, *, /, (), percentages, sqrt, and π.',
//   parameters: z.object({
//     expression: z.string().describe('Mathematical expression (e.g., "2 + 2", "sqrt(16)", "15% of 200")'),
//   }),
//   execute: async ({ expression }): Promise<CalculatorResult> => {
//     try {
//       const sanitized = expression.toLowerCase().trim()
//
//       // Handle percentages first
//       if (sanitized.includes('%')) {
//         const match = sanitized.match(/(\d+(?:\.\d*)?)%\s*of\s*(\d+\.?\d*)/)
//         if (match) {
//           const result = (Number.parseFloat(match[1]) / 100) * Number.parseFloat(match[2])
//           return { result: Number(result.toFixed(10)), expression }
//         }
//       }
//
//       // Strict allow-list: only safe characters
//       const allowed = /^[\d+\-*/.()√π\s]+$/
//       const safe = sanitized
//         .replace(/√/g, 'Math.sqrt')
//         .replace(/π/g, 'Math.PI')
//
//       // Final validation: check if only allowed chars remain after replacements
//       const testStr = safe.replace(/Math\.(sqrt|PI)/g, '')
//       if (!allowed.test(testStr)) {
//         return { error: 'Invalid expression. Use only: digits, +, -, *, /, (), sqrt, π' }
//       }
//
//       // Execute with Function (safer than eval, still sandboxed)
//       // eslint-disable-next-line no-new-func -- Safe: expression validated against strict allow-list (only Math.sqrt, Math.PI, digits, +, -, *, /, (), spaces)
//       const evaluation = new Function(`'use strict'; return (${safe})`)()
//
//       if (typeof evaluation !== 'number' || Number.isNaN(evaluation)) {
//         return { error: 'Calculation did not produce a numeric result', expression }
//       }
//
//       return {
//         result: Number(evaluation.toFixed(10)),
//         expression,
//       }
//     }
//     catch (error) {
//       return { error: `Calculation failed: ${error}` }
//     }
//   },
// })
//
// // Date/Time Tool (Europe/Kyiv default timezone)
// const dateTimeTool = tool({
//   description: 'Get current date/time, parse natural language dates, or perform date calculations.',
//   parameters: z.object({
//     action: z.enum(['current', 'parse', 'add', 'diff']).describe('Action to perform'),
//     input: z.string().default('').describe('Natural language date (e.g., "next Tuesday", "in 5 days")'),
//     timezone: z.string().default('Europe/Kyiv').describe('Timezone'),
//   }),
//   execute: async ({ action, input, timezone }): Promise<DateTimeResult> => {
//     try {
//       const now = new Date()
//
//       if (action === 'current') {
//         return {
//           iso: now.toISOString(),
//           formatted: now.toLocaleString('en-US', { timeZone: timezone }),
//           timestamp: now.getTime(),
//           timezone,
//         }
//       }
//
//       if (action === 'parse' && input) {
//         const lower = input.toLowerCase()
//         const targetDate = new Date(now.getTime())
//
//         if (lower.includes('tomorrow')) {
//           targetDate.setDate(targetDate.getDate() + 1)
//         }
//         else if (lower.includes('yesterday')) {
//           targetDate.setDate(targetDate.getDate() - 1)
//         }
//         else if (lower.match(/in (\d+) days?/)) {
//           const match = lower.match(/in (\d+) days?/)
//           const days = match ? Number.parseInt(match[1], 10) : 0
//           targetDate.setDate(targetDate.getDate() + days)
//         }
//         else {
//           const nextMatch = lower.match(/next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
//           const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
//           const targetDay = nextMatch?.[1]
//           if (targetDay) {
//             const targetDayIndex = days.indexOf(targetDay)
//             const currentDayIndex = targetDate.getDay()
//             const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7 || 7
//             targetDate.setDate(targetDate.getDate() + daysToAdd)
//           }
//         }
//
//         return {
//           input,
//           iso: targetDate.toISOString(),
//           formatted: targetDate.toLocaleString('en-US', { timeZone: timezone }),
//           timezone,
//         }
//       }
//
//       return { error: 'Invalid action or missing input' }
//     }
//     catch (error) {
//       return { error: `Date operation failed: ${error}` }
//     }
//   },
// })
//
// // Text Summarization Tool
// const summarizeTool = tool({
//   description: 'Summarize long text into a concise version. Returns instruction for the model.',
//   parameters: z.object({
//     text: z.string().describe('Text to summarize'),
//     style: z.enum(['brief', 'detailed', 'bullet-points']).default('brief'),
//     maxLength: z.number().int().default(200).describe('Maximum length in words'),
//   }),
//   execute: async ({ text, style, maxLength }): Promise<SummarizeResult> => {
//     return {
//       instruction: `Summarize this text in ${style} style, max ${maxLength} words`,
//       text: text.slice(0, 10000),
//     }
//   },
// })
//
// // Knowledge Base Tool (placeholder)
// const knowledgeBaseTool = tool({
//   description: 'Search a local knowledge base for information.',
//   parameters: z.object({
//     query: z.string().describe('Search query'),
//     topK: z.number().int().default(3).describe('Number of results'),
//   }),
//   execute: async ({ query, topK }): Promise<KnowledgeBaseResult> => {
//     return {
//       query,
//       results: [],
//       note: `Knowledge base not configured. Requested top ${topK} results.`,
//     }
//   },
// })
//
// // ============================================================================
// // AGENT CONFIGURATION (optimized for gpt-5-nano)
// // ============================================================================
//
// const AGENT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to tools.
//
// RULES:
// 1) Prefer short, inexpensive reasoning. Use tools only when needed.
// 2) For web: search first, then fetch 1–2 best URLs. Cite URLs.
// 3) If web_search fails (no key / API error), say so and continue with best effort.
// 4) Keep answers concise, with bullet points when helpful.
// 5) Never fabricate citations.
//
// CAPABILITIES:
// - Web search + fetch (current information)
// - Math calculations
// - Date/time operations
// - Text summarization
// - Knowledge base search
//
// Be concise but thorough. Use tools proactively when they add value.`
//
// export default defineLazyEventHandler(async () => {
//   const apiKey = useRuntimeConfig().openaiApiKey
//   const defaultModel = useRuntimeConfig().public.openaiModel || 'gpt-5-nano'
//
//   if (!apiKey)
//     throw new Error('Missing OpenAI API key')
//
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
//       maxSteps = 5, // Lower default for gpt-5-nano (was 6)
//     } = await readBody<AgentChatRequestBody>(event)
//
//     const model = requestModel || defaultModel
//
//     // ============================================================================
//     // AGENT WITH TOOLS & LOOP (gpt-5-nano optimized)
//     // ============================================================================
//
//     const result = streamText({
//       model: openai(model),
//       messages: convertToModelMessages(messages),
//       system: AGENT_SYSTEM_PROMPT,
//
//       // Tools available to the agent
//       tools: {
//         web_search: webSearchTool,
//         web_fetch: webFetchTool,
//         calculator: calculatorTool,
//         date_time: dateTimeTool,
//         summarize: summarizeTool,
//         knowledge_base: knowledgeBaseTool,
//       },
//
//       // Explicit tool choice for small models
//       toolChoice: 'auto',
//
//       // Tighter loop for cheaper model
//       maxSteps,
//
//       experimental_continueSteps: true,
//     })
//
//     return result.toUIMessageStreamResponse({
//       originalMessages: messages,
//       async onFinish({ messages: finalMessages, usage, finishReason }) {
//         // Only persist messages if chatId is provided
//         if (!chatId) {
//           console.warn('[Agent] No chatId provided, skipping message persistence')
//           return
//         }
//
//         // Verify chat exists and user owns it
//         const chat = getChatById(chatId, authUser.id)
//         if (!chat) {
//           console.error('[AI Chat] Chat not found or unauthorized:', chatId)
//           return
//         }
//
//         try {
//           const existingMessages = messages.length - 1
//           const newMessages = finalMessages.slice(existingMessages)
//
//           for (const msg of newMessages) {
//             if (msg.role !== 'user' && msg.role !== 'assistant') {
//               continue
//             }
//
//             let content = ''
//
//             // Log tool calls with chatId for correlation
//             for (const part of msg.parts) {
//               if (isTextPart(part)) {
//                 content += `${part.text}\n`
//               }
//               else if (isToolCallPart(part)) {
//                 console.log('[Tool Call]', {
//                   chatId,
//                   msgId: msg.id,
//                   tool: part.toolName,
//                   args: 'input' in part ? part.input : undefined,
//                 })
//               }
//               else if (isToolResultPart(part)) {
//                 console.log('[Tool Result]', {
//                   chatId,
//                   msgId: msg.id,
//                   tool: part.toolName,
//                   result: 'output' in part ? part.output : undefined,
//                 })
//               }
//             }
//
//             if (!content.trim())
//               continue
//
//             insertMessage({
//               chatId,
//               role: msg.role,
//               content: content.trim(),
//               providerGenerationId: msg.id,
//             })
//           }
//
//           updateChatTimestamp(chatId, authUser.id)
//
//           // Enhanced telemetry
//           console.log('[Agent Stats]', {
//             chatId,
//             model,
//             totalSteps: finalMessages.length - messages.length,
//             finishReason,
//             tokens: usage,
//           })
//         }
//         catch (error: unknown) {
//           console.error('[AI Chat] Failed to save messages:', error)
//         }
//       },
//     })
//   })
// })

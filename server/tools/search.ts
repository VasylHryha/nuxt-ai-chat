import type { TavilySearchResponse } from '@tavily/core'
import { tavily } from '@tavily/core'
import { tool } from 'ai'
import { z } from 'zod'

const tvly = tavily({ apiKey: useRuntimeConfig().tavilyApiKey || '' })

type TavilySearchToolResult = TavilySearchResponse & { provider: 'tavily' }

export const tavilySearchTool = tool({
  description: 'Web search using Tavily (fresh results with titles, URLs, and snippets).',
  inputSchema: z.object({
    q: z.string().describe('Search query'),
    maxResults: z.number().int().min(1).max(8).default(4),
  }),
  execute: async ({ q, maxResults }): Promise<TavilySearchToolResult> => {
    // Tavily returns structured results with links + snippets.
    const res = await tvly.search(q, { maxResults })
    return { provider: 'tavily', ...res }
  },
})

// (Optional) tiny summarizer helper to keep outputs short on nano
export const summarizeTool = tool({
  description: 'Summarize provided text into concise bullets (final-step helper).',
  inputSchema: z.object({
    text: z.string(),
    maxWords: z.number().int().min(40).max(250).default(150),
  }),
  execute: async ({ text, maxWords }): Promise<{ text: string, maxWords: number }> => ({ text, maxWords }),
})

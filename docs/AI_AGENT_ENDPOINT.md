# AI Agent Endpoint Documentation

## Overview

The Agent endpoint (`POST /api/v1/ai/chats/[id]/agent`) is an **advanced AI chat endpoint** that extends basic chat capabilities with autonomous tool calling and multi-step reasoning. Unlike the basic chat endpoint, the agent can automatically search the web, perform calculations, fetch web pages, handle dates, and more - all without explicit instructions.

**Endpoint:** `POST /api/v1/ai/chats/[id]/agent`

**Status:** ✅ Production-ready, optimized for `gpt-4o-mini` and `gpt-5-nano`

---

## What is an AI Agent?

An **AI agent** is an LLM that can:
1. **Reason** about complex multi-step tasks
2. **Select tools** automatically based on user needs
3. **Execute tools** and use results to inform responses
4. **Loop** through multiple reasoning + tool execution cycles
5. **Synthesize** final answers from tool results

### How It Works

```
User: "What's 15% of the current Bitcoin price?"

Agent Flow:
1. [Reasoning] Need BTC price → select web_search tool
2. [Tool Call] web_search({ query: "current bitcoin price" })
3. [Tool Result] { results: [...], snippets: "$43,250" }
4. [Reasoning] Got price, now calculate → select calculator tool
5. [Tool Call] calculator({ expression: "15% of 43250" })
6. [Tool Result] { result: 6487.5 }
7. [Response] "15% of the current Bitcoin price ($43,250) is $6,487.50"
```

This all happens **automatically** - you just send the user's message!

---

## When to Use Agent vs Basic Chat

### ✅ Use Agent Endpoint When:

- User needs **current information** (web search)
- Task requires **calculations** or math
- Task involves **dates** or time conversions
- You want **web page content** extraction
- Task is **multi-step** (search → fetch → summarize)
- You need **automatic tool selection**
- Accuracy matters more than speed

### ❌ Use Basic Chat Endpoint When:

- Simple conversation with no tools needed
- Speed is critical (basic chat is faster)
- You want to minimize token usage
- User is just asking for advice/opinions
- Task is purely creative writing
- No external data is required

---

## Pros and Cons

### ✅ Pros

| Feature | Benefit |
|---------|---------|
| **Autonomous** | Agent decides which tools to use automatically |
| **Multi-step** | Can chain tools (search → fetch → summarize) |
| **Current data** | Access to real-time web information |
| **Accurate math** | Precise calculations via calculator tool |
| **Date parsing** | Natural language date handling |
| **Extensible** | Easy to add custom tools |
| **Transparent** | All tool calls logged for debugging |

### ❌ Cons

| Issue | Impact |
|-------|--------|
| **Slower** | Multiple LLM calls per request (up to `maxSteps`) |
| **More expensive** | Higher token usage due to tool calling overhead |
| **Requires OpenAI** | Only works with models supporting tool calling |
| **Complexity** | Harder to debug multi-step failures |
| **Rate limits** | Can hit API limits faster with multiple steps |
| **Optional tools** | Web search requires Brave API key (free tier available) |

---

## Available Tools

| Tool | Description | Cost | Use Cases |
|------|-------------|------|-----------|
| `web_search` | Brave Search API | Free (2K/month) | Current events, news, prices, facts |
| `web_fetch` | Fetch & parse any URL | Free (unlimited) | Extract article content, docs, pages |
| `calculator` | Math expressions | Free (unlimited) | Percentages, arithmetic, sqrt, π |
| `date_time` | Natural date parsing | Free (unlimited) | "next Tuesday", "in 5 days", timestamps |
| `summarize` | Text summarization | Uses your LLM | Condense long content |
| `knowledge_base` | Local vector search | Free (placeholder) | Custom knowledge retrieval |

### Tool Selection Logic

The agent automatically selects tools based on:
- **User intent** - "search for..." → `web_search`
- **Content type** - "calculate..." → `calculator`
- **Data requirements** - "what date is..." → `date_time`
- **Context** - Search results contain URLs → may use `web_fetch`

You can **guide** tool selection in the prompt:
```typescript
{
  messages: [
    {
      role: 'user',
      content: 'Use web search to find the latest Nuxt 4 release notes, then summarize them'
    }
  ]
}
```

---

## API Reference

### Request

**Endpoint:** `POST /api/v1/ai/chats/[id]/agent`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id` (string, required): Chat ID

**Request Body:**
```typescript
{
  messages: UIMessage[]     // Chat history
  model?: string            // Override default model (optional)
  maxSteps?: number         // Max tool loop iterations (default: 5)
}
```

**Example:**
```typescript
const response = await fetch('/api/v1/ai/chats/chat__abc123/agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is the weather in Kyiv and convert it to Fahrenheit?' }
    ],
    maxSteps: 8  // Allow more steps for complex tasks
  })
})
```

### Response

**Content-Type:** `text/event-stream` (SSE)

**Stream Format:**
```typescript
// Text chunk
data: {"type":"text","content":"The current"}

// Tool call
data: {"type":"tool-call","toolName":"web_search","args":{...}}

// Tool result
data: {"type":"tool-result","toolName":"web_search","result":{...}}

// Final message
data: {"type":"message","id":"msg_123","role":"assistant","parts":[...]}
```

**Status Codes:**
- `200` - Success (streaming started)
- `400` - Missing chat ID
- `401` - Unauthorized
- `404` - Chat not found
- `500` - Internal server error

---

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional - for web search (free tier: 2000/month)
BRAVE_API_KEY=your-brave-api-key

# Model defaults
OPENAI_MODEL=gpt-4o-mini  # or gpt-5-nano
```

### Runtime Config (nuxt.config.ts)

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    braveApiKey: process.env.BRAVE_API_KEY,  // Optional

    public: {
      openaiModel: 'gpt-4o-mini',  // Default model
    },
  },
})
```

### Get Free Brave API Key

1. Visit https://brave.com/search/api/
2. Sign up for free tier (2,000 queries/month)
3. Get API key
4. Add to `.env` as `BRAVE_API_KEY`

**Note:** If no Brave key is configured, `web_search` tool returns helpful error message and the agent continues with best effort.

---

## Usage Examples

### Example 1: Web Research

**User Query:**
```typescript
{
  messages: [
    { role: 'user', content: 'Search for latest Nuxt 4 features and summarize' }
  ],
  maxSteps: 6
}
```

**Agent Actions:**
1. Uses `web_search` to find Nuxt 4 articles
2. Uses `web_fetch` to get full content from top result
3. Uses `summarize` to condense content
4. Returns cited summary with URLs

### Example 2: Math + Current Data

**User Query:**
```typescript
{
  messages: [
    { role: 'user', content: 'What is 20% of the current Ethereum price?' }
  ]
}
```

**Agent Actions:**
1. Uses `web_search` to find ETH price
2. Extracts price from search results
3. Uses `calculator` to compute 20%
4. Returns answer with sources

### Example 3: Date Calculations

**User Query:**
```typescript
{
  messages: [
    { role: 'user', content: 'When is next Monday and what day of the week will it be in 30 days?' }
  ]
}
```

**Agent Actions:**
1. Uses `date_time({ action: 'parse', input: 'next Monday' })`
2. Uses `date_time({ action: 'parse', input: 'in 30 days' })`
3. Returns both dates with formatted output

### Example 4: Complex Multi-Step

**User Query:**
```typescript
{
  messages: [
    { role: 'user', content: 'Find the top 3 AI news articles from today and list their key points' }
  ],
  maxSteps: 10  // Allow more steps for complex workflow
}
```

**Agent Actions:**
1. `web_search({ query: 'AI news today' })`
2. `web_fetch({ url: article1_url })`
3. `summarize({ text: article1_content, style: 'bullet-points' })`
4. `web_fetch({ url: article2_url })`
5. `summarize({ text: article2_content, style: 'bullet-points' })`
6. `web_fetch({ url: article3_url })`
7. `summarize({ text: article3_content, style: 'bullet-points' })`
8. Returns structured list with key points and URLs

---

## Loop Control

### Default Settings

```typescript
{
  maxSteps: 5,                        // Max tool calling iterations
  experimental_continueSteps: true    // Allow multi-turn tool use
}
```

### Adjust Per Request

```typescript
{
  messages: [...],
  maxSteps: 10,  // Allow more steps for complex tasks
}
```

### Stop Conditions

The agent stops when:
1. It reaches `maxSteps` (prevents infinite loops)
2. It decides the task is complete (no more tools needed)
3. A tool returns an error that can't be recovered from

### Recommended maxSteps

| Task Complexity | Recommended maxSteps | Example |
|----------------|---------------------|---------|
| Simple | 3-4 | Single tool use (calculator, date) |
| Medium | 5-6 | Search + fetch or search + calculate |
| Complex | 8-10 | Multi-step research (search → fetch × N → summarize) |

**Note:** Higher `maxSteps` = slower response + higher cost

---

## Debugging

### Console Logs

All tool calls and results are logged:

```
[Tool Call] { chatId: 'chat__123', tool: 'web_search', args: { query: 'AI news' } }
[Tool Result] { chatId: 'chat__123', tool: 'web_search', result: { results: [...] } }
[Agent Stats] { chatId: 'chat__123', model: 'gpt-4o-mini', totalSteps: 3, finishReason: 'stop', tokens: {...} }
```

### Common Issues

#### Issue: Tools not being called

**Possible causes:**
- Model doesn't support tool calling (use `gpt-4o`, `gpt-4o-mini`, or `gpt-5-nano`)
- User query is too vague (guide with explicit instructions)
- `maxSteps` too low (increase for complex tasks)

**Solution:**
```typescript
{
  messages: [
    {
      role: 'user',
      content: 'Use the calculator tool to compute 25% of 500'  // Explicit guidance
    }
  ],
  maxSteps: 6
}
```

#### Issue: "Brave API key not configured"

**Solution:**
1. Get free key at https://brave.com/search/api/
2. Add to `.env`: `BRAVE_API_KEY=your-key`
3. Restart dev server

**Workaround:** Agent will continue with best effort if key is missing

#### Issue: Too many steps / slow responses

**Solution:** Lower `maxSteps` for simpler queries
```typescript
{
  messages: [{ role: 'user', content: 'Calculate 2 + 2' }],
  maxSteps: 3  // Only need one tool call
}
```

#### Issue: Agent hallucinating tool results

**Cause:** Model fabricating citations when tools fail

**Solution:** Check tool error logs and fix failing tools first

---

## Extending with Custom Tools

### Add a New Tool

```typescript
// In agent.post.ts
const myCustomTool = tool({
  description: 'Does something useful',
  parameters: z.object({
    input: z.string(),
  }),
  execute: async ({ input }) => {
    // Your logic here
    return { result: 'done!' }
  },
})

// Add to tools object:
tools: {
  web_search: webSearchTool,
  my_custom: myCustomTool,  // ← Add here
}
```

### Popular Free Tool Ideas

| Tool | Provider | Free Tier |
|------|----------|-----------|
| Weather | OpenWeatherMap | 60 calls/min |
| Currency | fixer.io | 100 requests/month |
| Translation | LibreTranslate | Self-hosted (free) |
| Code execution | Piston API | Rate-limited |
| Image gen | Replicate | Pay-as-you-go |

---

## Security Considerations

### 1. API Keys

✅ **Safe:** Stored in `runtimeConfig` (server-only)
❌ **Unsafe:** Never expose in client-side code

### 2. Rate Limiting

Implement per-user limits for tool usage:
```typescript
// Example middleware
if (toolCallCount > 100) {
  throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded' })
}
```

### 3. URL Validation

The `web_fetch` tool validates URLs, but consider adding a domain whitelist:
```typescript
const ALLOWED_DOMAINS = ['wikipedia.org', 'github.com', 'docs.nuxt.com']
if (!ALLOWED_DOMAINS.some(d => url.includes(d))) {
  return { error: 'Domain not allowed' }
}
```

### 4. Calculator Safety

Uses `Function` constructor (safer than `eval`) with strict character allowlist:
- ✅ Safe: digits, `+`, `-`, `*`, `/`, `()`, `sqrt`, `π`
- ❌ Blocked: All other characters and keywords

---

## Performance Tips

### 1. Model Selection

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `gpt-5-nano` | ⚡⚡⚡ Very fast | $ Cheapest | Simple tasks, high volume |
| `gpt-4o-mini` | ⚡⚡ Fast | $$ Moderate | Most use cases (recommended) |
| `gpt-4o` | ⚡ Slower | $$$ Expensive | Complex reasoning |

### 2. Optimize maxSteps

```typescript
// ✅ Good: Match complexity
{ messages: [{ role: 'user', content: 'Calculate 10 + 5' }], maxSteps: 3 }

// ❌ Bad: Overkill
{ messages: [{ role: 'user', content: 'Calculate 10 + 5' }], maxSteps: 10 }
```

### 3. Cache Tool Results

Consider caching for repeated queries:
```typescript
// Pseudo-code
const cacheKey = `web_search:${query}`
const cached = await redis.get(cacheKey)
if (cached) return cached

const result = await fetch(...)
await redis.set(cacheKey, result, { ex: 3600 })  // 1 hour TTL
```

### 4. Stream Tool Updates

For better UX, consider streaming tool call progress to the client:
```typescript
// Frontend
for (const part of message.parts) {
  if (part.type === 'tool-call') {
    displayToolBadge(part.toolName)  // Show "Searching..." badge
  }
}
```

---

## Comparison: Agent vs Basic Chat

| Feature | Basic Chat (`/api/v1/ai/chats`) | Agent (`/api/v1/ai/chats/[id]/agent`) |
|---------|--------------------------------|---------------------------------------|
| **Speed** | ⚡⚡⚡ Very fast | ⚡ Slower (multi-step) |
| **Cost** | $ Low | $$$ Higher |
| **Tools** | ❌ None | ✅ 6+ tools |
| **Web access** | ❌ No | ✅ Yes (search + fetch) |
| **Math** | ⚠️ Approximate | ✅ Precise |
| **Multi-step** | ❌ No | ✅ Yes |
| **Current data** | ❌ No | ✅ Yes |
| **Use case** | General chat | Research, calculations, current info |

---

## Migration Guide

### From Basic Chat to Agent

**Before (basic chat):**
```typescript
fetch('/api/v1/ai/chats', {
  method: 'POST',
  body: JSON.stringify({
    messages: [...],
    id: chatId,
    model: 'gpt-4o-mini'
  })
})
```

**After (agent):**
```typescript
fetch(`/api/v1/ai/chats/${chatId}/agent`, {  // ← chatId in path
  method: 'POST',
  body: JSON.stringify({
    messages: [...],           // ← id removed from body
    model: 'gpt-4o-mini',
    maxSteps: 5                // ← New parameter
  })
})
```

**Breaking changes:**
1. `chatId` moved from body to URL path (REST compliant)
2. Added `maxSteps` parameter

---

## FAQ

### Q: Do I need Brave API key?

**A:** No, it's optional. If not configured, the `web_search` tool will return a helpful error message and the agent will continue with best effort using other tools.

### Q: Can I use other models besides OpenAI?

**A:** Currently only OpenAI models are supported. Tool calling requires models with native function calling support (`gpt-4o`, `gpt-4o-mini`, `gpt-5-nano`).

### Q: How much does it cost?

**A:** Depends on model and steps:
- `gpt-5-nano`: ~$0.0001 per simple request (1-2 steps)
- `gpt-4o-mini`: ~$0.001 per simple request
- `gpt-4o`: ~$0.01 per simple request
- Complex multi-step tasks cost more (up to 10x)

### Q: Can I disable specific tools?

**A:** Yes, remove them from the `tools` object in `agent.post.ts`:
```typescript
tools: {
  // web_search: webSearchTool,  // ← Comment out to disable
  calculator: calculatorTool,
  date_time: dateTimeTool,
}
```

### Q: How do I add custom tools?

**A:** See [Extending with Custom Tools](#extending-with-custom-tools) section above.

---

## Related Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Project overview and conventions
- **[AI_PLAYBOOK.md](./AI_PLAYBOOK.md)** - Development guidelines
- **[AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)** - System architecture
- **[types/api.ts](../shared/types/api.ts)** - API types reference

---

## Changelog

- **2025-01-XX** - Initial documentation
- **2025-01-XX** - Fixed REST compliance (chatId in path)
- **2025-01-XX** - Added TypeScript types from `types/api.ts`

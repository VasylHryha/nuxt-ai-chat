import type { UIMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey
  const model = useRuntimeConfig().openaiModel
  if (!apiKey)
    throw new Error('Missing OpenAI API key')
  const openai = createOpenAI({
    apiKey,
  })

  return defineEventHandler(async (event: any) => {
    const { messages }: { messages: UIMessage[] } = await readBody(event)

    const result = streamText({
      model: openai(model),
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  })
})

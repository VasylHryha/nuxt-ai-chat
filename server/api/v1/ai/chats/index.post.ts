import type { UIMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey
  const defaultModel = useRuntimeConfig().public.openaiModel
  if (!apiKey)
    throw new Error('Missing OpenAI API key')
  const openai = createOpenAI({
    apiKey,
  })

  return defineEventHandler(async (event: any) => {
    const { messages, model: requestModel }: { messages: UIMessage[], model?: string } = await readBody(event)

    // Use model from request, fallback to config
    const model = requestModel || defaultModel

    console.log('Using model:', model)
    console.log('Messages count:', messages.length)

    const result = streamText({
      model: openai(model),
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  })
})

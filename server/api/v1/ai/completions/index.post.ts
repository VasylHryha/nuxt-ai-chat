import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey
  const defaultModel = useRuntimeConfig().public.openaiModel
  if (!apiKey)
    throw new Error('Missing OpenAI API key')

  const openai = createOpenAI({
    apiKey,
  })

  return defineEventHandler(async (event: any) => {
    const { prompt, model: requestModel } = await readBody(event)

    if (!prompt || typeof prompt !== 'string')
      throw createError({ statusCode: 400, statusMessage: 'prompt is required' })

    const model = requestModel || defaultModel

    const result = streamText({
      model: openai(model),
      prompt,
    })

    return result.toUIMessageStreamResponse()
  })
})

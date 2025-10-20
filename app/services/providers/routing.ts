// app/services/providers/routing.ts
// Central mapping from provider/model → chat UI route

export function getChatRouteFor(provider: string, model?: string, chatId?: string, ui?: 'ai-sdk' | 'native' | 'proxy'): string {
  const prov = (provider || '').toLowerCase()
  const hasId = typeof chatId === 'string' && chatId.length > 0

  // If UI kind is explicitly provided by the server, prefer it
  if (ui === 'ai-sdk')
    return hasId ? `/ai-chat/${chatId}` : '/ai-chat/new'
  if (ui === 'native')
    return hasId ? `/native-chat/${chatId}` : '/native-chat/new'
  if (ui === 'proxy')
    return hasId ? `/proxy-chat/${chatId}` : '/proxy-chat/new'

  // Known providers that use the AI SDK chat UI
  const aiSdkProviders = new Set(['openai', 'openrouter', 'anthropic', 'google'])

  if (aiSdkProviders.has(prov))
    return hasId ? `/ai-chat/${chatId}` : '/ai-chat/new'

  // TODO: add routing for other providers or native UIs as they are introduced
  return hasId ? `/ai-chat/${chatId}` : '/ai-chat/new'
}

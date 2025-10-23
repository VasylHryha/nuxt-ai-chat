export type ChatProviderFilterValue = 'all' | 'openai' | 'anthropic' | 'google' | 'openrouter'
export type ChatDateFilterValue = 'all' | 'today' | 'week' | 'month'

interface SelectOption {
  label: string
  value: string
}

export const CHAT_PROVIDER_FILTERS: SelectOption[] = [
  { label: 'All Providers', value: 'all' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Google', value: 'google' },
  { label: 'OpenRouter', value: 'openrouter' },
]

export const CHAT_DATE_FILTERS: SelectOption[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const CHAT_PROVIDER_COLOR_MAP: Record<string, string> = {
  openai: 'emerald',
  anthropic: 'orange',
  google: 'blue',
  openrouter: 'purple',
}

export function getProviderColor(provider: string): string {
  return CHAT_PROVIDER_COLOR_MAP[provider] || 'gray'
}

export function resolveDateFilterStart(value: ChatDateFilterValue): number | undefined {
  const now = Date.now()

  switch (value) {
    case 'today':
      return now - 24 * 60 * 60 * 1000
    case 'week':
      return now - 7 * 24 * 60 * 60 * 1000
    case 'month':
      return now - 30 * 24 * 60 * 60 * 1000
    default:
      return undefined
  }
}

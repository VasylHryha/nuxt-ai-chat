/**
 * Formats a timestamp string into a human-friendly relative time.
 * Falls back to locale date when older than a week.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1)
    return 'Just now'
  if (diffMins < 60)
    return `${diffMins}m ago`

  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 24)
    return `${diffHours}h ago`

  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays < 7)
    return `${diffDays}d ago`

  return date.toLocaleDateString()
}

// server/db/connections.ts
import type { Connection } from 'db/types'
import db from './main'

export function getOrCreateConnection(
  userId: string,
  provider: string,
  model: string,
  baseURL?: string | null,
  settings?: unknown,
  ui: 'ai-sdk' | 'native' | 'proxy' = 'ai-sdk',
): Connection {
  const prov = provider.trim().toLowerCase()
  const mdl = model.trim()

  const found = db.prepare(`
        SELECT * FROM connections
        WHERE user_id = ? AND provider = ? AND model = ? AND ui = ? AND deleted_at IS NULL
    `).get(userId, prov, mdl, ui) as Connection | undefined

  if (found)
    return found

  const now = Date.now()
  const id = rid('conn_')
  const label = `${prov}:${mdl}`

  db.prepare(`
        INSERT INTO connections (id,user_id,label,provider,model,ui,base_url,settings_json,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(id, userId, label, prov, mdl, ui, baseURL ?? null, settings ? JSON.stringify(settings) : null, now, now)

  return db.prepare(`SELECT * FROM connections WHERE id = ?`).get(id) as Connection
}

// app/services/directory.ts
import type { ProviderKey } from '@/services/providers/types'
import type { DirectorySnapshot } from '~/types'
import { chatRepository } from '@/services/chatRepository'
import { getAdapter } from '@/services/providers'

export async function getDirectorySnapshot(provider: ProviderKey): Promise<DirectorySnapshot> {
  const adapter = getAdapter(provider)
  if (adapter.supportsServerChats && adapter.directory) {
    return await adapter.directory.getList()
  }
  return await chatRepository.load(provider) // local-only providers
}

export async function saveDirectorySnapshot(provider: ProviderKey, snapshot: DirectorySnapshot) {
  const adapter = getAdapter(provider)
  if (adapter.supportsServerChats && adapter.directory) {
    await adapter.directory.upsertSnapshot(snapshot) // best-effort push
  }
  await chatRepository.save(provider, snapshot) // always keep local fresh
}

import type { DirectorySnapshot } from '~/types'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = (globalThis as any).__NUXT_FETCH_MOCK__ as Mock

vi.mock('ofetch', () => ({
  $fetch: fetchMock,
}))

let chatRepository!: typeof import('@/app/services/chatRepository').chatRepository

beforeAll(async () => {
  chatRepository = (await import('@/app/services/chatRepository')).chatRepository
})

const STORAGE_KEY = 'ai-chat.v1.directory'

describe('chatRepository', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads snapshot from localStorage before fetching remote', async () => {
    const snapshot: DirectorySnapshot = {
      currentProfileId: 'profile-local',
      profiles: {
        'profile-local': {
          id: 'profile-local',
          name: 'Local profile',
          currentSessionId: 'session-1',
          createdAt: 1,
          updatedAt: 2,
          sessions: {
            'session-1': {
              id: 'session-1',
              title: 'Offline session',
              provider: 'openai',
              model: 'gpt-4o-mini',
              createdAt: 1,
              updatedAt: 2,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 5,
              messages: [
                { id: 'msg-1', role: 'user', content: 'hello', createdAt: 1, updatedAt: 1 },
              ],
            },
          },
        },
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))

    const result = await chatRepository.load()

    expect(result).toEqual(snapshot)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('saves snapshot to localStorage and debounced PUT request', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(undefined)
    const snapshot: DirectorySnapshot = {
      currentProfileId: 'p1',
      profiles: {
        p1: {
          id: 'p1',
          name: 'Profile',
          currentSessionId: 's1',
          createdAt: 1,
          updatedAt: 1,
          sessions: {
            s1: {
              id: 's1',
              title: 'Session',
              provider: 'openai',
              model: 'gpt-4o',
              createdAt: 1,
              updatedAt: 1,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 0,
              messages: [],
            },
          },
        },
      },
    }

    await chatRepository.save(snapshot)

    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(snapshot))
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/chats', {
      method: 'PUT',
      body: snapshot,
    })
  })

  it('merges remote snapshot on syncPull and schedules save push', async () => {
    vi.useFakeTimers()
    const localSnapshot: DirectorySnapshot = {
      currentProfileId: 'profileA',
      profiles: {
        profileA: {
          id: 'profileA',
          name: 'Local',
          currentSessionId: 'sessionA',
          createdAt: 1,
          updatedAt: 5,
          sessions: {
            sessionA: {
              id: 'sessionA',
              title: 'Session A',
              provider: 'openai',
              model: 'gpt-4o',
              createdAt: 1,
              updatedAt: 5,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 20,
              messages: [
                { id: 'msg-1', role: 'user', content: 'hi', createdAt: 1, updatedAt: 1 },
                { id: 'msg-2', role: 'assistant', content: 'local answer', createdAt: 2, updatedAt: 2 },
              ],
            },
          },
        },
      },
    }

    const remoteSnapshot: DirectorySnapshot = {
      currentProfileId: 'profileA',
      profiles: {
        profileA: {
          id: 'profileA',
          name: 'Remote',
          currentSessionId: 'sessionA',
          createdAt: 1,
          updatedAt: 10,
          sessions: {
            sessionA: {
              id: 'sessionA',
              title: 'Session A remote',
              provider: 'openai',
              model: 'gpt-4o',
              createdAt: 1,
              updatedAt: 10,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 30,
              messages: [
                { id: 'msg-1', role: 'user', content: 'hi', createdAt: 1, updatedAt: 1 },
                { id: 'msg-2', role: 'assistant', content: 'remote answer', createdAt: 2, updatedAt: 8 },
                { id: 'msg-3', role: 'assistant', content: 'new thought', createdAt: 3, updatedAt: 9 },
              ],
            },
          },
        },
        profileB: {
          id: 'profileB',
          name: 'New profile',
          currentSessionId: '',
          createdAt: 5,
          updatedAt: 5,
          sessions: {},
        },
      },
    }

    fetchMock.mockResolvedValueOnce(remoteSnapshot)
    fetchMock.mockResolvedValue(undefined)

    const merged = await chatRepository.syncPull(localSnapshot)

    expect(merged.currentProfileId).toBe('profileA')
    const profile = merged.profiles.profileA
    expect(profile).toMatchObject({
      name: 'Remote',
      currentSessionId: 'sessionA',
      updatedAt: 10,
    })
    const session = profile.sessions.sessionA
    expect(session).toMatchObject({
      title: 'Session A remote',
      charCount: 30,
      updatedAt: 10,
    })
    expect(session.messages).toHaveLength(3)
    expect(session.messages[1]).toMatchObject({ id: 'msg-2', content: 'remote answer', updatedAt: 8 })
    expect(session.messages[2]).toMatchObject({ id: 'msg-3', content: 'new thought' })
    expect(merged.profiles.profileB).toBeDefined()

    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/chats', { method: 'GET' })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/chats', { method: 'PUT', body: merged })
  })

  it('preserves concurrent offline/remote messages in chronological order', async () => {
    vi.useFakeTimers()
    const local: DirectorySnapshot = {
      currentProfileId: 'p1',
      profiles: {
        p1: {
          id: 'p1',
          name: 'Local',
          currentSessionId: 's1',
          createdAt: 1,
          updatedAt: 5,
          sessions: {
            s1: {
              id: 's1',
              title: 'Session',
              provider: 'openai',
              model: 'gpt-4o',
              createdAt: 1,
              updatedAt: 5,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 10,
              messages: [
                { id: 'm1', role: 'user', content: 'hey', createdAt: 1, updatedAt: 1 },
                { id: 'm-local', role: 'assistant', content: 'local draft', createdAt: 4, updatedAt: 4 },
              ],
            },
          },
        },
      },
    }

    const remote: DirectorySnapshot = {
      currentProfileId: 'p1',
      profiles: {
        p1: {
          id: 'p1',
          name: 'Remote',
          currentSessionId: 's1',
          createdAt: 1,
          updatedAt: 6,
          sessions: {
            s1: {
              id: 's1',
              title: 'Session remote',
              provider: 'openai',
              model: 'gpt-4o',
              createdAt: 1,
              updatedAt: 6,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 14,
              messages: [
                { id: 'm1', role: 'user', content: 'hey', createdAt: 1, updatedAt: 1 },
                { id: 'm-remote', role: 'assistant', content: 'remote reply', createdAt: 5, updatedAt: 5 },
              ],
            },
          },
        },
      },
    }

    fetchMock.mockResolvedValueOnce(remote)
    fetchMock.mockResolvedValue(undefined)

    const merged = await chatRepository.syncPull(local)
    const messages = merged.profiles.p1.sessions.s1.messages

    expect(messages.map(m => m.id)).toEqual(['m1', 'm-local', 'm-remote'])
    expect(messages[1]).toMatchObject({ id: 'm-local', content: 'local draft' })
    expect(messages[2]).toMatchObject({ id: 'm-remote', content: 'remote reply' })
  })

  it('clears current session when remote snapshot removes the session', async () => {
    vi.useFakeTimers()
    const local: DirectorySnapshot = {
      currentProfileId: 'p1',
      profiles: {
        p1: {
          id: 'p1',
          name: 'Local',
          currentSessionId: 's1',
          createdAt: 1,
          updatedAt: 5,
          sessions: {
            s1: {
              id: 's1',
              title: 'Session',
              provider: 'openai',
              model: 'gpt-4o',
              createdAt: 1,
              updatedAt: 5,
              cappedByCount: false,
              cappedByChars: false,
              charCount: 10,
              messages: [],
            },
          },
        },
      },
    }

    const remote: DirectorySnapshot = {
      currentProfileId: 'p1',
      profiles: {
        p1: {
          id: 'p1',
          name: 'Remote',
          currentSessionId: '',
          createdAt: 1,
          updatedAt: 8,
          sessions: {},
        },
      },
    }

    fetchMock.mockResolvedValueOnce(remote)
    fetchMock.mockResolvedValue(undefined)

    const merged = await chatRepository.syncPull(local)
    expect(Object.keys(merged.profiles.p1.sessions)).toEqual(['s1'])
    expect(merged.profiles.p1.currentSessionId).toBe('')
  })

  it('returns local snapshot untouched when remote fetch fails', async () => {
    const local: DirectorySnapshot = {
      currentProfileId: 'p1',
      profiles: {
        p1: {
          id: 'p1',
          name: 'Local only',
          currentSessionId: '',
          createdAt: 1,
          updatedAt: 1,
          sessions: {},
        },
      },
    }

    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const merged = await chatRepository.syncPull(local)

    expect(merged).toEqual(local)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

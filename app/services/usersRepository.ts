import type { PublicUser } from 'db/types'

export interface UsersRepository {
  list: () => Promise<PublicUser[]>
  create: (payload: { email: string, name?: string }) => Promise<PublicUser>
}

export function createUsersRepository(base = ''): UsersRepository {
  return {
    list: () => $fetch<PublicUser[]>(`${base}/api/v1/users`),
    create: payload => $fetch<PublicUser>(`${base}/api/v1/users`, { method: 'POST', body: payload }),
  }
}

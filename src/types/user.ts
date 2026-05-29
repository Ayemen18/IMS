import type { RoleKey } from './role'

export type UserStatus = 'active' | 'invited' | 'disabled'

export interface UserSite {
  id: string
  name: string
}

export interface UserActivityEvent {
  id: string
  /** ISO timestamp */
  at: string
  /** Short verb describing the action */
  verb: string
  /** Optional target the action operated on */
  target?: string
  /** Optional contextual note */
  context?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: RoleKey
  status: UserStatus
  sites: UserSite[]
  /** ISO timestamp of last active session, or null if never */
  lastActiveAt: string | null
  /** ISO timestamp of when the user record was created */
  joinedAt: string
  /** Optional title / position label shown on detail page */
  title?: string
  /** Optional phone */
  phone?: string
  /** Activity log for the detail page */
  activity: UserActivityEvent[]
}

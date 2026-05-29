import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Role, RoleKey } from '../types/role'
import { ROLES } from './roles'

export interface CurrentUser {
  role: RoleKey
  email: string
  name: string
  initials: string
  signedInAt: string // ISO timestamp
}

interface SessionContextValue {
  user: CurrentUser | null
  signInAs: (role: Role) => CurrentUser
  signInWithCredentials: (email: string, _password: string) => CurrentUser | null
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  signInAs: () => ({ role: 'admin', email: '', name: '', initials: '', signedInAt: '' }),
  signInWithCredentials: () => null,
  signOut: () => {},
})

const STORAGE_KEY = 'ims-session'

function deriveName(role: Role): string {
  return role.demoName
}

function deriveInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored) as CurrentUser
      // sanity check
      if (parsed && parsed.role && parsed.email) return parsed
      return null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [user])

  const signInAs = (role: Role): CurrentUser => {
    const name = deriveName(role)
    const next: CurrentUser = {
      role: role.key,
      email: role.email,
      name,
      initials: deriveInitials(name),
      signedInAt: new Date().toISOString(),
    }
    setUser(next)
    return next
  }

  /** Real login. Matches email against ROLES list. Password is ignored in demo. */
  const signInWithCredentials = (email: string, _password: string): CurrentUser | null => {
    const normalized = email.trim().toLowerCase()
    const match = ROLES.find((r) => r.email.toLowerCase() === normalized)
    if (!match) return null
    return signInAs(match)
  }

  const signOut = () => setUser(null)

  return (
    <SessionContext.Provider value={{ user, signInAs, signInWithCredentials, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}

/** Convenience hook: returns the current Role object, or null. */
export function useCurrentRole(): Role | null {
  const { user } = useSession()
  if (!user) return null
  return ROLES.find((r) => r.key === user.role) ?? null
}

import { useLocation } from 'react-router-dom'
import { Wordmark } from '../primitives/Wordmark'
import { ThemeToggle } from '../primitives/ThemeToggle'
import { Icon } from '../primitives/Icon'
import { useNav } from '../../lib/router'
import { useSession } from '../../lib/session'
import { ROLES } from '../../lib/roles'

interface Tab {
  label: string
  path: string
  matchPrefix: string
  hideWhenSignedIn?: boolean
}

const ALL_TABS: Tab[] = [
  { label: 'Landing',   path: '/',          matchPrefix: '/'          },
  { label: 'Login',     path: '/login',     matchPrefix: '/login',    hideWhenSignedIn: true },
  { label: 'Dashboard', path: '/admin',     matchPrefix: '/admin'     },
]

function isActive(currentPath: string, tab: Tab): boolean {
  if (tab.path === '/') return currentPath === '/' || currentPath === ''
  return currentPath.startsWith(tab.matchPrefix)
}

export function PrototypeBar() {
  const nav = useNav()
  const location = useLocation()
  const { user, signOut } = useSession()
  const role = user ? ROLES.find((r) => r.key === user.role) : null

  const tabs = ALL_TABS.filter((t) => !(t.hideWhenSignedIn && user))

  return (
    <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-ink-900/70 border-b hairline">
      <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => nav.push('/')}
            className="hover:opacity-80 transition-opacity"
          >
            <Wordmark variant="small" />
          </button>
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {tabs.map((t) => (
              <button
                key={t.path}
                onClick={() => nav.push(t.path)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                  isActive(location.pathname, t)
                    ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && role ? (
            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md border hairline">
              <div className={`w-4 h-4 rounded-sm ${role.accent}`} />
              <span className="text-[11px] font-mono text-ink-700 dark:text-ink-200">
                {role.shortLabel}
              </span>
              <button
                onClick={() => {
                  signOut()
                  nav.push('/login')
                }}
                className="text-[10px] text-ink-400 hover:text-ink-900 dark:hover:text-ink-50 transition-colors ml-1"
                title="Sign out"
              >
                <Icon name="close" className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="hidden md:inline text-[11px] text-ink-400 dark:text-ink-500 font-mono">
              v0.1 · preview
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

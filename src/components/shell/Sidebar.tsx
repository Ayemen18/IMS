import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../primitives/Icon'
import { useSession, useCurrentRole } from '../../lib/session'
import { useNav } from '../../lib/router'
import { DASHBOARD_NAV } from '../../lib/dashboardNav'
import { Avatar } from '../primitives/Avatar'
import type { RoleKey } from '../../types/role'

interface SidebarProps {
  activeItem?: string
  onSelectItem?: (key: string) => void
}

const ROLE_URL_PREFIX: Record<RoleKey, string> = {
  admin:              '/admin',
  quality_manager:    '/qm',
  safety_manager:     '/sm',
  quality_inspector:  '/qi',
  safety_inspector:   '/si',
  employee:           '/emp',
  top_management:     '/exec',
}

function keyToPath(roleKey: RoleKey, navKey: string): string {
  const prefix = ROLE_URL_PREFIX[roleKey] ?? '/'
  if (navKey === 'overview') return prefix
  return `${prefix}/${navKey}`
}

function pathToNavKey(roleKey: RoleKey, path: string): string {
  const prefix = ROLE_URL_PREFIX[roleKey] ?? '/'
  if (path === prefix || path === `${prefix}/`) return 'overview'
  const stripped = path.replace(new RegExp(`^${prefix}/?`), '')
  return stripped.split('/')[0] || 'overview'
}

export function Sidebar({ activeItem, onSelectItem }: SidebarProps) {
  const { user, signOut } = useSession()
  const role = useCurrentRole()
  const nav = useNav()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  if (!user || !role) return null
  const sections = DASHBOARD_NAV[role.key]

  const resolvedActive = activeItem ?? pathToNavKey(role.key, location.pathname)

  const handleSelect = (key: string) => {
    nav.push(keyToPath(role.key, key))
    if (onSelectItem) onSelectItem(key)
  }

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-text-secondary/10 bg-white sticky top-[72px] h-[calc(100vh-72px)] z-20">
      {/* Workspace card dropdown */}
      <div className="px-4 py-5 border-b border-text-secondary/10">
        <button
          onClick={() => {
            signOut()
            nav.push('/login')
          }}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent-light transition text-left group"
          title="Switch workspace"
        >
          <div className="w-8 h-8 rounded bg-warning/20 border border-warning/40 flex items-center justify-center shrink-0">
            <span className="font-sans text-[14px] font-bold text-text-primary">
              {role.label.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.12em] text-text-secondary leading-tight">
              Workspace
            </div>
            <div className="text-[13px] font-semibold text-text-primary truncate leading-snug mt-0.5">
              {role.label}
            </div>
          </div>
          <Icon name="chevron_down" className="w-4 h-4 text-text-secondary shrink-0 group-hover:text-text-primary transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em] font-bold text-text-secondary">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = resolvedActive === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    className={`w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition relative ${ isActive ? 'bg-warning/15 text-text-primary font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-accent-light' }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-warning rounded-r-full"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      name={item.icon}
                      className={`w-5 h-5 shrink-0 transition-colors ${ isActive ? 'text-warning' : 'text-text-secondary' }`}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count && (
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.5 rounded transition ${ isActive ? 'bg-primary/10 text-primary' : 'bg-text-secondary/10 text-text-secondary group-hover:bg-text-secondary/15' }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="relative border-t border-text-secondary/10 px-3 py-3">
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-text-secondary/10 bg-white shadow-lift overflow-hidden animate-fade-in z-20">
            <button
              onClick={() => {
                setUserMenuOpen(false)
                signOut()
                nav.push('/login')
              }}
              className="w-full px-3 py-2.5 text-left text-[12px] text-text-secondary hover:bg-accent-light transition-colors flex items-center gap-2 font-medium"
            >
              <Icon name="close" className="w-3.5 h-3.5 text-text-secondary" />
              Sign out
            </button>
          </div>
        )}
        <button
          onClick={() => setUserMenuOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent-light transition text-left"
        >
          <Avatar name={user.name} size="w-8 h-8 text-[11px]" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-text-primary truncate">
              {user.name}
            </div>
            <div className="text-[11px] font-mono text-text-secondary truncate leading-none mt-0.5">
              {user.email}
            </div>
          </div>
          <Icon name="chevron_down" className="w-3.5 h-3.5 text-text-secondary shrink-0" />
        </button>
      </div>
    </aside>
  )
}

import { useState, useEffect } from 'react'
import { Icon } from '../components/primitives/Icon'
import { StatusPill } from '../components/primitives/StatusPill'
import { useNav } from '../lib/router'
import { useSession } from '../lib/session'
import { ROLES } from '../lib/roles'
import type { Role } from '../types/role'

/**
 * Demo password used for all role tiles. In production this whole tile UI
 * would be removed and only the form would remain.
 */
const DEMO_PASSWORD = 'qmics-demo-2026'

export function RoleSwitcher() {
  const nav = useNav()
  const { signInWithCredentials } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<Role | null>(null)

  const active = hovered ?? ROLES[0]

  /** Auto-fill credentials from a clicked role tile. Does NOT submit. */
  const fillFromRole = (role: Role) => {
    setEmail(role.email)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    const user = signInWithCredentials(email, password)
    if (!user) {
      setError('No workspace matches that email.')
      return
    }
    nav.push(user.role === 'admin' ? '/admin' : '/dashboard')
  }

  // Clear error as soon as user starts typing
  useEffect(() => {
    if (error && (email || password)) setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password])

  return (
    <div className="min-h-[calc(100vh-48px)] relative overflow-hidden bg-ink-50 dark:bg-ink-900">
      <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

      <div className="relative max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-12 gap-10">
          {/* ============ LEFT: login form ============ */}
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-24 stagger">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border hairline bg-white/60 dark:bg-ink-800/60 backdrop-blur-sm text-[11px] font-medium text-ink-600 dark:text-ink-300">
                <Icon name="sparkle" className="w-3 h-3 text-accent-500" />
                Sign in · or pick a demo role
              </div>

              <h1 className="mt-6 font-display text-[52px] lg:text-[64px] leading-[0.95] tracking-tight text-ink-900 dark:text-ink-50">
                Welcome to <span className="italic text-ink-500 dark:text-ink-400">InspectSphere.</span>
              </h1>

              <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-ink-600 dark:text-ink-300">
                Sign in with your work credentials, or click any role on the right to load demo
                credentials and explore that workspace.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2"
                  >
                    Work email
                  </label>
                  <div className="relative">
                    <Icon
                      name="mail"
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="focus-ring w-full pl-10 pr-3 py-3 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[14px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[11px] text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Icon
                      name="lock"
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                    />
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="focus-ring w-full pl-10 pr-10 py-3 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[14px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      <Icon name={showPw ? 'eye_off' : 'eye'} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-[12px] text-signal-red flex items-center gap-2 animate-fade-in">
                    <Icon name="alert" className="w-3.5 h-3.5" />
                    {error}
                  </div>
                )}

                <label className="flex items-center gap-2 text-[12px] text-ink-600 dark:text-ink-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-ink-300 dark:border-ink-600 accent-ink-900 dark:accent-ink-50"
                  />
                  Keep me signed in on this device
                </label>

                <button
                  type="submit"
                  className="btn-primary relative overflow-hidden w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-accent-500 text-white text-[14px] font-medium hover:bg-accent-600 transition-colors"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Login
                    <Icon name="arrow_right" className="w-4 h-4" />
                  </span>
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-brand-yellow-500" aria-hidden="true" />
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t hairline" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="px-3 bg-ink-50 dark:bg-ink-900 text-ink-400 dark:text-ink-500">
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 text-[13px] font-medium hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
                >
                  Sign in with company SSO
                </button>
              </form>
            </div>
          </div>

          {/* ============ RIGHT: role tiles ============ */}
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400">
                  Demo workspaces
                </div>
                <p className="mt-2 text-[13px] text-ink-600 dark:text-ink-300 max-w-[440px]">
                  Click any role to auto-fill credentials, then press Login.
                </p>
              </div>
              <div className="text-[11px] font-mono text-ink-400 dark:text-ink-500">
                {String(ROLES.length).padStart(2, '0')} roles
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
              {ROLES.map((r, i) => {
                const isSelected = email === r.email
                return (
                  <button
                    key={r.key}
                    type="button"
                    onMouseEnter={() => setHovered(r)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => fillFromRole(r)}
                    className={`group text-left rounded-xl border p-5 transition-all bg-white dark:bg-ink-800 ${
                      isSelected
                        ? 'border-ink-900 dark:border-ink-50 shadow-sm -translate-y-0.5'
                        : 'border-black/[0.06] dark:border-white/[0.08] hover:border-ink-400 dark:hover:border-ink-500 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-md ${r.accent} flex items-center justify-center text-white dark:text-ink-900`}
                      >
                        <Icon name={r.glyph} className="w-[18px] h-[18px]" />
                      </div>
                      {isSelected ? (
                        <span className="font-mono text-[10px] text-ink-900 dark:text-ink-50 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse-dot" />
                          selected
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-ink-400 dark:text-ink-500 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="mt-6">
                      <div className="text-[15px] font-medium text-ink-900 dark:text-ink-50 tracking-tight">
                        {r.label}
                      </div>
                      <div className="mt-0.5 text-[11px] font-mono text-ink-500 dark:text-ink-400 truncate">
                        {r.email}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">
                      <span>{isSelected ? 'Credentials loaded' : 'Use these credentials'}</span>
                      <Icon
                        name="arrow_right"
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Hovered-role context strip — small, doesn't fight for attention */}
            <div className="mt-6 rounded-lg border hairline border-dashed bg-white/40 dark:bg-ink-800/30 p-4 text-[12px] text-ink-600 dark:text-ink-300 leading-relaxed flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-md ${active.accent} flex items-center justify-center text-white dark:text-ink-900 shrink-0`}
              >
                <Icon name={active.glyph} className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-ink-900 dark:text-ink-50">{active.label}</div>
                <div className="mt-0.5">{active.description}.</div>
              </div>
              <StatusPill tone="neutral">demo</StatusPill>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

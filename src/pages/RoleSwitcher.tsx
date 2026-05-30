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
    <div className="min-h-[calc(100vh-48px)] relative overflow-hidden bg-accent-light">
      <div className="absolute inset-0 bg-grid-light opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

      <div className="relative max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-12 gap-10">
          {/* ============ LEFT: login form ============ */}
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-24 stagger">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border hairline bg-white/60 backdrop-blur-sm text-[11px] font-medium text-text-secondary">
                <Icon name="sparkle" className="w-3 h-3 text-primary" />
                Sign in · or pick a demo role
              </div>

              <h1 className="mt-6 font-sans font-bold text-[52px] lg:text-[64px] leading-[0.95] tracking-tight text-text-primary">
                Welcome to <span className="italic text-text-secondary">InspectSphere.</span>
              </h1>

              <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-text-secondary">
                Sign in with your work credentials, or click any role on the right to load demo
                credentials and explore that workspace.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2"
                  >
                    Work email
                  </label>
                  <div className="relative">
                    <Icon
                      name="mail"
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="focus-ring w-full pl-10 pr-3 py-3 rounded-md border border-text-secondary/15 bg-white text-[14px] text-text-primary placeholder:text-text-secondary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Icon
                      name="lock"
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    />
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="focus-ring w-full pl-10 pr-10 py-3 rounded-md border border-text-secondary/15 bg-white text-[14px] text-text-primary placeholder:text-text-secondary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      <Icon name={showPw ? 'eye_off' : 'eye'} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-[12px] text-status-fail flex items-center gap-2 animate-fade-in">
                    <Icon name="alert" className="w-3.5 h-3.5" />
                    {error}
                  </div>
                )}

                <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-text-secondary/15 accent-primary"
                  />
                  Keep me signed in on this device
                </label>

                <button
                  type="submit"
                  className="btn-primary relative overflow-hidden w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-primary text-white text-[14px] font-medium hover:bg-primary transition-colors"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Login
                    <Icon name="arrow_right" className="w-4 h-4" />
                  </span>
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-warning" aria-hidden="true" />
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t hairline" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="px-3 bg-accent-light text-text-secondary">
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-text-secondary/15 bg-white text-text-primary text-[13px] font-medium hover:bg-accent-light transition-colors"
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
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
                  Demo workspaces
                </div>
                <p className="mt-2 text-[13px] text-text-secondary max-w-[440px]">
                  Click any role to auto-fill credentials, then press Login.
                </p>
              </div>
              <div className="text-[11px] font-mono text-text-secondary">
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
                    className={`group text-left rounded-xl border p-5 transition-all bg-white relative overflow-hidden ${ isSelected ? 'border-text-secondary/15 shadow-soft -translate-y-0.5' : 'border-black/[0.06] hover:border-text-secondary/15 hover:shadow-soft hover:-translate-y-0.5' }`}
                  >
                    {(isSelected || hovered?.key === r.key) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
                    )}
                    <div className="pl-2">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-10 h-10 rounded-md ${r.accent} flex items-center justify-center text-white `}
                        >
                          <Icon name={r.glyph} className="w-[18px] h-[18px]" />
                        </div>
                        {isSelected ? (
                          <span className="font-mono text-[10px] text-text-primary inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-pass animate-pulse-dot" />
                            selected
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-text-secondary group-hover:text-text-primary transition-colors">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <div className="mt-6">
                        <div className="text-[15px] font-medium text-text-primary tracking-tight">
                          {r.label}
                        </div>
                        <div className="mt-0.5 text-[11px] font-mono text-text-secondary truncate">
                          {r.email}
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between text-[12px] text-text-secondary group-hover:text-text-primary transition-colors">
                        <span>{isSelected ? 'Credentials loaded' : 'Use these credentials'}</span>
                        <Icon
                          name="arrow_right"
                          className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Hovered-role context strip — small, doesn't fight for attention */}
            <div className="mt-6 rounded-lg border hairline border-dashed bg-white/40 p-4 text-[12px] text-text-secondary leading-relaxed flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-md ${active.accent} flex items-center justify-center text-white shrink-0`}
              >
                <Icon name={active.glyph} className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-text-primary">{active.label}</div>
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

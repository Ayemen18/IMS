import { useLocation } from 'react-router-dom'
import { useSession } from '../../lib/session'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { KpiStrip, type Kpi } from '../../components/dashboard/KpiStrip'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'
import { SitesRouter } from './admin/SitesRouter'
import { SettingsPage } from './admin/SettingsPage'

export function AdminDashboard() {
  const location = useLocation()
  // /admin/users → users; /admin → overview
  const cleaned = location.pathname.replace(/^\/admin\/?/, '').split('/')[0]
  const activeFromUrl = cleaned || 'overview'

  return (
    <DashboardShell
      defaultItem={activeFromUrl}
      primaryActionLabel="Invite user"
    >
      {(activeItem) => {
        // Prefer URL-derived active item over shell's internal state
        const effectiveItem = activeFromUrl !== 'overview' ? activeFromUrl : activeItem
        if (effectiveItem === 'organization') {
          return <SitesRouter />
        }
        if (effectiveItem === 'settings') {
          return <SettingsPage />
        }
        if (effectiveItem !== 'overview') {
          return <PlaceholderSection itemKey={effectiveItem} />
        }
        return <OverviewSection />
      }}
    </DashboardShell>
  )
}

/* ============================================================
 * Overview section — the real content
 * ============================================================ */

function OverviewSection() {
  const { user } = useSession()
  const greeting = greetByHour()

  return (
    <div className="stagger">
      {/* ============ Hero greeting + priority strip ============ */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>System Admin</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Overview</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            {greeting}, <span className="italic text-ink-500 dark:text-ink-400">{firstName(user?.name)}</span>.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            Three configuration changes need your attention this week.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
              <Icon name="calendar" className="w-3.5 h-3.5" />
              Last 7 days
              <Icon name="chevron_down" className="w-3.5 h-3.5" />
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Attention card — the differentiation move */}
        <div className="col-span-12 lg:col-span-5">
          <div className="h-full rounded-xl border hairline bg-white dark:bg-ink-900 p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
                Needs your attention
              </div>
              <StatusPill tone="amber">3 items</StatusPill>
            </div>
            <div className="mt-4 space-y-2.5 flex-1">
              {ATTENTION.map((a, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-3 cursor-pointer p-2 -mx-2 rounded-md hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
                >
                  <div
                    className={`mt-1 w-1 h-1 rounded-full shrink-0 ${
                      a.tone === 'red' ? 'bg-signal-red' : 'bg-signal-amber'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-900 dark:text-ink-50">
                      {a.title}
                    </div>
                    <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">
                      {a.context}
                    </div>
                  </div>
                  <Icon
                    name="chevron_right"
                    className="w-3.5 h-3.5 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ KPI strip ============ */}
      <div className="mt-8">
        <KpiStrip kpis={ADMIN_KPIS} />
      </div>

      {/* ============ Two-column content ============ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
          <div className="px-5 py-4 border-b hairline flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Recent activity</div>
              <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5">Across users, templates, and configuration</div>
            </div>
            <button className="inline-flex items-center gap-1.5 text-[12px] text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
              <Icon name="filter" className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
          <div className="divide-y hairline">
            {ACTIVITY.map((row, i) => (
              <div
                key={i}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors cursor-pointer group"
              >
                <div className="font-mono text-[10px] text-ink-400 dark:text-ink-500 w-16 shrink-0">
                  {row.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-ink-900 dark:text-ink-50 truncate">
                    <span className="font-medium">{row.actor}</span>{' '}
                    <span className="text-ink-500 dark:text-ink-400">{row.verb}</span>{' '}
                    <span className="font-mono text-ink-700 dark:text-ink-200">{row.target}</span>
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                    {row.context}
                  </div>
                </div>
                <StatusPill tone={row.tone}>{row.label}</StatusPill>
                <span className="hidden sm:inline text-[11px] font-mono text-ink-400 dark:text-ink-500 w-12 text-right shrink-0">
                  {row.when}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t hairline">
            <button className="text-[12px] text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 inline-flex items-center gap-1 transition-colors">
              View full audit log
              <Icon name="arrow_right" className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* System health */}
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">System health</div>
              <StatusPill tone="green">All systems go</StatusPill>
            </div>
            <div className="mt-5 space-y-3">
              {HEALTH.map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-700 dark:text-ink-200">{m.label}</span>
                    <span
                      className={`font-mono ${
                        m.tone === 'green'
                          ? 'text-signal-green'
                          : m.tone === 'amber'
                          ? 'text-signal-amber'
                          : 'text-signal-red'
                      }`}
                    >
                      {m.value}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.tone === 'green'
                          ? 'bg-signal-green'
                          : m.tone === 'amber'
                          ? 'bg-signal-amber'
                          : 'bg-signal-red'
                      }`}
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Quick actions</div>
            </div>
            <div className="divide-y hairline">
              {QUICK_ACTIONS.map((a, i) => (
                <button
                  key={i}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group text-left"
                >
                  <div className="w-7 h-7 rounded-md border hairline flex items-center justify-center text-ink-700 dark:text-ink-200 group-hover:bg-ink-900 group-hover:text-ink-50 dark:group-hover:bg-ink-50 dark:group-hover:text-ink-900 transition-colors">
                    <Icon name={a.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-900 dark:text-ink-50">{a.label}</div>
                    <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">{a.hint}</div>
                  </div>
                  <Icon
                    name="arrow_right"
                    className="w-3.5 h-3.5 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Placeholder for non-Overview nav items
 * ============================================================ */
function PlaceholderSection({ itemKey }: { itemKey: string }) {
  return (
    <div className="stagger">
      <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
        <span>System Admin</span>
        <Icon name="chevron_right" className="w-3 h-3" />
        <span className="text-ink-900 dark:text-ink-50 capitalize">{itemKey.replace(/_/g, ' ')}</span>
      </div>
      <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
        <span className="capitalize">{itemKey.replace(/_/g, ' ')}</span>
      </h1>
      <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300 max-w-[520px]">
        This module is part of the Admin deep build coming in the next step. Click Overview in the sidebar to return.
      </p>
      <div className="mt-10 rounded-xl border hairline border-dashed bg-white/50 dark:bg-ink-900/40 p-12 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
          Coming soon
        </div>
        <div className="mt-2 font-display text-[28px] leading-tight tracking-tight text-ink-700 dark:text-ink-200">
          Module wireframe pending.
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Helpers + data — local to this file for now
 * ============================================================ */

function greetByHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(name: string | undefined): string {
  if (!name) return 'there'
  return name.split(/\s+/)[0]
}

const ATTENTION: { title: string; context: string; tone: 'red' | 'amber' }[] = [
  {
    title: 'Sterilab India SSO certificate expires in 6 days',
    context: 'Identity · Renew before May 26',
    tone: 'red',
  },
  {
    title: '4 new GMP inspectors await access provisioning',
    context: 'Users & roles · Mumbai site',
    tone: 'amber',
  },
  {
    title: 'Template "HACCP CCP daily" pending Q.Manager approval',
    context: 'Master data · 2 days in queue',
    tone: 'amber',
  },
]

const ADMIN_KPIS: Kpi[] = [
  { label: 'Active users',     value: '247', delta: '+12',  deltaTone: 'green', progress: 78, progressTone: 'neutral' },
  { label: 'Templates live',   value: '34',  delta: '+3',   deltaTone: 'green', progress: 62, progressTone: 'neutral' },
  { label: 'Sites configured', value: '6',   delta: '+1',   deltaTone: 'green', progress: 86, progressTone: 'neutral' },
  { label: 'Pending invites',  value: '4',   delta: '+2',   deltaTone: 'amber', progress: 14, progressTone: 'amber'   },
]

const ACTIVITY: {
  id: string
  actor: string
  verb: string
  target: string
  context: string
  tone: 'green' | 'amber' | 'red' | 'neutral'
  label: string
  when: string
}[] = [
  { id: 'EVT-1294', actor: 'R. Iyer',   verb: 'invited',   target: 'priya.shah@helix.io',    context: 'Quality Inspector · Pune',         tone: 'amber',   label: 'Pending', when: '8m'  },
  { id: 'EVT-1293', actor: 'M. Chen',   verb: 'updated',   target: 'Template/HACCP-CCP-002', context: 'Added 3 parameters',               tone: 'green',   label: 'Saved',   when: '21m' },
  { id: 'EVT-1292', actor: 'System',    verb: 'rotated',   target: 'SSO certificate',        context: 'Mumbai · auto-rotated',            tone: 'green',   label: 'Healthy', when: '1h'  },
  { id: 'EVT-1291', actor: 'A. Sharma', verb: 'disabled',  target: 'kavya.r@northvale.io',   context: 'Inactive 90 days · policy',        tone: 'neutral', label: 'Archived', when: '3h' },
  { id: 'EVT-1290', actor: 'R. Iyer',   verb: 'created',   target: 'Site/Hyderabad-Packing', context: 'Department added: Cold storage',   tone: 'green',   label: 'Live',    when: '5h'  },
  { id: 'EVT-1289', actor: 'M. Chen',   verb: 'archived',  target: 'Template/GMP-2019-old',  context: 'Superseded · ref GMP-2024',        tone: 'neutral', label: 'Archived', when: '8h' },
]

const HEALTH = [
  { label: 'Uptime (30d)',          value: '99.98%', percent: 99.98, tone: 'green'  as const },
  { label: 'Auth latency (p95)',    value: '142ms',  percent: 86,    tone: 'green'  as const },
  { label: 'Storage utilization',   value: '63%',    percent: 63,    tone: 'amber'  as const },
  { label: 'Background job lag',    value: 'normal', percent: 100,   tone: 'green'  as const },
]

const QUICK_ACTIONS: { label: string; hint: string; icon: 'plus' | 'file' | 'users' | 'settings' }[] = [
  { label: 'Invite user',          hint: 'Send a workspace invitation',  icon: 'users'    },
  { label: 'New template',         hint: 'Start from a blank checklist', icon: 'file'     },
  { label: 'Add inspection type',  hint: 'GMP, HACCP, custom',           icon: 'plus'     },
  { label: 'Notification rule',    hint: 'Configure alerts',             icon: 'settings' },
]

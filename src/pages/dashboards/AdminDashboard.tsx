import { useLocation } from 'react-router-dom'
import { useSession } from '../../lib/session'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { KpiStrip, type Kpi } from '../../components/dashboard/KpiStrip'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'
import { SitesRouter } from './admin/SitesRouter'
import { SettingsPage } from './admin/SettingsPage'
import { PageBanner } from '../../components/shell/PageBanner'

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
  const attentionItems = ATTENTION

  return (
    <div className="space-y-6">
      <PageBanner
        title={`${greeting}, ${firstName(user?.name)}.`}
        subline="Three configuration changes need your attention this week."
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              Audit log
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm">
              + Invite user
            </button>
          </>
        }
      />

      {/* Attention banner */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
            Needs your attention
          </div>
          <span className="inline-flex items-center gap-1 bg-warning/15 text-warning text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ring-warning/30">
            3 items
          </span>
        </div>
        <div className="space-y-3">
          {attentionItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-3 rounded-xl border border-text-secondary/15 hover:bg-accent-light transition cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${ item.tone === 'red' ? 'bg-status-fail' : 'bg-warning' }`}
                />
                <div>
                  <div className="text-[14px] font-semibold text-text-primary">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-text-secondary mt-0.5">
                    {item.context}
                  </div>
                </div>
              </div>
              <Icon name="chevron_right" className="w-4 h-4 text-text-secondary mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip kpis={ADMIN_KPIS} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
          <div className="px-6 py-5 border-b border-text-secondary/15 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                Recent activity
              </div>
              <div className="mt-1 text-[18px] font-bold text-text-primary">
                Across users, templates, and configuration
              </div>
            </div>
          </div>
          <div className="divide-y divide-text-secondary/15">
            {ACTIVITY.map((row) => (
              <div
                key={row.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-accent-light transition cursor-pointer"
              >
                <div className="font-mono text-[13px] text-text-secondary w-20 shrink-0">
                  {row.id}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-[14px] font-semibold text-text-primary truncate">
                    {row.actor} <span className="text-[13px] font-normal text-text-secondary">{row.verb}</span>{' '}
                    <span className="font-mono text-[13px] text-primary">{row.target}</span>
                  </div>
                  <div className="text-[12px] text-text-secondary mt-0.5 truncate">
                    {row.context}
                  </div>
                </div>
                <StatusPill tone={row.tone}>{row.label}</StatusPill>
                <div className="font-mono text-[13px] text-text-secondary w-12 text-right shrink-0">
                  {row.when}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <SystemHealthPanel metrics={HEALTH} />
          
          {/* Quick Actions */}
          <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
            <div className="px-6 py-5 border-b border-text-secondary/15">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                Quick actions
              </div>
              <div className="mt-1 text-[18px] font-bold text-text-primary">
                System controls
              </div>
            </div>
            <div className="divide-y divide-text-secondary/15">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent-light transition group text-left"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary">
                      {a.label}
                    </div>
                    <div className="text-[12px] text-text-secondary mt-0.5">
                      {a.hint}
                    </div>
                  </div>
                  <Icon name="arrow_right" className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition-transform" />
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
    <div className="space-y-6">
      <PageBanner
        title={itemKey.replace(/_/g, ' ')}
        subline={`Configuration segment for ${itemKey.replace(/_/g, ' ')}`}
      />
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-12 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
          Coming soon
        </div>
        <div className="text-[18px] font-bold text-text-primary">
          Module is currently being developed.
        </div>
        <p className="mt-2 text-[13px] text-text-secondary max-w-[360px] mx-auto">
          Please click on Overview in the sidebar to return to the active system dashboard.
        </p>
      </div>
    </div>
  )
}

function SystemHealthPanel({ metrics }: { metrics: any[] }) {
  return (
    <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
            System health
          </div>
          <div className="mt-1 text-[18px] font-bold text-text-primary">
            All systems go
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-pass/10 text-status-pass text-[11px] font-bold uppercase tracking-wide ring-1 ring-status-pass/20">
          <span className="w-1.5 h-1.5 rounded-full bg-status-pass animate-pulse" />
          Healthy
        </span>
      </div>
      
      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-[13px] text-text-secondary">{m.label}</div>
              <div className="font-mono text-[13px] font-bold text-text-primary">{m.value}</div>
            </div>
            <div className="h-1.5 bg-accent-light rounded-full overflow-hidden">
              <div 
                className={`h-full ${m.tone === 'green' ? 'bg-status-pass' : m.tone === 'amber' ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${m.percent}%` }}
              />
            </div>
          </div>
        ))}
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

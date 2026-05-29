import { useCurrentRole } from '../../lib/session'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'

export function RoleDashboardPlaceholder() {
  const role = useCurrentRole()
  if (!role) return null

  return (
    <DashboardShell defaultItem="overview" primaryActionLabel="New inspection">
      {() => (
        <div className="stagger">
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>{role.label}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Overview</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            Welcome to the <span className="italic text-ink-500 dark:text-ink-400">{role.label}</span> workspace.
          </h1>
          <p className="mt-2 text-[14px] text-ink-600 dark:text-ink-300 max-w-[560px]">
            This role's dashboard is part of the next build step. The shell, navigation, and design system are already wired — what's coming is the role-specific content for {role.label.toLowerCase()}s.
          </p>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border hairline border-dashed bg-white/50 dark:bg-ink-900/40 p-12">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
                Reserved
              </div>
              <div className="mt-2 font-display text-[36px] leading-tight tracking-tight text-ink-700 dark:text-ink-200">
                Workspace content.
              </div>
              <div className="mt-2 text-[13px] text-ink-500 dark:text-ink-400 max-w-[420px]">
                KPIs, task lists, review queues, and activity feeds tailored for {role.label.toLowerCase()}s land here.
              </div>
            </div>
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Status</div>
                <StatusPill tone="neutral">Shell ready</StatusPill>
              </div>
              <ul className="mt-5 space-y-2.5 text-[12px]">
                {[
                  ['Sidebar nav', 'green'],
                  ['Topbar & search', 'green'],
                  ['Design tokens', 'green'],
                  ['Role-specific content', 'amber'],
                ].map(([label, tone], i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-ink-700 dark:text-ink-200">{label}</span>
                    <span
                      className={`text-[10px] font-mono uppercase ${
                        tone === 'green' ? 'text-signal-green' : 'text-signal-amber'
                      }`}
                    >
                      {tone === 'green' ? 'wired' : 'pending'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

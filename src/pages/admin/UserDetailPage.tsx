import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import { useUsers, formatRelativeTime, formatDate } from '../../lib/users'
import { ROLES } from '../../lib/roles'
import { Icon } from '../../components/primitives/Icon'
import { Avatar } from '../../components/primitives/Avatar'
import { StatusPill } from '../../components/primitives/StatusPill'
import { Modal } from '../../components/primitives/Modal'
import { PageBanner } from '../../components/shell/PageBanner'

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { getById, setStatus } = useUsers()
  const nav = useNav()
  const [confirmDisable, setConfirmDisable] = useState(false)

  const user = userId ? getById(userId) : undefined

  if (!user) {
    return (
      <div className="space-y-6">
        <BreadcrumbBack onBack={() => nav.push('/admin/users')} />
        <div className="rounded-2xl border border-dashed border-text-secondary/15 bg-white p-16 text-center shadow-soft max-w-[500px] mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-text-secondary/15 bg-accent-light/50 mb-4 animate-bounce">
            <Icon name="alert" className="w-5 h-5 text-status-fail" />
          </div>
          <h2 className="text-[15px] font-bold text-text-primary">
            User not found
          </h2>
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
            The user ID <span className="font-mono font-bold text-text-primary bg-accent-light px-1 py-0.5 rounded">{userId}</span> doesn't exist or has been removed.
          </p>
          <button
            onClick={() => nav.push('/admin/users')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white text-[12px] font-bold rounded-lg transition-all shadow-sm"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
            Back to users
          </button>
        </div>
      </div>
    )
  }

  const role = ROLES.find((r) => r.key === user.role)
  const statusTone =
    user.status === 'active'   ? 'green'
    : user.status === 'invited' ? 'amber'
    : 'neutral'
  const statusLabel =
    user.status === 'active'   ? 'Active'
    : user.status === 'invited' ? 'Invited'
    : 'Disabled'

  const toggleDisabled = () => {
    if (user.status === 'disabled') {
      setStatus(user.id, 'active')
    } else {
      setConfirmDisable(true)
    }
  }

  const reallyDisable = () => {
    setStatus(user.id, 'disabled')
    setConfirmDisable(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Row */}
      <div className="flex items-center justify-between">
        <BreadcrumbBack onBack={() => nav.push('/admin/users')} userName={user.name} />
        <div className="flex items-center gap-2">
          <Avatar name={user.name} size="w-7 h-7 text-[10px]" />
          <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
        </div>
      </div>

      {/* Page Banner with Action Slot */}
      <PageBanner
        title={user.name}
        subline={`${role ? role.label : ''} · ${user.email} ${user.title ? `· ${user.title}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {user.status === 'invited' && (
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm">
                <Icon name="mail" className="w-3.5 h-3.5" />
                Resend Invite
              </button>
            )}
            <button
              onClick={toggleDisabled}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm hover:bg-white/15"
            >
              <Icon name={user.status === 'disabled' ? 'check' : 'close'} className="w-3.5 h-3.5" />
              {user.status === 'disabled' ? 'Reactivate' : 'Disable'}
            </button>
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm">
              <Icon name="settings" className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        }
      />

      {/* ============ Stat row ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
        <Stat label="Last Active"  value={formatRelativeTime(user.lastActiveAt)} />
        <Stat label="Joined"       value={formatDate(user.joinedAt)} />
        <Stat label="Sites"        value={String(user.sites.length)} />
        <Stat label="User ID"      value={user.id} mono />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
          <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
            <div className="text-[13px] font-bold text-text-primary">Recent Activity</div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Logs of recent actions taken in the workspace
            </div>
          </div>
          {user.activity.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-text-secondary">
              No activity recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-text-secondary/15">
              {user.activity.map((event) => (
                <div key={event.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-accent-light/20 transition-colors">
                  <div className="font-mono text-[10px] text-text-secondary w-16 shrink-0 pt-0.5 font-bold">
                    {event.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text-primary font-medium">
                      <span className="text-text-secondary font-normal">{event.verb}</span>
                      {event.target && (
                        <>
                          {' '}
                          <span className="font-mono text-text-primary font-bold bg-accent-light px-1.5 py-0.5 rounded border border-text-secondary/15">{event.target}</span>
                        </>
                      )}
                    </div>
                    {event.context && (
                      <div className="text-[11px] text-text-secondary mt-1 pl-2 border-l-2 border-text-secondary/15">
                        {event.context}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary shrink-0 pt-0.5 font-bold">
                    {formatRelativeTime(event.at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Profile Details</div>
            </div>
            <dl className="divide-y divide-text-secondary/15">
              <Field label="Full name"  value={user.name} />
              <Field label="Email"      value={user.email} mono />
              {user.phone && <Field label="Phone" value={user.phone} mono />}
              {user.title && <Field label="Title" value={user.title} />}
              <Field label="User ID"    value={user.id} mono />
            </dl>
          </div>

          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-text-primary">Sites Assigned</div>
                <span className="bg-accent-light text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-text-secondary/15">{user.sites.length}</span>
              </div>
            </div>
            {user.sites.length === 0 ? (
              <div className="px-5 py-8 text-center text-[12px] text-text-secondary">
                No sites assigned yet.
              </div>
            ) : (
              <div className="divide-y divide-text-secondary/15">
                {user.sites.map((site) => (
                  <div key={site.id} className="px-5 py-3 flex items-center gap-3 hover:bg-accent-light/20 transition-colors">
                    <div className="w-7 h-7 rounded-lg border border-text-secondary/15 flex items-center justify-center text-text-primary bg-accent-light">
                      <Icon name="box" className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-text-primary font-bold truncate">{site.name}</div>
                      <div className="text-[10px] font-mono text-text-secondary truncate">{site.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        title={`Disable ${user.name}?`}
        description="They will be signed out immediately and unable to access the workspace until reactivated. Their records and activity history are preserved."
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDisable(false)}
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={reallyDisable}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-bold hover:bg-status-fail/90 transition-colors"
            >
              Disable User
            </button>
          </>
        }
      >
        <div className="hidden" />
      </Modal>
    </div>
  )
}

/* ============================================================
 * Small reusable bits — local to this file
 * ============================================================ */

function BreadcrumbBack({
  onBack,
  userName,
}: {
  onBack: () => void
  userName?: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
      <span className="uppercase text-[10px] tracking-wider text-text-secondary">System Admin</span>
      <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
      <button
        onClick={onBack}
        className="hover:text-text-primary transition-colors"
      >
        Users &amp; Roles
      </button>
      {userName && (
        <>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-primary">{userName}</span>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white p-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div
        className={`mt-2 tracking-tight text-text-primary truncate font-bold ${ mono ? 'font-mono text-[12px] pt-0.5' : 'text-[20px] leading-none' }`}
      >
        {value}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-baseline">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </dt>
      <dd
        className={`col-span-2 text-[13px] text-text-primary font-medium truncate ${ mono ? 'font-mono text-[12px]' : '' }`}
      >
        {value}
      </dd>
    </div>
  )
}

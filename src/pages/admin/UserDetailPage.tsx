import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import { useUsers, formatRelativeTime, formatDate } from '../../lib/users'
import { ROLES } from '../../lib/roles'
import { Icon } from '../../components/primitives/Icon'
import { Avatar } from '../../components/primitives/Avatar'
import { StatusPill } from '../../components/primitives/StatusPill'
import { Modal } from '../../components/primitives/Modal'

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { getById, setStatus } = useUsers()
  const nav = useNav()
  const [confirmDisable, setConfirmDisable] = useState(false)

  const user = userId ? getById(userId) : undefined

  if (!user) {
    return (
      <div className="stagger">
        <BreadcrumbBack onBack={() => nav.push('/admin/users')} />
        <div className="mt-10 rounded-xl border hairline border-dashed p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline">
            <Icon name="alert" className="w-5 h-5 text-ink-400 dark:text-ink-500" />
          </div>
          <h2 className="mt-4 font-display text-[28px] tracking-tight text-ink-900 dark:text-ink-50">
            User not found
          </h2>
          <p className="mt-1 text-[13px] text-ink-505 text-ink-500 dark:text-ink-400">
            The user ID <span className="font-mono">{userId}</span> doesn't exist or has been removed.
          </p>
          <button
            onClick={() => nav.push('/admin/users')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors"
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
    <div className="stagger">
      <BreadcrumbBack onBack={() => nav.push('/admin/users')} userName={user.name} />

      {/* ============ Hero header ============ */}
      <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
        <div className="flex items-center gap-5">
          <Avatar name={user.name} size="w-16 h-16 text-[20px]" />
          <div>
            <div className="flex items-center gap-3 text-balance">
              <h1 className="font-display text-[40px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
                {user.name}
              </h1>
              <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[13px]">
              {role && (
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-sm ${role.accent}`} />
                  <span className="text-ink-700 dark:text-ink-200">{role.label}</span>
                </span>
              )}
              <span className="text-ink-300 dark:text-ink-600">·</span>
              <span className="text-ink-500 dark:text-ink-400 font-mono text-[12px]">{user.email}</span>
            </div>
            {user.title && (
              <div className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">{user.title}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.status === 'invited' && (
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
              <Icon name="mail" className="w-3.5 h-3.5" />
              Resend invite
            </button>
          )}
          <button
            onClick={toggleDisabled}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline text-[12px] font-medium transition-colors ${
              user.status === 'disabled'
                ? 'bg-white dark:bg-ink-900 text-signal-green hover:bg-signal-green/5'
                : 'bg-white dark:bg-ink-900 text-signal-red hover:bg-signal-red/5'
            }`}
          >
            <Icon name={user.status === 'disabled' ? 'check' : 'close'} className="w-3.5 h-3.5" />
            {user.status === 'disabled' ? 'Reactivate' : 'Disable'}
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors">
            <Icon name="settings" className="w-3.5 h-3.5" />
            Edit profile
          </button>
        </div>
      </div>

      {/* ============ Stat row ============ */}
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
        <Stat label="Last active"  value={formatRelativeTime(user.lastActiveAt)} />
        <Stat label="Joined"       value={formatDate(user.joinedAt)} />
        <Stat label="Sites"        value={String(user.sites.length)} />
        <Stat label="User ID"      value={user.id} mono />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
          <div className="px-5 py-4 border-b hairline">
            <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Activity</div>
            <div className="text-[12px] text-ink-505 text-ink-500 dark:text-ink-400 mt-0.5">
              Recent actions taken by {user.name.split(' ')[0]}
            </div>
          </div>
          {user.activity.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-ink-505 text-ink-500 dark:text-ink-400">
              No activity recorded yet.
            </div>
          ) : (
            <div className="divide-y hairline">
              {user.activity.map((event) => (
                <div key={event.id} className="px-5 py-3.5 flex items-start gap-4">
                  <div className="font-mono text-[10px] text-ink-400 dark:text-ink-505 w-16 shrink-0 pt-0.5">
                    {event.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-900 dark:text-ink-50">
                      <span className="text-ink-505 text-ink-500 dark:text-ink-400">{event.verb}</span>
                      {event.target && (
                        <>
                          {' '}
                          <span className="font-mono text-ink-700 dark:text-ink-200">{event.target}</span>
                        </>
                      )}
                    </div>
                    {event.context && (
                      <div className="text-[11px] text-ink-505 text-ink-500 dark:text-ink-400 mt-0.5">
                        {event.context}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-ink-400 dark:text-ink-505 shrink-0 pt-0.5">
                    {formatRelativeTime(event.at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Profile</div>
            </div>
            <dl className="divide-y hairline">
              <Field label="Full name"  value={user.name} />
              <Field label="Email"      value={user.email} mono />
              {user.phone && <Field label="Phone" value={user.phone} mono />}
              {user.title && <Field label="Title" value={user.title} />}
              <Field label="User ID"    value={user.id} mono />
            </dl>
          </div>

          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Sites assigned</div>
                <span className="text-[11px] font-mono text-ink-505 text-ink-500 dark:text-ink-400">{user.sites.length}</span>
              </div>
            </div>
            {user.sites.length === 0 ? (
              <div className="px-5 py-8 text-center text-[12px] text-ink-505 text-ink-500 dark:text-ink-400">
                No sites assigned.
              </div>
            ) : (
              <div className="divide-y hairline">
                {user.sites.map((site) => (
                  <div key={site.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md border hairline flex items-center justify-center text-ink-700 dark:text-ink-200">
                      <Icon name="box" className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink-900 dark:text-ink-50 truncate">{site.name}</div>
                      <div className="text-[10px] font-mono text-ink-505 text-ink-500 dark:text-ink-400 truncate">{site.id}</div>
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
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={reallyDisable}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-signal-red text-white text-[13px] font-medium hover:bg-signal-red/90 transition-colors"
            >
              Disable user
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink-600 dark:text-ink-300">
          {/* description lives in the header */}
        </p>
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
    <div className="flex items-center gap-2 text-[12px] text-ink-505 text-ink-500 dark:text-ink-400">
      <span>System Admin</span>
      <Icon name="chevron_right" className="w-3 h-3" />
      <button
        onClick={onBack}
        className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
      >
        Users &amp; roles
      </button>
      {userName && (
        <>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">{userName}</span>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white dark:bg-ink-900 p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-505 text-ink-500 dark:text-ink-400">
        {label}
      </div>
      <div
        className={`mt-3 text-[20px] tracking-tight text-ink-900 dark:text-ink-50 truncate ${
          mono ? 'font-mono text-[14px] pt-1' : 'font-display leading-none'
        }`}
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
      <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-505 text-ink-500 dark:text-ink-400">
        {label}
      </dt>
      <dd
        className={`col-span-2 text-[13px] text-ink-900 dark:text-ink-50 truncate ${
          mono ? 'font-mono text-[12px]' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

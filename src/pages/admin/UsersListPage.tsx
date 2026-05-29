import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import { useUsers, formatRelativeTime } from '../../lib/users'
import { ROLES } from '../../lib/roles'
import { Icon } from '../../components/primitives/Icon'
import { Avatar } from '../../components/primitives/Avatar'
import { StatusPill } from '../../components/primitives/StatusPill'
import { Modal } from '../../components/primitives/Modal'
import { InviteUserModal } from '../../components/admin/InviteUserModal'
import { BulkActionBar, type BulkAction } from '../../components/admin/BulkActionBar'
import type { RoleKey } from '../../types/role'
import type { User, UserStatus } from '../../types/user'

type SortKey = 'name' | 'role' | 'site' | 'lastActive' | 'joined'
type SortDir = 'asc' | 'desc'

const STATUS_TABS: { key: 'all' | UserStatus; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'invited',  label: 'Invited' },
  { key: 'disabled', label: 'Disabled' },
]

export function UsersListPage() {
  const nav = useNav()
  const { users, setStatus, remove } = useUsers()

  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | UserStatus>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | RoleKey>('all')
  const [sortKey, setSortKey] = useState<SortKey>('lastActive')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirm, setConfirm] = useState<null | {
    title: string
    description: string
    confirmLabel: string
    destructive: boolean
    onConfirm: () => void
  }>(null)

  const [searchParams, setSearchParams] = useSearchParams()

  // Open invite modal if ?invite=1 is in the URL
  useEffect(() => {
    if (searchParams.get('invite') === '1') {
      setInviteOpen(true)
      // Clean the URL so back button doesn't reopen
      searchParams.delete('invite')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const counts = useMemo(() => ({
    all: users.length,
    active:   users.filter((u) => u.status === 'active').length,
    invited:  users.filter((u) => u.status === 'invited').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
  }), [users])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (u: User) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.title ?? '').toLowerCase().includes(q)
    const matchesStatus = (u: User) => statusTab === 'all' || u.status === statusTab
    const matchesRole = (u: User) => roleFilter === 'all' || u.role === roleFilter

    const result = users.filter((u) => matchesQuery(u) && matchesStatus(u) && matchesRole(u))
    const dir = sortDir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'name': return a.name.localeCompare(b.name)
          case 'role': return a.role.localeCompare(b.role)
          case 'site': return (a.sites[0]?.name ?? '').localeCompare(b.sites[0]?.name ?? '')
          case 'joined': return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          case 'lastActive': {
            const av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
            const bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
            return av - bv
          }
        }
      })()
      return cmp * dir
    })
    return result
  }, [users, query, statusTab, roleFilter, sortKey, sortDir])

  /* ============ Selection helpers ============ */

  const filteredIds = useMemo(() => filtered.map((u) => u.id), [filtered])
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const someFilteredSelected =
    filteredIds.some((id) => selectedIds.has(id)) && !allFilteredSelected

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        filteredIds.forEach((id) => next.delete(id))
        return next
      } else {
        const next = new Set(prev)
        filteredIds.forEach((id) => next.add(id))
        return next
      }
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  /* ============ Bulk actions ============ */

  const selectedUsers = users.filter((u) => selectedIds.has(u.id))
  const allInvited = selectedUsers.length > 0 && selectedUsers.every((u) => u.status === 'invited')
  const anyActive = selectedUsers.some((u) => u.status === 'active')
  const anyDisabled = selectedUsers.some((u) => u.status === 'disabled')

  const bulkDisable = () => {
    setConfirm({
      title: `Disable ${selectedUsers.length} user${selectedUsers.length === 1 ? '' : 's'}?`,
      description:
        'They will be signed out immediately and unable to access the workspace until reactivated. Their records and activity history are preserved.',
      confirmLabel: 'Disable users',
      destructive: true,
      onConfirm: () => {
        selectedUsers.forEach((u) => setStatus(u.id, 'disabled'))
        clearSelection()
        setConfirm(null)
      },
    })
  }

  const bulkReactivate = () => {
    selectedUsers.forEach((u) => setStatus(u.id, 'active'))
    clearSelection()
  }

  const bulkResendInvite = () => {
    // No backend yet — just clear selection and we'd toast in production
    clearSelection()
  }

  const bulkDeleteInvited = () => {
    setConfirm({
      title: `Cancel ${selectedUsers.length} invitation${selectedUsers.length === 1 ? '' : 's'}?`,
      description:
        'The invite links will be revoked. The invitees will not be able to join. You can re-invite them later.',
      confirmLabel: 'Cancel invitations',
      destructive: true,
      onConfirm: () => {
        selectedUsers.forEach((u) => remove(u.id))
        clearSelection()
        setConfirm(null)
      },
    })
  }

  const bulkActions: BulkAction[] = [
    { key: 'resend',     label: 'Resend invite',  icon: 'mail',  onClick: bulkResendInvite,  disabled: !allInvited },
    { key: 'disable',    label: 'Disable',        icon: 'close', onClick: bulkDisable,       disabled: !anyActive },
    { key: 'reactivate', label: 'Reactivate',     icon: 'check', onClick: bulkReactivate,    disabled: !anyDisabled },
    { key: 'remove',     label: 'Cancel invite',  icon: 'close', onClick: bulkDeleteInvited, disabled: !allInvited, destructive: true },
  ]

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'role' || key === 'site' ? 'asc' : 'desc')
    }
  }

  return (
    <>
      <div className="stagger">
        {/* ============ Header ============ */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
              <span>System Admin</span>
              <Icon name="chevron_right" className="w-3 h-3" />
              <span className="text-ink-900 dark:text-ink-50">Users &amp; roles</span>
            </div>
            <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
              Users &amp; <span className="italic text-ink-500 dark:text-ink-400">roles</span>.
            </h1>
            <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
              {counts.all} total · {counts.active} active · {counts.invited} pending invites
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Invite user
            </button>
          </div>
        </div>

        {/* ============ Filter bar ============ */}
        <div className="mt-8 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-md border hairline bg-white dark:bg-ink-900">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-2 ${
                  statusTab === tab.key
                    ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {tab.label}
                <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] max-w-[360px] flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 focus-within:border-accent-500">
            <Icon name="search" className="w-3.5 h-3.5 text-ink-400 dark:text-ink-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, title…"
              className="flex-1 bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors" aria-label="Clear search">
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | RoleKey)}
              className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
            >
              <option value="all">All roles</option>
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
          </div>
        </div>

        {/* ============ Table ============ */}
        <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[36px_1.6fr_1fr_1fr_0.9fr_0.7fr] gap-4 px-5 py-2.5 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
            <SelectAllCheckbox
              checked={allFilteredSelected}
              indeterminate={someFilteredSelected}
              onChange={toggleAllFiltered}
              disabled={filteredIds.length === 0}
            />
            <SortHeader label="User"        sortKey="name"        active={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortHeader label="Role"        sortKey="role"        active={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortHeader label="Site"        sortKey="site"        active={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortHeader label="Last active" sortKey="lastActive"  active={sortKey} dir={sortDir} onClick={toggleSort} />
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 text-right">Status</div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              query={query}
              statusTab={statusTab}
              roleFilter={roleFilter}
              onInvite={() => setInviteOpen(true)}
            />
          ) : (
            <div className="divide-y hairline">
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  selected={selectedIds.has(u.id)}
                  onToggleSelect={() => toggleOne(u.id)}
                  onClick={() => nav.push(`/admin/users/${u.id}`)}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t hairline flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400">
              <span>
                Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {users.length}
              </span>
              <button className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
                View audit log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============ Floating bulk action bar ============ */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        actions={bulkActions}
      />

      {/* ============ Invite modal ============ */}
      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(user) => {
          // Land on the new user's detail page to confirm the invite went through
          nav.push(`/admin/users/${user.id}`)
        }}
      />

      {/* ============ Confirmation modal ============ */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        description={confirm?.description}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => confirm?.onConfirm()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
                confirm?.destructive
                  ? 'bg-signal-red text-white hover:bg-signal-red/90'
                  : 'bg-accent-500 text-white hover:bg-accent-600'
              }`}
            >
              {confirm?.confirmLabel ?? 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink-600 dark:text-ink-300">
          {/* Body intentionally empty — description in header carries the message */}
        </p>
      </Modal>
    </>
  )
}

/* ============================================================
 * Sub-components — local to this file
 * ============================================================ */

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
  disabled: boolean
}) {
  // Native checkboxes can't render "indeterminate" via attribute alone — we use a ref
  const setRef = (el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate
  }
  return (
    <div className="flex items-center justify-center">
      <input
        ref={setRef}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-3.5 h-3.5 rounded border-ink-300 dark:border-ink-600 accent-ink-900 dark:accent-ink-50 disabled:opacity-50 cursor-pointer"
        aria-label="Select all visible users"
      />
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onClick,
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
}) {
  const isActive = active === sortKey
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`text-left text-[10px] font-medium uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${
        isActive ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
      }`}
    >
      {label}
      {isActive && (
        <Icon name="chevron_down" className={`w-3 h-3 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  )
}

function UserRow({
  user,
  selected,
  onToggleSelect,
  onClick,
}: {
  user: User
  selected: boolean
  onToggleSelect: () => void
  onClick: () => void
}) {
  const role = ROLES.find((r) => r.key === user.role)
  const statusTone =
    user.status === 'active'   ? 'green'
    : user.status === 'invited' ? 'amber'
    : 'neutral'
  const statusLabel =
    user.status === 'active'   ? 'Active'
    : user.status === 'invited' ? 'Invited'
    : 'Disabled'

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[36px_1.6fr_1fr_1fr_0.9fr_0.7fr] gap-4 items-center px-5 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group cursor-pointer ${
        selected ? 'bg-ink-50 dark:bg-ink-800/40' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Checkbox — stop propagation so it doesn't navigate */}
      <div
        className="flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          className="w-3.5 h-3.5 rounded border-ink-300 dark:border-ink-600 accent-ink-900 dark:accent-ink-50 cursor-pointer"
          aria-label={`Select ${user.name}`}
        />
      </div>

      {/* User */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={user.name} />
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{user.name}</div>
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 truncate">{user.email}</div>
        </div>
      </div>

      {/* Role */}
      <div className="flex items-center gap-2 min-w-0">
        {role && <span className={`w-2 h-2 rounded-sm ${role.accent} shrink-0`} />}
        <span className="text-[13px] text-ink-700 dark:text-ink-200 truncate">
          {role?.label ?? user.role}
        </span>
      </div>

      {/* Site */}
      <div className="min-w-0">
        <div className="text-[13px] text-ink-700 dark:text-ink-200 truncate">
          {user.sites[0]?.name ?? '—'}
        </div>
        {user.sites.length > 1 && (
          <div className="text-[11px] text-ink-500 dark:text-ink-400">+{user.sites.length - 1} more</div>
        )}
      </div>

      {/* Last active */}
      <div className="text-[12px] font-mono text-ink-600 dark:text-ink-300">
        {formatRelativeTime(user.lastActiveAt)}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2">
        <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
        <Icon
          name="chevron_right"
          className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </div>
  )
}

function EmptyState({
  query,
  statusTab,
  roleFilter,
  onInvite,
}: {
  query: string
  statusTab: string
  roleFilter: string
  onInvite: () => void
}) {
  const hasFilters = query || statusTab !== 'all' || roleFilter !== 'all'
  return (
    <div className="px-5 py-16 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed">
        <Icon name={hasFilters ? 'search' : 'users'} className="w-5 h-5 text-ink-400 dark:text-ink-500" />
      </div>
      <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
        {hasFilters ? 'No users match these filters' : 'No users yet'}
      </div>
      <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different status tab.'
          : 'Invite your first teammate to get started.'}
      </p>
      {!hasFilters && (
        <button
          onClick={onInvite}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Invite a user
        </button>
      )}
    </div>
  )
}

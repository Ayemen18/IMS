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
import { PageBanner } from '../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <PageBanner
        title={`Users & roles`}
        subline={`${counts.all} total · ${counts.active} active · ${counts.invited} pending invites`}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              + Invite user
            </button>
          </>
        }
      />

      {/* ============ Filter bar ============ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition ${ statusTab === tab.key ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
            >
              {tab.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ statusTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-accent-light text-text-secondary' }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-white border border-text-secondary/15 rounded-lg pl-10 pr-8 py-2 text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Clear search">
                <Icon name="close" className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | RoleKey)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All roles</option>
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[36px_1.6fr_1fr_1fr_0.9fr_0.7fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
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
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary text-right pr-2">Status</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            query={query}
            statusTab={statusTab}
            roleFilter={roleFilter}
            onInvite={() => setInviteOpen(true)}
          />
        ) : (
          <div className="divide-y divide-text-secondary/15">
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
          <div className="px-6 py-4 border-t border-text-secondary/15 flex items-center justify-between text-[12px] text-text-secondary bg-accent-light/50">
            <span>
              Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {users.length}
            </span>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        actions={bulkActions}
      />

      {/* Invite modal */}
      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(user) => {
          nav.push(`/admin/users/${user.id}`)
        }}
      />

      {/* Confirmation modal */}
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-secondary hover:bg-accent-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => confirm?.onConfirm()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${ confirm?.destructive ? 'bg-status-fail text-white hover:bg-status-fail/90' : 'bg-primary text-white hover:bg-primary' }`}
            >
              {confirm?.confirmLabel ?? 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-text-secondary">
          {/* Description carries the message */}
        </p>
      </Modal>
    </div>
  )
}

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
        className="w-4 h-4 rounded border-text-secondary/15 text-text-primary focus:ring-primary/15 cursor-pointer"
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
      className={`text-left text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${ isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary' }`}
    >
      {label}
      {isActive && (
        <Icon name="chevron_down" className={`w-3.5 h-3.5 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />
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
      className={`grid grid-cols-[36px_1.6fr_1fr_1fr_0.9fr_0.7fr] gap-4 items-center px-6 py-4 hover:bg-accent-light transition-colors group cursor-pointer ${ selected ? 'bg-accent-light' : '' }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
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
          className="w-4 h-4 rounded border-text-secondary/15 text-text-primary focus:ring-primary/15 cursor-pointer"
          aria-label={`Select ${user.name}`}
        />
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={user.name} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-text-primary truncate">{user.name}</div>
          <div className="text-[12px] font-mono text-text-secondary truncate">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {role && <span className={`w-2 h-2 rounded-full ${role.accent} shrink-0`} />}
        <span className="text-[13px] text-text-secondary truncate font-medium">
          {role?.label ?? user.role}
        </span>
      </div>

      <div className="min-w-0">
        <div className="text-[13px] text-text-secondary truncate font-semibold">
          {user.sites[0]?.name ?? '—'}
        </div>
        {user.sites.length > 1 && (
          <div className="text-[11px] text-text-secondary">+{user.sites.length - 1} more</div>
        )}
      </div>

      <div className="text-[13px] font-mono text-text-secondary">
        {formatRelativeTime(user.lastActiveAt)}
      </div>

      <div className="flex items-center justify-end gap-2 pr-2">
        <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
        <Icon
          name="chevron_right"
          className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all"
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
    <div className="px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light mb-4">
        <Icon name={hasFilters ? 'search' : 'users'} className="w-6 h-6 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary mb-1">
        {hasFilters ? 'No users match these filters' : 'No users yet'}
      </div>
      <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto mb-6">
        {hasFilters
          ? 'Try clearing the search or switching to a different status tab.'
          : 'Invite your first teammate to get started.'}
      </p>
      {!hasFilters && (
        <button
          onClick={onInvite}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary text-white text-[13px] font-bold transition shadow-sm"
        >
          <Icon name="plus" className="w-4 h-4" />
          Invite a user
        </button>
      )}
    </div>
  )
}

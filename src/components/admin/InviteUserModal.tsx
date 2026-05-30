import { useState } from 'react'
import { Modal } from '../primitives/Modal'
import { Icon } from '../primitives/Icon'
import { ROLES } from '../../lib/roles'
import { useUsers } from '../../lib/users'
import type { RoleKey } from '../../types/role'
import type { User, UserSite } from '../../types/user'

interface InviteUserModalProps {
  open: boolean
  onClose: () => void
  /** Called with the freshly created user after a successful invite */
  onInvited?: (user: User) => void
}

const AVAILABLE_SITES: UserSite[] = [
  { id: 'site_mumbai',    name: 'Mumbai HQ' },
  { id: 'site_pune',      name: 'Pune Plant' },
  { id: 'site_hyderabad', name: 'Hyderabad Packing' },
]

const ASSIGNABLE_ROLES: RoleKey[] = [
  'quality_manager',
  'safety_manager',
  'quality_inspector',
  'safety_inspector',
  'employee',
  'top_management',
  // Note: 'admin' deliberately omitted — admins are provisioned via a different path
]

export function InviteUserModal({ open, onClose, onInvited }: InviteUserModalProps) {
  const { add, users } = useUsers()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<RoleKey>('quality_inspector')
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([AVAILABLE_SITES[0].id])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setEmail('')
    setName('')
    setRole('quality_inspector')
    setSelectedSiteIds([AVAILABLE_SITES[0].id])
    setMessage('')
    setError(null)
    setSubmitting(false)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.'
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return 'Enter a valid email address.'
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return 'A user with this email already exists.'
    }
    if (selectedSiteIds.length === 0) return 'Assign at least one site.'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setSubmitting(true)

    // Build the new user record
    const newUser: User = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'invited',
      sites: AVAILABLE_SITES.filter((s) => selectedSiteIds.includes(s.id)),
      lastActiveAt: null,
      joinedAt: new Date().toISOString(),
      title: ROLES.find((r) => r.key === role)?.label,
      activity: [
        {
          id: `evt_${Date.now().toString(36)}`,
          at: new Date().toISOString(),
          verb: 'invited',
          context: message.trim() ? `Note: ${message.trim()}` : 'Pending acceptance',
        },
      ],
    }

    // Tiny artificial delay so the submit feels real
    setTimeout(() => {
      add(newUser)
      setSubmitting(false)
      onInvited?.(newUser)
      reset()
      onClose()
    }, 220)
  }

  const toggleSite = (id: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
    setError(null)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite a user"
      description="They'll receive an email with a one-time link to set their password and join the workspace."
      size="md"
      dismissOnBackdrop={!submitting}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-md border hairline bg-white text-[13px] font-medium text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invite-user-form"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send invitation'}
            {!submitting && <Icon name="arrow_right" className="w-3.5 h-3.5" />}
          </button>
        </>
      }
    >
      <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Name + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="invite-name" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">
              Full name
            </label>
            <input
              id="invite-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Shah"
              autoComplete="off"
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="invite-email" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">
              Work email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@company.com"
              autoComplete="off"
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-colors"
            />
          </div>
        </div>

        {/* Role picker — grid of tiles, not a dropdown, so the choice feels deliberate */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ASSIGNABLE_ROLES.map((roleKey) => {
              const roleObj = ROLES.find((r) => r.key === roleKey)!
              const isSelected = role === roleKey
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setRole(roleKey)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all ${ isSelected ? 'border-text-secondary/15 bg-accent-light ' : 'border-black/[0.06] hover:border-text-secondary/15 ' }`}
                >
                  <span className={`w-2 h-2 rounded-sm ${roleObj.accent} shrink-0`} />
                  <span className="text-[12px] font-medium text-text-primary truncate">
                    {roleObj.label}
                  </span>
                  {isSelected && (
                    <Icon name="check" className="w-3.5 h-3.5 text-text-primary ml-auto shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sites */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">
              Sites
            </label>
            <span className="text-[11px] font-mono text-text-secondary">
              {selectedSiteIds.length} selected
            </span>
          </div>
          <div className="space-y-1.5">
            {AVAILABLE_SITES.map((site) => {
              const checked = selectedSiteIds.includes(site.id)
              return (
                <label
                  key={site.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border hairline bg-white cursor-pointer hover:bg-accent-light transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSite(site.id)}
                    className="w-3.5 h-3.5 rounded border-text-secondary/15 accent-ink-900"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text-primary truncate">{site.name}</div>
                    <div className="text-[10px] font-mono text-text-secondary truncate">{site.id}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Optional welcome message */}
        <div>
          <label htmlFor="invite-message" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">
            Message <span className="text-text-secondary normal-case font-normal tracking-normal">— optional</span>
          </label>
          <textarea
            id="invite-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi Priya — looking forward to having you on the Pune line. — Maya"
            rows={2}
            className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[12px] text-status-fail animate-fade-in">
            <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}

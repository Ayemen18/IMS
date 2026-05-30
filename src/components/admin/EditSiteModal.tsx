import { useState, useEffect } from 'react'
import { Modal } from '../primitives/Modal'
import { Icon } from '../primitives/Icon'
import { useSites } from '../../lib/sites'
import { useUsers } from '../../lib/users'
import type { Site } from '../../types/site'

interface EditSiteModalProps {
  open: boolean
  onClose: () => void
  site: Site | null
}

export function EditSiteModal({ open, onClose, site }: EditSiteModalProps) {
  const { updateSite } = useSites()
  const { users } = useUsers()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [primaryDomain, setPrimaryDomain] = useState<'quality' | 'safety' | 'both'>('quality')
  
  const [certInput, setCertInput] = useState('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [managerId, setManagerId] = useState<string>('')
  const [notes, setNotes] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && site) {
      setName(site.name)
      setCode(site.code)
      setCity(site.city)
      setCountry(site.country)
      setTimezone(site.timezone)
      setPrimaryDomain(site.primaryDomain)
      setCertifications(site.certifications)
      setManagerId(site.managerId || '')
      setNotes(site.notes || '')
      setCertInput('')
      setError(null)
      setSubmitting(false)
    }
  }, [open, site])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.'
    if (!code.trim()) return 'Code is required.'
    if (!city.trim()) return 'City is required.'
    if (!country.trim()) return 'Country is required.'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!site) return
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setSubmitting(true)

    const managerName = managerId ? users.find(u => u.id === managerId)?.name || null : null

    setTimeout(() => {
      updateSite(site.id, {
        name: name.trim(),
        code: code.trim(),
        city: city.trim(),
        country: country.trim(),
        timezone: timezone.trim(),
        certifications,
        primaryDomain,
        managerId: managerId || null,
        managerName,
        notes: notes.trim() || undefined
      })
      setSubmitting(false)
      onClose()
    }, 220)
  }

  const handleAddCert = () => {
    if (certInput.trim() && !certifications.includes(certInput.trim())) {
      setCertifications([...certifications, certInput.trim()])
    }
    setCertInput('')
  }

  const removeCert = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit site details"
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
            form="edit-site-form"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="edit-site-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Primary Domain</label>
          <div className="flex gap-4">
            {(['quality', 'safety', 'both'] as const).map(domain => (
              <label key={domain} className="flex items-center gap-2 cursor-pointer text-[13px] text-text-primary capitalize">
                <input
                  type="radio"
                  name="domain"
                  checked={primaryDomain === domain}
                  onChange={() => setPrimaryDomain(domain)}
                  className="w-3.5 h-3.5 accent-primary"
                />
                {domain}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Certifications</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCert()
                }
              }}
              placeholder="e.g. GMP, HACCP"
              className="focus-ring flex-1 px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary"
            />
            <button
              type="button"
              onClick={handleAddCert}
              className="px-3 py-2 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light"
            >
              Add
            </button>
          </div>
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {certifications.map(cert => (
                <div key={cert} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-light text-[12px] font-medium text-text-secondary">
                  {cert}
                  <button type="button" onClick={() => removeCert(cert)} className="text-text-secondary hover:text-text-primary">
                    <Icon name="close" className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Site Manager</label>
          <div className="relative">
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="appearance-none focus-ring w-full pl-3 pr-9 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
            >
              <option value="">No manager assigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="focus-ring w-full px-3 py-2.5 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary resize-none"
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

import { useState, useEffect } from 'react'
import { Modal } from '../primitives/Modal'
import { Icon } from '../primitives/Icon'
import { useSites } from '../../lib/sites'
import { useUsers } from '../../lib/users'
import type { Department, DepartmentKind } from '../../types/site'

interface DepartmentModalProps {
  open: boolean
  onClose: () => void
  siteId: string
  department?: Department | null // If present, edit mode. Else create mode.
}

const DEPT_KINDS: { value: DepartmentKind, label: string }[] = [
  { value: 'production', label: 'Production' },
  { value: 'quality_lab', label: 'Quality Lab' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'office', label: 'Office' },
  { value: 'utility', label: 'Utility' },
]

export function DepartmentModal({ open, onClose, siteId, department }: DepartmentModalProps) {
  const { createDepartment, updateDepartment } = useSites()
  const { users } = useUsers()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<DepartmentKind>('production')
  const [headId, setHeadId] = useState<string>('')
  
  const [areaInput, setAreaInput] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!department

  useEffect(() => {
    if (open) {
      if (department) {
        setName(department.name)
        setCode(department.code)
        setKind(department.kind)
        setHeadId(department.headId || '')
        setAreas(department.areas)
      } else {
        setName('')
        setCode('')
        setKind('production')
        setHeadId('')
        setAreas([])
      }
      setAreaInput('')
      setError(null)
      setSubmitting(false)
    }
  }, [open, department])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.'
    if (!code.trim()) return 'Code is required.'
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

    const headName = headId ? users.find(u => u.id === headId)?.name || null : null

    setTimeout(() => {
      if (isEdit && department) {
        updateDepartment(department.id, {
          name: name.trim(),
          code: code.trim(),
          kind,
          headId: headId || null,
          headName,
          areas,
        })
      } else {
        createDepartment({
          siteId,
          name: name.trim(),
          code: code.trim(),
          kind,
          headId: headId || null,
          headName,
          areas,
          active: true,
        })
      }
      setSubmitting(false)
      onClose()
    }, 220)
  }

  const handleAddArea = () => {
    if (areaInput.trim() && !areas.includes(areaInput.trim())) {
      setAreas([...areas, areaInput.trim()])
    }
    setAreaInput('')
  }

  const removeArea = (area: string) => {
    setAreas(areas.filter(a => a !== area))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit department' : 'Add department'}
      size="md"
      dismissOnBackdrop={!submitting}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="department-form"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Saving…' : (isEdit ? 'Save changes' : 'Add department')}
          </button>
        </>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Department kind</label>
          <div className="relative">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DepartmentKind)}
              className="appearance-none focus-ring w-full pl-3 pr-9 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 cursor-pointer"
            >
              {DEPT_KINDS.map(k => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Head of Department</label>
          <div className="relative">
            <select
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              className="appearance-none focus-ring w-full pl-3 pr-9 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 cursor-pointer"
            >
              <option value="">No head assigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Areas</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddArea()
                }
              }}
              placeholder="e.g. Packing Line 1"
              className="focus-ring flex-1 px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={handleAddArea}
              className="px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800"
            >
              Add
            </button>
          </div>
          {areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {areas.map(area => (
                <div key={area} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink-100 dark:bg-ink-800 text-[12px] font-medium text-ink-700 dark:text-ink-200">
                  {area}
                  <button type="button" onClick={() => removeArea(area)} className="text-ink-400 hover:text-ink-900 dark:hover:text-ink-50">
                    <Icon name="close" className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[12px] text-signal-red animate-fade-in">
            <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}

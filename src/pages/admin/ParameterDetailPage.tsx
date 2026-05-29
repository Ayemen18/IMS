import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import { useSession } from '../../lib/session'
import { useParameters, PARAMETER_CATEGORIES } from '../../lib/parameters'
import { useTemplates, formatDate, formatRelativeTime } from '../../lib/templates'
import { Icon } from '../../components/primitives/Icon'
import { Avatar } from '../../components/primitives/Avatar'
import { Modal } from '../../components/primitives/Modal'
import type { Parameter, ParameterType } from '../../types/parameter'
import type { Template } from '../../types/template'

const TYPE_LABELS: Record<ParameterType, string> = {
  pass_fail_na: 'Pass / Fail / N/A',
  numeric: 'Numeric',
  text: 'Free text',
  single_select: 'Single select',
}

export function ParameterDetailPage() {
  const { parameterId } = useParams<{ parameterId: string }>()
  const { getById, update, remove, duplicate } = useParameters()
  const { templates } = useTemplates()
  const { user } = useSession()
  const nav = useNav()

  const [editModalOpen, setEditModalOpen] = useState(false)

  const parameter = parameterId ? getById(parameterId) : undefined

  // Find usage in templates
  const usedInTemplates = useMemo(() => {
    if (!parameter) return []
    const referencing: Template[] = []
    templates.forEach((t) => {
      let uses = false
      t.sections.forEach((s) => {
        s.items.forEach((i) => {
          if (i.parameterRef === parameter.id) uses = true
        })
      })
      if (uses) referencing.push(t)
    })
    return referencing
  }, [parameter, templates])

  if (!parameter) {
    return (
      <div className="stagger">
        <Breadcrumb onBack={() => nav.push('/admin/parameters')} />
        <div className="mt-10 rounded-xl border hairline border-dashed p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline">
            <Icon name="alert" className="w-5 h-5 text-ink-400 dark:text-ink-500" />
          </div>
          <h2 className="mt-4 font-display text-[28px] tracking-tight text-ink-900 dark:text-ink-50">
            Parameter not found
          </h2>
          <button
            onClick={() => nav.push('/admin/parameters')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
            Back to library
          </button>
        </div>
      </div>
    )
  }

  const categoryMeta = PARAMETER_CATEGORIES.find(c => c.key === parameter.category)

  const handleDuplicate = () => {
    if (!user) return
    const copy = duplicate(parameter.id, user.email, user.name)
    if (copy) nav.push(`/admin/parameters/${copy.id}`)
  }

  const handleArchive = () => {
    if (!window.confirm('Archive this parameter?')) return
    remove(parameter.id)
    nav.push('/admin/parameters')
  }

  return (
    <>
      <div className="stagger">
        <Breadcrumb onBack={() => nav.push('/admin/parameters')} parameterName={parameter.name} />

        {/* ============ Hero header ============ */}
        <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
          <div className="min-w-0 max-w-[640px]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border hairline">
                <span className={`w-1.5 h-1.5 rounded-full ${categoryMeta?.accent || 'bg-ink-400'}`} />
                {categoryMeta?.label || parameter.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border hairline text-ink-600 dark:text-ink-300">
                {TYPE_LABELS[parameter.type]}
              </span>
            </div>
            <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
              {parameter.name}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600 dark:text-ink-300 text-pretty">
              {parameter.description}
            </p>
            {parameter.tags.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                {parameter.tags.map((tag) => (
                  <span key={tag} className="text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDuplicate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              <Icon name="layers" className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              <Icon name="box" className="w-3.5 h-3.5" />
              Archive
            </button>
            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
            >
              <Icon name="settings" className="w-3.5 h-3.5" />
              Edit parameter
            </button>
          </div>
        </div>

        {/* ============ Stat row ============ */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
          <Stat label="Used by"      value={`${usedInTemplates.length} template${usedInTemplates.length === 1 ? '' : 's'}`} />
          <Stat label="Category"     value={categoryMeta?.label || parameter.category} />
          <Stat label="Type"         value={TYPE_LABELS[parameter.type]} />
          <Stat label="Last updated" value={formatRelativeTime(parameter.updatedAt)} />
        </div>

        {/* ============ Two-column body ============ */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Definition card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline flex items-center justify-between">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Definition</div>
                <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400">{parameter.code}</div>
              </div>
              <div className="p-6">
                <div className="text-[13px] uppercase tracking-[0.12em] font-medium text-ink-500 dark:text-ink-400 mb-2">Prompt</div>
                <div className="text-[18px] text-ink-900 dark:text-ink-50 leading-relaxed max-w-2xl">
                  {parameter.prompt}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-ink-500 dark:text-ink-400 mb-3">Type configuration</div>
                    {parameter.type === 'numeric' && (
                      <div className="space-y-2">
                        <div className="text-[13px] text-ink-700 dark:text-ink-200">
                          <span className="text-ink-500 dark:text-ink-400 mr-2">Min:</span>
                          <span className="font-mono">{parameter.numericMin ?? 'None'}</span>
                        </div>
                        <div className="text-[13px] text-ink-700 dark:text-ink-200">
                          <span className="text-ink-500 dark:text-ink-400 mr-2">Max:</span>
                          <span className="font-mono">{parameter.numericMax ?? 'None'}</span>
                        </div>
                        <div className="text-[13px] text-ink-700 dark:text-ink-200">
                          <span className="text-ink-500 dark:text-ink-400 mr-2">Unit:</span>
                          <span className="font-mono">{parameter.numericUnit || 'None'}</span>
                        </div>
                      </div>
                    )}
                    {parameter.type === 'single_select' && parameter.options && (
                      <div className="flex flex-wrap gap-2">
                        {parameter.options.map(opt => (
                          <span key={opt} className="text-[12px] font-mono text-ink-700 dark:text-ink-200 px-2 py-1 rounded border hairline bg-ink-50 dark:bg-ink-800">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {(parameter.type === 'pass_fail_na' || parameter.type === 'text') && (
                      <div className="text-[13px] text-ink-500 dark:text-ink-400 italic">No additional configuration needed.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-ink-500 dark:text-ink-400 mb-3">Modifiers & Context</div>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2 text-[13px] text-ink-700 dark:text-ink-200">
                        <Icon name={parameter.photoRequired ? 'check' : 'close'} className={`w-4 h-4 shrink-0 mt-0.5 ${parameter.photoRequired ? 'text-signal-green' : 'text-ink-400'}`} />
                        Photo evidence required
                      </li>
                      <li className="flex items-start gap-2 text-[13px] text-ink-700 dark:text-ink-200">
                        <Icon name={parameter.observationRequiredOnFail ? 'check' : 'close'} className={`w-4 h-4 shrink-0 mt-0.5 ${parameter.observationRequiredOnFail ? 'text-signal-green' : 'text-ink-400'}`} />
                        Observation required on fail
                      </li>
                      {parameter.reference && (
                        <li className="flex items-start gap-2 text-[13px] text-ink-700 dark:text-ink-200 mt-4">
                          <Icon name="file" className="w-4 h-4 shrink-0 mt-0.5 text-accent-500" />
                          <div>
                            <div className="font-medium text-ink-900 dark:text-ink-50">Reference</div>
                            <div className="mt-0.5 text-ink-600 dark:text-ink-300 italic">{parameter.reference}</div>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Used in templates card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline flex items-center justify-between">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Used in templates</div>
                <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">{usedInTemplates.length}</span>
              </div>
              {usedInTemplates.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-ink-500 dark:text-ink-400">
                  This parameter is not used in any templates yet.
                </div>
              ) : (
                <div className="divide-y hairline">
                  {usedInTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => nav.push(`/admin/templates/${t.id}`)}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{t.name}</div>
                        <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">v{t.version} · {t.status}</div>
                      </div>
                      <Icon name="arrow_right" className="w-4 h-4 text-ink-400 dark:text-ink-500 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Details card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Details</div>
              </div>
              <dl className="divide-y hairline">
                <Field label="Parameter ID"  value={parameter.id} mono />
                <Field label="Code"          value={parameter.code} mono />
                <Field label="Category"      value={categoryMeta?.label || parameter.category} />
                <Field label="Type"          value={TYPE_LABELS[parameter.type]} />
                <Field label="Created"       value={formatDate(parameter.createdAt)} />
                <Field label="Last updated"  value={formatDate(parameter.updatedAt)} />
              </dl>
            </div>

            {/* Owner card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Owner</div>
              </div>
              <div className="px-5 py-4 flex items-center gap-3">
                <Avatar name={parameter.ownerName} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{parameter.ownerName}</div>
                  <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 truncate">{parameter.ownerId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ParameterEditModal
        open={editModalOpen}
        parameter={parameter}
        onClose={() => setEditModalOpen(false)}
        onSave={(patch) => {
          update(parameter.id, patch)
          setEditModalOpen(false)
        }}
      />
    </>
  )
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function Breadcrumb({
  onBack,
  parameterName,
}: {
  onBack: () => void
  parameterName?: string
}) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
      <span>System Admin</span>
      <Icon name="chevron_right" className="w-3 h-3" />
      <button
        onClick={onBack}
        className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
      >
        Parameters
      </button>
      {parameterName && (
        <>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50 truncate max-w-[300px]">{parameterName}</span>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-ink-900 p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
        {label}
      </div>
      <div className="mt-3 text-[20px] font-display leading-none tracking-tight text-ink-900 dark:text-ink-50">
        {value}
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-baseline">
      <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
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

function ParameterEditModal({
  open,
  parameter,
  onClose,
  onSave
}: {
  open: boolean
  parameter: Parameter
  onClose: () => void
  onSave: (patch: Partial<Parameter>) => void
}) {
  const [name, setName] = useState(parameter.name)
  const [description, setDescription] = useState(parameter.description)
  const [prompt, setPrompt] = useState(parameter.prompt)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit parameter"
      description="Update basic details. Type changes are restricted to avoid breaking existing templates."
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200">Cancel</button>
          <button onClick={() => onSave({ name, description, prompt })} className="px-4 py-2 rounded-md bg-ink-900 dark:bg-ink-50 text-ink-50 dark:text-ink-900 text-[13px] font-medium">Save changes</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] text-ink-900 dark:text-ink-50 focus-ring"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] text-ink-900 dark:text-ink-50 focus-ring resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1.5">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] text-ink-900 dark:text-ink-50 focus-ring resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}

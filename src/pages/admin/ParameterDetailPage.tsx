import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import { useSession } from '../../lib/session'
import { useParameters, PARAMETER_CATEGORIES } from '../../lib/parameters'
import { useTemplates, formatDate, formatRelativeTime } from '../../lib/templates'
import { Icon } from '../../components/primitives/Icon'
import { Avatar } from '../../components/primitives/Avatar'
import { Modal } from '../../components/primitives/Modal'
import { PageBanner } from '../../components/shell/PageBanner'
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
      <div className="space-y-6">
        <Breadcrumb onBack={() => nav.push('/admin/parameters')} />
        <div className="rounded-2xl border border-dashed border-text-secondary/15 bg-white p-16 text-center shadow-soft max-w-[500px] mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-text-secondary/15 bg-accent-light/50 mb-4 animate-bounce">
            <Icon name="alert" className="w-5 h-5 text-status-fail" />
          </div>
          <h2 className="text-[15px] font-bold text-text-primary">
            Parameter not found
          </h2>
          <button
            onClick={() => nav.push('/admin/parameters')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white text-[12px] font-bold rounded-lg transition-all shadow-sm"
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
      <div className="space-y-6">
        {/* Top Breadcrumb Row */}
        <div className="flex items-center justify-between">
          <Breadcrumb onBack={() => nav.push('/admin/parameters')} parameterName={parameter.name} />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-text-secondary/15 bg-accent-light uppercase tracking-wider text-text-primary">
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${categoryMeta?.accent || 'bg-accent-light'}`} />
              {categoryMeta?.label || parameter.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-text-secondary/15 bg-accent-light uppercase tracking-wider text-text-primary">
              {TYPE_LABELS[parameter.type]}
            </span>
          </div>
        </div>

        {/* Page Banner with Action Slot */}
        <PageBanner
          title={parameter.name}
          subline={parameter.description || "No description provided for this parameter."}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm"
              >
                <Icon name="layers" className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm hover:bg-white/15"
              >
                <Icon name="box" className="w-3.5 h-3.5" />
                Archive
              </button>
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm"
              >
                <Icon name="settings" className="w-3.5 h-3.5" />
                Edit Parameter
              </button>
            </div>
          }
        />

        {/* Tags Row */}
        {parameter.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mr-1">Tags:</span>
            {parameter.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-mono font-bold text-text-primary px-2 py-0.5 rounded-lg bg-white border border-text-secondary/15 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ============ Stat row ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
          <Stat label="Used By"      value={`${usedInTemplates.length} template${usedInTemplates.length === 1 ? '' : 's'}`} />
          <Stat label="Category"     value={categoryMeta?.label || parameter.category} />
          <Stat label="Type"         value={TYPE_LABELS[parameter.type]} />
          <Stat label="Last Updated" value={formatRelativeTime(parameter.updatedAt)} />
        </div>

        {/* ============ Two-column body ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Definition card */}
            <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
              <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50 flex items-center justify-between">
                <div className="text-[13px] font-bold text-text-primary">Definition</div>
                <div className="font-mono text-[10px] font-bold text-text-secondary">{parameter.code}</div>
              </div>
              <div className="p-6">
                <div className="text-[10px] uppercase tracking-wider font-bold text-text-secondary mb-2">Prompt</div>
                <div className="text-[16px] font-bold text-text-primary leading-relaxed max-w-2xl">
                  {parameter.prompt}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-text-secondary/15">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-text-secondary mb-3">Type Configuration</div>
                    {parameter.type === 'numeric' && (
                      <div className="space-y-2.5">
                        <div className="text-[13px] font-medium text-text-primary">
                          <span className="text-text-secondary mr-2 uppercase text-[10px] font-bold">Min:</span>
                          <span className="font-mono font-bold">{parameter.numericMin ?? 'None'}</span>
                        </div>
                        <div className="text-[13px] font-medium text-text-primary">
                          <span className="text-text-secondary mr-2 uppercase text-[10px] font-bold">Max:</span>
                          <span className="font-mono font-bold">{parameter.numericMax ?? 'None'}</span>
                        </div>
                        <div className="text-[13px] font-medium text-text-primary">
                          <span className="text-text-secondary mr-2 uppercase text-[10px] font-bold">Unit:</span>
                          <span className="font-mono font-bold">{parameter.numericUnit || 'None'}</span>
                        </div>
                      </div>
                    )}
                    {parameter.type === 'single_select' && parameter.options && (
                      <div className="flex flex-wrap gap-2">
                        {parameter.options.map(opt => (
                          <span key={opt} className="text-[11px] font-mono font-bold text-text-primary px-2 py-1 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {(parameter.type === 'pass_fail_na' || parameter.type === 'text') && (
                      <div className="text-[12px] text-text-secondary italic font-medium">No additional configuration needed.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-text-secondary mb-3">Modifiers & Context</div>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
                        <Icon name={parameter.photoRequired ? 'check' : 'close'} className={`w-4 h-4 shrink-0 ${parameter.photoRequired ? 'text-status-pass' : 'text-text-secondary'}`} />
                        Photo evidence required
                      </li>
                      <li className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
                        <Icon name={parameter.observationRequiredOnFail ? 'check' : 'close'} className={`w-4 h-4 shrink-0 ${parameter.observationRequiredOnFail ? 'text-status-pass' : 'text-text-secondary'}`} />
                        Observation required on fail
                      </li>
                      {parameter.reference && (
                        <li className="flex items-start gap-2 text-[13px] font-medium text-text-primary mt-4 pt-3 border-t border-text-secondary/15">
                          <Icon name="file" className="w-4 h-4 shrink-0 mt-0.5 text-text-primary" />
                          <div>
                            <div className="font-bold text-[11px] uppercase tracking-wider text-text-secondary">Reference</div>
                            <div className="mt-0.5 text-text-primary italic font-semibold">{parameter.reference}</div>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Used in templates card */}
            <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
              <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50 flex items-center justify-between">
                <div className="text-[13px] font-bold text-text-primary">Used in Templates</div>
                <span className="bg-accent-light text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-text-secondary/15">{usedInTemplates.length}</span>
              </div>
              {usedInTemplates.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-text-secondary">
                  This parameter is not used in any templates yet.
                </div>
              ) : (
                <div className="divide-y divide-text-secondary/15">
                  {usedInTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => nav.push(`/admin/templates/${t.id}`)}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-accent-light/20 transition-colors group"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="text-[13px] font-bold text-text-primary truncate">{t.name}</div>
                        <div className="text-[11px] text-text-secondary mt-0.5 font-medium">v{t.version} · <span className="capitalize">{t.status}</span></div>
                      </div>
                      <Icon name="arrow_right" className="w-5 h-5 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Details card */}
            <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
              <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
                <div className="text-[13px] font-bold text-text-primary">Details</div>
              </div>
              <dl className="divide-y divide-text-secondary/15">
                <Field label="Parameter ID"  value={parameter.id} mono />
                <Field label="Code"          value={parameter.code} mono />
                <Field label="Category"      value={categoryMeta?.label || parameter.category} />
                <Field label="Type"          value={TYPE_LABELS[parameter.type]} />
                <Field label="Created"       value={formatDate(parameter.createdAt)} />
                <Field label="Last updated"  value={formatDate(parameter.updatedAt)} />
              </dl>
            </div>

            {/* Owner card */}
            <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
              <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
                <div className="text-[13px] font-bold text-text-primary">Owner</div>
              </div>
              <div className="px-5 py-4 flex items-center gap-3">
                <Avatar name={parameter.ownerName} />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-text-primary truncate">{parameter.ownerName}</div>
                  <div className="text-[11px] font-mono text-text-secondary truncate">{parameter.ownerId}</div>
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
    <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
      <span className="uppercase text-[10px] tracking-wider text-text-secondary">System Admin</span>
      <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
      <button
        onClick={onBack}
        className="hover:text-text-primary transition-colors"
      >
        Parameters
      </button>
      {parameterName && (
        <>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-primary truncate max-w-[300px]">{parameterName}</span>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div className="mt-2 text-[20px] tracking-tight text-text-primary font-bold leading-none">
        {value}
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-3 grid grid-cols-3 gap-3 items-baseline">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </dt>
      <dd
        className={`col-span-2 text-[13px] text-text-primary font-semibold truncate ${ mono ? 'font-mono text-[12px]' : '' }`}
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
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors">Cancel</button>
          <button onClick={() => onSave({ name, description, prompt })} className="px-4 py-2 rounded-lg bg-primary text-white text-[13px] font-bold hover:bg-primary transition-colors shadow-sm">Save changes</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary font-semibold focus-ring"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary font-semibold focus-ring resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-1.5">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary font-semibold focus-ring resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import { useSession } from '../../lib/session'
import {
  useTemplates,
  INSPECTION_TYPES,
  formatDate,
  formatRelativeTime,
  statusToneFor,
  statusLabelFor,
} from '../../lib/templates'
import {
  getRequiredCount,
  getPhotoRequiredCount,
} from '../../types/template'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'
import { Avatar } from '../../components/primitives/Avatar'
import { Modal } from '../../components/primitives/Modal'
import { PublishTemplateModal } from '../../components/admin/PublishTemplateModal'
import type {
  TemplateItem,
  TemplateSection,
  TemplateItemType,
} from '../../types/template'

const ITEM_TYPE_LABELS: Record<TemplateItemType, string> = {
  pass_fail_na:  'Pass / Fail / N/A',
  numeric:       'Numeric',
  text:          'Free text',
  single_select: 'Single select',
}

export function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const {
    getById,
    getLineage,
    getCurrentPublished,
    publish,
    editPublished,
    archive,
    restore,
    duplicate,
  } = useTemplates()
  const { user } = useSession()
  const nav = useNav()

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const template = templateId ? getById(templateId) : undefined

  const lineageCount = template
    ? getLineage(template.baseTemplateId).length
    : 0

  if (!template) {
    return (
      <div className="stagger">
        <Breadcrumb onBack={() => nav.push('/admin/templates')} />
        <div className="mt-10 rounded-xl border hairline border-dashed p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline">
            <Icon name="alert" className="w-5 h-5 text-ink-400 dark:text-ink-500" />
          </div>
          <h2 className="mt-4 font-display text-[28px] tracking-tight text-ink-900 dark:text-ink-50">
            Template not found
          </h2>
          <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
            The template ID <span className="font-mono">{templateId}</span> doesn't exist or has been removed.
          </p>
          <button
            onClick={() => nav.push('/admin/templates')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
            Back to templates
          </button>
        </div>
      </div>
    )
  }

  const type = INSPECTION_TYPES[template.inspectionType]
  const requiredCount = getRequiredCount(template)
  const photoRequiredCount = getPhotoRequiredCount(template)
  const currentPublished = getCurrentPublished(template.baseTemplateId)
  const supersededBy = template.supersededBy ? template.supersededBy : null

  const handleDuplicate = () => {
    const copy = duplicate(template.id)
    if (copy) nav.push(`/admin/templates/${copy.id}`)
  }

  const handleEditNewRevision = () => {
    if (!user) return
    const result = editPublished(template.id, user.email, user.name)
    if (result) nav.push(`/admin/templates/${result.draft.id}/edit`)
  }

  const handleConfirmPublish = (opts: { bump: 'major' | 'minor'; note: string }) => {
    if (!user) return
    setPublishing(true)
    setTimeout(() => {
      publish(template.id, {
        bump: opts.bump,
        note: opts.note || undefined,
        byId: user.email,
        byName: user.name,
      })
      setPublishing(false)
      setPublishModalOpen(false)
    }, 320)
  }

  const handleArchive = () => {
    if (!user) return
    archive(template.id, user.email, user.name)
    setConfirmArchive(false)
  }

  const handleRestore = () => {
    if (!user) return
    restore(template.id, user.email, user.name)
  }

  return (
    <>
      <div className="stagger">
        <Breadcrumb onBack={() => nav.push('/admin/templates')} templateName={template.name} />

        {/* ============ Contextual banner ============ */}
        {template.status === 'superseded' && (
          <div className="mt-4 rounded-md border hairline bg-ink-50 dark:bg-ink-800/50 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Icon name="layers" className="w-4 h-4 text-ink-500 dark:text-ink-400 shrink-0" />
              <p className="text-[12px] text-ink-700 dark:text-ink-200 min-w-0">
                This version was superseded.{' '}
                {supersededBy && (
                  <button
                    onClick={() => nav.push(`/admin/templates/${supersededBy}`)}
                    className="font-medium underline underline-offset-2 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
                  >
                    View current version
                  </button>
                )}
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500 dark:text-ink-400 shrink-0">
              read-only
            </span>
          </div>
        )}
        {template.parentVersionId && template.status === 'draft' && (
          <div className="mt-4 rounded-md border hairline bg-signal-amber/5 px-4 py-3 flex items-center gap-3">
            <Icon name="alert" className="w-4 h-4 text-signal-amber shrink-0" />
            <p className="text-[12px] text-ink-700 dark:text-ink-200">
              This is a draft revision. Publishing it will supersede the currently active version
              {currentPublished && (
                <> (<span className="font-mono">v{currentPublished.version}</span>)</>
              )}.
            </p>
          </div>
        )}

        {/* ============ Hero header ============ */}
        <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
          <div className="min-w-0 max-w-[640px]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border hairline">
                <span className={`w-1.5 h-1.5 rounded-sm ${type.accent}`} />
                {type.label}
              </span>
              <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">v{template.version}</span>
              <StatusPill tone={statusToneFor(template.status)}>{statusLabelFor(template.status)}</StatusPill>
            </div>
            <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
              {template.name}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600 dark:text-ink-300 text-pretty">
              {template.summary}
            </p>
            {template.tags.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                {template.tags.map((tag) => (
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
            {template.status === 'archived' && (
              <button
                onClick={handleRestore}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-signal-green hover:bg-signal-green/5 transition-colors"
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                Restore
              </button>
            )}
            {(template.status === 'published' || template.status === 'draft') && (
              <button
                onClick={() => setConfirmArchive(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                <Icon name="box" className="w-3.5 h-3.5" />
                Archive
              </button>
            )}
            {template.status === 'published' && (
              <button
                onClick={handleEditNewRevision}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
              >
                <Icon name="settings" className="w-3.5 h-3.5" />
                Edit (new revision)
              </button>
            )}
            {template.status === 'draft' && (
              <>
                <button
                  onClick={() => setPublishModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline border-signal-green/30 bg-signal-green/5 text-signal-green text-[12px] font-medium hover:bg-signal-green/10 transition-colors"
                >
                  <Icon name="arrow_up_right" className="w-3.5 h-3.5" />
                  Publish…
                </button>
                <button
                  onClick={() => nav.push(`/admin/templates/${template.id}/edit`)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
                >
                  <Icon name="settings" className="w-3.5 h-3.5" />
                  Edit draft
                </button>
              </>
            )}
          </div>
        </div>

        {/* ============ Stat row ============ */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
          <Stat label="Sections"        value={String(template.sections.length)} />
          <Stat label="Total items"     value={String(template.itemCount)} />
          <Stat label="Required"        value={`${requiredCount} / ${template.itemCount}`} />
          <Stat label="Photo required"  value={String(photoRequiredCount)} />
          <Stat label="Last updated"    value={formatRelativeTime(template.updatedAt)} />
        </div>

        {/* ============ Two-column body ============ */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Structure — main content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-[24px] tracking-tight text-ink-900 dark:text-ink-50">
                  Structure
                </h2>
                <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-0.5">
                  {template.sections.length} section{template.sections.length === 1 ? '' : 's'} · {template.itemCount} items total
                </p>
              </div>
            </div>

            {template.sections.map((section, idx) => (
              <SectionCard key={section.id} section={section} index={idx} />
            ))}
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* History link */}
            <button
              onClick={() => nav.push(`/admin/templates/${template.id}/history`)}
              className="w-full rounded-xl border hairline bg-white dark:bg-ink-900 px-5 py-4 flex items-center justify-between text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Version history</div>
                <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5">
                  {lineageCount} version{lineageCount === 1 ? '' : 's'} in this lineage
                </div>
              </div>
              <Icon
                name="arrow_right"
                className="w-4 h-4 text-ink-400 dark:text-ink-500 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>

            {/* Details card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Details</div>
              </div>
              <dl className="divide-y hairline">
                <Field label="Template ID"     value={template.id} mono />
                <Field label="Version"         value={`v${template.version}`} mono />
                <Field label="Inspection type" value={INSPECTION_TYPES[template.inspectionType].label} />
                <Field label="Created"         value={formatDate(template.createdAt)} />
                <Field label="Last updated"    value={formatDate(template.updatedAt)} />
              </dl>
            </div>

            {/* Owner card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Owner</div>
              </div>
              <div className="px-5 py-4 flex items-center gap-3">
                <Avatar name={template.ownerName} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{template.ownerName}</div>
                  <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 truncate">{template.ownerId}</div>
                </div>
              </div>
            </div>

            {/* Sites card */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Sites</div>
                  <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
                    {template.siteIds.length === 0 ? 'All' : template.siteIds.length}
                  </span>
                </div>
              </div>
              {template.siteIds.length === 0 ? (
                <div className="px-5 py-4 text-[12px] text-ink-500 dark:text-ink-400">
                  Applies to all sites.
                </div>
              ) : (
                <div className="divide-y hairline">
                  {template.siteIds.map((siteId) => (
                    <div key={siteId} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md border hairline flex items-center justify-center text-ink-700 dark:text-ink-200">
                        <Icon name="box" className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[12px] font-mono text-ink-700 dark:text-ink-200">{siteId}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PublishTemplateModal
        open={publishModalOpen}
        template={template}
        currentPublished={currentPublished || null}
        onClose={() => setPublishModalOpen(false)}
        onConfirm={handleConfirmPublish}
        submitting={publishing}
      />
      
      <Modal
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archive template?"
        description="This will retire the template. It won't be available for new inspections, but historical data will remain."
        footer={
          <>
            <button
              onClick={() => setConfirmArchive(false)}
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 rounded-md bg-signal-red text-white text-[13px] font-medium hover:bg-signal-red/90 transition-colors"
            >
              Archive
            </button>
          </>
        }
      >
        <></>
      </Modal>
    </>
  )
}

/* ============================================================
 * Sub-components — local to this file
 * ============================================================ */

function Breadcrumb({
  onBack,
  templateName,
}: {
  onBack: () => void
  templateName?: string
}) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
      <span>System Admin</span>
      <Icon name="chevron_right" className="w-3 h-3" />
      <button
        onClick={onBack}
        className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
      >
        Templates
      </button>
      {templateName && (
        <>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50 truncate max-w-[300px]">{templateName}</span>
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

function SectionCard({ section, index }: { section: TemplateSection; index: number }) {
  return (
    <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
      {/* Section header */}
      <div className="px-5 py-4 border-b hairline">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md border hairline text-[10px] font-mono font-medium text-ink-500 dark:text-ink-400">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">{section.title}</div>
            {section.description && (
              <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5">{section.description}</div>
            )}
          </div>
          <span className="text-[11px] font-mono text-ink-400 dark:text-ink-500 shrink-0">
            {section.items.length} item{section.items.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y hairline">
        {section.items.map((item, itemIdx) => (
          <ItemRow key={item.id} item={item} index={itemIdx} />
        ))}
      </div>
    </div>
  )
}

function ItemRow({ item, index }: { item: TemplateItem; index: number }) {
  return (
    <div className="px-5 py-3 flex items-start gap-4">
      {/* Index */}
      <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500 pt-0.5 w-5 shrink-0 text-right">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-ink-900 dark:text-ink-50 leading-snug">{item.prompt}</div>

        {/* Metadata badges */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <span className="text-[10px] font-mono text-ink-500 dark:text-ink-400 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
            {ITEM_TYPE_LABELS[item.type]}
          </span>

          {/* Numeric bounds */}
          {item.type === 'numeric' && item.numericMin != null && item.numericMax != null && (
            <span className="text-[10px] font-mono text-ink-500 dark:text-ink-400 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
              {item.numericMin}–{item.numericMax}{item.numericUnit ? ` ${item.numericUnit}` : ''}
            </span>
          )}

          {/* Single select options */}
          {item.type === 'single_select' && item.options && (
            <span className="text-[10px] font-mono text-ink-500 dark:text-ink-400 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
              {item.options.join(' / ')}
            </span>
          )}

          {/* Required */}
          {item.required && (
            <span className="text-[10px] font-medium text-signal-amber px-1.5 py-0.5 rounded bg-signal-amber/10">
              Required
            </span>
          )}

          {/* Photo */}
          {item.photoRequired && (
            <span className="text-[10px] font-medium text-accent-500 px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-500/10">
              📷 Photo
            </span>
          )}

          {/* Observation on fail */}
          {item.observationRequiredOnFail && (
            <span className="text-[10px] text-ink-400 dark:text-ink-500">
              Observation on fail
            </span>
          )}
        </div>

        {/* Reference */}
        {item.reference && (
          <div className="mt-1.5 text-[11px] text-ink-500 dark:text-ink-400 italic">
            Ref: {item.reference}
          </div>
        )}

        {/* Parameter ref */}
        {item.parameterRef && (
          <div className="mt-1 text-[10px] font-mono text-accent-500">
            ← {item.parameterRef}
          </div>
        )}
      </div>
    </div>
  )
}

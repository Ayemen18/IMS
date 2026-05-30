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
import { PageBanner } from '../../components/shell/PageBanner'
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
      <div className="space-y-6">
        <Breadcrumb onBack={() => nav.push('/admin/templates')} />
        <div className="rounded-2xl border border-dashed border-text-secondary/15 bg-white p-16 text-center shadow-soft max-w-[500px] mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-text-secondary/15 bg-accent-light/50 mb-4 animate-bounce">
            <Icon name="alert" className="w-5 h-5 text-status-fail" />
          </div>
          <h2 className="text-[15px] font-bold text-text-primary">
            Template not found
          </h2>
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
            The template ID <span className="font-mono font-bold text-text-primary bg-accent-light px-1 py-0.5 rounded">{templateId}</span> doesn't exist or has been removed.
          </p>
          <button
            onClick={() => nav.push('/admin/templates')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white text-[12px] font-bold rounded-lg transition-all shadow-sm"
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
    <div className="space-y-6">
      {/* Top Breadcrumb row with tags */}
      <div className="flex items-center justify-between">
        <Breadcrumb onBack={() => nav.push('/admin/templates')} templateName={template.name} />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-text-secondary/15 bg-accent-light uppercase tracking-wider text-text-primary">
            <span className={`w-1.5 h-1.5 rounded-sm mr-1 ${type.accent}`} />
            {type.label}
          </span>
          <span className="font-mono text-[10px] font-bold text-text-secondary">v{template.version}</span>
          <StatusPill tone={statusToneFor(template.status)}>{statusLabelFor(template.status)}</StatusPill>
        </div>
      </div>

      {/* ============ Contextual banners ============ */}
      {template.status === 'superseded' && (
        <div className="rounded-xl border border-text-secondary/15 bg-accent-light p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Icon name="layers" className="w-4 h-4 text-text-secondary shrink-0" />
            <p className="text-[12px] text-text-primary font-medium min-w-0">
              This template version has been superseded.{' '}
              {supersededBy && (
                <button
                  onClick={() => nav.push(`/admin/templates/${supersededBy}`)}
                  className="font-bold underline underline-offset-2 hover:text-primary transition-colors"
                >
                  View current version
                </button>
              )}
            </p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary shrink-0 px-2 py-0.5 bg-white rounded-lg border border-text-secondary/15 shadow-soft">
            Read-only
          </span>
        </div>
      )}
      {template.parentVersionId && template.status === 'draft' && (
        <div className="rounded-xl border border-warning/30 bg-warning/15 p-4 flex items-center gap-3 shadow-soft">
          <Icon name="alert" className="w-4 h-4 text-warning shrink-0 animate-pulse" />
          <p className="text-[12px] text-text-primary font-medium">
            This is a draft revision. Publishing it will supersede the currently active version
            {currentPublished && (
              <> (<span className="font-mono font-bold">v{currentPublished.version}</span>)</>
            )}.
          </p>
        </div>
      )}

      {/* Page Banner */}
      <PageBanner
        title={template.name}
        subline={template.summary || "No summary provided for this template lineage."}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm"
            >
              <Icon name="layers" className="w-3.5 h-3.5" />
              Duplicate
            </button>
            {template.status === 'archived' && (
              <button
                onClick={handleRestore}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-pass hover:bg-status-pass/90 text-white text-[12px] font-bold transition-all shadow-sm"
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                Restore
              </button>
            )}
            {(template.status === 'published' || template.status === 'draft') && (
              <button
                onClick={() => setConfirmArchive(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm hover:bg-white/15"
              >
                <Icon name="box" className="w-3.5 h-3.5" />
                Archive
              </button>
            )}
            {template.status === 'published' && (
              <button
                onClick={handleEditNewRevision}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm"
              >
                <Icon name="settings" className="w-3.5 h-3.5" />
                New Revision
              </button>
            )}
            {template.status === 'draft' && (
              <>
                <button
                  onClick={() => setPublishModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-pass hover:bg-status-pass/90 text-white text-[12px] font-bold transition-all shadow-sm"
                >
                  <Icon name="arrow_up_right" className="w-3.5 h-3.5" />
                  Publish…
                </button>
                <button
                  onClick={() => nav.push(`/admin/templates/${template.id}/edit`)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm"
                >
                  <Icon name="settings" className="w-3.5 h-3.5" />
                  Edit Draft
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Summary tags strip */}
      {template.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mr-1">Tags:</span>
          {template.tags.map((tag) => (
            <span key={tag} className="text-[11px] font-mono font-bold text-text-primary px-2 py-0.5 rounded-lg bg-white border border-text-secondary/15 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ============ Stat row ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
        <Stat label="Sections"        value={String(template.sections.length)} />
        <Stat label="Total Items"     value={String(template.itemCount)} />
        <Stat label="Required"        value={`${requiredCount} / ${template.itemCount}`} />
        <Stat label="Photo Required"  value={String(photoRequiredCount)} />
        <Stat label="Last Updated"    value={formatRelativeTime(template.updatedAt)} />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Structure — main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-[18px] font-bold text-text-primary">
                Structure
              </h2>
              <p className="text-[12px] text-text-secondary mt-0.5">
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
            className="w-full rounded-2xl border border-text-secondary/15 bg-white px-5 py-4 flex items-center justify-between text-left hover:bg-accent-light/50 transition-all shadow-soft group"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-text-primary">Version History</div>
              <div className="text-[12px] text-text-secondary mt-0.5">
                {lineageCount} version{lineageCount === 1 ? '' : 's'} in this lineage
              </div>
            </div>
            <Icon
              name="arrow_right"
              className="w-5 h-5 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>

          {/* Details card */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Details</div>
            </div>
            <dl className="divide-y divide-text-secondary/15">
              <Field label="Template ID"     value={template.id} mono />
              <Field label="Version"         value={`v${template.version}`} mono />
              <Field label="Inspection type" value={INSPECTION_TYPES[template.inspectionType].label} />
              <Field label="Created"         value={formatDate(template.createdAt)} />
              <Field label="Last updated"    value={formatDate(template.updatedAt)} />
            </dl>
          </div>

          {/* Owner card */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Owner</div>
            </div>
            <div className="px-5 py-4 flex items-center gap-3">
              <Avatar name={template.ownerName} />
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-text-primary truncate">{template.ownerName}</div>
                <div className="text-[11px] font-mono text-text-secondary truncate">{template.ownerId}</div>
              </div>
            </div>
          </div>

          {/* Sites card */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-text-primary">Sites</div>
                <span className="bg-accent-light text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-text-secondary/15">
                  {template.siteIds.length === 0 ? 'All' : template.siteIds.length}
                </span>
              </div>
            </div>
            {template.siteIds.length === 0 ? (
              <div className="px-5 py-4 text-[12px] text-text-secondary font-medium">
                Applies to all sites.
              </div>
            ) : (
              <div className="divide-y divide-text-secondary/15">
                {template.siteIds.map((siteId) => (
                  <div key={siteId} className="px-5 py-3 flex items-center gap-3 hover:bg-accent-light/20 transition-colors">
                    <div className="w-7 h-7 rounded-lg border border-text-secondary/15 flex items-center justify-center text-text-primary bg-accent-light">
                      <Icon name="box" className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[12px] font-mono text-text-primary font-bold">{siteId}</div>
                  </div>
                ))}
              </div>
            )}
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-bold hover:bg-status-fail/90 transition-colors"
            >
              Archive
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
    <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
      <span className="uppercase text-[10px] tracking-wider text-text-secondary">System Admin</span>
      <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
      <button
        onClick={onBack}
        className="hover:text-text-primary transition-colors"
      >
        Templates
      </button>
      {templateName && (
        <>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-primary truncate max-w-[300px]">{templateName}</span>
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

function SectionCard({ section, index }: { section: TemplateSection; index: number }) {
  return (
    <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
      {/* Section header */}
      <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg border border-text-secondary/15 bg-white text-[10px] font-mono font-bold text-text-primary">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-text-primary">{section.title}</div>
            {section.description && (
              <div className="text-[12px] text-text-secondary mt-0.5">{section.description}</div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary shrink-0">
            {section.items.length} item{section.items.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-text-secondary/15">
        {section.items.map((item, itemIdx) => (
          <ItemRow key={item.id} item={item} index={itemIdx} />
        ))}
      </div>
    </div>
  )
}

function ItemRow({ item, index }: { item: TemplateItem; index: number }) {
  return (
    <div className="px-5 py-3.5 flex items-start gap-4 hover:bg-accent-light/20 transition-colors">
      {/* Index */}
      <span className="text-[10px] font-mono text-text-secondary pt-0.5 w-5 shrink-0 text-right">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary leading-snug font-medium">{item.prompt}</div>

        {/* Metadata badges */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <span className="text-[10px] font-mono font-bold text-text-primary px-1.5 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
            {ITEM_TYPE_LABELS[item.type]}
          </span>

          {/* Numeric bounds */}
          {item.type === 'numeric' && item.numericMin != null && item.numericMax != null && (
            <span className="text-[10px] font-mono font-bold text-text-primary px-1.5 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
              {item.numericMin}–{item.numericMax}{item.numericUnit ? ` ${item.numericUnit}` : ''}
            </span>
          )}

          {/* Single select options */}
          {item.type === 'single_select' && item.options && (
            <span className="text-[10px] font-mono font-bold text-text-primary px-1.5 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
              {item.options.join(' / ')}
            </span>
          )}

          {/* Required */}
          {item.required && (
            <span className="text-[10px] font-bold text-warning px-1.5 py-0.5 rounded bg-warning/15 border border-warning/30 shadow-soft">
              Required
            </span>
          )}

          {/* Photo */}
          {item.photoRequired && (
            <span className="text-[10px] font-bold text-text-primary px-1.5 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
              📷 Photo
            </span>
          )}

          {/* Observation on fail */}
          {item.observationRequiredOnFail && (
            <span className="text-[10px] font-bold text-text-secondary">
              Observation on fail
            </span>
          )}
        </div>

        {/* Reference */}
        {item.reference && (
          <div className="mt-1.5 text-[11px] text-text-secondary italic font-medium">
            Ref: {item.reference}
          </div>
        )}

        {/* Parameter ref */}
        {item.parameterRef && (
          <div className="mt-1 text-[10px] font-mono font-bold text-text-primary">
            ← {item.parameterRef}
          </div>
        )}
      </div>
    </div>
  )
}

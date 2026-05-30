import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTemplates, INSPECTION_TYPES } from '../../lib/templates'
import {
  useTemplateEditor,
  makeBlankTemplate,
  loadAutosavedDraft,
} from '../../lib/templateEditor'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'
import { SectionBlock } from '../../components/templateBuilder/SectionBlock'
import type { Template, InspectionTypeKey } from '../../types/template'

export function TemplateBuilderPage() {
  const { templateId } = useParams<{ templateId?: string }>()
  const navigate = useNavigate()
  const { getById, add, update } = useTemplates()

  // Resolve initial template: existing, autosaved draft, or fresh
  const [initialTemplate, setInitialTemplate] = useState<Template | null>(null)
  const [isNewTemplate, setIsNewTemplate] = useState(false)

  useEffect(() => {
    if (templateId) {
      const existing = getById(templateId)
      if (existing) {
        const autosaved = loadAutosavedDraft(existing.id)
        // Prefer autosave if it differs from existing (recovery scenario)
        if (autosaved && JSON.stringify(autosaved) !== JSON.stringify(existing)) {
          setInitialTemplate(autosaved)
        } else {
          setInitialTemplate(existing)
        }
        setIsNewTemplate(false)
      } else {
        setInitialTemplate(null)
      }
    } else {
      setInitialTemplate(makeBlankTemplate())
      setIsNewTemplate(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  if (initialTemplate === null && templateId) {
    return (
      <div className="px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-dashed border-text-secondary/15 bg-white p-16 text-center max-w-[500px] mx-auto shadow-soft">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-text-secondary/15 bg-accent-light/50 mb-4 animate-bounce">
            <Icon name="alert" className="w-5 h-5 text-status-fail" />
          </div>
          <h2 className="text-[15px] font-bold text-text-primary">
            Template not found
          </h2>
          <button
            onClick={() => navigate('/admin/templates')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white text-[12px] font-bold rounded-lg transition-all shadow-sm"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
            Back to templates
          </button>
        </div>
      </div>
    )
  }

  if (!initialTemplate) return null

  return (
    <BuilderInner
      initial={initialTemplate}
      isNew={isNewTemplate}
      onSave={(t) => {
        if (isNewTemplate) add(t)
        else update(t.id, t)
      }}
      onExit={() => {
        if (isNewTemplate && initialTemplate.id) {
          navigate(`/admin/templates/${initialTemplate.id}`)
        } else if (!isNewTemplate) {
          navigate(`/admin/templates/${initialTemplate.id}`)
        } else {
          navigate('/admin/templates')
        }
      }}
      onCancelNew={() => navigate('/admin/templates')}
    />
  )
}

/* ============================================================
 * Inner — runs the editor for a known initial template
 * ============================================================ */

function BuilderInner({
  initial,
  isNew,
  onSave,
  onExit,
  onCancelNew,
}: {
  initial: Template
  isNew: boolean
  onSave: (t: Template) => void
  onExit: () => void
  onCancelNew: () => void
}) {
  const { draft, dispatch, isDirty, markClean, validate } = useTemplateEditor(initial)
  const [saving, setSaving] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Outer sensors for sections
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleSectionDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = draft.sections.findIndex((s) => s.id === active.id)
    const newIndex = draft.sections.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const next = [...draft.sections]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    dispatch({ type: 'reorderSections', orderedIds: next.map((s) => s.id) })
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      setErrorMessage(err)
      return
    }
    setErrorMessage(null)
    setSaving(true)
    // Simulate latency for the save state feel
    setTimeout(() => {
      onSave(draft)
      markClean()
      setSaving(false)
      if (isNew) {
        onExit()
      }
    }, 320)
  }

  const handleExitAttempt = () => {
    if (isDirty) setConfirmExit(true)
    else {
      if (isNew) onCancelNew()
      else onExit()
    }
  }

  const handleConfirmExit = () => {
    setConfirmExit(false)
    if (isNew) onCancelNew()
    else onExit()
  }

  return (
    <div className="pb-24">
      {/* ============ Builder toolbar ============ */}
      <div className="sticky top-0 z-40 -mx-6 lg:-mx-8 mb-6 px-6 lg:px-8 py-3 bg-white/90 backdrop-blur-md border-b border-text-secondary/15 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-w-[920px] mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleExitAttempt}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-bold text-text-secondary hover:text-text-primary hover:bg-accent-light transition-colors"
            >
              <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
              {isNew ? 'Discard' : 'Back'}
            </button>
            <div className="w-px h-5 bg-accent-light" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary shrink-0">
                {isNew ? 'New Template' : 'Editing'}
              </span>
              <span className="text-[12px] font-mono font-bold text-text-primary truncate max-w-[280px]">
                {draft.name || 'untitled'}
              </span>
              <span className="font-mono text-[10px] font-bold text-text-secondary shrink-0">v{draft.version}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <SaveStateBadge isDirty={isDirty} saving={saving} />
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-white text-[12px] font-bold hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? 'Saving…' : isNew ? 'Create Template' : 'Save Changes'}
              {!saving && <Icon name="check" className="w-3.5 h-3.5 text-warning" />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-2 flex items-center gap-2 text-[12px] font-bold text-status-fail animate-fade-in max-w-[920px] mx-auto bg-status-fail/10 px-3 py-1.5 rounded-lg border border-status-fail/20">
            <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />
            {errorMessage}
          </div>
        )}
      </div>

      {/* ============ Metadata header ============ */}
      <div className="max-w-[920px] mx-auto stagger relative z-0 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <InspectionTypeSelect
            value={draft.inspectionType}
            onChange={(v) => dispatch({ type: 'init', template: { ...draft, inspectionType: v } })}
          />
          <StatusPill tone={draft.status === 'published' ? 'green' : draft.status === 'draft' ? 'amber' : 'neutral'}>
            {draft.status === 'published' ? 'Published' : draft.status === 'draft' ? 'Draft' : 'Archived'}
          </StatusPill>
        </div>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => dispatch({ type: 'setName', value: e.target.value })}
          placeholder="Template Name"
          className="w-full bg-transparent font-bold text-[32px] leading-tight tracking-tight text-text-primary placeholder:text-text-secondary outline-none focus:outline-none transition-all"
        />
        <textarea
          value={draft.summary}
          onChange={(e) => dispatch({ type: 'setSummary', value: e.target.value })}
          placeholder="Brief description of this template's purpose…"
          rows={2}
          className="w-full bg-transparent text-[14px] leading-relaxed text-text-secondary placeholder:text-text-secondary outline-none focus:outline-none transition-all resize-none font-medium"
        />

        {/* ============ Sections ============ */}
        <div className="mt-8 space-y-6">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={draft.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {draft.sections.map((section, idx) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  index={idx}
                  onUpdateSection={(patch) => dispatch({ type: 'updateSection', sectionId: section.id, patch })}
                  onUpdateItem={(itemId, patch) => dispatch({ type: 'updateItem', sectionId: section.id, itemId, patch })}
                  onRemoveItem={(itemId) => dispatch({ type: 'removeItem', sectionId: section.id, itemId })}
                  onDuplicateItem={(itemId) => dispatch({ type: 'duplicateItem', sectionId: section.id, itemId })}
                  onAddItem={(afterItemId) => dispatch({ type: 'addItem', sectionId: section.id, afterItemId })}
                  onReorderItems={(orderedIds) => dispatch({ type: 'reorderItems', sectionId: section.id, orderedIds })}
                  onRemoveSection={() => dispatch({ type: 'removeSection', sectionId: section.id })}
                  onDuplicateSection={() => dispatch({ type: 'duplicateSection', sectionId: section.id })}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={() => dispatch({ type: 'addSection' })}
            className="w-full py-4 rounded-2xl border border-dashed border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:text-text-primary hover:bg-accent-light transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Icon name="plus" className="w-4 h-4 text-text-secondary" />
            Add another section
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent-light/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-text-secondary/15 shadow-2xl max-w-[400px] w-full p-6 animate-fade-up">
            <h3 className="text-[16px] font-bold text-text-primary">Unsaved changes</h3>
            <p className="mt-2 text-[13px] text-text-secondary font-medium leading-relaxed">
              You have unsaved changes. They are saved locally in your browser, but won't be visible to others until you save. Are you sure you want to leave?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="px-4 py-2 rounded-lg text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-bold hover:bg-status-fail/90 transition-colors"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function SaveStateBadge({ isDirty, saving }: { isDirty: boolean; saving: boolean }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-text-secondary animate-fade-in">
        <Icon name="activity" className="w-3.5 h-3.5 animate-pulse" />
        Saving…
      </span>
    )
  }
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-warning animate-fade-in">
        <Icon name="dot" className="w-3.5 h-3.5" />
        Unsaved changes
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-status-pass animate-fade-in">
      <Icon name="check" className="w-3 h-3" />
      Saved
    </span>
  )
}

function InspectionTypeSelect({
  value,
  onChange,
}: {
  value: InspectionTypeKey
  onChange: (v: InspectionTypeKey) => void
}) {
  const current = INSPECTION_TYPES[value]
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as InspectionTypeKey)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {Object.values(INSPECTION_TYPES).map((t) => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-text-secondary/15 bg-white pointer-events-none font-bold text-[10px] uppercase tracking-wider text-text-primary shadow-sm">
        <span className={`w-1.5 h-1.5 rounded-sm ${current.accent}`} />
        {current.label}
        <Icon name="chevron_down" className="w-3 h-3 ml-0.5 text-text-secondary" />
      </div>
    </div>
  )
}

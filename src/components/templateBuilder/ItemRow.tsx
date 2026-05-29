import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from '../primitives/Icon'
import { ItemTypeMenu } from './ItemTypeMenu'
import { ParameterPickerModal } from './ParameterPickerModal'
import { useParameters } from '../../lib/parameters'
import type { TemplateItem, TemplateItemType } from '../../types/template'
import type { Parameter } from '../../types/parameter'

interface ItemRowProps {
  item: TemplateItem
  index: number
  onUpdate: (patch: Partial<TemplateItem>) => void
  onRemove: () => void
  onDuplicate: () => void
  onAddBelow: () => void
}

export function ItemRow({ item, index, onUpdate, onRemove, onDuplicate, onAddBelow }: ItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [expanded, setExpanded] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 'auto' as any,
  }

  const { getById } = useParameters()
  const [pickerOpen, setPickerOpen] = useState(false)

  const linkedParameter = item.parameterRef ? getById(item.parameterRef) : undefined
  const hasBounds = item.numericMin != null || item.numericMax != null
  const showAffordances = item.type === 'numeric' || item.type === 'single_select'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-ink-900 ${
        isDragging ? 'shadow-2xl ring-1 ring-ink-200 dark:ring-ink-700' : ''
      }`}
    >
      {/* Accent stripe for linked items */}
      {linkedParameter && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent-500 rounded-l-md pointer-events-none" />
      )}

      <div className="grid grid-cols-[24px_24px_1fr_auto] gap-3 items-start px-5 py-3.5">
        {/* Drag handle */}
        <button
          type="button"
          className="mt-1 w-6 h-6 rounded flex items-center justify-center text-ink-300 dark:text-ink-600 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon />
        </button>

        {/* Index */}
        <div className="mt-2 font-mono text-[10px] text-ink-400 dark:text-ink-500 text-right">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Content */}
        <div className="min-w-0">
          {/* Prompt input */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={item.prompt}
                onChange={(e) => onUpdate({ prompt: e.target.value })}
                placeholder="Enter the question or check…"
                className="w-full bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none focus:outline-none border-b border-transparent focus:border-ink-300 dark:focus:border-ink-600 transition-colors pb-0.5"
              />
              {linkedParameter && (
                <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-1 italic">
                  Editing locally — changes won't sync to library
                </div>
              )}
            </div>
            {item.required && (
              <span className="text-signal-red font-mono text-[11px] mt-0.5 shrink-0" title="Required">*</span>
            )}
          </div>

          {/* Type-specific affordances */}
          {showAffordances && (
            <div className="mt-2">
              {item.type === 'numeric' && (
                <div className="inline-flex items-center gap-1.5 text-[11px]">
                  <span className="text-ink-500 dark:text-ink-400 font-mono">range:</span>
                  <input
                    type="number"
                    value={item.numericMin ?? ''}
                    onChange={(e) => onUpdate({ numericMin: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="min"
                    className="w-14 px-1.5 py-0.5 rounded border hairline bg-ink-50 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-mono text-[11px] focus-ring"
                  />
                  <span className="text-ink-400 dark:text-ink-500">—</span>
                  <input
                    type="number"
                    value={item.numericMax ?? ''}
                    onChange={(e) => onUpdate({ numericMax: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="max"
                    className="w-14 px-1.5 py-0.5 rounded border hairline bg-ink-50 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-mono text-[11px] focus-ring"
                  />
                  <input
                    type="text"
                    value={item.numericUnit ?? ''}
                    onChange={(e) => onUpdate({ numericUnit: e.target.value || undefined })}
                    placeholder="unit"
                    className="w-16 px-1.5 py-0.5 rounded border hairline bg-ink-50 dark:bg-ink-800 text-ink-900 dark:text-ink-50 font-mono text-[11px] focus-ring"
                  />
                  {hasBounds && (
                    <button
                      type="button"
                      onClick={() => onUpdate({ numericMin: undefined, numericMax: undefined, numericUnit: undefined })}
                      className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors ml-1"
                      title="Clear bounds"
                    >
                      <Icon name="close" className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              {item.type === 'single_select' && (
                <OptionsEditor
                  options={item.options ?? []}
                  onChange={(opts) => onUpdate({ options: opts })}
                />
              )}
            </div>
          )}

          {/* Expanded options */}
          {expanded && (
            <div className="mt-3 p-3 rounded-md border hairline bg-ink-50/50 dark:bg-ink-950/30 space-y-2.5">
              <ToggleRow
                label="Required"
                hint="Inspector cannot submit without answering"
                checked={item.required}
                onChange={(v) => onUpdate({ required: v })}
              />
              <ToggleRow
                label="Photo required"
                hint="Inspector must attach a photo"
                checked={item.photoRequired}
                onChange={(v) => onUpdate({ photoRequired: v })}
              />
              <ToggleRow
                label="Observation required on Fail / N/A"
                hint="A note must accompany non-Pass answers"
                checked={item.observationRequiredOnFail}
                onChange={(v) => onUpdate({ observationRequiredOnFail: v })}
                disabled={item.type !== 'pass_fail_na'}
              />
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">
                  Reference <span className="normal-case font-normal tracking-normal text-ink-400 dark:text-ink-500">— SOP, regulation, etc.</span>
                </label>
                <input
                  type="text"
                  value={item.reference ?? ''}
                  onChange={(e) => onUpdate({ reference: e.target.value || undefined })}
                  placeholder="e.g. SOP-QA-014 § 3.2"
                  className="w-full px-2 py-1.5 rounded border hairline bg-white dark:bg-ink-800 text-[12px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus-ring font-mono"
                />
              </div>
            </div>
          )}

          {/* Modifier chips when not expanded */}
          {!expanded && (item.photoRequired || item.reference) && (
            <div className="mt-1.5 flex items-center gap-2.5 flex-wrap text-[10px] text-ink-500 dark:text-ink-400">
              {item.photoRequired && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Icon name="eye" className="w-3 h-3" /> photo required
                </span>
              )}
              {item.reference && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Icon name="file" className="w-3 h-3" /> {item.reference}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right column: type + actions */}
        <div className="flex items-center gap-1">
          {linkedParameter && (
            <span
              className="mr-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-500/10 text-[10px] font-mono text-accent-700 dark:text-accent-400 border border-accent-500/20"
              title="Linked to parameter library"
            >
              <Icon name="cube_3d" className="w-3 h-3" />
              {linkedParameter.code}
            </span>
          )}
          <ItemTypeMenu
            value={item.type}
            onChange={(next: TemplateItemType) => {
              const patch: Partial<TemplateItem> = { type: next }
              if (next !== 'numeric') {
                patch.numericMin = undefined
                patch.numericMax = undefined
                patch.numericUnit = undefined
              }
              if (next !== 'single_select') {
                patch.options = undefined
              }
              onUpdate(patch)
            }}
          />
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              expanded
                ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                : 'text-ink-400 dark:text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-50'
            }`}
            aria-label="Toggle options"
          >
            <Icon name="settings" className="w-3.5 h-3.5" />
          </button>
          <RowMenu
            onAddBelow={onAddBelow}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            isLinked={!!linkedParameter}
            onOpenPicker={() => setPickerOpen(true)}
            onBreakLink={() => onUpdate({ parameterRef: undefined })}
          />
        </div>
      </div>
      
      <ParameterPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(p: Parameter) => {
          onUpdate({
            parameterRef: p.id,
            prompt: p.prompt,
            type: p.type,
            numericMin: p.numericMin,
            numericMax: p.numericMax,
            numericUnit: p.numericUnit,
            options: p.options,
            reference: p.reference,
            photoRequired: p.photoRequired,
            observationRequiredOnFail: p.observationRequiredOnFail,
          })
          setPickerOpen(false)
        }}
      />
    </div>
  )
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function DragHandleIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="2" cy="2"  r="1" fill="currentColor" />
      <circle cx="8" cy="2"  r="1" fill="currentColor" />
      <circle cx="2" cy="7"  r="1" fill="currentColor" />
      <circle cx="8" cy="7"  r="1" fill="currentColor" />
      <circle cx="2" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-3.5 h-3.5 rounded border-ink-300 dark:border-ink-600 accent-ink-900 dark:accent-ink-50"
      />
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-ink-900 dark:text-ink-50">{label}</div>
        <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">{hint}</div>
      </div>
    </label>
  )
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const addOption = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (options.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...options, trimmed])
    setDraft('')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map((opt) => (
          <span
            key={opt}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-700 dark:text-ink-200 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800"
          >
            {opt}
            <button
              type="button"
              onClick={() => onChange(options.filter((o) => o !== opt))}
              className="text-ink-400 dark:text-ink-500 hover:text-signal-red transition-colors"
              aria-label={`Remove ${opt}`}
            >
              <Icon name="close" className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addOption()
            }
          }}
          placeholder="Add option and press Enter"
          className="flex-1 px-2 py-1 rounded border hairline bg-white dark:bg-ink-800 text-[11px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus-ring font-mono"
        />
      </div>
    </div>
  )
}

function RowMenu({
  onAddBelow,
  onDuplicate,
  onRemove,
  isLinked,
  onOpenPicker,
  onBreakLink,
}: {
  onAddBelow: () => void
  onDuplicate: () => void
  onRemove: () => void
  isLinked: boolean
  onOpenPicker: () => void
  onBreakLink: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onBlur={(e) => {
      // Close when focus leaves the wrapper entirely
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded flex items-center justify-center text-ink-400 dark:text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
        aria-label="More actions"
      >
        <Icon name="chevron_down" className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-[180px] rounded-lg border hairline bg-white dark:bg-ink-900 shadow-xl overflow-hidden animate-fade-in">
          {isLinked ? (
            <MenuItem icon="close"  label="Break link"     onClick={() => { onBreakLink(); setOpen(false) }} />
          ) : (
            <MenuItem icon="cube_3d" label="From library"   onClick={() => { onOpenPicker(); setOpen(false) }} />
          )}
          <div className="border-t hairline" />
          <MenuItem icon="plus"   label="Add item below" onClick={() => { onAddBelow(); setOpen(false) }} />
          <MenuItem icon="layers" label="Duplicate"      onClick={() => { onDuplicate(); setOpen(false) }} />
          <div className="border-t hairline" />
          <MenuItem icon="close"  label="Delete"         onClick={() => { onRemove(); setOpen(false) }} destructive />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: 'plus' | 'layers' | 'close' | 'cube_3d'
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] transition-colors ${
        destructive
          ? 'text-signal-red hover:bg-signal-red/5'
          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800/60'
      }`}
    >
      <Icon name={icon} className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

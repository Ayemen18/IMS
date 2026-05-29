import { useState } from 'react'
import { Modal } from '../primitives/Modal'
import { Icon } from '../primitives/Icon'
import { nextVersion } from '../../lib/templates'
import type { Template } from '../../types/template'

interface PublishTemplateModalProps {
  open: boolean
  template: Template | null
  /** The currently-published version in the lineage, if any. */
  currentPublished: Template | null
  onClose: () => void
  onConfirm: (opts: { bump: 'major' | 'minor'; note: string }) => void
  submitting?: boolean
}

export function PublishTemplateModal({
  open,
  template,
  currentPublished,
  onClose,
  onConfirm,
  submitting,
}: PublishTemplateModalProps) {
  const [bump, setBump] = useState<'major' | 'minor'>('minor')
  const [note, setNote] = useState('')

  if (!template) return null

  const isFirstPublish = !currentPublished
  const targetVersion = isFirstPublish
    ? '1.0'
    : nextVersion(currentPublished.version, bump)

  return (
    <Modal
      open={open}
      onClose={() => {
        if (submitting) return
        setNote('')
        setBump('minor')
        onClose()
      }}
      title="Publish this template?"
      description={
        isFirstPublish
          ? 'This is the first published version. It becomes immediately available for inspections.'
          : `Publishing replaces the currently active version (v${currentPublished.version}). The previous version will be marked as superseded but kept for audit history.`
      }
      size="md"
      dismissOnBackdrop={!submitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ bump, note: note.trim() })}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-signal-green text-white text-[13px] font-medium hover:bg-signal-green/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Publishing…' : `Publish v${targetVersion}`}
            {!submitting && <Icon name="arrow_right" className="w-3.5 h-3.5" />}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Version bump choice — only if not first publish */}
        {!isFirstPublish && (
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">
              Version bump
            </label>
            <div className="grid grid-cols-2 gap-2">
              <BumpOption
                selected={bump === 'minor'}
                onSelect={() => setBump('minor')}
                title="Minor"
                target={nextVersion(currentPublished!.version, 'minor')}
                hint="Bug fixes, wording, small tweaks"
              />
              <BumpOption
                selected={bump === 'major'}
                onSelect={() => setBump('major')}
                title="Major"
                target={nextVersion(currentPublished!.version, 'major')}
                hint="Structural changes, new items, retired CCPs"
              />
            </div>
          </div>
        )}

        {/* Changelog note */}
        <div>
          <label htmlFor="publish-note" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">
            Changelog note{' '}
            <span className="normal-case font-normal tracking-normal text-ink-400 dark:text-ink-500">
              — recommended
            </span>
          </label>
          <textarea
            id="publish-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed in this version? e.g. 'Added Fe test piece check, tightened CCP-2 upper bound from 78°C to 76°C.'"
            rows={3}
            className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
          />
          <p className="mt-1.5 text-[11px] text-ink-500 dark:text-ink-400">
            This note appears in the version history and on the published template's detail page.
          </p>
        </div>

        {/* Summary card */}
        <div className="rounded-md border hairline bg-ink-50/50 dark:bg-ink-950/30 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink-500 dark:text-ink-400">Template</span>
            <span className="text-ink-900 dark:text-ink-50 truncate max-w-[280px] text-right">{template.name}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink-500 dark:text-ink-400">Current version</span>
            <span className="font-mono text-ink-900 dark:text-ink-50">
              {isFirstPublish ? '—' : `v${currentPublished.version}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink-500 dark:text-ink-400">Publishing as</span>
            <span className="font-mono text-signal-green">v{targetVersion}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink-500 dark:text-ink-400">Sections / items</span>
            <span className="font-mono text-ink-900 dark:text-ink-50">
              {template.sections.length} / {template.itemCount}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function BumpOption({
  selected, onSelect, title, target, hint,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  target: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left p-3 rounded-md border transition-all ${
        selected
          ? 'border-ink-900 dark:border-ink-50 bg-ink-50 dark:bg-ink-800'
          : 'border-black/[0.06] dark:border-white/[0.08] hover:border-ink-300 dark:hover:border-ink-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">{title}</div>
        <div className="font-mono text-[11px] text-signal-green">v{target}</div>
      </div>
      <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-1">{hint}</div>
    </button>
  )
}

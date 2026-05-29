import { useState, useMemo } from 'react'
import { formatRelativeTime } from '../../lib/inspections'
import { getResponseSummary, getIssueSummary } from '../../types/inspection'
import type { Inspection } from '../../types/inspection'
import type { Template } from '../../types/template'
import { Icon } from '../primitives/Icon'
import { Avatar } from '../primitives/Avatar'
import { AttentionStack, AnswerChip } from './AttentionStack'

interface PreviewPaneProps {
  inspection: Inspection | null
  template: Template | undefined
  onApprove: () => void
  onReject: () => void
  onViewFull: () => void
}

export function PreviewPane({ inspection, template, onApprove, onReject, onViewFull }: PreviewPaneProps) {
  const [showAll, setShowAll] = useState(false)

  // Reset showAll when inspection changes
  useMemo(() => {
    setShowAll(false)
  }, [inspection?.id])

  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-500 p-8">
        <Icon name="search" className="w-8 h-8 mb-4 opacity-50" />
        <p>Select an inspection to review</p>
      </div>
    )
  }

  const responseSummary = getResponseSummary(inspection)
  const issueSummary = getIssueSummary(inspection)
  
  const hasFails = responseSummary.fail > 0
  const submittedAt = inspection.submittedAt || inspection.updatedAt

  return (
    <div className="flex flex-col h-full bg-white dark:bg-ink-950">
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
        <div className="p-8 max-w-3xl mx-auto space-y-10">
          
          {/* Hero */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-ink-700 dark:text-ink-200 px-2 py-0.5 rounded border hairline bg-ink-50 dark:bg-ink-900/50">
              {inspection.number}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500 dark:text-ink-400">
              <Icon name={inspection.domain === 'quality' ? 'badge' : 'shield'} className="w-3 h-3" />
              {inspection.domain === 'quality' ? 'Quality' : 'Safety'}
            </span>
            <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">v{inspection.templateVersion}</span>
            <span className="text-[11px] text-ink-500 dark:text-ink-400">·</span>
            <span className="text-[11px] text-ink-500 dark:text-ink-400">submitted {formatRelativeTime(submittedAt)}</span>
            
            <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded-full border hairline bg-ink-50 dark:bg-ink-900/50">
              <Avatar name={inspection.inspectorName ?? '?'} size="sm" />
              <span className="text-[11px] font-medium text-ink-700 dark:text-ink-200 mr-1">{inspection.inspectorName ?? 'Unassigned'}</span>
            </div>
          </div>

          {/* Title Row */}
          <div>
            <h2 className="font-display text-[28px] leading-tight tracking-tight text-ink-900 dark:text-ink-50 mb-2">
              {inspection.templateName}
            </h2>
            <div className="text-[13px] text-ink-500 dark:text-ink-400">
              {inspection.siteName}{inspection.area ? ` · ${inspection.area}` : ''}
              <span className="mx-2">·</span>
              {new Date(inspection.scheduledFor).toLocaleDateString()}
            </div>
          </div>

          {/* At-a-glance summary */}
          <div className="grid grid-cols-4 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden h-[80px]">
            <div className="bg-white dark:bg-ink-900 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Items</div>
              <div className="mt-1 font-mono text-[18px] text-ink-900 dark:text-ink-50">{responseSummary.total - responseSummary.skipped} / {responseSummary.total}</div>
            </div>
            <div className="bg-white dark:bg-ink-900 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Pass</div>
              <div className="mt-1 font-mono text-[18px] text-signal-green">{responseSummary.pass}</div>
            </div>
            <div className="bg-white dark:bg-ink-900 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Fail</div>
              <div className={`mt-1 font-mono text-[18px] ${responseSummary.fail > 0 ? 'text-signal-red' : 'text-ink-900 dark:text-ink-50'}`}>{responseSummary.fail}</div>
            </div>
            <div className="bg-white dark:bg-ink-900 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Issues</div>
              <div className="mt-1 font-mono text-[18px] text-ink-900 dark:text-ink-50">{issueSummary.total}</div>
            </div>
          </div>

          {/* Attention Stack */}
          {template ? (
            <AttentionStack responses={inspection.responses} sections={template.sections} />
          ) : (
            <div className="text-[12px] text-ink-500 italic">Template structure unavailable.</div>
          )}

          {/* Other responses toggle */}
          {template && (
            <div className="border-t hairline pt-6 pb-20">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[13px] font-medium text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 transition-colors flex items-center gap-2"
              >
                <Icon name={showAll ? "chevron_down" : "chevron_right"} className="w-4 h-4" />
                {showAll ? 'Hide full responses' : `Show all ${responseSummary.total} responses`}
              </button>
              
              {showAll && (
                <div className="mt-6 space-y-6 animate-fade-in">
                  {template.sections.map(section => (
                    <div key={section.id} className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
                      <div className="px-4 py-2.5 border-b hairline bg-ink-50 dark:bg-ink-800/50 text-[11px] font-medium text-ink-900 dark:text-ink-50">
                        {section.title}
                      </div>
                      <ul className="divide-y hairline">
                        {section.items.map((item) => {
                          const response = inspection.responses.find(r => r.itemId === item.id)
                          return (
                            <li key={item.id} className="px-4 py-2.5 flex items-start justify-between gap-4">
                              <div className="text-[12px] text-ink-900 dark:text-ink-50 flex-1 min-w-0">
                                {item.prompt}
                              </div>
                              <div className="shrink-0 scale-90 origin-right">
                                <AnswerChip answer={response?.answer ?? null} reading={response?.reading} textAnswer={response?.textAnswer} item={item} />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer / Action bar */}
      <div className="shrink-0 border-t hairline bg-white dark:bg-ink-900 p-4 px-6 flex items-center justify-end gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button
          onClick={onViewFull}
          className="mr-auto text-[13px] font-medium text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50 transition-colors"
        >
          Open full inspection
        </button>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReject}
            className="flex items-center gap-2 px-4 py-2 rounded-md border hairline text-[13px] font-medium text-signal-red hover:bg-signal-red/5 transition-colors"
          >
            Reject
            <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-signal-red/30 bg-signal-red/5 text-[10px] font-mono leading-none">r</span>
          </button>
          
          <button
            onClick={onApprove}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-signal-green text-white text-[13px] font-medium hover:bg-signal-green/90 transition-colors"
          >
            {hasFails ? 'Approve with issues' : 'Approve'}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-white/30 bg-white/10 text-[10px] font-mono leading-none">a</span>
          </button>
        </div>
      </div>
    </div>
  )
}

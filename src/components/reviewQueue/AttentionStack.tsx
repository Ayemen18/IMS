import { Icon } from '../primitives/Icon'
import type { InspectionItemResponse } from '../../types/inspection'
import type { TemplateItem, TemplateSection } from '../../types/template'

interface AttentionStackProps {
  responses: InspectionItemResponse[]
  sections: TemplateSection[]
}

export function AttentionStack({ responses, sections }: AttentionStackProps) {
  // Find all items that need attention: fails, N/As with observations, any item with observations
  const attentionItems: { response: InspectionItemResponse, item: TemplateItem, section: TemplateSection }[] = []

  const sectionMap = new Map<string, TemplateSection>()
  const itemMap = new Map<string, TemplateItem>()
  sections.forEach((s: TemplateSection) => {
    sectionMap.set(s.id, s)
    s.items.forEach((i: TemplateItem) => itemMap.set(i.id, i))
  })

  responses.forEach((r: InspectionItemResponse) => {
    const item = itemMap.get(r.itemId)
    if (!item) return
    const section = sections.find((s: TemplateSection) => s.items.some((i: TemplateItem) => i.id === item.id))
    if (!section) return

    const needsAttention = r.answer === 'fail' || !!r.observation
    if (needsAttention) {
      attentionItems.push({ response: r, item, section })
    }
  })

  if (attentionItems.length === 0) return null

  const visibleItems = attentionItems.slice(0, 8)
  const remaining = attentionItems.length - 8

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="alert" className="w-4 h-4 text-signal-red" />
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Worth your attention</h3>
      </div>

      <div className="space-y-4">
        {visibleItems.map(({ response, item, section }) => (
          <div key={item.id} className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-4 py-2 border-b hairline bg-ink-50 dark:bg-ink-800/50 text-[10px] uppercase tracking-[0.12em] text-ink-500 font-medium">
              {section.title}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-ink-900 dark:text-ink-50 leading-snug">
                    {item.prompt}
                  </div>
                  {item.type === 'numeric' && (item.numericMin != null || item.numericMax != null) && (
                    <div className="mt-1 text-[11px] font-mono text-ink-500">
                      Expected: {item.numericMin ?? '−∞'} — {item.numericMax ?? '+∞'} {item.numericUnit ?? ''}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <AnswerChip answer={response.answer} reading={response.reading} textAnswer={response.textAnswer} item={item} />
                </div>
              </div>

              {response.observation && (
                <div className="mt-3 ml-0 pl-3 border-l-2 border-signal-red/40">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-signal-red/80 font-medium">Observation</div>
                  <p className="mt-0.5 text-[12px] text-ink-700 dark:text-ink-200 leading-relaxed">{response.observation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <div className="text-center mt-2 text-[12px] text-ink-500 dark:text-ink-400">
          + {remaining} more items needing attention below
        </div>
      )}
    </div>
  )
}

export function AnswerChip({ answer, reading, textAnswer, item }: { answer: string | null, reading?: number | null, textAnswer?: string, item?: TemplateItem }) {
  if (answer === 'pass') {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-signal-green/10 text-signal-green text-[12px] font-medium">
        <Icon name="check" className="w-3.5 h-3.5" />
        Pass
        {reading != null && <span className="font-mono text-[11px] ml-1 opacity-80">{reading} {item?.numericUnit}</span>}
      </div>
    )
  }
  if (answer === 'fail') {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-signal-red/10 text-signal-red text-[12px] font-medium">
        <Icon name="close" className="w-3.5 h-3.5" />
        Fail
        {reading != null && <span className="font-mono text-[11px] ml-1 opacity-80">{reading} {item?.numericUnit}</span>}
      </div>
    )
  }
  if (answer === 'na') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-300 text-[12px] font-medium">
        N/A
      </div>
    )
  }
  if (textAnswer) {
    return (
      <div className="text-[13px] text-ink-900 dark:text-ink-50 font-medium max-w-[200px] truncate" title={textAnswer}>
        {textAnswer}
      </div>
    )
  }
  return <div className="text-[12px] text-ink-400 dark:text-ink-500 italic">Unanswered</div>
}

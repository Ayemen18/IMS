import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInspections } from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { useSession } from '../../../lib/session'
import { DashboardShell } from '../../../components/shell/DashboardShell'
import { Icon } from '../../../components/primitives/Icon'
import { Modal } from '../../../components/primitives/Modal'
import type { InspectionItemResponse, InspectionDomain } from '../../../types/inspection'
import type { TemplateItem } from '../../../types/template'

// Debounce helper for auto-saving
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function InspectionExecutionPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const navigate = useNavigate()
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { user } = useSession()
  const { getById: getInspection, start, submit, saveResponses, resumeRejected } = useInspections()
  const { getById: getTemplate } = useTemplates()

  const inspection = getInspection(inspectionId!)
  const template = inspection ? getTemplate(inspection.templateId) : undefined

  // Local state for answers to enable snappy UI without waiting for context
  const [localResponses, setLocalResponses] = useState<InspectionItemResponse[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const debouncedResponses = useDebounce(localResponses, 400)

  // Hydrate local responses once
  useEffect(() => {
    if (inspection && localResponses.length === 0 && inspection.responses.length > 0) {
      setLocalResponses(inspection.responses)
    }
  }, [inspection?.id])

  // Execute debounced autosave
  useEffect(() => {
    if (!inspection || inspection.status !== 'in_progress') return
    // Simple deep equivalence check approximation
    if (JSON.stringify(debouncedResponses) !== JSON.stringify(inspection.responses)) {
      if (debouncedResponses.length > 0) {
        saveResponses(inspection.id, debouncedResponses)
        setSaveStatus('saved')
      }
    }
  }, [debouncedResponses, inspection?.id, inspection?.status, saveResponses])

  // Track unsaved changes instantly
  const updateResponse = useCallback((resp: InspectionItemResponse) => {
    setSaveStatus('unsaved')
    setLocalResponses(prev => {
      const idx = prev.findIndex(r => r.itemId === resp.itemId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = resp
        return next
      }
      return [...prev, resp]
    })
  }, [])

  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(() => setSaveStatus('saving'), 300)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const [showSubmitModal, setShowSubmitModal] = useState(false)

  if (!inspection || !template) {
    return (
      <DashboardShell hideSidebar hideTopbar>
        {() => (
          <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
            <div className="text-ink-500">Inspection not found</div>
          </div>
        )}
      </DashboardShell>
    )
  }

  if (!['scheduled', 'in_progress', 'rejected'].includes(inspection.status)) {
    return (
      <DashboardShell hideSidebar hideTopbar>
        {() => (
          <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
            <div className="text-center">
              <h1 className="font-display text-3xl mb-2">This inspection is in {inspection.status.replace('_', ' ')} status.</h1>
              <p className="text-ink-600 mb-6">You can't edit it anymore.</p>
              <button onClick={() => navigate(prefix)} className="btn-primary">Back to My day</button>
            </div>
          </div>
        )}
      </DashboardShell>
    )
  }

  const allItems = useMemo(() => template.sections.flatMap(s => s.items), [template])
  const currentItem = allItems[currentItemIndex]
  const currentSection = template.sections.find(s => s.items.some(i => i.id === currentItem?.id))

  const getResponse = (itemId: string): InspectionItemResponse => {
    return localResponses.find(r => r.itemId === itemId) || { itemId, answer: null, attachments: [] }
  }

  const currentResponse = currentItem ? getResponse(currentItem.id) : null

  const isItemComplete = (item: TemplateItem, resp: InspectionItemResponse) => {
    let valid = false
    if (item.type === 'pass_fail_na') {
      valid = resp.answer !== null
    } else if (item.type === 'numeric') {
      valid = resp.reading !== undefined && resp.reading !== null
    } else if (item.type === 'text') {
      valid = !!resp.textAnswer && resp.textAnswer.trim().length > 0
    } else if (item.type === 'single_select') {
      valid = !!resp.textAnswer
    }

    if (item.observationRequiredOnFail && (resp.answer === 'fail' || resp.answer === 'na')) {
      if (!resp.observation || resp.observation.trim().length === 0) valid = false
    }

    return valid
  }

  const isValidToProceed = () => {
    if (!currentItem || !currentResponse) return true
    if (currentItem.type === 'pass_fail_na' && currentResponse.answer === null) return !currentItem.required
    if (currentItem.type === 'text' && !currentResponse.textAnswer) return !currentItem.required
    if (currentItem.type === 'numeric' && currentResponse.reading === undefined) return !currentItem.required
    if (currentItem.type === 'single_select' && !currentResponse.textAnswer) return !currentItem.required
    
    if (currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na')) {
      if (!currentResponse.observation || currentResponse.observation.trim() === '') return false
    }
    return true
  }

  const canSubmit = allItems.filter(i => i.required).every(i => isItemComplete(i, getResponse(i.id)))

  const handleStart = () => {
    if (user) {
      start(inspection.id, user.email, user.name)
      if (inspection.responses.length > 0) {
        const firstUnanswered = allItems.findIndex(item => !isItemComplete(item, getResponse(item.id)))
        if (firstUnanswered >= 0) setCurrentItemIndex(firstUnanswered)
      }
    }
  }

  const handleResume = () => {
    if (user) resumeRejected(inspection.id, user.email, user.name)
  }

  const handleConfirmSubmit = () => {
    if (user) {
      saveResponses(inspection.id, localResponses)
      submit(inspection.id, user.email, user.name)
      navigate(prefix)
    }
  }

  if (inspection.status === 'scheduled') {
    return (
      <DashboardShell hideSidebar hideTopbar>
        {() => (
          <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
            <div className="max-w-[520px] w-full p-10 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl text-center shadow-sm">
              <h1 className="font-display text-[36px] leading-tight text-ink-900 dark:text-ink-50 mb-4">
                Ready to start this inspection?
              </h1>
              <div className="text-ink-600 dark:text-ink-300 mb-6">
                <div className="font-medium text-ink-900 dark:text-ink-100">{template.name}</div>
                <div>{inspection.area} · {inspection.siteName}</div>
                <div className="text-sm mt-1">Scheduled: {new Date(inspection.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
              </div>
              <div className="text-sm text-ink-500 mb-8 border-t border-ink-100 dark:border-ink-800 pt-4">
                {allItems.length} items across {template.sections.length} sections.
              </div>
              <button 
                onClick={handleStart}
                className="w-full bg-signal-green text-white py-4 rounded-lg font-medium text-lg hover:bg-signal-green/90 transition-colors"
              >
                Start now
              </button>
            </div>
          </div>
        )}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell hideSidebar hideTopbar>
      {() => (
        <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-950">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(prefix)} className="p-2 -ml-2 text-ink-500 hover:text-ink-900 dark:hover:text-ink-50">
                <Icon name="arrow_right" className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-500">{inspection.number}</span>
                  <span className="font-medium text-sm text-ink-900 dark:text-ink-50">{template.name}</span>
                </div>
                <div className="text-xs text-ink-500">{inspection.area} · {inspection.siteName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  saveResponses(inspection.id, localResponses)
                  setSaveStatus('saved')
                }}
                className="px-4 py-2 text-sm font-medium border border-ink-200 dark:border-ink-700 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                Save draft
              </button>
              <button
                disabled={!canSubmit}
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 text-sm font-medium bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit ({allItems.filter(i => isItemComplete(i, getResponse(i.id))).length} of {allItems.filter(i => i.required).length})
              </button>
            </div>
          </header>

          {inspection.status === 'rejected' && (
            <div className="bg-signal-amber/10 border-b border-signal-amber/20 p-4 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-signal-amber font-medium mb-1">
                <Icon name="alert" className="w-5 h-5" />
                <span>Returned for rework</span>
              </div>
              <p className="text-sm text-ink-700 dark:text-ink-300 italic max-w-2xl">
                "{inspection.timeline.find(e => e.action === 'rejected')?.note || 'Your manager sent this back to you.'}"
              </p>
              <button onClick={handleResume} className="mt-3 px-4 py-2 bg-signal-amber text-white font-medium rounded-lg hover:bg-signal-amber/90">
                Resume editing
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 px-6 py-4 sticky top-16 z-10 flex flex-col items-center">
            <div className="max-w-[720px] w-full mx-auto flex flex-col items-center">
              <div className="flex gap-2 w-full overflow-x-auto pt-6 pb-2 scrollbar-hide items-end justify-start sm:justify-center">
                {template.sections.map((section, sIdx) => (
                  <div key={section.id} className="flex gap-1 items-end relative mr-4">
                    <div className="absolute -top-5 left-0 text-[10px] uppercase tracking-wider font-mono text-ink-400 whitespace-nowrap">
                      {section.title}
                    </div>
                    {sIdx > 0 && <div className="w-[2px] h-4 bg-ink-200 dark:bg-ink-700 absolute -left-3" />}
                    {section.items.map(item => {
                      const idx = allItems.findIndex(i => i.id === item.id)
                      const isCurrent = idx === currentItemIndex
                      const resp = getResponse(item.id)
                      
                      let bg = 'bg-transparent'
                      let border = 'border-ink-200 dark:border-ink-700'
                      if (resp.answer === 'pass') { bg = 'bg-signal-green'; border = 'border-signal-green' }
                      else if (resp.answer === 'fail') { bg = 'bg-signal-red'; border = 'border-signal-red' }
                      else if (resp.answer === 'na') { bg = 'bg-ink-500'; border = 'border-ink-500' }
                      else if (isItemComplete(item, resp)) { bg = 'bg-ink-800 dark:bg-ink-200'; border = 'border-ink-800 dark:border-ink-200' }
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentItemIndex(idx)}
                          className={`w-3 h-3 rounded-sm border ${bg} ${border} transition-all ${isCurrent ? 'ring-2 ring-ink-900 dark:ring-ink-50 ring-offset-2 ring-offset-white dark:ring-offset-ink-900 scale-110 mx-1' : 'hover:scale-110'}`}
                          aria-label={`Go to item ${idx + 1}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3 font-mono text-[11px] text-ink-500 w-full text-center">
                Item {currentItemIndex + 1} of {allItems.length} ·{' '}
                <span className="text-signal-green">{localResponses.filter(r => r.answer === 'pass').length} passed</span> ·{' '}
                <span className="text-signal-red">{localResponses.filter(r => r.answer === 'fail').length} failed</span> ·{' '}
                <span className="text-ink-400">{localResponses.filter(r => r.answer === 'na').length} N/A</span> ·{' '}
                {allItems.length - localResponses.filter(r => isItemComplete(allItems.find(i=>i.id===r.itemId)!, r)).length} remaining
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto pointer-events-auto">
            <div className="max-w-[720px] mx-auto px-6 pt-6 pb-32">
              {currentItem && currentSection && currentResponse && (
                <div className="animate-fade-in">
                  <div className="mb-4 text-ink-500 flex items-baseline gap-2">
                    <span className="font-display italic text-[16px]">{currentSection.title}</span>
                    <span className="font-mono text-[11px]">· {template.sections.findIndex(s => s.id === currentSection.id) + 1} of {template.sections.length}</span>
                  </div>
                  
                  <div className="font-mono text-sm text-ink-400 mb-2 flex items-center">
                    Item {String(currentItemIndex + 1).padStart(2, '0')}
                  </div>

                  <h2 className="font-display text-[32px] leading-snug text-ink-900 dark:text-ink-50 mb-8 text-balance">
                    {currentItem.prompt}
                    {currentItem.required && <span className="text-signal-red font-mono text-[16px] ml-1">*</span>}
                  </h2>

                  <div className="mb-8">
                    {currentItem.type === 'pass_fail_na' && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => updateResponse({ ...currentResponse, answer: 'pass' })}
                          className={`flex-1 py-6 px-8 min-h-[80px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all outline-none ${currentResponse.answer === 'pass' ? 'bg-signal-green border-signal-green text-white' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-signal-green/10 hover:border-signal-green/30 border-l-[6px] hover:border-l-[6px] border-l-signal-green'}`}
                        >
                          <Icon name="check" className={`w-8 h-8 ${currentResponse.answer === 'pass' ? '' : 'text-signal-green'}`} />
                          <span className="font-medium tracking-wide">PASS</span>
                        </button>
                        <button
                          onClick={() => updateResponse({ ...currentResponse, answer: 'fail' })}
                          className={`flex-1 py-6 px-8 min-h-[80px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all outline-none ${currentResponse.answer === 'fail' ? 'bg-signal-red border-signal-red text-white' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-signal-red/10 hover:border-signal-red/30 border-l-[6px] hover:border-l-[6px] border-l-signal-red'}`}
                        >
                          <Icon name="close" className={`w-8 h-8 ${currentResponse.answer === 'fail' ? '' : 'text-signal-red'}`} />
                          <span className="font-medium tracking-wide">FAIL</span>
                        </button>
                        <button
                          onClick={() => updateResponse({ ...currentResponse, answer: 'na' })}
                          className={`flex-1 py-6 px-8 min-h-[80px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all outline-none ${currentResponse.answer === 'na' ? 'bg-ink-600 dark:bg-ink-400 border-ink-600 dark:border-ink-400 text-white dark:text-ink-900' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 border-l-[6px] hover:border-l-[6px] border-l-ink-400'}`}
                        >
                          <span className="font-medium tracking-wide">N/A</span>
                        </button>
                      </div>
                    )}

                    {currentItem.type === 'numeric' && (
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-2 font-mono">Enter reading</div>
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            value={currentResponse.reading ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value)
                              let autoAnswer: 'pass' | 'fail' | null = null
                              if (val !== undefined && currentItem.numericMin !== undefined && currentItem.numericMax !== undefined) {
                                autoAnswer = (val >= currentItem.numericMin && val <= currentItem.numericMax) ? 'pass' : 'fail'
                              }
                              updateResponse({ ...currentResponse, reading: val, answer: autoAnswer })
                            }}
                            className="text-center font-display text-[40px] w-48 bg-transparent border-b-2 border-ink-200 dark:border-ink-700 focus:border-accent-500 outline-none pb-2"
                            placeholder="0.0"
                          />
                          {currentItem.numericUnit && (
                            <span className="absolute -right-12 bottom-4 text-ink-400 font-mono bg-ink-100 dark:bg-ink-800 px-2 py-1 rounded text-sm">
                              {currentItem.numericUnit}
                            </span>
                          )}
                        </div>
                        {currentResponse.reading !== undefined && currentItem.numericMin !== undefined && currentItem.numericMax !== undefined && (
                          <div className={`mt-4 flex items-center gap-2 text-sm font-mono ${currentResponse.answer === 'pass' ? 'text-signal-green' : 'text-signal-red'}`}>
                            {currentResponse.answer === 'pass' ? (
                              <><Icon name="check" className="w-4 h-4" /> Within range</>
                            ) : (
                              <><Icon name="dot" className="w-4 h-4" /> Out of range — enter an observation explaining why.</>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {currentItem.type === 'text' && (
                      <div className="flex flex-col">
                        <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-2 font-mono">Your answer</div>
                        <textarea
                          value={currentResponse.textAnswer ?? ''}
                          onChange={(e) => updateResponse({ ...currentResponse, textAnswer: e.target.value })}
                          className="w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-lg p-4 focus-ring min-h-[120px] resize-none"
                          placeholder="Type your answer here..."
                        />
                      </div>
                    )}

                    {currentItem.type === 'single_select' && currentItem.options && (
                      <div className="flex flex-col gap-2">
                        {currentItem.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => updateResponse({ ...currentResponse, textAnswer: opt, answer: 'pass' })}
                            className={`w-full text-left py-4 px-6 rounded-lg border transition-all relative overflow-hidden ${currentResponse.textAnswer === opt ? 'border-ink-900 dark:border-ink-50 bg-ink-50 dark:bg-ink-800/50 text-ink-900 dark:text-ink-50 font-medium' : 'border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'}`}
                          >
                            {currentResponse.textAnswer === opt && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-ink-900 dark:bg-ink-50" />}
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${currentResponse.textAnswer === opt ? 'border-ink-900 dark:border-ink-50' : 'border-ink-300 dark:border-ink-600'}`}>
                                {currentResponse.textAnswer === opt && <div className="w-2 h-2 rounded-full bg-ink-900 dark:bg-ink-50" />}
                              </div>
                              {opt}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {(currentItem.numericMin !== undefined || currentItem.reference) && (
                    <div className="mb-8 space-y-2">
                      {currentItem.numericMin !== undefined && currentItem.numericMax !== undefined && (
                        <div className="text-ink-500 font-mono text-xs bg-ink-100 dark:bg-ink-800/50 py-2 px-3 rounded inline-block mr-2">
                          Range: {currentItem.numericMin} — {currentItem.numericMax} {currentItem.numericUnit}
                        </div>
                      )}
                      {currentItem.reference && (
                        <div className="text-ink-500 font-mono text-xs flex items-center gap-1.5 bg-ink-100 dark:bg-ink-800/50 py-2 px-3 rounded inline-block">
                          <Icon name="file" className="w-3.5 h-3.5" /> Reference: {currentItem.reference}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-8">
                    <label className={`block text-sm font-medium mb-2 ${currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') && (!currentResponse.observation || currentResponse.observation.trim() === '') ? 'text-signal-red' : 'text-ink-900 dark:text-ink-100'}`}>
                      Observation
                    </label>
                    <textarea
                      value={currentResponse.observation ?? ''}
                      onChange={(e) => updateResponse({ ...currentResponse, observation: e.target.value })}
                      className={`w-full bg-white dark:bg-ink-900 border rounded-lg p-3 focus-ring resize-none min-h-[80px] ${currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') ? 'border-ink-200 dark:border-ink-700 border-l-2 border-l-signal-red bg-signal-red/5' : 'border-ink-200 dark:border-ink-700'}`}
                      placeholder="Add an observation..."
                    />
                    <div className={`text-xs mt-2 flex items-center gap-1 ${currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') && (!currentResponse.observation || currentResponse.observation.trim() === '') ? 'text-signal-red font-medium' : 'text-ink-500'}`}>
                      {currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') && (!currentResponse.observation || currentResponse.observation.trim() === '') ? (
                        <><Icon name="alert" className="w-3 h-3" /> Observation required to continue.</>
                      ) : (
                        `Required when answer is Fail or N/A.`
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex gap-3 mb-4">
                      <button 
                        onClick={() => updateResponse({ ...currentResponse, attachments: [...currentResponse.attachments, `photo_${Date.now()}.jpg`] })}
                        className="flex items-center gap-2 px-4 py-2 border border-ink-200 dark:border-ink-700 rounded-lg text-sm font-medium hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200"
                      >
                        <Icon name="eye" className="w-4 h-4" /> Take photo
                      </button>
                      <button 
                        onClick={() => updateResponse({ ...currentResponse, attachments: [...currentResponse.attachments, `file_${Date.now()}.pdf`] })}
                        className="flex items-center gap-2 px-4 py-2 border border-ink-200 dark:border-ink-700 rounded-lg text-sm font-medium hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200"
                      >
                        <Icon name="file" className="w-4 h-4" /> Attach file
                      </button>
                    </div>
                    {currentResponse.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {currentResponse.attachments.map(att => (
                          <div key={att} className="flex items-center gap-2 px-3 py-1.5 bg-ink-100 dark:bg-ink-800 rounded font-mono text-xs text-ink-700 dark:text-ink-300">
                            <span>{att}</span>
                            <button 
                              onClick={() => updateResponse({ ...currentResponse, attachments: currentResponse.attachments.filter(a => a !== att) })}
                              className="text-ink-400 hover:text-signal-red"
                            >
                              <Icon name="close" className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>

          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800 px-6 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-30">
            <div className="max-w-[720px] mx-auto w-full flex items-center justify-between">
              <button 
                disabled={currentItemIndex === 0}
                onClick={() => setCurrentItemIndex(prev => prev - 1)}
                className="px-6 py-3 border border-ink-200 dark:border-ink-700 rounded-lg font-medium text-ink-700 dark:text-ink-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink-50 dark:hover:bg-ink-800 flex items-center gap-2"
              >
                <Icon name="arrow_right" className="w-4 h-4 rotate-180" />
                Previous
              </button>

              <div className="text-sm font-mono flex items-center gap-2">
                {saveStatus === 'saved' && <span className="text-signal-green">Saved</span>}
                {saveStatus === 'saving' && <span className="text-ink-500 flex items-center gap-1"><span className="animate-pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-ink-400" /> Saving…</span>}
                {saveStatus === 'unsaved' && <span className="text-signal-amber">Unsaved changes</span>}
              </div>

              {currentItemIndex === allItems.length - 1 ? (
                <button 
                  disabled={!isValidToProceed()}
                  onClick={() => setShowSubmitModal(true)}
                  className="px-8 py-3 bg-signal-green text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-signal-green/90 transition-colors flex items-center gap-2"
                >
                  Submit <Icon name="check" className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  disabled={!isValidToProceed()}
                  onClick={() => setCurrentItemIndex(prev => prev + 1)}
                  className="px-8 py-3 bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900 rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-colors flex items-center gap-2"
                >
                  Next <Icon name="arrow_right" className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <Modal
            open={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            title="Submit this inspection?"
            size="md"
          >
            <div className="p-6">
              <p className="text-ink-600 dark:text-ink-300 mb-6">
                Your responses will be sent to {inspection.managerName} for review. You'll be notified when they approve or send it back.
              </p>
              
              <div className="bg-ink-50 dark:bg-ink-900/50 border border-ink-200 dark:border-ink-800 rounded-lg p-5 space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">Total items:</span>
                  <span className="text-ink-900 dark:text-ink-50">{allItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Passes:</span>
                  <span className="text-signal-green font-display text-[20px] leading-none">{localResponses.filter(r => r.answer === 'pass').length}</span>
                </div>
                {localResponses.filter(r => r.answer === 'fail').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-500">Fails:</span>
                    <span className="text-signal-red font-display text-[20px] leading-none">{localResponses.filter(r => r.answer === 'fail').length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-500">N/As:</span>
                  <span className="text-ink-500 font-display text-[20px] leading-none">{localResponses.filter(r => r.answer === 'na').length}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-ink-200 dark:border-ink-800 mt-2">
                  <span className="text-ink-500">Items with photos:</span>
                  <span className="text-ink-900 dark:text-ink-50">{localResponses.filter(r => r.attachments.length > 0).length}</span>
                </div>
              </div>

              {localResponses.filter(r => r.answer === 'fail').length > 0 && (
                <div className="mt-4 flex items-start gap-2 text-sm text-ink-600 dark:text-ink-400 bg-signal-amber/10 p-3 rounded-lg border border-signal-amber/20">
                  <Icon name="alert" className="w-4 h-4 text-signal-amber shrink-0 mt-0.5" />
                  <span>{localResponses.filter(r => r.answer === 'fail').length} issues will be created and assigned to your {domain === 'safety' ? 'Safety Manager' : 'Quality Manager'} for review.</span>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg">
                  Cancel
                </button>
                <button onClick={handleConfirmSubmit} className="px-6 py-2 text-sm font-medium bg-signal-green text-white rounded-lg hover:bg-signal-green/90">
                  Submit
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </DashboardShell>
  )
}

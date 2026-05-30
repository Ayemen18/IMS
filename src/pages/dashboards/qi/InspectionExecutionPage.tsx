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
          <div className="flex h-screen items-center justify-center bg-accent-light">
            <div className="text-text-secondary">Inspection not found</div>
          </div>
        )}
      </DashboardShell>
    )
  }

  if (!['scheduled', 'in_progress', 'rejected'].includes(inspection.status)) {
    return (
      <DashboardShell hideSidebar hideTopbar>
        {() => (
          <div className="flex h-screen items-center justify-center bg-accent-light">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-text-primary mb-2">This inspection is in {inspection.status.replace('_', ' ')} status.</h1>
              <p className="text-text-secondary mb-6">You can't edit it anymore.</p>
              <button onClick={() => navigate(prefix)} className="btn-primary">Back to My Day</button>
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
          <div className="flex h-screen items-center justify-center bg-accent-light">
            <div className="max-w-[520px] w-full p-10 bg-white border border-text-secondary/15 rounded-2xl text-center shadow-soft">
              <h1 className="text-[32px] font-bold tracking-tight leading-tight text-text-primary mb-4">
                Ready to start this inspection?
              </h1>
              <div className="text-text-secondary mb-6 space-y-1">
                <div className="font-bold text-text-primary text-lg">{template.name}</div>
                <div className="font-medium">{inspection.area} · {inspection.siteName}</div>
                <div className="text-sm font-medium mt-1">Scheduled: {new Date(inspection.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
              </div>
              <div className="text-sm text-text-secondary font-bold uppercase tracking-wider mb-8 border-t border-text-secondary/15 pt-4">
                {allItems.length} items across {template.sections.length} sections.
              </div>
              <button 
                onClick={handleStart}
                className="w-full bg-warning text-text-primary py-3.5 rounded-xl font-bold text-[15px] hover:bg-warning/90 transition-colors shadow-sm"
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
        <div className="min-h-screen flex flex-col bg-accent-light">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 bg-white border-b border-text-secondary/15">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(prefix)} className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors">
                <Icon name="arrow_right" className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-secondary font-bold">{inspection.number}</span>
                  <span className="font-bold text-sm text-text-primary">{template.name}</span>
                </div>
                <div className="text-xs text-text-secondary font-medium">{inspection.area} · {inspection.siteName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  saveResponses(inspection.id, localResponses)
                  setSaveStatus('saved')
                }}
                className="px-4 py-2 text-sm font-bold border border-text-secondary/15 rounded-lg hover:bg-accent-light text-text-primary transition-colors bg-white shadow-sm"
              >
                Save draft
              </button>
              <button
                disabled={!canSubmit}
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors shadow-sm"
              >
                Submit ({allItems.filter(i => isItemComplete(i, getResponse(i.id))).length} of {allItems.filter(i => i.required).length})
              </button>
            </div>
          </header>

          {inspection.status === 'rejected' && (
            <div className="bg-warning/10 border-b border-warning/20 p-4 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-warning font-bold mb-1">
                <Icon name="alert" className="w-5 h-5" />
                <span>Returned for rework</span>
              </div>
              <p className="text-sm text-text-primary font-medium italic max-w-2xl">
                "{inspection.timeline.find(e => e.action === 'rejected')?.note || 'Your manager sent this back to you.'}"
              </p>
              <button onClick={handleResume} className="mt-3 px-4 py-2 bg-warning text-text-primary font-bold rounded-lg hover:bg-warning/90 transition-colors shadow-sm">
                Resume editing
              </button>
            </div>
          )}

          <div className="bg-white border-b border-text-secondary/15 px-6 py-4 sticky top-16 z-10 flex flex-col items-center">
            <div className="max-w-[720px] w-full mx-auto flex flex-col items-center">
              <div className="flex gap-2 w-full overflow-x-auto pt-6 pb-2 scrollbar-hide items-end justify-start sm:justify-center">
                {template.sections.map((section, sIdx) => (
                  <div key={section.id} className="flex gap-1 items-end relative mr-4">
                    <div className="absolute -top-5 left-0 text-[10px] uppercase tracking-wider font-mono text-text-secondary whitespace-nowrap font-bold">
                      {section.title}
                    </div>
                    {sIdx > 0 && <div className="w-[2px] h-4 bg-accent-light absolute -left-3" />}
                    {section.items.map(item => {
                      const idx = allItems.findIndex(i => i.id === item.id)
                      const isCurrent = idx === currentItemIndex
                      const resp = getResponse(item.id)
                      
                      let bg = 'bg-transparent'
                      let border = 'border-text-secondary/15'
                      if (resp.answer === 'pass') { bg = 'bg-status-pass'; border = 'border-status-pass' }
                      else if (resp.answer === 'fail') { bg = 'bg-status-fail'; border = 'border-status-fail' }
                      else if (resp.answer === 'na') { bg = 'bg-accent-light'; border = 'border-text-secondary/15' }
                      else if (isItemComplete(item, resp)) { bg = 'bg-accent-light'; border = 'border-text-secondary/15' }
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentItemIndex(idx)}
                          className={`w-3 h-3 rounded-sm border ${bg} ${border} transition-all ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-white scale-110 mx-1' : 'hover:scale-110'}`}
                          aria-label={`Go to item ${idx + 1}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3 font-mono text-[11px] text-text-secondary w-full text-center font-bold">
                Item {currentItemIndex + 1} of {allItems.length} ·{' '}
                <span className="text-status-pass">{localResponses.filter(r => r.answer === 'pass').length} passed</span> ·{' '}
                <span className="text-status-fail">{localResponses.filter(r => r.answer === 'fail').length} failed</span> ·{' '}
                <span className="text-text-secondary">{localResponses.filter(r => r.answer === 'na').length} N/A</span> ·{' '}
                {allItems.length - localResponses.filter(r => isItemComplete(allItems.find(i=>i.id===r.itemId)!, r)).length} remaining
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto pointer-events-auto">
            <div className="max-w-[720px] mx-auto px-6 pt-6 pb-32">
              {currentItem && currentSection && currentResponse && (
                <div className="animate-fade-in">
                  <div className="mb-4 text-text-secondary flex items-baseline gap-2">
                    <span className="text-[14px] font-bold text-text-primary">{currentSection.title}</span>
                    <span className="font-mono text-[11px] font-bold">· {template.sections.findIndex(s => s.id === currentSection.id) + 1} of {template.sections.length}</span>
                  </div>
                  
                  <div className="font-mono text-xs text-text-secondary mb-2 flex items-center font-bold">
                    Item {String(currentItemIndex + 1).padStart(2, '0')}
                  </div>

                  <h2 className="text-[28px] font-bold leading-snug text-text-primary mb-8 text-balance">
                    {currentItem.prompt}
                    {currentItem.required && <span className="text-status-fail font-mono text-[16px] ml-1">*</span>}
                  </h2>

                  <div className="mb-8">
                    {currentItem.type === 'pass_fail_na' && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => updateResponse({ ...currentResponse, answer: 'pass' })}
                          className={`flex-1 py-6 px-8 min-h-[80px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all outline-none ${currentResponse.answer === 'pass' ? 'bg-status-pass border-status-pass text-white' : 'border-text-secondary/15 text-text-secondary bg-white hover:bg-status-pass/10 hover:border-status-pass/30 border-l-[6px] hover:border-l-[6px] border-l-status-pass font-bold'}`}
                        >
                          <Icon name="check" className={`w-8 h-8 ${currentResponse.answer === 'pass' ? '' : 'text-status-pass'}`} />
                          <span className="font-bold tracking-wide">PASS</span>
                        </button>
                        <button
                          onClick={() => updateResponse({ ...currentResponse, answer: 'fail' })}
                          className={`flex-1 py-6 px-8 min-h-[80px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all outline-none ${currentResponse.answer === 'fail' ? 'bg-status-fail border-status-fail text-white' : 'border-text-secondary/15 text-text-secondary bg-white hover:bg-status-fail/10 hover:border-status-fail/30 border-l-[6px] hover:border-l-[6px] border-l-status-fail font-bold'}`}
                        >
                          <Icon name="close" className={`w-8 h-8 ${currentResponse.answer === 'fail' ? '' : 'text-status-fail'}`} />
                          <span className="font-bold tracking-wide">FAIL</span>
                        </button>
                        <button
                          onClick={() => updateResponse({ ...currentResponse, answer: 'na' })}
                          className={`flex-1 py-6 px-8 min-h-[80px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all outline-none ${currentResponse.answer === 'na' ? 'bg-text-secondary border-text-secondary text-white' : 'border-text-secondary/15 text-text-secondary bg-white hover:bg-text-secondary/10 hover:border-text-secondary/30 border-l-[6px] hover:border-l-[6px] border-l-text-secondary font-bold'}`}
                        >
                          <span className="font-bold tracking-wide">N/A</span>
                        </button>
                      </div>
                    )}

                    {currentItem.type === 'numeric' && (
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-mono font-bold">Enter reading</div>
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
                            className="text-center font-bold text-[36px] w-48 bg-transparent border-b-2 border-text-secondary/15 focus:border-primary/20 outline-none pb-2"
                            placeholder="0.0"
                          />
                          {currentItem.numericUnit && (
                            <span className="absolute -right-12 bottom-4 text-text-secondary font-mono bg-accent-light px-2 py-1 rounded text-xs font-bold">
                              {currentItem.numericUnit}
                            </span>
                          )}
                        </div>
                        {currentResponse.reading !== undefined && currentItem.numericMin !== undefined && currentItem.numericMax !== undefined && (
                          <div className={`mt-4 flex items-center gap-2 text-sm font-mono font-bold ${currentResponse.answer === 'pass' ? 'text-status-pass' : 'text-status-fail'}`}>
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
                        <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-mono font-bold">Your answer</div>
                        <textarea
                          value={currentResponse.textAnswer ?? ''}
                          onChange={(e) => updateResponse({ ...currentResponse, textAnswer: e.target.value })}
                          className="w-full bg-white border border-text-secondary/15 rounded-lg p-4 focus-ring min-h-[120px] resize-none text-[13px] text-text-primary font-medium"
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
                            className={`w-full text-left py-4 px-6 rounded-lg border transition-all relative overflow-hidden ${currentResponse.textAnswer === opt ? 'border-primary/20 bg-accent-light text-text-primary font-bold' : 'border-text-secondary/15 text-text-secondary hover:bg-accent-light bg-white'}`}
                          >
                            {currentResponse.textAnswer === opt && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${currentResponse.textAnswer === opt ? 'border-primary/20' : 'border-text-secondary/15'}`}>
                                {currentResponse.textAnswer === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
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
                        <div className="text-text-secondary font-mono text-xs bg-accent-light py-2 px-3 rounded inline-block mr-2 font-bold">
                          Range: {currentItem.numericMin} — {currentItem.numericMax} {currentItem.numericUnit}
                        </div>
                      )}
                      {currentItem.reference && (
                        <div className="text-text-secondary font-mono text-xs flex items-center gap-1.5 bg-accent-light py-2 px-3 rounded inline-block font-bold">
                          <Icon name="file" className="w-3.5 h-3.5 text-text-secondary" /> Reference: {currentItem.reference}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-8">
                    <label className={`block text-sm font-bold mb-2 ${currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') && (!currentResponse.observation || currentResponse.observation.trim() === '') ? 'text-status-fail' : 'text-text-primary'}`}>
                      Observation
                    </label>
                    <textarea
                      value={currentResponse.observation ?? ''}
                      onChange={(e) => updateResponse({ ...currentResponse, observation: e.target.value })}
                      className={`w-full bg-white border rounded-lg p-3 focus-ring resize-none min-h-[80px] ${currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') ? 'border-text-secondary/15 border-l-2 border-l-status-fail bg-status-fail/5' : 'border-text-secondary/15'}`}
                      placeholder="Add an observation..."
                    />
                    <div className={`text-xs mt-2 flex items-center gap-1 ${currentItem.observationRequiredOnFail && (currentResponse.answer === 'fail' || currentResponse.answer === 'na') && (!currentResponse.observation || currentResponse.observation.trim() === '') ? 'text-status-fail font-bold' : 'text-text-secondary font-medium'}`}>
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
                        className="flex items-center gap-2 px-4 py-2 border border-text-secondary/15 rounded-lg text-sm font-bold hover:bg-accent-light text-text-secondary bg-white"
                      >
                        <Icon name="eye" className="w-4 h-4" /> Take photo
                      </button>
                      <button 
                        onClick={() => updateResponse({ ...currentResponse, attachments: [...currentResponse.attachments, `file_${Date.now()}.pdf`] })}
                        className="flex items-center gap-2 px-4 py-2 border border-text-secondary/15 rounded-lg text-sm font-bold hover:bg-accent-light text-text-secondary bg-white"
                      >
                        <Icon name="file" className="w-4 h-4" /> Attach file
                      </button>
                    </div>
                    {currentResponse.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {currentResponse.attachments.map(att => (
                          <div key={att} className="flex items-center gap-2 px-3 py-1.5 bg-accent-light rounded font-mono text-xs text-text-primary font-bold border border-text-secondary/15">
                            <span>{att}</span>
                            <button 
                              onClick={() => updateResponse({ ...currentResponse, attachments: currentResponse.attachments.filter(a => a !== att) })}
                              className="text-text-secondary hover:text-status-fail"
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

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-text-secondary/15 px-6 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-30">
            <div className="max-w-[720px] mx-auto w-full flex items-center justify-between">
              <button 
                disabled={currentItemIndex === 0}
                onClick={() => setCurrentItemIndex(prev => prev - 1)}
                className="px-6 py-3 border border-text-secondary/15 rounded-lg font-bold text-text-secondary bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-light flex items-center gap-2 transition-all shadow-sm"
              >
                <Icon name="arrow_right" className="w-4 h-4 rotate-180" />
                Previous
              </button>

              <div className="text-sm font-mono flex items-center gap-2 font-bold">
                {saveStatus === 'saved' && <span className="text-status-pass">Saved</span>}
                {saveStatus === 'saving' && <span className="text-text-secondary flex items-center gap-1"><span className="animate-pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-accent-light" /> Saving…</span>}
                {saveStatus === 'unsaved' && <span className="text-warning">Unsaved changes</span>}
              </div>

              {currentItemIndex === allItems.length - 1 ? (
                <button 
                  disabled={!isValidToProceed()}
                  onClick={() => setShowSubmitModal(true)}
                  className="px-8 py-3 bg-warning hover:bg-warning/90 text-text-primary rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm animate-pulse"
                >
                  Submit <Icon name="check" className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  disabled={!isValidToProceed()}
                  onClick={() => setCurrentItemIndex(prev => prev + 1)}
                  className="px-8 py-3 bg-primary text-white rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition-colors flex items-center gap-2 shadow-sm"
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
              <p className="text-text-secondary mb-6 font-medium leading-relaxed">
                Your responses will be sent to {inspection.managerName} for review. You'll be notified when they approve or send it back.
              </p>
              
              <div className="bg-accent-light border border-text-secondary/15 rounded-xl p-5 space-y-3 font-mono text-sm shadow-inner font-bold">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total items:</span>
                  <span className="text-text-primary">{allItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Passes:</span>
                  <span className="text-status-pass text-[18px] leading-none">{localResponses.filter(r => r.answer === 'pass').length}</span>
                </div>
                {localResponses.filter(r => r.answer === 'fail').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Fails:</span>
                    <span className="text-status-fail text-[18px] leading-none">{localResponses.filter(r => r.answer === 'fail').length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">N/As:</span>
                  <span className="text-text-secondary text-[18px] leading-none">{localResponses.filter(r => r.answer === 'na').length}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-text-secondary/15 mt-2">
                  <span className="text-text-secondary">Items with photos:</span>
                  <span className="text-text-primary">{localResponses.filter(r => r.attachments.length > 0).length}</span>
                </div>
              </div>

              {localResponses.filter(r => r.answer === 'fail').length > 0 && (
                <div className="mt-4 flex items-start gap-2 text-sm text-text-secondary bg-warning/10 p-3 rounded-lg border border-warning/20 shadow-sm">
                  <Icon name="alert" className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>{localResponses.filter(r => r.answer === 'fail').length} issues will be created and assigned to your {domain === 'safety' ? 'Safety Manager' : 'Quality Manager'} for review.</span>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 text-sm font-bold hover:bg-accent-light rounded-lg text-text-secondary border border-transparent transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmSubmit} className="px-6 py-2 text-sm font-bold bg-status-pass hover:bg-status-pass/90 text-white rounded-lg transition-colors shadow-sm">
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

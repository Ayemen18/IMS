import { useState, useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatClockTime } from '../../../lib/inspections'
import { useRecurrenceRules, formatRuleSummary } from '../../../lib/recurrence'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import { Avatar } from '../../../components/primitives/Avatar'
import { RecurrenceRuleModal } from '../../../components/admin/RecurrenceRuleModal'
import type { RecurrenceRule } from '../../../types/recurrence'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'

type ViewMode = 'calendar' | 'rules'
type RuleFilter = 'all' | 'active' | 'paused' | 'archived'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

function getWeekDates(start: Date): Date[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatWeekRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = end.getFullYear()
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
}

export function SchedulePage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/sm' : '/qm'
  const { user } = useSession()
  const { inspections } = useInspections()
  const { rules, add, update, setStatus } = useRecurrenceRules()

  const [view, setView] = useState<ViewMode>('calendar')
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDateIso, setSelectedDateIso] = useState(() => toIsoDate(new Date()))

  // Rules state
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>('all')
  const [ruleQuery, setRuleQuery] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurrenceRule | null>(null)

  // Calendar derivations
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate])
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekEnd = weekDates[6]
  
  const inspectionsForWeek = useMemo(() => {
    const startIso = toIsoDate(weekStart)
    const endIso = toIsoDate(weekEnd)
    return inspections.filter(i => {
      if (i.domain !== domain) return false
      if (!i.scheduledFor) return false
      const d = i.scheduledFor.split('T')[0]
      return d >= startIso && d <= endIso
    })
  }, [inspections, weekStart, weekEnd])

  const inspectionsByDay = useMemo(() => {
    const map = new Map<string, Inspection[]>()
    weekDates.forEach(d => map.set(toIsoDate(d), []))
    inspectionsForWeek.forEach(i => {
      const d = i.scheduledFor!.split('T')[0]
      if (map.has(d)) {
        map.get(d)!.push(i)
      }
    })
    return map
  }, [inspectionsForWeek, weekDates])

  const handlePrevWeek = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() - 7)
    setCurrentDate(next)
  }

  const handleNextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 7)
    setCurrentDate(next)
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDateIso(toIsoDate(today))
  }

  const handleDayClick = (iso: string) => {
    setSelectedDateIso(iso)
    // In a real app we might scroll to the day group
    const el = document.getElementById(`day-${iso}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Rules derivations
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (ruleFilter !== 'all' && r.status !== ruleFilter) return false
      if (ruleQuery) {
        const q = ruleQuery.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.templateName.toLowerCase().includes(q) && !r.siteName.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [rules, ruleFilter, ruleQuery])

  // Handlers
  const handleSaveRule = (patch: Partial<RecurrenceRule>) => {
    if (!user) return
    if (editingRule) {
      update(editingRule.id, patch)
    } else {
      add({
        ...patch,
        id: `rule_${Date.now()}`,
        status: 'active',
        changelog: [{
          id: `chg_${Date.now()}`,
          at: new Date().toISOString(),
          byId: user.email,
          byName: user.name,
          action: 'created',
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as RecurrenceRule)
    }
    setModalOpen(false)
    setEditingRule(null)
  }

  const handleStatusToggle = (e: React.MouseEvent, rule: RecurrenceRule, nextStatus: 'active' | 'paused' | 'archived') => {
    e.stopPropagation()
    if (!user) return
    setStatus(rule.id, nextStatus, user.email, user.name)
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-3">
            <span>{domain === 'safety' ? 'Safety Manager' : 'Quality Manager'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Schedule</span>
          </div>
          <h1 className="font-display text-4xl text-ink-900 dark:text-ink-50 tracking-tight mb-2">
            Inspection <span className="italic text-ink-500 dark:text-ink-400">schedule</span>.
          </h1>
          <p className="text-[14px] text-ink-600 dark:text-ink-300">
            {inspectionsForWeek.length} inspections upcoming this week · {rules.filter(r => r.status === 'active').length} active rules
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex p-1 rounded-md border hairline bg-ink-50 dark:bg-ink-900/50">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 text-[12px] font-medium rounded transition-colors ${
                view === 'calendar' ? 'bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-sm' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('rules')}
              className={`px-4 py-1.5 text-[12px] font-medium rounded transition-colors ${
                view === 'rules' ? 'bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-sm' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              Rules
            </button>
          </div>
          
          <button
            onClick={() => { setEditingRule(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-md text-[13px] font-medium hover:bg-accent-600 transition-colors shadow-sm"
          >
            <Icon name="plus" className="w-4 h-4" />
            New rule
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="space-y-8">
          {/* Week Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevWeek} className="p-1.5 hover:bg-ink-50 dark:hover:bg-ink-900 rounded text-ink-500 transition-colors">
                <Icon name="arrow_left" className="w-4 h-4" />
              </button>
              <button onClick={handleNextWeek} className="p-1.5 hover:bg-ink-50 dark:hover:bg-ink-900 rounded text-ink-500 transition-colors">
                <Icon name="arrow_right" className="w-4 h-4" />
              </button>
              <h2 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 ml-2">
                {formatWeekRange(weekStart, weekEnd)}
              </h2>
            </div>
            <button onClick={handleToday} className="text-[12px] font-medium text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors px-3 py-1.5 rounded-md border hairline hover:bg-ink-50 dark:hover:bg-ink-900">
              Today
            </button>
          </div>

          {/* Week Strip */}
          <div className="grid grid-cols-7 border hairline rounded-xl overflow-hidden bg-white dark:bg-ink-900/50 shadow-sm">
            {weekDates.map((date) => {
              const iso = toIsoDate(date)
              const isToday = iso === toIsoDate(new Date())
              const isSelected = iso === selectedDateIso
              const dayInspections = inspectionsByDay.get(iso) || []
              
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNum = date.getDate()
              
              return (
                <button
                  key={iso}
                  onClick={() => handleDayClick(iso)}
                  className={`flex flex-col items-center p-4 border-r last:border-r-0 hairline hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors relative h-32 ${isSelected ? 'bg-ink-50 dark:bg-ink-800' : ''}`}
                >
                  {isToday && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-ink-900 dark:bg-ink-50" />
                  )}
                  <span className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${isToday || isSelected ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-400'}`}>
                    {dayName}
                  </span>
                  <span className={`font-display text-3xl mb-4 ${isToday ? 'text-ink-900 dark:text-ink-50' : 'text-ink-700 dark:text-ink-200'}`}>
                    {dayNum}
                  </span>
                  
                  {/* Density dots */}
                  <div className="flex flex-col items-center gap-1">
                    {dayInspections.slice(0, 5).map((insp, idx) => {
                      const tone = STATUS_TONE[insp.status]
                      const color = tone === 'green' ? 'bg-signal-green' : tone === 'amber' ? 'bg-signal-amber' : tone === 'red' ? 'bg-signal-red' : 'bg-ink-300 dark:bg-ink-600'
                      return (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${color}`} />
                      )
                    })}
                    {dayInspections.length > 5 && (
                      <span className="text-[10px] text-ink-400 font-medium">+{dayInspections.length - 5}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* List of inspections for the week */}
          <div className="space-y-10 pt-4">
            {weekDates.map(date => {
              const iso = toIsoDate(date)
              const items = inspectionsByDay.get(iso) || []
              if (items.length === 0) return null
              
              const isToday = iso === toIsoDate(new Date())
              const dayStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
              
              return (
                <div key={iso} id={`day-${iso}`} className="scroll-mt-8">
                  <h3 className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mb-4 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-ink-300 dark:bg-ink-600" />
                    {dayStr}
                  </h3>
                  <div className="space-y-2">
                    {items.sort((a,b) => (a.scheduledFor||'').localeCompare(b.scheduledFor||'')).map(insp => (
                      <div
                        key={insp.id}
                        onClick={() => nav.push(`${prefix}/inspections/${insp.id}`)}
                        className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border hairline bg-white dark:bg-ink-900/50 hover:border-ink-300 dark:hover:border-ink-600 cursor-pointer transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex flex-col gap-1 mb-3 md:mb-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] text-ink-500">{insp.id}</span>
                            <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700" />
                            <span className="text-[13px] text-ink-500 font-mono">
                              {insp.scheduledFor ? formatClockTime(insp.scheduledFor) : '—'}
                            </span>
                            {insp.status === 'issues_open' && (
                              <Icon name="alert" className="w-3.5 h-3.5 text-signal-red" />
                            )}
                          </div>
                          <h4 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 group-hover:text-accent-500 transition-colors">
                            {insp.templateName}
                          </h4>
                          <div className="text-[13px] text-ink-500 flex items-center gap-2">
                            <span>{insp.siteName}</span>
                            {insp.area && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700" />
                                <span>{insp.area}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-[13px]">
                            {insp.inspectorName ? (
                              <>
                                <Avatar name={insp.inspectorName} size="sm" />
                                <span className="text-ink-700 dark:text-ink-300 hidden md:inline">{insp.inspectorName}</span>
                              </>
                            ) : (
                              <span className="italic text-ink-400">Unassigned</span>
                            )}
                          </div>
                          <div className="w-[100px] flex justify-end">
                            <StatusPill tone={STATUS_TONE[insp.status]}>{STATUS_LABEL[insp.status]}</StatusPill>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {inspectionsForWeek.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border hairline border-dashed rounded-xl text-center">
                <div className="w-12 h-12 bg-ink-50 dark:bg-ink-900 rounded-full flex items-center justify-center mb-4 text-ink-400">
                  <Icon name="calendar" className="w-6 h-6" />
                </div>
                <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-1">No inspections scheduled</h3>
                <p className="text-[13px] text-ink-500">There are no inspections scheduled for this week.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rules Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex p-1 rounded-md border hairline bg-ink-50 dark:bg-ink-900/50 w-full md:w-auto">
              {(['all', 'active', 'paused', 'archived'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setRuleFilter(filter)}
                  className={`flex-1 md:px-4 py-1.5 text-[12px] font-medium rounded transition-colors capitalize ${
                    ruleFilter === filter ? 'bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-sm' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-64">
              <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search rules..."
                value={ruleQuery}
                onChange={(e) => setRuleQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] focus-ring"
              />
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2">
            {filteredRules.map(rule => (
              <div
                key={rule.id}
                onClick={() => { setEditingRule(rule); setModalOpen(true) }}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border hairline bg-white dark:bg-ink-900/50 hover:border-ink-300 dark:hover:border-ink-600 cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col gap-1 mb-3 md:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 group-hover:text-accent-500 transition-colors">
                      {rule.name}
                    </h4>
                    {rule.status === 'paused' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-signal-amber/10 text-signal-amber border border-signal-amber/20">
                        Paused
                      </span>
                    )}
                    {rule.status === 'archived' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 border border-ink-200 dark:border-ink-700">
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-ink-500">
                    {rule.templateName} <span className="font-mono ml-1">v{rule.templateVersion}</span>
                  </div>
                  <div className="text-[13px] text-ink-600 dark:text-ink-300 flex items-center gap-2 mt-1">
                    <Icon name="calendar" className="w-3.5 h-3.5 text-ink-400" />
                    <span>{formatRuleSummary(rule)}</span>
                    <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700 mx-1" />
                    <span>{rule.siteName}</span>
                    {rule.area && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700 mx-1" />
                        <span>{rule.area}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[13px]">
                    {rule.defaultInspectorName ? (
                      <>
                        <Avatar name={rule.defaultInspectorName} size="sm" />
                        <span className="text-ink-700 dark:text-ink-300 hidden md:inline">{rule.defaultInspectorName}</span>
                      </>
                    ) : (
                      <span className="italic text-ink-400">Unassigned</span>
                    )}
                  </div>
                  
                  {/* Actions inside row */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {rule.status === 'active' && (
                      <button onClick={(e) => handleStatusToggle(e, rule, 'paused')} className="px-3 py-1.5 rounded border hairline text-[12px] font-medium text-ink-600 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                        Pause
                      </button>
                    )}
                    {rule.status === 'paused' && (
                      <button onClick={(e) => handleStatusToggle(e, rule, 'active')} className="px-3 py-1.5 rounded border hairline text-[12px] font-medium text-signal-green hover:bg-signal-green/10 transition-colors">
                        Resume
                      </button>
                    )}
                    {rule.status !== 'archived' && (
                      <button onClick={(e) => handleStatusToggle(e, rule, 'archived')} className="p-1.5 rounded border hairline text-ink-400 hover:text-signal-red hover:bg-signal-red/10 transition-colors" title="Archive rule">
                        <Icon name="box" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border hairline border-dashed rounded-xl text-center">
                <div className="w-12 h-12 bg-ink-50 dark:bg-ink-900 rounded-full flex items-center justify-center mb-4 text-ink-400">
                  <Icon name="box" className="w-6 h-6" />
                </div>
                <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-1">No rules found</h3>
                <p className="text-[13px] text-ink-500">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <RecurrenceRuleModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingRule(null); }}
          rule={editingRule}
          onSave={handleSaveRule}
        />
      )}
    </div>
  )
}

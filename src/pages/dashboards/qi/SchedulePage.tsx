import { useState, useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatClockTime, filterToInspectorInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
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
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { user } = useSession()
  const { inspections } = useInspections()

  // Calendar state
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDateIso, setSelectedDateIso] = useState(() => toIsoDate(new Date()))

  // Calendar derivations
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate])
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekEnd = weekDates[6]
  
  const myInspections = useMemo(() => filterToInspectorInspections(inspections.filter(i => i.domain === domain), user), [inspections, user, domain])

  const inspectionsForWeek = useMemo(() => {
    const startIso = toIsoDate(weekStart)
    const endIso = toIsoDate(weekEnd)
    return myInspections.filter(i => {
      if (!i.scheduledFor) return false
      const d = i.scheduledFor.split('T')[0]
      return d >= startIso && d <= endIso
    })
  }, [myInspections, weekStart, weekEnd])

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
    const el = document.getElementById(`day-${iso}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const nextUpcoming = useMemo(() => {
    const now = new Date().getTime()
    const sorted = [...myInspections]
      .filter(i => i.status === 'scheduled' && i.scheduledFor && new Date(i.scheduledFor).getTime() > now)
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
    return sorted[0]
  }, [myInspections])

  const nextRelativeStr = useMemo(() => {
    if (!nextUpcoming || !nextUpcoming.scheduledFor) return null
    const diff = new Date(nextUpcoming.scheduledFor).getTime() - Date.now()
    const hours = Math.floor(diff / 3_600_000)
    if (hours < 1) return 'in less than an hour'
    if (hours < 24) return `in ${hours} hours`
    const days = Math.floor(hours / 24)
    if (days === 1) return `tomorrow`
    return `in ${days} days`
  }, [nextUpcoming])

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-3">
            <span>{domain === 'safety' ? 'Safety Inspector' : 'Quality Inspector'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Schedule</span>
          </div>
          <h1 className="font-display text-4xl text-ink-900 dark:text-ink-50 tracking-tight mb-2">
            Your <span className="italic text-ink-500 dark:text-ink-400">week</span>.
          </h1>
          <p className="text-[14px] text-ink-600 dark:text-ink-300">
            {inspectionsForWeek.length} inspections scheduled this week
            {nextRelativeStr && ` · next one starts ${nextRelativeStr}.`}
          </p>
        </div>
      </div>

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
                <div className="space-y-3">
                  {items.sort((a,b) => (a.scheduledFor||'').localeCompare(b.scheduledFor||'')).map(insp => (
                    <button
                      key={insp.id}
                      onClick={() => nav.push(`${prefix}/inspections/${insp.id}`)}
                      className="w-full text-left group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border hairline bg-white dark:bg-ink-900/50 hover:border-ink-300 dark:hover:border-ink-600 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-3 md:mb-0">
                        <div className="w-20 shrink-0">
                          <span className="font-mono text-[16px] text-ink-900 dark:text-ink-50 tracking-tight">
                            {insp.scheduledFor ? formatClockTime(insp.scheduledFor) : '—'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[16px] font-medium text-ink-900 dark:text-ink-50 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                            {insp.templateName}
                          </h4>
                          <div className="text-[14px] text-ink-500 flex items-center gap-2 mt-1 truncate">
                            <span>{insp.siteName}</span>
                            {insp.area && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700" />
                                <span>{insp.area}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                        <StatusPill tone={STATUS_TONE[insp.status]}>{STATUS_LABEL[insp.status]}</StatusPill>
                        <div className="w-6 flex justify-end text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">
                          <Icon name="arrow_right" className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          
          {inspectionsForWeek.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border hairline border-dashed rounded-xl text-center">
              <div className="w-16 h-16 rounded-full bg-ink-50 dark:bg-bg-ink-900 flex items-center justify-center mb-6">
                <Icon name="calendar" className="w-8 h-8 text-ink-300 dark:text-ink-600" />
              </div>
              <h3 className="text-[18px] font-medium text-ink-900 dark:text-ink-50 mb-2">Nothing scheduled this week.</h3>
              <p className="text-[14px] text-ink-500">Check with your Quality Manager if you think there's work assigned.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

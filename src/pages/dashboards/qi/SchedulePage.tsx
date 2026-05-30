import { useState, useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatClockTime, filterToInspectorInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* Header Banner */}
      <PageBanner
        title={`Your schedule`}
        subline={`${inspectionsForWeek.length} inspections scheduled this week${ nextRelativeStr ? ` · next one starts ${nextRelativeStr}.` : '' }`}
      />

      <div className="space-y-6">
        {/* Week Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-accent-light rounded-lg text-text-secondary hover:text-text-primary transition-colors">
              <Icon name="arrow_left" className="w-4 h-4" />
            </button>
            <button onClick={handleNextWeek} className="p-2 hover:bg-accent-light rounded-lg text-text-secondary hover:text-text-primary transition-colors">
              <Icon name="arrow_right" className="w-4 h-4" />
            </button>
            <h2 className="text-[14px] font-bold text-text-primary ml-2">
              {formatWeekRange(weekStart, weekEnd)}
            </h2>
          </div>
          <button onClick={handleToday} className="text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg border border-text-secondary/15 bg-white hover:bg-accent-light">
            Today
          </button>
        </div>

        {/* Week Strip Calendar */}
        <div className="grid grid-cols-7 border border-text-secondary/15 rounded-2xl overflow-hidden bg-white shadow-soft">
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
                className={`flex flex-col items-center p-4 border-r last:border-r-0 border-text-secondary/15 hover:bg-accent-light transition-colors relative h-32 ${isSelected ? 'bg-accent-light' : ''}`}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                )}
                <span className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isToday || isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {dayName}
                </span>
                <span className={`font-mono text-2xl font-bold mb-3 ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                  {dayNum}
                </span>
                
                {/* Density dots */}
                <div className="flex items-center justify-center gap-1 flex-wrap max-w-full">
                  {dayInspections.slice(0, 3).map((insp, idx) => {
                    const tone = STATUS_TONE[insp.status]
                    const color = tone === 'green' ? 'bg-status-pass' : tone === 'amber' ? 'bg-warning' : tone === 'red' ? 'bg-status-fail' : 'bg-accent-light'
                    return (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${color}`} />
                    )
                  })}
                  {dayInspections.length > 3 && (
                    <span className="text-[10px] text-text-secondary font-bold">+{dayInspections.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* List of inspections for the week */}
        <div className="space-y-8 pt-2">
          {weekDates.map(date => {
            const iso = toIsoDate(date)
            const items = inspectionsByDay.get(iso) || []
            if (items.length === 0) return null
            
            const isToday = iso === toIsoDate(new Date())
            const dayStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            
            return (
              <div key={iso} id={`day-${iso}`} className="scroll-mt-8 space-y-3">
                <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wider ml-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {dayStr}
                </h3>
                <div className="space-y-3">
                  {items.sort((a,b) => (a.scheduledFor||'').localeCompare(b.scheduledFor||'')).map(insp => (
                    <button
                      key={insp.id}
                      onClick={() => nav.push(`${prefix}/inspections/${insp.id}`)}
                      className="w-full text-left group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-text-secondary/15 bg-white hover:bg-accent-light transition shadow-soft hover:shadow-medium"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-3 md:mb-0 min-w-0">
                        <div className="w-16 shrink-0 font-mono text-[14px] text-text-primary font-bold tracking-tight">
                          {insp.scheduledFor ? formatClockTime(insp.scheduledFor) : '—'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                            {insp.templateName}
                          </h4>
                          <div className="text-[12px] text-text-secondary flex items-center gap-2 mt-1 truncate">
                            <span>{insp.siteName}</span>
                            {insp.area && (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-light" />
                                <span>{insp.area}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                        <StatusPill tone={STATUS_TONE[insp.status]}>{STATUS_LABEL[insp.status]}</StatusPill>
                        <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          
          {inspectionsForWeek.length === 0 && (
            <div className="flex flex-col items-center justify-center border border-dashed border-text-secondary/15 rounded-2xl py-32 text-center bg-white shadow-soft">
              <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4 text-text-secondary">
                <Icon name="calendar" className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-text-primary mb-1">Nothing scheduled this week.</h3>
              <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto">Check with your manager if you think there is work assigned.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

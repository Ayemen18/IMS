import { useState, useMemo } from 'react'
import { useInspections, computeThroughput } from '../../../lib/inspections'

type DomainFilter = 'all' | 'quality' | 'safety'
type WindowFilter = 7 | 30 | 90 | 365

export function TrendsPage() {
  const { inspections } = useInspections()
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [windowDays, setWindowDays] = useState<WindowFilter>(30)

  // removed unused timeStr

  // 1. Throughput Data
  const throughputData = useMemo(() => {
    return computeThroughput(inspections, windowDays, domain)
  }, [inspections, windowDays, domain])

  // 2. Compliance Data (Daily)
  const complianceData = useMemo(() => {
    const daily: { date: string, rate: number, total: number }[] = []
    
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = d.toISOString().split('T')[0]
      
      // Calculate compliance for items completed on this exact day
      const dayStart = d.setHours(0, 0, 0, 0)
      const dayEnd = d.setHours(23, 59, 59, 999)
      
      const responsesOnDay = inspections
        .filter((insp: any) => (!domain || domain === 'all' || insp.domain === domain))
        .filter((insp: any) => insp.publishedAt && new Date(insp.publishedAt).getTime() >= dayStart && new Date(insp.publishedAt).getTime() <= dayEnd)
        .flatMap((insp: any) => insp.responses)

      const pass = responsesOnDay.filter((r: any) => r.answer === 'pass').length
      const fail = responsesOnDay.filter((r: any) => r.answer === 'fail').length
      const total = pass + fail

      daily.push({
        date: dateStr,
        rate: total > 0 ? (pass / total) * 100 : -1, // -1 means no data
        total
      })
    }
    return daily
  }, [inspections, windowDays, domain])

  // 3. Issue Lifecycle (Grouped by week)
  const lifecycleData = useMemo(() => {
    // Find all closed issues in the window
    const cutoff = Date.now() - windowDays * 86400000
    
    // Determine buckets (weeks)
    const weeksCount = Math.max(1, Math.ceil(windowDays / 7))
    const buckets: { label: string, sumDays: number, count: number }[] = Array.from({ length: weeksCount }, (_, i) => {
      const d = new Date(Date.now() - (weeksCount - 1 - i) * 7 * 86400000)
      return { label: `Wk of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, sumDays: 0, count: 0 }
    })

    inspections.forEach((insp: any) => {
      if (domain !== 'all' && insp.domain !== domain) return
      insp.issues.forEach((iss: any) => {
        if (iss.state === 'closed' && iss.verifiedAt) {
          const verifiedTime = new Date(iss.verifiedAt).getTime()
          if (verifiedTime >= cutoff) {
            const ageDays = (verifiedTime - new Date(iss.createdAt).getTime()) / 86400000
            // Which bucket?
            const daysAgo = (Date.now() - verifiedTime) / 86400000
            const bucketIndex = weeksCount - 1 - Math.floor(daysAgo / 7)
            if (bucketIndex >= 0 && bucketIndex < weeksCount) {
              buckets[bucketIndex].sumDays += ageDays
              buckets[bucketIndex].count++
            }
          }
        }
      })
    })

    return buckets.map(b => ({
      label: b.label,
      avgDays: b.count > 0 ? b.sumDays / b.count : 0,
      count: b.count
    }))
  }, [inspections, windowDays, domain])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 mb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 uppercase tracking-widest">
            Top Management {'>'} Trends
          </div>
          <div>
            <h1 className="font-display text-[40px] leading-tight text-ink-900 dark:text-ink-50">
              <span className="italic">Trends</span> over time.
            </h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-md w-fit">
                {(['all', 'quality', 'safety'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`px-4 py-1 text-[12px] font-medium rounded capitalize transition-colors ${
                      domain === d 
                        ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20' 
                        : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-md">
            {([7, 30, 90, 365] as const).map(w => (
              <button
                key={w}
                onClick={() => setWindowDays(w)}
                className={`px-3 py-1 text-[12px] font-mono rounded transition-colors ${
                  windowDays === w 
                    ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20' 
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
            last {windowDays} days
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Trend 1: Throughput */}
        <TrendCard 
          title="Inspection throughput" 
          description="Inspections completed per day. A steady or rising line indicates healthy cadence."
        >
          <LineChart data={throughputData.map(d => d.count)} labels={throughputData.map(d => d.date)} isDate />
        </TrendCard>

        {/* Trend 2: Compliance */}
        <TrendCard 
          title="Compliance rate" 
          description="Daily compliance percentage across completed inspections. Target is 95%."
        >
          <LineChart 
            data={complianceData.map(d => d.rate === -1 ? null : d.rate)} 
            labels={complianceData.map(d => d.date)} 
            target={95} 
            isDate
            yMax={100}
          />
        </TrendCard>

        {/* Trend 3: Issue Lifecycle */}
        <TrendCard 
          title="Issue lifecycle" 
          description="Average days from issue creation to closure, plotted per week. Lower is better."
        >
          <BarChart 
            data={lifecycleData.map(d => d.avgDays)} 
            labels={lifecycleData.map(d => d.label)} 
          />
        </TrendCard>
      </div>

    </div>
  )
}

function TrendCard({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-ink-950 border hairline rounded-lg p-8 space-y-6">
      <div>
        <h2 className="font-display text-[24px] italic text-ink-900 dark:text-ink-50">{title}</h2>
        <p className="text-[14px] text-ink-600 dark:text-ink-300 mt-1">{description}</p>
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------
// Minimal SVG Charts
// ------------------------------------------------------------------------------------------------

function LineChart({ data, labels, target, isDate, yMax: forceYMax }: { data: (number|null)[], labels: string[], target?: number, isDate?: boolean, yMax?: number }) {
  const validData = data.filter(d => d !== null) as number[]
  if (validData.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-[13px] font-mono text-ink-400">Limited data for this window.</div>
  }

  const w = 800
  const h = 200
  const padX = 20
  const padY = 20
  const chartW = w - padX * 2
  const chartH = h - padY * 2

  const maxVal = forceYMax ?? Math.max(...validData, target ?? 0, 1)
  const minVal = 0

  const getX = (i: number) => padX + (i / Math.max(1, data.length - 1)) * chartW
  const getY = (v: number) => h - padY - ((v - minVal) / (maxVal - minVal)) * chartH

  // Build points skipping nulls
  const points = data.map((d, i) => {
    if (d === null) return null
    return `${getX(i)},${getY(d)}`
  }).filter(Boolean).join(' ')

  // Stats
  const avg = Math.round(validData.reduce((a, b) => a + b, 0) / validData.length)
  const peak = Math.max(...validData)
  const min = Math.min(...validData)
  const current = validData[validData.length - 1]

  // Ticks
  const numTicks = Math.min(data.length, 5)
  const tickIndices = Array.from({ length: numTicks }, (_, i) => Math.floor(i * (data.length - 1) / Math.max(1, numTicks - 1)))

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/1] bg-ink-50 dark:bg-ink-900/20 rounded">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {/* Grid */}
          <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} className="stroke-ink-200 dark:stroke-ink-800" strokeWidth="1" />
          <line x1={padX} y1={padY} x2={w - padX} y2={padY} className="stroke-ink-200 dark:stroke-ink-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padX} y1={padY + chartH/2} x2={w - padX} y2={padY + chartH/2} className="stroke-ink-200 dark:stroke-ink-800" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Target Line */}
          {target !== undefined && (
            <line x1={padX} y1={getY(target)} x2={w - padX} y2={getY(target)} className="stroke-signal-green" strokeWidth="1" strokeDasharray="2 2" />
          )}

        {/* Line */}
        <polyline points={points} fill="none" className="stroke-ink-900 dark:stroke-ink-50" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Dots */}
        {data.map((d: any, i: number) => {
          if (d === null) return null
          return <circle key={i} cx={getX(i)} cy={getY(d)} r="3" className="fill-ink-900 dark:fill-ink-50" />
        })}

          {/* X Axis Labels */}
          {tickIndices.map(i => {
            let label = labels[i]
            if (isDate) {
              const d = new Date(label)
              label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
            return (
              <text key={i} x={getX(i)} y={h} className="fill-ink-400 dark:fill-ink-500 font-mono text-[10px]" textAnchor="middle">
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-6 border-t hairline pt-4">
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-400">Average</div>
          <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{avg}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-400">Peak</div>
          <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{peak}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-400">Min</div>
          <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{min}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-400">Current</div>
          <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{current}</div>
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, labels }: { data: number[], labels: string[] }) {
  if (data.length === 0 || data.every(d => d === 0)) {
    return <div className="h-[240px] flex items-center justify-center text-[13px] font-mono text-ink-400">Limited data for this window.</div>
  }

  const w = 800
  const h = 200
  const padX = 40
  const padY = 20
  const chartW = w - padX * 2
  const chartH = h - padY * 2

  const maxVal = Math.max(...data, 1)
  const barWidth = Math.min(40, (chartW / data.length) - 4)

  const getX = (i: number) => padX + (i * (chartW / data.length)) + ((chartW / data.length) - barWidth) / 2
  const getY = (v: number) => h - padY - (v / maxVal) * chartH

  // Stats
  const validData = data.filter(d => d > 0)
  const avg = validData.length > 0 ? (validData.reduce((a, b) => a + b, 0) / validData.length).toFixed(1) : 0
  const current = data[data.length - 1].toFixed(1)

  // Ticks
  const numTicks = Math.min(data.length, 6)
  const tickIndices = Array.from({ length: numTicks }, (_, i) => Math.floor(i * (data.length - 1) / Math.max(1, numTicks - 1)))

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/1] bg-ink-50 dark:bg-ink-900/20 rounded">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {/* Grid */}
          <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} className="stroke-ink-200 dark:stroke-ink-800" strokeWidth="1" />
          
          {/* Bars */}
          {data.map((d, i) => {
            const barH = (d / maxVal) * chartH
            return (
              <rect 
                key={i} 
                x={getX(i)} 
                y={getY(d)} 
                width={barWidth} 
                height={barH} 
                className="fill-ink-900 dark:fill-ink-50" 
                rx={2}
              />
            )
          })}

          {/* X Axis Labels */}
          {tickIndices.map(i => {
            return (
              <text key={i} x={getX(i) + barWidth/2} y={h} className="fill-ink-400 dark:fill-ink-500 font-mono text-[10px]" textAnchor="middle">
                {labels[i]}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-6 border-t hairline pt-4">
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-400">Average Age</div>
          <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{avg} days</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-400">Current Period</div>
          <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{current} days</div>
        </div>
      </div>
    </div>
  )
}

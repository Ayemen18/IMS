import { useState, useMemo } from 'react'
import { useInspections, computeThroughput } from '../../../lib/inspections'
import { PageBanner } from '../../../components/shell/PageBanner'

type DomainFilter = 'all' | 'quality' | 'safety'
type WindowFilter = 7 | 30 | 90 | 365

export function TrendsPage() {
  const { inspections } = useInspections()
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [windowDays, setWindowDays] = useState<WindowFilter>(30)

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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
        Top Management &gt; Trends
      </div>

      {/* Page Banner with elegant visual controls */}
      <PageBanner
        title="Trends & Metrics"
        subline={`Performance analytics plotted across the last ${windowDays} days.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Domain Filter */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
              {(['all', 'quality', 'safety'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${ domain === d ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Time Window Filter */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
              {([7, 30, 90, 365] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setWindowDays(w)}
                  className={`px-3 py-1.5 text-[11px] font-mono rounded-lg transition-all ${ windowDays === w ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
                >
                  {w}d
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Trend 1: Throughput */}
        <TrendCard 
          title="Inspection Throughput" 
          description="Inspections completed per day. A steady or rising line indicates healthy cadence."
        >
          <LineChart data={throughputData.map(d => d.count)} labels={throughputData.map(d => d.date)} isDate />
        </TrendCard>

        {/* Trend 2: Compliance */}
        <TrendCard 
          title="Compliance Rate" 
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
          title="Issue Lifecycle" 
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
    <div className="bg-white border border-text-secondary/15 rounded-2xl p-6 shadow-soft space-y-4">
      <div>
        <h2 className="text-[16px] font-bold text-text-primary">{title}</h2>
        <p className="text-[13px] text-text-secondary mt-0.5">{description}</p>
      </div>
      <div className="w-full pt-2">
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
    return <div className="h-[200px] flex items-center justify-center text-[13px] font-mono text-text-secondary">Limited data for this window.</div>
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
      <div className="relative w-full aspect-[4/1] bg-accent-light/50 rounded-xl p-3 border border-text-secondary/15">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {/* Grid */}
          <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} className="stroke-text-secondary/15" strokeWidth="1" />
          <line x1={padX} y1={padY} x2={w - padX} y2={padY} className="stroke-text-secondary/15" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padX} y1={padY + chartH/2} x2={w - padX} y2={padY + chartH/2} className="stroke-text-secondary/15" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Target Line */}
          {target !== undefined && (
            <line x1={padX} y1={getY(target)} x2={w - padX} y2={getY(target)} className="stroke-status-pass" strokeWidth="1" strokeDasharray="2 2" />
          )}

          {/* Line */}
          <polyline points={points} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          
          {/* Dots */}
          {data.map((d: any, i: number) => {
            if (d === null) return null
            return <circle key={i} cx={getX(i)} cy={getY(d)} r="3.5" className="fill-primary" />
          })}

          {/* X Axis Labels */}
          {tickIndices.map(i => {
            let label = labels[i]
            if (isDate) {
              const d = new Date(label)
              label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
            return (
              <text key={i} x={getX(i)} y={h} className="fill-text-secondary/70 font-mono text-[10px]" textAnchor="middle">
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-6 border-t border-text-secondary/15 pt-3">
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Average</div>
          <div className="font-mono text-[13px] text-text-primary font-bold">{avg}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Peak</div>
          <div className="font-mono text-[13px] text-text-primary font-bold">{peak}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Min</div>
          <div className="font-mono text-[13px] text-text-primary font-bold">{min}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Current</div>
          <div className="font-mono text-[13px] text-text-primary font-bold">{current}</div>
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, labels }: { data: number[], labels: string[] }) {
  if (data.length === 0 || data.every(d => d === 0)) {
    return <div className="h-[200px] flex items-center justify-center text-[13px] font-mono text-text-secondary">Limited data for this window.</div>
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
      <div className="relative w-full aspect-[4/1] bg-accent-light/50 rounded-xl p-3 border border-text-secondary/15">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {/* Grid */}
          <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} className="stroke-text-secondary/15" strokeWidth="1" />
          
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
                className="fill-primary" 
                rx={3}
              />
            )
          })}

          {/* X Axis Labels */}
          {tickIndices.map(i => {
            return (
              <text key={i} x={getX(i) + barWidth/2} y={h} className="fill-text-secondary/70 font-mono text-[10px]" textAnchor="middle">
                {labels[i]}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-6 border-t border-text-secondary/15 pt-3">
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Average Age</div>
          <div className="font-mono text-[13px] text-text-primary font-bold">{avg} days</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Current Period</div>
          <div className="font-mono text-[13px] text-text-primary font-bold">{current} days</div>
        </div>
      </div>
    </div>
  )
}

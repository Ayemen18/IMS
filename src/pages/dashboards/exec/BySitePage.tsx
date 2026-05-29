import { useState } from 'react'
import {
  useInspections,
  computeComplianceRate,
  computeAgingIssues,
  getCompletedResponses
} from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'

type DomainFilter = 'all' | 'quality' | 'safety'

export function BySitePage() {
  const { inspections } = useInspections()
  const [domain, setDomain] = useState<DomainFilter>('all')

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // 1. Get unique sites and aggregate data
  const sites = Array.from(new Set(inspections.map((i: any) => i.siteId))).map(siteId => {
    const siteInsps = inspections.filter((i: any) => i.siteId === siteId && (domain === 'all' || i.domain === domain))
    const siteName = siteInsps[0]?.siteName || siteId

    // Compliance
    const compRate = computeComplianceRate(siteInsps, 30)

    // Completed this month (approx 30 days)
    const completedCount = siteInsps.filter((i: any) => 
      (i.status === 'published' || i.status === 'issues_closed' || i.status === 'issues_open') &&
      i.publishedAt && (Date.now() - new Date(i.publishedAt).getTime()) <= 30 * 86400000
    ).length

    // Issues
    let openIssues = 0
    siteInsps.forEach((i: any) => {
      i.issues.forEach((iss: any) => {
        if (['open', 'in_progress', 'reopened'].includes(iss.state)) {
          openIssues++
        }
      })
    })

    const agedIssues = computeAgingIssues(siteInsps, 7)

    // Posture (Pass/Fail/NA proportions)
    const responses = getCompletedResponses(siteInsps, 30)
    const passCount = responses.filter((r: any) => r.answer === 'pass').length
    const failCount = responses.filter((r: any) => r.answer === 'fail').length
    const naCount = responses.filter((r: any) => r.answer === 'na').length
    const total = passCount + failCount + naCount

    const passPct = total > 0 ? (passCount / total) * 100 : 0
    const failPct = total > 0 ? (failCount / total) * 100 : 0
    const naPct = total > 0 ? (naCount / total) * 100 : 0

    return {
      siteId,
      siteName,
      compRate,
      completedCount,
      openIssues,
      agedIssues,
      posture: { passPct, failPct, naPct, total }
    }
  })

  // Sort by compliance ascending
  sites.sort((a, b) => a.compRate - b.compRate)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 uppercase tracking-widest">
            Top Management {'>'} By site
          </div>
          <div>
            <h1 className="font-display text-[40px] leading-tight text-ink-900 dark:text-ink-50">
              Compliance <span className="italic">by site</span>.
            </h1>
            <p className="text-[14px] text-ink-500 dark:text-ink-400 mt-2 font-mono">
              {sites.length} sites · last refreshed {timeStr}
            </p>
          </div>
        </div>

        <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-md">
          {(['all', 'quality', 'safety'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded capitalize transition-colors ${
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

      <div className="bg-white dark:bg-ink-950 border hairline rounded-lg overflow-hidden">
        {sites.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-ink-500 dark:text-ink-400">
            No site data yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b hairline bg-ink-50 dark:bg-ink-900/50">
                <th className="px-6 py-4 text-[12px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider w-1/4">Site</th>
                <th className="px-6 py-4 text-[12px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider w-32">Compliance</th>
                <th className="px-6 py-4 text-[12px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider w-32">Completed<br/><span className="text-[10px] normal-case tracking-normal opacity-75">last 30d</span></th>
                <th className="px-6 py-4 text-[12px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider w-24">Open<br/><span className="text-[10px] normal-case tracking-normal opacity-75">issues</span></th>
                <th className="px-6 py-4 text-[12px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider w-24">Aging<br/><span className="text-[10px] normal-case tracking-normal opacity-75">{'>'} 7 days</span></th>
                <th className="px-6 py-4 text-[12px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">Posture<br/><span className="text-[10px] normal-case tracking-normal opacity-75">Pass / Fail / NA</span></th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y hairline">
              {sites.map((site: any) => {
                const compColor = site.compRate >= 95 ? 'text-signal-green' : site.compRate >= 90 ? 'text-signal-amber' : 'text-signal-red'
                const openColor = site.openIssues > 0 ? 'text-signal-red font-medium' : 'text-ink-500 dark:text-ink-400'
                const agingColor = site.agedIssues > 0 ? 'text-signal-red font-medium' : 'text-ink-500 dark:text-ink-400'

                return (
                  <tr key={site.siteId} className="group hover:bg-ink-50 dark:hover:bg-ink-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">{site.siteName}</div>
                      <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 mt-0.5">{site.siteId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-display text-[28px] leading-none ${compColor}`}>
                        {site.compRate}<span className="text-[18px]">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{site.completedCount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-mono text-[13px] ${openColor}`}>{site.openIssues}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-mono text-[13px] ${agingColor}`}>{site.agedIssues}</div>
                    </td>
                    <td className="px-6 py-4">
                      {site.posture.total > 0 ? (
                        <div className="space-y-1.5 w-full max-w-[200px]">
                          <div className="flex h-2 w-full rounded-full overflow-hidden bg-ink-100 dark:bg-ink-800">
                            {site.posture.passPct > 0 && <div style={{ width: `${site.posture.passPct}%` }} className="bg-signal-green h-full" />}
                            {site.posture.failPct > 0 && <div style={{ width: `${site.posture.failPct}%` }} className="bg-signal-red h-full" />}
                            {site.posture.naPct > 0 && <div style={{ width: `${site.posture.naPct}%` }} className="bg-ink-300 dark:bg-ink-600 h-full" />}
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-ink-500 dark:text-ink-400">
                            {site.posture.passPct > 0 && <span>{Math.round(site.posture.passPct)}%</span>}
                            {site.posture.failPct > 0 && <span className={site.posture.failPct > 0 ? 'text-signal-red' : ''}>{Math.round(site.posture.failPct)}%</span>}
                            {site.posture.naPct > 0 && <span>{Math.round(site.posture.naPct)}%</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-ink-400 dark:text-ink-600">No data</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Icon name="chevron_right" className="w-5 h-5 text-ink-300 dark:text-ink-600 group-hover:text-ink-500 dark:group-hover:text-ink-400" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

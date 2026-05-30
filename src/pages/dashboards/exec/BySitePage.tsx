import { useState } from 'react'
import {
  useInspections,
  computeComplianceRate,
  computeAgingIssues,
  getCompletedResponses
} from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { PageBanner } from '../../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
        Top Management &gt; By site
      </div>

      <PageBanner
        title="Compliance by Site"
        subline={`${sites.length} sites · last refreshed ${timeStr}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 mr-1">
              Domain Filter:
            </span>
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
              {(['all', 'quality', 'safety'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${ domain === d ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="rounded-2xl bg-white border border-text-secondary/15 shadow-soft overflow-hidden">
        {sites.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-text-secondary">
            No site data yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-text-secondary/15 bg-accent-light/50">
                <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider w-1/4">Site</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider w-32">Compliance</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider w-32">Completed<br/><span className="text-[9px] font-normal normal-case tracking-normal text-text-secondary">last 30d</span></th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider w-24">Open<br/><span className="text-[9px] font-normal normal-case tracking-normal text-text-secondary">issues</span></th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider w-24">Aging<br/><span className="text-[9px] font-normal normal-case tracking-normal text-text-secondary">{'>'} 7 days</span></th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Posture<br/><span className="text-[9px] font-normal normal-case tracking-normal text-text-secondary">Pass / Fail / NA</span></th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text-secondary/15">
              {sites.map((site: any) => {
                const compColor = site.compRate >= 95 ? 'text-status-pass' : site.compRate >= 90 ? 'text-warning' : 'text-status-fail'
                const openColor = site.openIssues > 0 ? 'text-status-fail font-bold' : 'text-text-secondary'
                const agingColor = site.agedIssues > 0 ? 'text-status-fail font-bold' : 'text-text-secondary'

                return (
                  <tr key={site.siteId} className="group hover:bg-accent-light/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-bold text-text-primary">{site.siteName}</div>
                      <div className="text-[11px] font-mono text-text-secondary mt-0.5">{site.siteId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-[24px] font-bold tracking-tight ${compColor}`}>
                        {site.compRate}<span className="text-[16px] font-semibold">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[13px] text-text-primary font-semibold">{site.completedCount}</div>
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
                          <div className="flex h-2 w-full rounded-full overflow-hidden bg-accent-light">
                            {site.posture.passPct > 0 && <div style={{ width: `${site.posture.passPct}%` }} className="bg-status-pass h-full" />}
                            {site.posture.failPct > 0 && <div style={{ width: `${site.posture.failPct}%` }} className="bg-status-fail h-full" />}
                            {site.posture.naPct > 0 && <div style={{ width: `${site.posture.naPct}%` }} className="bg-accent-light h-full" />}
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-text-secondary">
                            {site.posture.passPct > 0 && <span>{Math.round(site.posture.passPct)}%</span>}
                            {site.posture.failPct > 0 && <span className="text-status-fail">{Math.round(site.posture.failPct)}%</span>}
                            {site.posture.naPct > 0 && <span>{Math.round(site.posture.naPct)}%</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-text-secondary">No data</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Icon name="chevron_right" className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
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

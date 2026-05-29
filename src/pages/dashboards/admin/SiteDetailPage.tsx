import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../../lib/router'
import { useSites, formatDate } from '../../../lib/sites'
import { useUsers, formatRelativeTime } from '../../../lib/users'
import { useInspections } from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import { Avatar } from '../../../components/primitives/Avatar'
import { EditSiteModal } from '../../../components/admin/EditSiteModal'
import { DepartmentModal } from '../../../components/admin/DepartmentModal'
import type { Department } from '../../../types/site'

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const nav = useNav()
  
  const { getSiteById, getDepartmentsForSite, archiveSite, updateSite } = useSites()
  const { users } = useUsers()
  const { inspections } = useInspections()
  const { templates } = useTemplates()

  const site = siteId ? getSiteById(siteId) : undefined
  const departments = site ? getDepartmentsForSite(site.id) : []

  const [editOpen, setEditOpen] = useState(false)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)

  const stats = useMemo(() => {
    if (!site) return null
    
    // Departments + Areas
    const totalAreas = departments.reduce((acc, d) => acc + d.areas.length, 0)
    
    // Active personnel
    const activePersonnel = users.filter(u => u.sites.some(s => s.name === site.name)).length
    
    // Inspections / 30d & Open issues
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const prevThirtyDaysAgo = Date.now() - 60 * 86400000
    
    let current30d = 0
    let prev30d = 0
    let openIssuesCount = 0
    let passCount = 0
    let totalAnswered = 0

    const siteInspections = inspections.filter(i => i.siteName === site.name)
    
    siteInspections.forEach(ins => {
      const ts = ins.createdAt ? new Date(ins.createdAt).getTime() : 0
      
      // Open issues across all time for this site
      openIssuesCount += ins.issues?.filter(issue => 
        ['open', 'in_progress', 'awaiting_verification'].includes(issue.state)
      ).length || 0

      // Stats for last 30d
      if (ts >= thirtyDaysAgo) {
        current30d++
        // Compliance for last 30d
        ins.responses?.forEach(r => {
          if (r.answer === 'pass') passCount++
          if (r.answer === 'pass' || r.answer === 'fail') totalAnswered++
        })
      } else if (ts >= prevThirtyDaysAgo && ts < thirtyDaysAgo) {
        prev30d++
      }
    })

    const delta = current30d - prev30d
    const compliancePercent = totalAnswered > 0 ? Math.round((passCount / totalAnswered) * 100) : null

    // Recent activity (last 8)
    const recentActivity = [...siteInspections]
      .filter(i => i.submittedAt || i.status !== 'scheduled') // only show started/submitted
      .sort((a, b) => {
        const aTs = a.submittedAt ? new Date(a.submittedAt).getTime() : new Date(a.createdAt).getTime()
        const bTs = b.submittedAt ? new Date(b.submittedAt).getTime() : new Date(b.createdAt).getTime()
        return bTs - aTs
      })
      .slice(0, 8)

    // Quick stats
    const rolesMap = new Map<string, number>()
    users.filter(u => u.sites.some(s => s.name === site.name)).forEach(u => {
      rolesMap.set(u.role, (rolesMap.get(u.role) || 0) + 1)
    })
    
    const scopeCount = 2 // mock data

    return {
      totalAreas,
      activePersonnel,
      current30d,
      delta,
      openIssuesCount,
      compliancePercent,
      recentActivity,
      rolesMap,
      scopeCount
    }
  }, [site, departments, users, inspections, templates])

  if (!site || !stats) {
    return (
      <div className="p-8 text-center text-ink-500">
        Site not found. <button onClick={() => nav.push('/admin/organization')} className="underline">Go back</button>
      </div>
    )
  }

  const handleArchive = () => {
    if (confirm(`Are you sure you want to archive ${site.name}?`)) {
      archiveSite(site.id)
    }
  }
  
  const handleRestore = () => {
    updateSite(site.id, { status: 'commissioning', archivedAt: null })
  }

  return (
    <>
      <div className="stagger max-w-[1200px] mx-auto pb-12">
        {/* ============ Breadcrumb ============ */}
        <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400 mb-6">
          <span>System Admin</span>
          <Icon name="chevron_right" className="w-3 h-3" />
          <button onClick={() => nav.push('/admin/organization')} className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
            Sites &amp; departments
          </button>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">{site.name}</span>
        </div>

        {/* ============ Status Banner ============ */}
        {site.status === 'archived' && (
          <div className="mb-6 rounded-md bg-ink-100/50 dark:bg-ink-800/50 px-4 py-3 flex items-start gap-3">
            <Icon name="alert" className="w-4 h-4 text-ink-500 shrink-0 mt-0.5" />
            <div className="text-[13px] text-ink-700 dark:text-ink-200">
              This site was archived on {site.archivedAt ? formatDate(site.archivedAt) : 'a previous date'}. It's preserved for historical reference but not actively used.
            </div>
          </div>
        )}

        {/* ============ Hero ============ */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <div className="capitalize">
                <StatusPill tone={site.status === 'active' ? 'green' : site.status === 'commissioning' ? 'amber' : 'neutral'}>
                  {site.status}
                </StatusPill>
              </div>
              <span className="px-2 py-0.5 rounded border hairline text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 bg-white dark:bg-ink-900">
                {site.primaryDomain}
              </span>
              {site.certifications.map(cert => (
                <span key={cert} className="px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-[10px] font-mono text-ink-700 dark:text-ink-200">
                  {cert}
                </span>
              ))}
            </div>
            <h1 className="font-display text-[36px] leading-[1.1] tracking-tight text-ink-900 dark:text-ink-50">
              {site.name}
            </h1>
            <div className="mt-1 font-mono text-[13px] text-ink-500 dark:text-ink-400">
              {site.code}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {site.status !== 'archived' ? (
              <>
                <button
                  onClick={handleArchive}
                  className="px-4 py-2 rounded-md border border-signal-red/20 text-signal-red hover:bg-signal-red/5 transition-colors text-[13px] font-medium"
                >
                  Archive site
                </button>
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-[13px] font-medium text-ink-900 dark:text-ink-50"
                >
                  Edit details
                </button>
              </>
            ) : (
              <button
                onClick={handleRestore}
                className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-[13px] font-medium text-ink-900 dark:text-ink-50"
              >
                Restore site
              </button>
            )}
          </div>
        </div>

        {/* ============ Stat Strip ============ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden mb-8">
          <StatCell 
            label="Departments" 
            value={departments.length.toString()} 
            sub={<span>/ {stats.totalAreas} areas</span>} 
          />
          <StatCell 
            label="Active personnel" 
            value={stats.activePersonnel.toString()} 
            sub="Assigned to site"
          />
          <StatCell 
            label="Inspections / 30d" 
            value={stats.current30d.toString()} 
            sub={<span className={stats.delta > 0 ? 'text-signal-green' : stats.delta < 0 ? 'text-signal-amber' : ''}>{stats.delta > 0 ? `+${stats.delta}` : stats.delta} vs previous 30d</span>}
          />
          <StatCell 
            label="Open issues" 
            value={stats.openIssuesCount.toString()} 
            sub="Awaiting resolution"
          />
          <StatCell 
            label="Compliance" 
            value={stats.compliancePercent !== null ? `${stats.compliancePercent}%` : '—'} 
            sub="Pass rate last 30d"
          />
        </div>

        {/* ============ Two Column Layout ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Site Overview */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">Location</div>
                  <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{site.city}, {site.country}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">Timezone</div>
                  <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{site.timezone}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">Commissioned</div>
                  <div className="text-[13px] text-ink-900 dark:text-ink-50">{formatDate(site.commissionedAt)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">Primary Domain</div>
                  <div className="text-[13px] text-ink-900 dark:text-ink-50 capitalize">{site.primaryDomain}</div>
                </div>
              </div>
              {site.notes && (
                <div className="mt-6 pt-4 border-t hairline">
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">Notes</div>
                  <div className="text-[13px] text-ink-700 dark:text-ink-300 italic">{site.notes}</div>
                </div>
              )}
            </div>

            {/* Departments Panel - The Design Moment */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline flex items-center justify-between">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Departments</div>
                {site.status !== 'archived' && (
                  <button 
                    onClick={() => { setEditingDept(null); setDeptModalOpen(true); }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
                  >
                    <Icon name="plus" className="w-3.5 h-3.5" />
                    Add department
                  </button>
                )}
              </div>
              
              {departments.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed mb-4">
                    <Icon name="box" className="w-5 h-5 text-ink-400 dark:text-ink-500" />
                  </div>
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-1">No departments configured</div>
                  <p className="text-[13px] text-ink-500 dark:text-ink-400 mb-5">
                    Break this site down into manageable departments and areas.
                  </p>
                  <button
                    onClick={() => { setEditingDept(null); setDeptModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white dark:bg-ink-800 border hairline text-[13px] font-medium text-ink-900 dark:text-ink-50 hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
                  >
                    Create the first department
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {departments.map((dept, idx) => (
                    <div 
                      key={dept.id}
                      onClick={() => { setEditingDept(dept); setDeptModalOpen(true); }}
                      className={`px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${idx !== 0 ? 'border-t hairline' : ''}`}
                    >
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[12px] text-ink-500 dark:text-ink-400">{dept.code}</span>
                          <span className="text-[14px] font-medium text-ink-900 dark:text-ink-50">{dept.name}</span>
                          <span className="px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-[10px] uppercase tracking-[0.12em] font-medium text-ink-600 dark:text-ink-300">
                            {dept.kind.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2">
                            {dept.headId ? (
                              <>
                                <Avatar name={dept.headName || ''} size="sm" />
                                <span className="text-[12px] text-ink-700 dark:text-ink-200">{dept.headName}</span>
                              </>
                            ) : (
                              <span className="text-[12px] text-ink-400 dark:text-ink-500">— Unassigned</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {dept.areas.length > 0 ? (
                              dept.areas.map((area, i) => (
                                <div key={i} className="flex items-center">
                                  <span className="font-mono text-[11px] text-ink-600 dark:text-ink-300">{area}</span>
                                  {i < dept.areas.length - 1 && <span className="mx-1.5 text-ink-300 dark:text-ink-600">·</span>}
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-ink-400 italic">No areas defined</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="sm:text-right shrink-0">
                        <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-700 dark:group-hover:text-ink-200 transition-colors">
                          <span className="font-medium text-ink-900 dark:text-ink-50">{
                            // Approximation of activity for this department based on areas
                            inspections.filter(i => i.siteName === site.name && (i.area && dept.areas.includes(i.area))).length
                          }</span> inspections / 30d
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline flex items-center justify-between">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Recent activity</div>
                <button className="text-[12px] text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
                  View all
                </button>
              </div>
              <div className="divide-y hairline">
                {stats.recentActivity.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] text-ink-500">No recent inspections at this site.</div>
                ) : (
                  stats.recentActivity.map(ins => (
                    <div key={ins.id} onClick={() => nav.push(`/qm/inspections/${ins.id}`)} className="px-5 py-3.5 flex items-center justify-between hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors cursor-pointer group gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-ink-500">{ins.number}</span>
                          <span className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{ins.templateName}</span>
                        </div>
                        <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">{ins.area || 'General'}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:inline-block">
                          <StatusPill tone={['approved', 'published'].includes(ins.status) ? 'green' : ['under_review', 'issues_open'].includes(ins.status) ? 'amber' : 'neutral'}>
                            {ins.status.replace('_', ' ')}
                          </StatusPill>
                        </div>
                        <span className="font-mono text-[10px] text-ink-400 w-12 text-right">{formatRelativeTime(ins.submittedAt || ins.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* Site Manager */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-4">Site Manager</div>
              {site.managerName ? (
                <div className="flex items-center gap-3">
                  <Avatar name={site.managerName} size="lg" />
                  <div>
                    <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">{site.managerName}</div>
                    <div className="text-[12px] text-ink-500 mt-0.5">Manager role</div>
                  </div>
                </div>
              ) : (
                <div className="text-[13px] text-ink-500 italic">No manager assigned.</div>
              )}
              {site.status !== 'archived' && (
                <button onClick={() => setEditOpen(true)} className="mt-4 text-[12px] font-medium text-accent-600 dark:text-accent-400 hover:underline">
                  Reassign
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5 space-y-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-3">Personnel Breakdown</div>
                <div className="space-y-2">
                  {Array.from(stats.rolesMap.entries()).length === 0 ? (
                    <div className="text-[12px] text-ink-500 italic">No personnel assigned.</div>
                  ) : (
                    Array.from(stats.rolesMap.entries()).map(([role, count]) => (
                      <div key={role} className="flex justify-between text-[13px]">
                        <span className="text-ink-700 dark:text-ink-200 capitalize">{role.replace('_', ' ')}</span>
                        <span className="font-mono text-ink-900 dark:text-ink-50">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="border-t hairline pt-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-3">Template Scopes</div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-700 dark:text-ink-200">Site-specific templates</span>
                  <span className="font-mono text-ink-900 dark:text-ink-50">{stats.scopeCount}</span>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-4">Certifications</div>
              {site.certifications.length === 0 ? (
                <div className="text-[12px] text-ink-500 italic">No active certifications.</div>
              ) : (
                <div className="space-y-3">
                  {site.certifications.map(cert => (
                    <div key={cert} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-signal-green shrink-0" />
                        <span className="text-[13px] font-medium text-ink-900 dark:text-ink-50">{cert}</span>
                      </div>
                      <span className="text-[11px] text-ink-500">Valid</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log (Mocked last 4) */}
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-4">Activity Log</div>
              <div className="space-y-4">
                <div className="relative pl-3 border-l border-ink-200 dark:border-ink-700">
                  <div className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-ink-400 dark:bg-ink-500" />
                  <div className="text-[12px] text-ink-900 dark:text-ink-50">Department added: Packaging</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">2 days ago by System Admin</div>
                </div>
                <div className="relative pl-3 border-l border-ink-200 dark:border-ink-700">
                  <div className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-ink-400 dark:bg-ink-500" />
                  <div className="text-[12px] text-ink-900 dark:text-ink-50">Site details updated</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">5 days ago by System Admin</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <EditSiteModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        site={site}
      />
      
      <DepartmentModal
        open={deptModalOpen}
        onClose={() => { setDeptModalOpen(false); setEditingDept(null); }}
        siteId={site.id}
        department={editingDept}
      />
    </>
  )
}

function StatCell({ label, value, sub }: { label: string, value: string, sub: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-ink-900 p-4 flex flex-col justify-between h-[104px]">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 line-clamp-1">
        {label}
      </div>
      <div>
        <div className="font-display text-[32px] leading-none tracking-tight text-ink-900 dark:text-ink-50 mb-1.5">
          {value}
        </div>
        <div className="text-[11px] font-medium text-ink-500 dark:text-ink-400 line-clamp-1">
          {sub}
        </div>
      </div>
    </div>
  )
}

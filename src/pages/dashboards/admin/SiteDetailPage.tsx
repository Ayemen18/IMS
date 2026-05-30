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
import { PageBanner } from '../../../components/shell/PageBanner'
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
      <div className="p-8 text-center text-text-secondary bg-white shadow-soft rounded-2xl border border-text-secondary/15 max-w-[400px] mx-auto mt-12">
        Site not found.{' '}
        <button onClick={() => nav.push('/admin/organization')} className="underline font-bold text-text-primary ml-1">
          Go Back
        </button>
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
    <div className="space-y-6">
      {/* Top Breadcrumb Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
          <span className="uppercase text-[10px] tracking-wider text-text-secondary">System Admin</span>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <button onClick={() => nav.push('/admin/organization')} className="hover:text-text-primary transition-colors">
            Sites &amp; Departments
          </button>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-primary">{site.name}</span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-text-primary bg-accent-light px-2 py-0.5 rounded-lg border border-text-secondary/15 uppercase tracking-wider">
            {site.primaryDomain}
          </span>
          <StatusPill tone={site.status === 'active' ? 'green' : site.status === 'commissioning' ? 'amber' : 'neutral'}>
            {site.status}
          </StatusPill>
        </div>
      </div>

      {/* ============ Status Banner ============ */}
      {site.status === 'archived' && (
        <div className="rounded-xl bg-accent-light border border-text-secondary/15 p-4 flex items-start gap-3 shadow-sm">
          <Icon name="alert" className="w-4 h-4 text-text-secondary shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[13px] text-text-primary font-medium">
            This site was archived on {site.archivedAt ? formatDate(site.archivedAt) : 'a previous date'}. It is preserved for historical reference and inactive.
          </div>
        </div>
      )}

      {/* Page Banner with Action Slot */}
      <PageBanner
        title={site.name}
        subline={`${site.city}, ${site.country} · Timezone: ${site.timezone} · Code: ${site.code}`}
        actions={
          <div className="flex items-center gap-2">
            {site.status !== 'archived' ? (
              <>
                <button
                  onClick={handleArchive}
                  className="px-3.5 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm"
                >
                  Archive Site
                </button>
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm"
                >
                  Edit Details
                </button>
              </>
            ) : (
              <button
                onClick={handleRestore}
                className="px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm"
              >
                Restore Site
              </button>
            )}
          </div>
        }
      />

      {/* Certifications badges row */}
      {site.certifications.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mr-1">Certifications:</span>
          {site.certifications.map(cert => (
            <span key={cert} className="text-[11px] font-mono font-bold text-text-primary px-2 py-0.5 rounded-lg bg-white border border-text-secondary/15 shadow-sm">
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* ============ Stat Strip ============ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
        <StatCell 
          label="Departments" 
          value={departments.length.toString()} 
          sub={<span>/ {stats.totalAreas} areas</span>} 
        />
        <StatCell 
          label="Active Personnel" 
          value={stats.activePersonnel.toString()} 
          sub="Assigned to site"
        />
        <StatCell 
          label="Inspections / 30d" 
          value={stats.current30d.toString()} 
          sub={<span className={stats.delta > 0 ? 'text-status-pass' : stats.delta < 0 ? 'text-warning' : ''}>{stats.delta > 0 ? `+${stats.delta}` : stats.delta} vs prev 30d</span>}
        />
        <StatCell 
          label="Open Issues" 
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
          <div className="rounded-2xl border border-text-secondary/15 bg-white p-6 shadow-soft">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Location</div>
                <div className="font-mono text-[13px] text-text-primary font-bold">{site.city}, {site.country}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Timezone</div>
                <div className="font-mono text-[13px] text-text-primary font-bold">{site.timezone}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Commissioned</div>
                <div className="text-[13px] text-text-primary font-bold">{formatDate(site.commissionedAt)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Primary Domain</div>
                <div className="text-[13px] text-text-primary font-bold capitalize">{site.primaryDomain}</div>
              </div>
            </div>
            {site.notes && (
              <div className="mt-6 pt-4 border-t border-text-secondary/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Notes</div>
                <div className="text-[13px] text-text-primary italic font-semibold">"{site.notes}"</div>
              </div>
            )}
          </div>

          {/* Departments Panel */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50 flex items-center justify-between">
              <div className="text-[13px] font-bold text-text-primary">Departments</div>
              {site.status !== 'archived' && (
                <button 
                  onClick={() => { setEditingDept(null); setDeptModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-text-primary hover:text-primary transition-colors"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  Add Department
                </button>
              )}
            </div>
            
            {departments.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-text-secondary/15 bg-accent-light mb-4">
                  <Icon name="box" className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="text-[14px] font-bold text-text-primary mb-1">No departments configured</div>
                <p className="text-[13px] text-text-secondary mb-5 font-medium leading-relaxed">
                  Break this site down into manageable departments and areas.
                </p>
                <button
                  onClick={() => { setEditingDept(null); setDeptModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-text-secondary/15 text-[12px] font-bold text-text-primary hover:bg-accent-light transition-colors shadow-sm"
                >
                  Create the First Department
                </button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-text-secondary/15">
                {departments.map((dept) => (
                  <div 
                    key={dept.id}
                    onClick={() => { setEditingDept(dept); setDeptModalOpen(true); }}
                    className="px-5 py-4 hover:bg-accent-light/20 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-bold text-text-secondary">{dept.code}</span>
                        <span className="text-[13px] font-bold text-text-primary">{dept.name}</span>
                        <span className="px-2 py-0.5 rounded bg-accent-light border border-text-secondary/15 text-[10px] uppercase tracking-wider font-bold text-text-primary shadow-sm">
                          {dept.kind.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2">
                          {dept.headId ? (
                            <>
                              <Avatar name={dept.headName || ''} size="sm" />
                              <span className="text-[12px] text-text-primary font-bold">{dept.headName}</span>
                            </>
                          ) : (
                            <span className="text-[12px] text-text-secondary font-medium">— Unassigned</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {dept.areas.length > 0 ? (
                            dept.areas.map((area, i) => (
                              <div key={i} className="flex items-center">
                                <span className="font-mono text-[11px] text-text-primary font-bold bg-accent-light px-1.5 py-0.5 rounded border border-text-secondary/15 shadow-sm">{area}</span>
                                {i < dept.areas.length - 1 && <span className="mx-1 text-text-secondary font-bold">·</span>}
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-text-secondary italic">No areas defined</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:text-right shrink-0">
                      <div className="font-mono text-[11px] text-text-secondary font-bold group-hover:text-text-primary transition-colors">
                        <span className="font-bold text-text-primary">{
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
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50 flex items-center justify-between">
              <div className="text-[13px] font-bold text-text-primary">Recent Inspections</div>
              <button className="text-[12px] font-bold text-text-secondary hover:text-primary transition-colors">
                View All
              </button>
            </div>
            <div className="divide-y divide-text-secondary/15">
              {stats.recentActivity.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-text-secondary">No recent inspections at this site.</div>
              ) : (
                stats.recentActivity.map(ins => (
                  <div key={ins.id} onClick={() => nav.push(`/qm/inspections/${ins.id}`)} className="px-5 py-3.5 flex items-center justify-between hover:bg-accent-light/20 transition-colors cursor-pointer group gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-text-secondary font-bold">{ins.number}</span>
                        <span className="text-[13px] font-bold text-text-primary truncate">{ins.templateName}</span>
                      </div>
                      <div className="text-[12px] text-text-secondary mt-0.5 truncate font-medium">{ins.area || 'General'}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:inline-block">
                        <StatusPill tone={['approved', 'published'].includes(ins.status) ? 'green' : ['under_review', 'issues_open'].includes(ins.status) ? 'amber' : 'neutral'}>
                          {ins.status.replace('_', ' ')}
                        </StatusPill>
                      </div>
                      <span className="font-mono text-[10px] text-text-secondary w-12 text-right font-bold">{formatRelativeTime(ins.submittedAt || ins.createdAt)}</span>
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
          <div className="rounded-2xl border border-text-secondary/15 bg-white p-5 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-4">Site Manager</div>
            {site.managerName ? (
              <div className="flex items-center gap-3">
                <Avatar name={site.managerName} size="lg" />
                <div>
                  <div className="text-[14px] font-bold text-text-primary">{site.managerName}</div>
                  <div className="text-[11px] text-text-secondary font-medium mt-0.5">Manager Role</div>
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-text-secondary italic">No manager assigned.</div>
            )}
            {site.status !== 'archived' && (
              <button onClick={() => setEditOpen(true)} className="mt-4 text-[12px] font-bold text-text-primary hover:text-primary transition-colors">
                Reassign Manager
              </button>
            )}
          </div>

          {/* Personnel Breakdown */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white p-5 space-y-5 shadow-soft">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3">Personnel Breakdown</div>
              <div className="space-y-2">
                {Array.from(stats.rolesMap.entries()).length === 0 ? (
                  <div className="text-[12px] text-text-secondary italic">No personnel assigned.</div>
                ) : (
                  Array.from(stats.rolesMap.entries()).map(([role, count]) => (
                    <div key={role} className="flex justify-between text-[13px] font-medium text-text-primary">
                      <span className="capitalize">{role.replace('_', ' ')}s</span>
                      <span className="font-mono font-bold">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="border-t border-text-secondary/15 pt-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3">Template Scopes</div>
              <div className="flex justify-between text-[13px] font-medium text-text-primary">
                <span>Site-specific templates</span>
                <span className="font-mono font-bold">{stats.scopeCount}</span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white p-5 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-4">Certifications</div>
            {site.certifications.length === 0 ? (
              <div className="text-[12px] text-text-secondary italic">No active certifications.</div>
            ) : (
              <div className="space-y-3">
                {site.certifications.map(cert => (
                  <div key={cert} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-pass shrink-0 animate-pulse" />
                      <span className="text-[13px] font-bold text-text-primary">{cert}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-status-pass bg-status-pass/10 px-1.5 py-0.5 rounded border border-status-pass/20 shadow-sm">Valid</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white p-5 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-4">Activity Log</div>
            <div className="space-y-4">
              <div className="relative pl-3 border-l border-text-secondary/15">
                <div className="absolute -left-[3.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-accent-light" />
                <div className="text-[12px] text-text-primary font-bold">Department added: Packaging</div>
                <div className="text-[10px] text-text-secondary mt-0.5 font-bold font-mono">2 days ago · System Admin</div>
              </div>
              <div className="relative pl-3 border-l border-text-secondary/15">
                <div className="absolute -left-[3.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-accent-light" />
                <div className="text-[12px] text-text-primary font-bold">Site details updated</div>
                <div className="text-[10px] text-text-secondary mt-0.5 font-bold font-mono">5 days ago · System Admin</div>
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
    </div>
  )
}

function StatCell({ label, value, sub }: { label: string, value: string, sub: React.ReactNode }) {
  return (
    <div className="bg-white p-4 flex flex-col justify-between h-[104px]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary line-clamp-1">
        {label}
      </div>
      <div>
        <div className="text-[28px] font-bold leading-none tracking-tight text-text-primary mb-1.5">
          {value}
        </div>
        <div className="text-[11px] font-bold text-text-secondary line-clamp-1">
          {sub}
        </div>
      </div>
    </div>
  )
}

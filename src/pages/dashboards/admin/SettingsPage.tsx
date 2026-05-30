import { useEffect, useState, useRef } from 'react'
import { useSettings } from '../../../lib/settings'
import { formatRelativeTime } from '../../../lib/users'
import { Icon } from '../../../components/primitives/Icon'
import { PageBanner } from '../../../components/shell/PageBanner'
import { GeneralSettingsSection } from '../../../components/admin/settings/GeneralSettingsSection'
import { SecuritySettingsSection } from '../../../components/admin/settings/SecuritySettingsSection'
import { IntegrationsSettingsSection } from '../../../components/admin/settings/IntegrationsSettingsSection'
import { BillingSettingsSection } from '../../../components/admin/settings/BillingSettingsSection'
import { DataSettingsSection } from '../../../components/admin/settings/DataSettingsSection'
import { BrandingSettingsSection } from '../../../components/admin/settings/BrandingSettingsSection'

const SECTIONS = [
  { id: 'general', label: 'General', icon: 'home' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'integrations', label: 'Integrations', icon: 'layers' },
  { id: 'billing', label: 'Billing', icon: 'file' },
  { id: 'data', label: 'Data & Retention', icon: 'box' },
  { id: 'branding', label: 'Branding', icon: 'eye' },
]

export function SettingsPage() {
  const { settings } = useSettings()
  const [activeSection, setActiveSection] = useState<string>('general')
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Setup intersection observer to track which section is currently in view
    observer.current = new IntersectionObserver((entries) => {
      // Find the first intersecting entry (we only expect one to be dominant)
      const visibleEntry = entries.find(entry => entry.isIntersecting)
      if (visibleEntry) {
        setActiveSection(visibleEntry.target.id)
      }
    }, {
      rootMargin: '-20% 0px -60% 0px', // triggers when element is roughly in top third
      threshold: 0
    })

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el && observer.current) observer.current.observe(el)
    })

    return () => {
      if (observer.current) observer.current.disconnect()
    }
  }, [])

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Row */}
      <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
        <span className="uppercase text-[10px] tracking-wider text-text-secondary">System Admin</span>
        <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
        <span className="text-text-primary">Settings</span>
      </div>

      {/* Page Banner with History Action */}
      <PageBanner
        title="Workspace Settings"
        subline={`Configure your InspectSphere workspace · Last updated ${formatRelativeTime(settings.updatedAt)} by ${settings.updatedBy === 'usr_maya_chen' ? 'System Admin' : settings.updatedBy}.`}
        actions={
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm">
            <Icon name="activity" className="w-3.5 h-3.5" />
            Change History
          </button>
        }
      />

      {/* ============ Two Column Layout ============ */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-8 items-start pt-4">
        
        {/* Sticky sub-nav */}
        <nav className="hidden md:block sticky top-32 self-start space-y-1 bg-white border border-text-secondary/15 rounded-2xl p-3 shadow-soft">
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-[12px] font-bold rounded-lg transition-all relative ${ isActive ? 'text-text-primary bg-accent-light/70 border border-text-secondary/15/50 shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-accent-light/30' }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r-full bg-warning" />
                )}
                <Icon name={s.icon as any} className={`w-4 h-4 shrink-0 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`} />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Scrollable content with section anchors */}
        <div className="space-y-16">
          <GeneralSettingsSection />
          <SecuritySettingsSection />
          <IntegrationsSettingsSection />
          <BillingSettingsSection />
          <DataSettingsSection />
          <BrandingSettingsSection />
        </div>
      </div>
    </div>
  )
}

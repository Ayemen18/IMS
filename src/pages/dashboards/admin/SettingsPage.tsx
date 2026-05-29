import { useEffect, useState, useRef } from 'react'
import { useSettings } from '../../../lib/settings'
import { formatRelativeTime } from '../../../lib/users'
import { Icon } from '../../../components/primitives/Icon'
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
  { id: 'data', label: 'Data & retention', icon: 'box' },
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
    <div className="stagger max-w-[1200px] mx-auto pb-24">
      {/* ============ Header ============ */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400 mb-2">
          <span>System Admin</span>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">Settings</span>
        </div>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
              Workspace <span className="italic text-ink-500 dark:text-ink-400">settings</span>.
            </h1>
            <p className="mt-2 text-[14px] text-ink-600 dark:text-ink-300">
              Configure your InspectSphere workspace · Last updated {formatRelativeTime(settings.updatedAt)} by {settings.updatedBy === 'usr_maya_chen' ? 'System Admin' : settings.updatedBy}.
            </p>
          </div>
          <div>
            <button className="text-[13px] font-medium text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
              View change history
            </button>
          </div>
        </div>
      </div>

      {/* ============ Two Column Layout ============ */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-12 items-start">
        
        {/* Sticky sub-nav */}
        <nav className="hidden md:block sticky top-32 self-start pr-4 space-y-1">
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-r-md transition-colors relative ${
                  isActive 
                    ? 'text-ink-900 dark:text-ink-50 bg-ink-50/50 dark:bg-ink-800/30' 
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full bg-brand-yellow" />
                )}
                {!isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full bg-transparent" />
                )}
                <Icon name={s.icon as any} className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Scrollable content with section anchors */}
        <div className="space-y-24">
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

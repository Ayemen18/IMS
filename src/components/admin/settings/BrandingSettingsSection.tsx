import { useState, useEffect } from 'react'
import { useSettings } from '../../../lib/settings'
import { SettingsSection, SettingsField } from './SettingsSection'

export function BrandingSettingsSection() {
  const { settings, updateBranding } = useSettings()
  
  const [form, setForm] = useState(settings.branding)
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings.branding)

  useEffect(() => {
    setForm(settings.branding)
  }, [settings.branding])

  const handleSave = () => {
    updateBranding(form)
  }

  const handleDiscard = () => {
    setForm(settings.branding)
  }

  return (
    <SettingsSection
      id="branding"
      title={<>Branding.</>}
      description="How InspectSphere appears to your team."
      isDirty={isDirty}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      
      {/* 1. Brand colors */}
      <div className="pt-2">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Brand colors
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Workspace palette" description="Brand colors are managed at the system level. Contact your administrator to customize.">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 p-3 rounded-md border hairline bg-white dark:bg-ink-900">
                <div 
                  className="w-10 h-10 rounded shadow-sm shrink-0"
                  style={{ backgroundColor: settings.branding.primaryColor }}
                />
                <div>
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 leading-tight">Brand-blue (InspectSphere)</div>
                  <div className="text-[12px] text-ink-500 font-mono mt-0.5">{settings.branding.primaryColor}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border hairline bg-white dark:bg-ink-900">
                <div 
                  className="w-10 h-10 rounded shadow-sm shrink-0"
                  style={{ backgroundColor: settings.branding.accentColor }}
                />
                <div>
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 leading-tight">Brand-yellow (sparingly)</div>
                  <div className="text-[12px] text-ink-500 font-mono mt-0.5">{settings.branding.accentColor}</div>
                </div>
              </div>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 2. Logo */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Logo
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Workspace logo" description="Used in the sidebar, emails, and exports.">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center p-6 rounded-md border hairline bg-ink-50/50 dark:bg-ink-800/30">
                <img src={settings.branding.logoUrl} alt="Logo" className="h-10 object-contain" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                  Upload new logo
                </button>
                <button type="button" className="text-[12px] font-medium text-accent-600 hover:underline">
                  Reset to default
                </button>
              </div>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 3. Login screen */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Login screen
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Login tagline" description="Shown on the sign-in page below the logo.">
            <div className="space-y-4">
              <input
                type="text"
                value={form.loginScreenTagline}
                onChange={(e) => setForm({ ...form, loginScreenTagline: e.target.value })}
                className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50"
              />
              
              <div className="max-w-sm p-4 rounded-md border hairline bg-ink-50 dark:bg-ink-800 flex flex-col items-center justify-center text-center">
                <img src={settings.branding.logoUrl} alt="Logo" className="h-6 object-contain mb-3 opacity-50" />
                <p className="font-display text-[20px] text-ink-900 dark:text-ink-50 leading-snug">
                  {form.loginScreenTagline}
                </p>
                <div className="mt-4 w-full h-8 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900/50 flex items-center justify-center">
                  <div className="w-16 h-2 rounded bg-ink-200 dark:bg-ink-700" />
                </div>
              </div>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 4. Email customization */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Email customization
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Email footer text" description="Appended to all outgoing system emails.">
            <textarea
              value={form.emailFooterText}
              onChange={(e) => setForm({ ...form, emailFooterText: e.target.value })}
              rows={3}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 resize-none"
            />
          </SettingsField>

          <SettingsField label="Custom domain" description="Use your own domain for outgoing email notifications. Requires DNS setup.">
            <div className="flex items-center gap-2 max-w-sm">
              <span className="text-[13px] text-ink-500 font-mono">@</span>
              <input
                type="text"
                value={form.customDomain || ''}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value || null })}
                placeholder="e.g. inspections.acme.com"
                className="focus-ring w-full px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50"
              />
            </div>
          </SettingsField>
        </div>
      </div>

    </SettingsSection>
  )
}

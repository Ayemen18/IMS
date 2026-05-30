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
        <h3 className="text-[14px] font-medium text-text-primary mb-6 pb-2 border-b hairline">
          Brand colors
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Workspace palette" description="Brand colors are managed at the system level. Contact your administrator to customize.">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 p-3 rounded-md border hairline bg-white">
                <div 
                  className="w-10 h-10 rounded shadow-sm shrink-0"
                  style={{ backgroundColor: settings.branding.primaryColor }}
                />
                <div>
                  <div className="text-[13px] font-medium text-text-primary leading-tight">Brand-blue (InspectSphere)</div>
                  <div className="text-[12px] text-text-secondary font-mono mt-0.5">{settings.branding.primaryColor}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border hairline bg-white">
                <div 
                  className="w-10 h-10 rounded shadow-sm shrink-0"
                  style={{ backgroundColor: settings.branding.accentColor }}
                />
                <div>
                  <div className="text-[13px] font-medium text-text-primary leading-tight">Brand-yellow (sparingly)</div>
                  <div className="text-[12px] text-text-secondary font-mono mt-0.5">{settings.branding.accentColor}</div>
                </div>
              </div>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 2. Logo */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-text-primary mb-6 pb-2 border-b hairline">
          Logo
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Workspace logo" description="Used in the sidebar, emails, and exports.">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center p-6 rounded-md border hairline bg-accent-light/50">
                <img src={settings.branding.logoUrl} alt="Logo" className="h-10 object-contain" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light transition-colors">
                  Upload new logo
                </button>
                <button type="button" className="text-[12px] font-medium text-primary hover:underline">
                  Reset to default
                </button>
              </div>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 3. Login screen */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-text-primary mb-6 pb-2 border-b hairline">
          Login screen
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Login tagline" description="Shown on the sign-in page below the logo.">
            <div className="space-y-4">
              <input
                type="text"
                value={form.loginScreenTagline}
                onChange={(e) => setForm({ ...form, loginScreenTagline: e.target.value })}
                className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary"
              />
              
              <div className="max-w-sm p-4 rounded-md border hairline bg-accent-light flex flex-col items-center justify-center text-center">
                <img src={settings.branding.logoUrl} alt="Logo" className="h-6 object-contain mb-3 opacity-50" />
                <p className="font-sans font-bold text-[20px] text-text-primary leading-snug">
                  {form.loginScreenTagline}
                </p>
                <div className="mt-4 w-full h-8 rounded border border-text-secondary/15 bg-white flex items-center justify-center">
                  <div className="w-16 h-2 rounded bg-accent-light" />
                </div>
              </div>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 4. Email customization */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-text-primary mb-6 pb-2 border-b hairline">
          Email customization
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Email footer text" description="Appended to all outgoing system emails.">
            <textarea
              value={form.emailFooterText}
              onChange={(e) => setForm({ ...form, emailFooterText: e.target.value })}
              rows={3}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary resize-none"
            />
          </SettingsField>

          <SettingsField label="Custom domain" description="Use your own domain for outgoing email notifications. Requires DNS setup.">
            <div className="flex items-center gap-2 max-w-sm">
              <span className="text-[13px] text-text-secondary font-mono">@</span>
              <input
                type="text"
                value={form.customDomain || ''}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value || null })}
                placeholder="e.g. inspections.acme.com"
                className="focus-ring w-full px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary"
              />
            </div>
          </SettingsField>
        </div>
      </div>

    </SettingsSection>
  )
}

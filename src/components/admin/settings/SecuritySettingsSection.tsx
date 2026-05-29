import { useState, useEffect } from 'react'
import { useSettings } from '../../../lib/settings'
import { SettingsSection, SettingsField } from './SettingsSection'
import { Icon } from '../../../components/primitives/Icon'

export function SecuritySettingsSection() {
  const { settings, updateSecurity } = useSettings()
  
  const [form, setForm] = useState(settings.security)
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings.security)

  useEffect(() => {
    setForm(settings.security)
  }, [settings.security])

  const handleSave = () => {
    updateSecurity(form)
  }

  const handleDiscard = () => {
    setForm(settings.security)
  }

  const handleIpAllowlistChange = (val: string) => {
    const list = val.split('\\n').map(s => s.trim()).filter(Boolean)
    setForm({ ...form, ipAllowlist: list })
  }

  return (
    <SettingsSection
      id="security"
      title={<>Security &amp; <span className="italic text-ink-500">access</span>.</>}
      description="Authentication, sessions, and access policies."
      isDirty={isDirty}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      
      {/* 1. Single sign-on */}
      <div className="pt-2">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Single sign-on
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Enable SSO" description="Require users to authenticate via your identity provider.">
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={form.ssoEnabled} 
                  onChange={(e) => setForm({ ...form, ssoEnabled: e.target.checked })} 
                />
                <div className="w-9 h-5 bg-ink-200 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-500"></div>
              </label>
              <div className="flex items-center gap-1.5 text-[12px] font-medium">
                {form.ssoEnabled ? (
                  <><span className="w-2 h-2 rounded-full bg-signal-green" /> <span className="text-ink-900 dark:text-ink-50">Connected</span></>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-signal-amber" /> <span className="text-ink-500">Not configured</span></>
                )}
              </div>
            </div>
          </SettingsField>

          {form.ssoEnabled && (
            <>
              <SettingsField label="SSO provider">
                <select
                  value={form.ssoProvider || ''}
                  onChange={(e) => setForm({ ...form, ssoProvider: e.target.value as any })}
                  className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 cursor-pointer"
                >
                  <option value="okta">Okta</option>
                  <option value="azure_ad">Azure AD</option>
                  <option value="google">Google Workspace</option>
                </select>
              </SettingsField>

              <SettingsField label="SSO domain">
                <input
                  type="text"
                  value={form.ssoDomain || ''}
                  onChange={(e) => setForm({ ...form, ssoDomain: e.target.value })}
                  placeholder="e.g. acme.com"
                  className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50"
                />
              </SettingsField>
              
              <SettingsField label="">
                <button type="button" className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                  Test connection
                </button>
              </SettingsField>
            </>
          )}
        </div>
      </div>

      {/* 2. Authentication */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Authentication
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Enforce 2FA" description="Require two-factor authentication for all users.">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={form.enforce2fa} 
                onChange={(e) => setForm({ ...form, enforce2fa: e.target.checked })} 
              />
              <div className="w-9 h-5 bg-ink-200 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-500"></div>
            </label>
          </SettingsField>

          <SettingsField label="Session timeout" description="Automatically log users out after inactivity.">
            <select
              value={form.sessionTimeoutMinutes}
              onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: parseInt(e.target.value) })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 cursor-pointer"
            >
              <option value={60}>60 minutes</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </SettingsField>
        </div>
      </div>

      {/* 3. Password policy */}
      <div className="pt-6">
        <h3 className="flex items-center gap-2 text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          Password policy
          {form.ssoEnabled && (
            <span className="px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-[10px] uppercase tracking-wider text-ink-500 font-medium">
              Managed by SSO
            </span>
          )}
        </h3>
        
        <div className={`space-y-8 ${form.ssoEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsField label="Minimum length">
            <select
              value={form.passwordMinLength}
              onChange={(e) => setForm({ ...form, passwordMinLength: parseInt(e.target.value) })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 cursor-pointer"
            >
              <option value={8}>8 characters</option>
              <option value={12}>12 characters</option>
              <option value={16}>16 characters</option>
            </select>
          </SettingsField>

          <SettingsField label="Complexity requirements">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.passwordRequireSpecial}
                  onChange={(e) => setForm({ ...form, passwordRequireSpecial: e.target.checked })}
                  className="w-4 h-4 rounded border-ink-300 dark:border-ink-600 accent-accent-500 cursor-pointer"
                />
                <span className="text-[13px] text-ink-900 dark:text-ink-50">Require special character</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.passwordRequireNumber}
                  onChange={(e) => setForm({ ...form, passwordRequireNumber: e.target.checked })}
                  className="w-4 h-4 rounded border-ink-300 dark:border-ink-600 accent-accent-500 cursor-pointer"
                />
                <span className="text-[13px] text-ink-900 dark:text-ink-50">Require number</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.passwordRequireUppercase}
                  onChange={(e) => setForm({ ...form, passwordRequireUppercase: e.target.checked })}
                  className="w-4 h-4 rounded border-ink-300 dark:border-ink-600 accent-accent-500 cursor-pointer"
                />
                <span className="text-[13px] text-ink-900 dark:text-ink-50">Require uppercase letter</span>
              </label>
            </div>
          </SettingsField>

          <SettingsField label="Password expiry">
            <select
              value={form.passwordExpiryDays}
              onChange={(e) => setForm({ ...form, passwordExpiryDays: parseInt(e.target.value) })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 cursor-pointer"
            >
              <option value={0}>Never expire</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days</option>
            </select>
          </SettingsField>
        </div>
      </div>

      {/* 4. IP allowlist */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-6 pb-2 border-b hairline">
          IP allowlist
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Enable allowlist" description="Restrict access to specific IP ranges.">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={form.ipAllowlistEnabled} 
                onChange={(e) => setForm({ ...form, ipAllowlistEnabled: e.target.checked })} 
              />
              <div className="w-9 h-5 bg-ink-200 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-500"></div>
            </label>
          </SettingsField>

          {form.ipAllowlistEnabled && (
            <SettingsField label="Allowed IP ranges" description="Enter CIDR blocks, one per line.">
              <div className="space-y-3 max-w-md">
                <textarea
                  value={form.ipAllowlist.join('\\n')}
                  onChange={(e) => handleIpAllowlistChange(e.target.value)}
                  rows={4}
                  placeholder="e.g. 192.168.1.1/32"
                  className="focus-ring w-full px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] font-mono text-ink-900 dark:text-ink-50"
                />
                
                <div className="flex items-center justify-between">
                  <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                    Validate ranges
                  </button>
                  <span className="text-[11px] text-ink-500 font-mono">
                    {form.ipAllowlist.length} range{form.ipAllowlist.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="rounded-md bg-signal-amber/10 px-3 py-2.5 flex items-start gap-2.5">
                  <Icon name="alert" className="w-4 h-4 text-signal-amber shrink-0 mt-0.5" />
                  <p className="text-[12px] text-signal-amber leading-snug">
                    <span className="font-semibold">Warning:</span> When enabled, only requests from these IP ranges will be allowed. Test thoroughly before enforcing to avoid locking yourself out.
                  </p>
                </div>
              </div>
            </SettingsField>
          )}
        </div>
      </div>

    </SettingsSection>
  )
}

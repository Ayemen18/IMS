import { useState, useEffect } from 'react'
import { useSettings } from '../../../lib/settings'
import { SettingsSection, SettingsField } from './SettingsSection'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo',
  'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'
]

const LOCALES = [
  { val: 'en-US', label: 'English (US)' },
  { val: 'en-GB', label: 'English (UK)' },
  { val: 'en-IN', label: 'English (India)' },
  { val: 'fr-FR', label: 'French (France)' },
  { val: 'de-DE', label: 'German (Germany)' },
  { val: 'es-ES', label: 'Spanish (Spain)' },
  { val: 'pt-BR', label: 'Portuguese (Brazil)' },
  { val: 'ja-JP', label: 'Japanese (Japan)' },
  { val: 'zh-CN', label: 'Chinese (Simplified)' }
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function GeneralSettingsSection() {
  const { settings, updateGeneral } = useSettings()
  
  const [form, setForm] = useState(settings.general)
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings.general)

  useEffect(() => {
    setForm(settings.general)
  }, [settings.general])

  const handleSave = () => {
    updateGeneral(form)
  }

  const handleDiscard = () => {
    setForm(settings.general)
  }

  return (
    <SettingsSection
      id="general"
      title={<>General <span className="italic text-text-secondary">settings</span>.</>}
      description="Workspace identity, locale, and operational defaults."
      isDirty={isDirty}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      {/* Design Moment: Workspace Identity Card */}
      <div className="rounded-lg border hairline bg-gradient-to-r from-primary/500 to-transparent p-6 mb-8 flex items-center gap-6">
        <div className="shrink-0">
          <img src={settings.branding.logoUrl} alt="Workspace Logo" className="h-12 object-contain" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-[28px] leading-tight text-text-primary">
            {form.workspaceName || 'Workspace'}
          </h3>
          <div className="font-mono text-[12px] text-text-secondary mt-1 uppercase tracking-wide">
            {form.workspaceCode}
          </div>
        </div>
      </div>

      <SettingsField label="Workspace name" description="The public name of your organization.">
        <input
          type="text"
          value={form.workspaceName}
          onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
          className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary transition-colors"
        />
      </SettingsField>

      <SettingsField label="Workspace code" description="Identifier — contact support to change.">
        <input
          type="text"
          value={form.workspaceCode}
          disabled
          className="w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-accent-light text-[13px] text-text-secondary font-mono cursor-not-allowed"
        />
      </SettingsField>

      <SettingsField label="Primary domain" description="Focus the UI on Quality, Safety, or Both.">
        <div className="flex flex-col gap-2.5">
          {(['quality', 'safety', 'both'] as const).map(d => (
            <label key={d} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="domain"
                checked={form.primaryDomain === d}
                onChange={() => setForm({ ...form, primaryDomain: d })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-[13px] text-text-primary capitalize group-hover:text-primary transition-colors">{d}</span>
            </label>
          ))}
        </div>
      </SettingsField>

      <SettingsField label="Timezone" description="Default timezone for timestamps and scheduling.">
        <select
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </SettingsField>

      <SettingsField label="Locale" description="Language and region formats.">
        <select
          value={form.locale}
          onChange={(e) => setForm({ ...form, locale: e.target.value })}
          className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
        >
          {LOCALES.map(loc => (
            <option key={loc.val} value={loc.val}>{loc.label}</option>
          ))}
        </select>
      </SettingsField>

      <SettingsField label="Fiscal year start" description="Used for compliance reporting periods.">
        <select
          value={form.fiscalYearStartMonth}
          onChange={(e) => setForm({ ...form, fiscalYearStartMonth: parseInt(e.target.value) })}
          className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
      </SettingsField>

      <SettingsField label="Week start" description="First day of the week in calendars.">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="weekStart"
              checked={form.weekStart === 'monday'}
              onChange={() => setForm({ ...form, weekStart: 'monday' })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">Monday</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="weekStart"
              checked={form.weekStart === 'sunday'}
              onChange={() => setForm({ ...form, weekStart: 'sunday' })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">Sunday</span>
          </label>
        </div>
      </SettingsField>

      <SettingsField label="Date format" description="Display format across the application.">
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="dateFormat"
              checked={form.dateFormat === 'iso'}
              onChange={() => setForm({ ...form, dateFormat: 'iso' })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">ISO <span className="text-text-secondary">(2026-05-29)</span></span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="dateFormat"
              checked={form.dateFormat === 'us'}
              onChange={() => setForm({ ...form, dateFormat: 'us' })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">US <span className="text-text-secondary">(05/29/2026)</span></span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="dateFormat"
              checked={form.dateFormat === 'eu'}
              onChange={() => setForm({ ...form, dateFormat: 'eu' })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">EU <span className="text-text-secondary">(29/05/2026)</span></span>
          </label>
        </div>
      </SettingsField>
    </SettingsSection>
  )
}

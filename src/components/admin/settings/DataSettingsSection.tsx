import { useState, useEffect } from 'react'
import { useSettings } from '../../../lib/settings'
import { SettingsSection, SettingsField } from './SettingsSection'

export function DataSettingsSection() {
  const { settings, updateData } = useSettings()
  
  const [form, setForm] = useState(settings.data)
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings.data)

  useEffect(() => {
    setForm(settings.data)
  }, [settings.data])

  const handleSave = () => {
    updateData(form)
  }

  const handleDiscard = () => {
    setForm(settings.data)
  }

  return (
    <SettingsSection
      id="data"
      title={<>Data &amp; <span className="italic text-text-secondary">retention</span>.</>}
      description="How long data is kept and how it can be exported."
      isDirty={isDirty}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      
      {/* 1. Retention policy */}
      <div className="pt-2">
        <h3 className="text-[14px] font-medium text-text-primary mb-6 pb-2 border-b hairline">
          Retention policy
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Inspection records" description="How long to keep closed inspection data.">
            <select
              value={form.retentionDays}
              onChange={(e) => setForm({ ...form, retentionDays: parseInt(e.target.value) })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={1095}>3 years</option>
              <option value={1825}>5 years</option>
              <option value={-1}>Forever</option>
            </select>
          </SettingsField>

          <SettingsField label="Audit logs" description="Retention period for system action logs.">
            <select
              value={form.auditLogRetentionDays}
              onChange={(e) => setForm({ ...form, auditLogRetentionDays: parseInt(e.target.value) })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={1095}>3 years</option>
              <option value={1825}>5 years</option>
              <option value={-1}>Forever</option>
            </select>
          </SettingsField>

          <SettingsField label="Auto-archive" description="Archive completed inspections after this period.">
            <select
              value={form.autoArchiveCompletedInspectionsDays}
              onChange={(e) => setForm({ ...form, autoArchiveCompletedInspectionsDays: parseInt(e.target.value) })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer"
            >
              <option value={0}>Never</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </SettingsField>

          <SettingsField label="GDPR compliance mode" description="Enables right-to-erasure workflows and EU data residency.">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={form.gdprMode} 
                onChange={(e) => setForm({ ...form, gdprMode: e.target.checked })} 
              />
              <div className="w-9 h-5 bg-accent-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </SettingsField>
        </div>
      </div>

      {/* 2. Export & import */}
      <div className="pt-6">
        <h3 className="text-[14px] font-medium text-text-primary mb-6 pb-2 border-b hairline">
          Export &amp; import
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Default export format" description="Used for scheduled reports and data dumps.">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={form.exportFormat === 'json'}
                  onChange={() => setForm({ ...form, exportFormat: 'json' })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors font-mono">JSON</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={form.exportFormat === 'csv'}
                  onChange={() => setForm({ ...form, exportFormat: 'csv' })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors font-mono">CSV</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={form.exportFormat === 'xlsx'}
                  onChange={() => setForm({ ...form, exportFormat: 'xlsx' })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors font-mono">XLSX</span>
              </label>
            </div>
          </SettingsField>

          <SettingsField label="Data actions">
            <div className="flex items-center gap-3">
              <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light transition-colors">
                Export all data
              </button>
              <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light transition-colors">
                Import templates
              </button>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 3. Danger zone */}
      <div className="pt-6">
        <div className="rounded-md border border-status-fail/30 bg-status-fail/5 p-6">
          <h3 className="text-[14px] font-medium text-status-fail mb-2">
            Danger zone
          </h3>
          <p className="text-[13px] text-text-secondary mb-6">
            These actions are permanent and cannot be undone. Please proceed with caution.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-t border-status-fail/10">
              <div>
                <div className="text-[13px] font-medium text-text-primary">Delete old records</div>
                <div className="text-[12px] text-text-secondary mt-0.5">Permanently delete all inspections older than 5 years.</div>
              </div>
              <button type="button" className="shrink-0 px-3 py-1.5 rounded-md border border-status-fail text-[12px] font-medium text-status-fail hover:bg-status-fail hover:text-white transition-colors">
                Delete records
              </button>
            </div>
            
            <div className="flex items-center justify-between py-4 border-t border-status-fail/10">
              <div>
                <div className="text-[13px] font-medium text-text-primary">Reset workspace</div>
                <div className="text-[12px] text-text-secondary mt-0.5">Delete all data and reset workspace to factory defaults.</div>
              </div>
              <button type="button" className="shrink-0 px-3 py-1.5 rounded-md bg-status-fail text-[12px] font-medium text-white hover:bg-status-fail/90 transition-colors">
                Reset workspace
              </button>
            </div>
          </div>
        </div>
      </div>

    </SettingsSection>
  )
}

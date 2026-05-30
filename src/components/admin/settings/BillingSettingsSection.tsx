import { useState, useEffect } from 'react'
import { useSettings } from '../../../lib/settings'
import { SettingsSection, SettingsField } from './SettingsSection'
import { StatusPill } from '../../../components/primitives/StatusPill'

const INVOICES = [
  { id: 'INV-2026-005', date: '2026-05-01', amount: '$1,200.00', status: 'paid' },
  { id: 'INV-2026-004', date: '2026-04-01', amount: '$1,200.00', status: 'paid' },
  { id: 'INV-2026-003', date: '2026-03-01', amount: '$1,200.00', status: 'paid' },
  { id: 'INV-2026-002', date: '2026-02-01', amount: '$1,200.00', status: 'paid' },
  { id: 'INV-2026-001', date: '2026-01-01', amount: '$1,200.00', status: 'paid' },
  { id: 'INV-2025-012', date: '2025-12-01', amount: '$1,200.00', status: 'paid' },
]

export function BillingSettingsSection() {
  const { settings, updateBilling } = useSettings()
  
  const [form, setForm] = useState(settings.billing)
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings.billing)

  useEffect(() => {
    setForm(settings.billing)
  }, [settings.billing])

  const handleSave = () => {
    updateBilling(form)
  }

  const handleDiscard = () => {
    setForm(settings.billing)
  }

  const seatsPercent = Math.min(100, Math.round((form.seats.used / form.seats.total) * 100))

  return (
    <SettingsSection
      id="billing"
      title={<>Billing &amp; <span className="italic text-text-secondary">plan</span>.</>}
      description="Your subscription, usage, and invoices."
      isDirty={isDirty}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      
      {/* Design Moment: Plan Summary Card */}
      <div className="rounded-lg border border-text-secondary/15 p-6 bg-gradient-to-br from-primary/500 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-medium">Current plan</div>
            <div className="mt-2 font-sans font-bold text-[40px] leading-none text-text-primary capitalize">
              {form.plan}
            </div>
            <div className="mt-2 text-[14px] text-text-secondary">
              $1,200/month &middot; billed {form.billingPeriod}
            </div>
          </div>
          <button type="button" className="btn-primary px-4 py-2 rounded-md bg-primary text-white text-[13px] font-medium hover:bg-primary transition-colors">
            Manage plan
          </button>
        </div>
        
        {/* Seats progress */}
        <div className="mt-8">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[13px] text-text-secondary">Seats in use</div>
            <div className="font-mono text-[13px] text-text-primary">
              {form.seats.used} <span className="text-text-secondary">/ {form.seats.total}</span>
            </div>
          </div>
          <div className="h-2 bg-accent-light rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${seatsPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 1. Usage this period */}
      <div className="pt-2">
        <h3 className="text-[14px] font-medium text-text-primary mb-4">
          Usage this period
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-md border hairline bg-white">
            <div className="text-[12px] text-text-secondary mb-1">Active users</div>
            <div className="text-[20px] font-mono text-text-primary leading-tight">
              {form.currentMonthUsage.activeUsers}
            </div>
          </div>
          <div className="p-4 rounded-md border hairline bg-white">
            <div className="text-[12px] text-text-secondary mb-1">Inspections</div>
            <div className="flex items-baseline gap-2">
              <div className="text-[20px] font-mono text-text-primary leading-tight">
                {form.currentMonthUsage.inspectionsCompleted}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-status-pass font-medium">No limit</div>
            </div>
          </div>
          <div className="p-4 rounded-md border hairline bg-white">
            <div className="text-[12px] text-text-secondary mb-1">Storage used</div>
            <div className="flex items-baseline gap-2">
              <div className="text-[20px] font-mono text-text-primary leading-tight">
                {form.currentMonthUsage.storageGb} <span className="text-[14px] text-text-secondary">GB</span>
              </div>
              <div className="text-[10px] text-text-secondary">of 100 GB</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Billing details */}
      <div className="pt-6 border-t hairline">
        <h3 className="text-[14px] font-medium text-text-primary mb-6">
          Billing details
        </h3>
        
        <div className="space-y-8">
          <SettingsField label="Billing email" description="Where invoices and receipts are sent.">
            <input
              type="email"
              value={form.billingEmail}
              onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
              className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary"
            />
          </SettingsField>

          <SettingsField label="Billing period" description="Annual billing saves 20%.">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="billingPeriod"
                  checked={form.billingPeriod === 'monthly'}
                  onChange={() => setForm({ ...form, billingPeriod: 'monthly' })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">Monthly</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="billingPeriod"
                  checked={form.billingPeriod === 'annual'}
                  onChange={() => setForm({ ...form, billingPeriod: 'annual' })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-text-primary group-hover:text-primary transition-colors">
                  Annual <span className="ml-1 px-1.5 py-0.5 rounded bg-status-pass/10 text-status-pass text-[10px] font-medium uppercase tracking-wider">Save 20%</span>
                </span>
              </label>
            </div>
          </SettingsField>

          <SettingsField label="Next billing date" description="When your card will be charged next.">
            <div className="text-[13px] font-mono text-text-primary py-2">
              {new Date(form.nextBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </SettingsField>

          <SettingsField label="Payment method">
            <div className="flex items-center gap-4 py-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded border hairline bg-accent-light">
                <div className="w-8 h-5 bg-white rounded-sm border hairline flex items-center justify-center text-[10px] font-bold italic text-[#1A1F71]">VISA</div>
                <span className="text-[13px] font-mono text-text-primary">&bull;&bull;&bull;&bull; 4242</span>
              </div>
              <button type="button" className="text-[12px] font-medium text-primary hover:underline">
                Update
              </button>
            </div>
          </SettingsField>
        </div>
      </div>

      {/* 3. Invoices */}
      <div className="pt-6 border-t hairline">
        <h3 className="text-[14px] font-medium text-text-primary mb-4">
          Invoices
        </h3>
        
        <div className="rounded-md border hairline bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b hairline bg-accent-light/50">
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Date</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Invoice Number</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Amount</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Status</th>
                <th className="px-4 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y hairline">
              {INVOICES.map(inv => (
                <tr key={inv.id} className="hover:bg-accent-light/50 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-text-primary whitespace-nowrap">
                    {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                    {inv.id}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text-primary">
                    {inv.amount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="capitalize">
                      <StatusPill tone="green">{inv.status}</StatusPill>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="text-[12px] font-medium text-primary hover:underline whitespace-nowrap">
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </SettingsSection>
  )
}

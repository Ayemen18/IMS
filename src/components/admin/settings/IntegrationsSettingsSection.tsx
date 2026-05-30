import { useState, useEffect } from 'react'
import { useSettings } from '../../../lib/settings'
import { SettingsSection } from './SettingsSection'
import { Icon } from '../../../components/primitives/Icon'
import { formatRelativeTime } from '../../../lib/users'

export function IntegrationsSettingsSection() {
  const { settings, updateIntegrations } = useSettings()
  
  const [form, setForm] = useState(settings.integrations)
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings.integrations)

  useEffect(() => {
    setForm(settings.integrations)
  }, [settings.integrations])

  const handleSave = () => {
    updateIntegrations(form)
  }

  const handleDiscard = () => {
    setForm(settings.integrations)
  }

  return (
    <SettingsSection
      id="integrations"
      title={<>Integrations.</>}
      description="Connect InspectSphere to your existing systems."
      isDirty={isDirty}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      <div className="space-y-4">
        
        {/* Slack Integration */}
        <IntegrationCard
          name="Slack"
          icon="layers" // Placeholder icon
          connected={form.slack.connected}
          statusText={form.slack.connected ? `Connected to ${form.slack.channel}` : 'Not connected'}
        >
          <div className="p-5 border-t hairline bg-accent-light/50 space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-text-primary mb-1.5">Notification Channel</label>
              <input
                type="text"
                value={form.slack.channel || ''}
                onChange={(e) => setForm({ ...form, slack: { ...form.slack, channel: e.target.value } })}
                placeholder="#quality-ops"
                className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary"
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-medium text-text-primary mb-2">Events</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-text-secondary/15 accent-primary" />
                  <span className="text-[13px] text-text-secondary">Inspection published</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-text-secondary/15 accent-primary" />
                  <span className="text-[13px] text-text-secondary">New issue created</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-text-secondary/15 accent-primary" />
                  <span className="text-[13px] text-text-secondary">Daily digest</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t hairline">
              <button type="button" className="px-3 py-1.5 rounded-md border border-status-fail/30 text-[12px] font-medium text-status-fail hover:bg-status-fail/5 transition-colors">
                Disconnect Slack
              </button>
              {form.slack.lastSync && (
                <span className="text-[11px] text-text-secondary font-mono">Last sync {formatRelativeTime(form.slack.lastSync)}</span>
              )}
            </div>
          </div>
        </IntegrationCard>

        {/* Email Integration */}
        <IntegrationCard
          name="Email Provider"
          icon="mail"
          connected={true}
          statusText={`Connected via ${form.email.provider}`}
        >
          <div className="p-5 border-t hairline bg-accent-light/50 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              <div>
                <label className="block text-[12px] font-medium text-text-primary mb-1.5">Provider</label>
                <select
                  value={form.email.provider}
                  onChange={(e) => setForm({ ...form, email: { ...form.email, provider: e.target.value as any } })}
                  className="focus-ring w-full px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer capitalize"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="aws_ses">AWS SES</option>
                  <option value="smtp">Custom SMTP</option>
                </select>
              </div>
              
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-medium text-text-primary mb-1.5">Sender Name</label>
                  <input
                    type="text"
                    value={form.email.senderName}
                    onChange={(e) => setForm({ ...form, email: { ...form.email, senderName: e.target.value } })}
                    className="focus-ring w-full px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-text-primary mb-1.5">Sender Email</label>
                  <input
                    type="email"
                    value={form.email.senderEmail}
                    onChange={(e) => setForm({ ...form, email: { ...form.email, senderEmail: e.target.value } })}
                    className="focus-ring w-full px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t hairline">
              <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light transition-colors">
                Send test email
              </button>
              {form.email.verified && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-status-pass">
                  <Icon name="check" className="w-3.5 h-3.5" /> Domain verified
                </span>
              )}
            </div>
          </div>
        </IntegrationCard>

        {/* ERP Integration */}
        <IntegrationCard
          name="ERP System"
          icon="database"
          connected={form.erp.connected}
          statusText={form.erp.connected ? `Connected to ${form.erp.system?.toUpperCase()}` : 'Not connected'}
        >
          <div className="p-5 border-t hairline bg-accent-light/50 space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-text-primary mb-1.5">System</label>
              <select
                value={form.erp.system || ''}
                onChange={(e) => setForm({ ...form, erp: { ...form.erp, system: e.target.value as any } })}
                className="focus-ring w-full max-w-sm px-3 py-2 rounded-md border border-text-secondary/15 bg-white text-[13px] text-text-primary cursor-pointer capitalize"
              >
                <option value="sap">SAP</option>
                <option value="oracle">Oracle</option>
                <option value="netsuite">NetSuite</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t hairline">
              <button type="button" className="px-3 py-1.5 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light transition-colors">
                Run manual sync
              </button>
              <button type="button" className="text-[12px] font-medium text-primary hover:underline">
                View sync schedule
              </button>
              {form.erp.lastSync && (
                <span className="text-[11px] text-text-secondary font-mono ml-auto">Last sync {formatRelativeTime(form.erp.lastSync)}</span>
              )}
            </div>
          </div>
        </IntegrationCard>

        {/* Webhooks */}
        <IntegrationCard
          name="Webhooks"
          icon="code"
          connected={form.webhooks.length > 0}
          statusText={`${form.webhooks.filter(w => w.active).length} active hooks`}
        >
          <div className="p-5 border-t hairline bg-accent-light/50">
            {form.webhooks.length > 0 ? (
              <div className="rounded-md border hairline bg-white overflow-hidden mb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b hairline bg-accent-light/50">
                      <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary">URL</th>
                      <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Events</th>
                      <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary">Last Delivery</th>
                      <th className="px-4 py-2 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y hairline">
                    {form.webhooks.map(wh => (
                      <tr key={wh.id} className="hover:bg-accent-light/50 transition-colors">
                        <td className="px-4 py-2.5 max-w-[200px] truncate">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${wh.active ? 'bg-status-pass' : 'bg-accent-light '}`} />
                            <span className="font-mono text-[12px] text-text-primary truncate" title={wh.url}>{wh.url}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {wh.events.map(ev => (
                              <span key={ev} className="px-1.5 py-0.5 rounded bg-accent-light text-[10px] font-mono text-text-secondary">
                                {ev}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-text-secondary font-mono whitespace-nowrap">
                          {wh.lastDelivery ? formatRelativeTime(wh.lastDelivery) : 'Never'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button type="button" className="text-[12px] font-medium text-primary hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-[13px] text-text-secondary italic mb-4">No webhooks configured.</div>
            )}
            
            <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border hairline bg-white text-[12px] font-medium text-text-secondary hover:bg-accent-light transition-colors">
              <Icon name="plus" className="w-3.5 h-3.5" />
              Add webhook
            </button>
          </div>
        </IntegrationCard>

      </div>
    </SettingsSection>
  )
}

function IntegrationCard({
  name,
  icon,
  connected,
  statusText,
  children
}: {
  name: string
  icon: string
  connected: boolean
  statusText: string
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border hairline bg-white overflow-hidden">
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-accent-light/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded border hairline flex items-center justify-center bg-accent-light text-text-primary">
            <Icon name={icon as any} className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[14px] font-medium text-text-primary leading-snug">{name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-status-pass' : 'bg-accent-light '}`} />
              <span className="text-[12px] text-text-secondary">{statusText}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            className={`px-3 py-1.5 rounded-md border hairline text-[12px] font-medium transition-colors ${ connected ? 'bg-white text-text-secondary hover:bg-accent-light ' : 'bg-primary text-white border-transparent hover:bg-primary' }`}
            onClick={(e) => {
              if (!connected) {
                e.stopPropagation()
                // Fake connect
              }
            }}
          >
            {connected ? 'Manage' : 'Connect'}
          </button>
          
          <Icon 
            name="chevron_down" 
            className={`w-4 h-4 text-text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
      
      {expanded && children}
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { Modal } from '../primitives/Modal'
import { Icon } from '../primitives/Icon'
import { useTemplates } from '../../lib/templates'
import { useUsers } from '../../lib/users'
import { formatRuleSummary } from '../../lib/recurrence'
import type { RecurrenceRule, RecurrenceFrequency, Weekday } from '../../types/recurrence'

interface RecurrenceRuleModalProps {
  open: boolean
  onClose: () => void
  rule: RecurrenceRule | null
  onSave: (rule: Partial<RecurrenceRule>) => void
}

const SITES = [
  { id: 'site_mumbai', name: 'Mumbai HQ' },
  { id: 'site_pune', name: 'Pune Plant' },
  { id: 'site_hyderabad', name: 'Hyderabad Packing' },
]

const WEEKDAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
]

export function RecurrenceRuleModal({ open, onClose, rule, onSave }: RecurrenceRuleModalProps) {
  const { templates } = useTemplates()
  const { users } = useUsers()

  const publishedTemplates = useMemo(() => templates.filter((t) => t.status === 'published'), [templates])
  const inspectors = useMemo(() => users.filter((u) => u.role === 'quality_inspector' || u.role === 'safety_inspector'), [users])

  // Form state
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [area, setArea] = useState('')
  const [inspectorId, setInspectorId] = useState('')
  
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [interval, setIntervalVal] = useState(1)
  const [weekdays, setWeekdays] = useState<Weekday[]>([])
  const [monthDay, setMonthDay] = useState<number>(1)
  
  const [timeOfDay, setTimeOfDay] = useState('09:00')
  const [startsOn, setStartsOn] = useState(() => new Date().toISOString().split('T')[0])
  const [endsOn, setEndsOn] = useState('')

  useEffect(() => {
    if (open) {
      if (rule) {
        setName(rule.name)
        setTemplateId(rule.templateId)
        setSiteId(rule.siteId)
        setArea(rule.area || '')
        setInspectorId(rule.defaultInspectorId || '')
        setFrequency(rule.frequency)
        setIntervalVal(rule.interval)
        setWeekdays(rule.weekdays)
        setMonthDay(rule.monthDay || 1)
        setTimeOfDay(rule.timeOfDay)
        setStartsOn(rule.startsOn.split('T')[0])
        setEndsOn(rule.endsOn ? rule.endsOn.split('T')[0] : '')
      } else {
        // Reset defaults
        setName('')
        setTemplateId('')
        setSiteId('')
        setArea('')
        setInspectorId('')
        setFrequency('daily')
        setIntervalVal(1)
        setWeekdays([])
        setMonthDay(1)
        setTimeOfDay('09:00')
        setStartsOn(new Date().toISOString().split('T')[0])
        setEndsOn('')
      }
    }
  }, [open, rule])

  const toggleWeekday = (d: Weekday) => {
    setWeekdays((prev) => prev.includes(d) ? prev.filter((w) => w !== d) : [...prev, d].sort())
  }

  // Live preview
  const previewDraft: RecurrenceRule = {
    id: '', name: '', templateId: '', templateBaseId: '', templateName: '', templateVersion: '',
    siteId: '', siteName: '', defaultInspectorId: null, defaultInspectorName: null, managerId: '', managerName: '',
    status: 'active', changelog: [], createdAt: '', updatedAt: '',
    frequency, interval, weekdays, monthDay, timeOfDay, startsOn: startsOn || new Date().toISOString()
  }

  const isValid = 
    name.trim() !== '' &&
    templateId !== '' &&
    siteId !== '' &&
    startsOn !== '' &&
    (frequency !== 'weekly' || weekdays.length > 0) &&
    (!endsOn || new Date(endsOn) >= new Date(startsOn))

  const handleSave = () => {
    if (!isValid) return

    const tpl = publishedTemplates.find(t => t.id === templateId)
    const site = SITES.find(s => s.id === siteId)
    const insp = inspectors.find(u => u.id === inspectorId)

    onSave({
      name: name.trim(),
      templateId,
      templateBaseId: tpl?.baseTemplateId || '',
      templateName: tpl?.name || '',
      templateVersion: tpl?.version || '',
      siteId,
      siteName: site?.name || '',
      area: area.trim() || undefined,
      defaultInspectorId: insp?.id || null,
      defaultInspectorName: insp?.name || null,
      frequency,
      interval,
      weekdays: frequency === 'weekly' ? weekdays : [],
      monthDay: frequency === 'monthly' ? monthDay : undefined,
      timeOfDay,
      startsOn: new Date(startsOn).toISOString(),
      endsOn: endsOn ? new Date(endsOn).toISOString() : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={rule ? 'Edit recurrence rule' : 'New recurrence rule'}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {rule ? 'Save changes' : 'Create rule'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Rule name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daily CCP verification — Line 3"
            className="focus-ring w-full px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50"
          />
        </div>

        {/* Template & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Template</label>
            <div className="relative">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="appearance-none w-full pl-3 pr-9 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 focus-ring"
              >
                <option value="" disabled>Select template</option>
                {publishedTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} v{t.version}</option>
                ))}
              </select>
              <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Site</label>
            <div className="relative">
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="appearance-none w-full pl-3 pr-9 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 focus-ring"
              >
                <option value="" disabled>Select site</option>
                {SITES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Area (Optional)</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Cleanroom B"
              className="focus-ring w-full px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Default Inspector</label>
            <div className="relative">
              <select
                value={inspectorId}
                onChange={(e) => setInspectorId(e.target.value)}
                className="appearance-none w-full pl-3 pr-9 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 focus-ring"
              >
                <option value="">Unassigned</option>
                {inspectors.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Frequency Segmented Control */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Pattern</label>
          <div className="flex p-1 rounded-md border hairline bg-ink-50 dark:bg-ink-900/50 w-full sm:w-[300px]">
            {(['daily', 'weekly', 'monthly'] as const).map(freq => (
              <button
                key={freq}
                type="button"
                onClick={() => setFrequency(freq)}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded transition-colors capitalize ${
                  frequency === freq 
                    ? 'bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-sm'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Frequency Block */}
        <div className="p-4 rounded-xl border hairline bg-ink-50/50 dark:bg-ink-950/30 space-y-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-ink-900 dark:text-ink-50">Every</span>
            <input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setIntervalVal(parseInt(e.target.value) || 1)}
              className="w-16 focus-ring px-2 py-1.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-center font-mono"
            />
            <span className="text-[13px] text-ink-900 dark:text-ink-50">
              {frequency === 'daily' ? (interval === 1 ? 'day' : 'days') :
               frequency === 'weekly' ? (interval === 1 ? 'week' : 'weeks') :
               (interval === 1 ? 'month' : 'months')}
            </span>
          </div>

          {frequency === 'weekly' && (
            <div className="flex items-center gap-1.5 pt-2 border-t hairline border-dashed">
              {WEEKDAYS.map((d) => {
                const selected = weekdays.includes(d.value as Weekday)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWeekday(d.value as Weekday)}
                    className={`w-8 h-8 rounded text-[12px] font-medium transition-colors ${
                      selected
                        ? 'bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900'
                        : 'border hairline bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="flex items-center gap-4 pt-2 border-t hairline border-dashed">
              <span className="text-[13px] text-ink-900 dark:text-ink-50">On day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={monthDay === 0 ? '' : monthDay}
                disabled={monthDay === 0}
                onChange={(e) => setMonthDay(parseInt(e.target.value) || 1)}
                className="w-16 focus-ring px-2 py-1.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-center font-mono disabled:opacity-50"
              />
              <label className="flex items-center gap-2 cursor-pointer ml-4 text-[13px] text-ink-700 dark:text-ink-200">
                <input
                  type="checkbox"
                  checked={monthDay === 0}
                  onChange={(e) => setMonthDay(e.target.checked ? 0 : 1)}
                  className="rounded border-ink-300 text-ink-900 focus:ring-ink-900"
                />
                Last day of month
              </label>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t hairline border-dashed">
            <span className="text-[13px] text-ink-900 dark:text-ink-50">At</span>
            <input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="focus-ring px-2 py-1.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] font-mono"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Starts on</label>
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              className="focus-ring w-full px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Ends on (Optional)</label>
            <input
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              className="focus-ring w-full px-3 py-2 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 font-mono"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-4 p-3 rounded bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900 text-center">
          <p className="font-display text-[16px] italic leading-snug">
            This rule fires {formatRuleSummary(previewDraft)}, starting {startsOn}{endsOn ? ` until ${endsOn}` : ''}.
          </p>
        </div>
      </div>
    </Modal>
  )
}

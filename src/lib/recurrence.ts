import { useCallback, useEffect, useState } from 'react'
import type {
  RecurrenceRule,
  RuleStatus,
  RuleChangelogEntry,
  Weekday,
} from '../types/recurrence'

const STORAGE_KEY = 'ims-recurrence-rules-v1'

/* ============================================================
 * Seed Rules
 * ============================================================ */

const NOW = Date.now()
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

function makeSeedChangelog(action: RuleChangelogEntry['action'], byName: string, byId: string, at: string): RuleChangelogEntry[] {
  return [{
    id: `chg_${Math.random().toString(36).slice(2, 10)}`,
    at,
    byId,
    byName,
    action,
    note: action === 'created' ? 'Initial rule configuration' : undefined,
  }]
}

const SEED_RULES: RecurrenceRule[] = [
  {
    id: 'rule_ccp_daily',
    name: 'Daily CCP verification — Line 3',
    templateId: 'tpl_haccp_ccp_daily',
    templateBaseId: 'tpl_haccp_ccp_daily',
    templateName: 'Daily CCP verification — Line 3',
    templateVersion: '4.2',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Line 3 bottling',
    defaultInspectorId: 'usr_priya_shah',
    defaultInspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    frequency: 'daily',
    weekdays: [1, 2, 3, 4, 5], // Mon-Fri
    interval: 1,
    timeOfDay: '07:00',
    startsOn: days(10),
    status: 'active',
    changelog: makeSeedChangelog('created', 'Rahul Iyer', 'usr_rahul_iyer', days(10)),
    createdAt: days(10),
    updatedAt: days(10),
  },
  {
    id: 'rule_gmp_weekly',
    name: 'Weekly gowning audit',
    templateId: 'tpl_gmp_gowning',
    templateBaseId: 'tpl_gmp_gowning',
    templateName: 'GMP — Gowning audit, Cleanroom B',
    templateVersion: '2.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Cleanroom B',
    defaultInspectorId: 'usr_lakshmi_iyer',
    defaultInspectorName: 'Lakshmi Iyer',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    frequency: 'weekly',
    weekdays: [1], // Monday
    interval: 1,
    timeOfDay: '09:00',
    startsOn: days(30),
    status: 'active',
    changelog: makeSeedChangelog('created', 'Rahul Iyer', 'usr_rahul_iyer', days(30)),
    createdAt: days(30),
    updatedAt: days(30),
  },
  {
    id: 'rule_preop_daily',
    name: 'Pre-op sanitation',
    templateId: 'tpl_pre_op_sanitation',
    templateBaseId: 'tpl_pre_op_sanitation',
    templateName: 'Pre-operational sanitation — Bottling',
    templateVersion: '3.1',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Bottling Line A',
    defaultInspectorId: 'usr_priya_shah',
    defaultInspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    frequency: 'daily',
    weekdays: [1, 2, 3, 4, 5],
    interval: 1,
    timeOfDay: '06:00',
    startsOn: days(20),
    status: 'active',
    changelog: makeSeedChangelog('created', 'Rahul Iyer', 'usr_rahul_iyer', days(20)),
    createdAt: days(20),
    updatedAt: days(20),
  },
  {
    id: 'rule_safety_monthly',
    name: 'Monthly safety walkthrough',
    templateId: 'tpl_safety_walk',
    templateBaseId: 'tpl_safety_walk',
    templateName: 'Safety walkthrough — Production floor',
    templateVersion: '1.4',
    siteId: 'site_mumbai', // Simplifying "all sites" for now
    siteName: 'Mumbai HQ',
    area: undefined,
    defaultInspectorId: null,
    defaultInspectorName: null,
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    frequency: 'monthly',
    weekdays: [],
    monthDay: 1,
    interval: 1,
    timeOfDay: '10:00',
    startsOn: days(60),
    status: 'active',
    changelog: makeSeedChangelog('created', 'Rahul Iyer', 'usr_rahul_iyer', days(60)),
    createdAt: days(60),
    updatedAt: days(60),
  },
  {
    id: 'rule_allergen_paused',
    name: 'Allergen changeover verification',
    templateId: 'tpl_allergen_changeover',
    templateBaseId: 'tpl_allergen_changeover',
    templateName: 'Allergen changeover verification',
    templateVersion: '0.3',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Mix tank 2',
    defaultInspectorId: 'usr_priya_shah',
    defaultInspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    frequency: 'weekly',
    weekdays: [5], // Friday
    interval: 1,
    timeOfDay: '14:00',
    startsOn: days(15),
    status: 'paused',
    changelog: [
      {
        id: `chg_${Math.random().toString(36).slice(2, 10)}`,
        at: days(2),
        byId: 'usr_rahul_iyer',
        byName: 'Rahul Iyer',
        action: 'paused',
        note: 'Template is still in draft mode.',
      },
      ...makeSeedChangelog('created', 'Rahul Iyer', 'usr_rahul_iyer', days(15)),
    ],
    createdAt: days(15),
    updatedAt: days(2),
  },
  {
    id: 'rule_legacy_archived',
    name: 'Legacy daily hygiene check',
    templateId: 'tpl_gmp_old',
    templateBaseId: 'tpl_gmp_old',
    templateName: 'GMP — General checklist (legacy)',
    templateVersion: '1.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: undefined,
    defaultInspectorId: null,
    defaultInspectorName: null,
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    frequency: 'daily',
    weekdays: [],
    interval: 1,
    timeOfDay: '08:00',
    startsOn: days(100),
    endsOn: days(10),
    status: 'archived',
    changelog: [
      {
        id: `chg_${Math.random().toString(36).slice(2, 10)}`,
        at: days(10),
        byId: 'usr_rahul_iyer',
        byName: 'Rahul Iyer',
        action: 'archived',
        note: 'Replaced by site-specific templates.',
      },
      ...makeSeedChangelog('created', 'Rahul Iyer', 'usr_rahul_iyer', days(100)),
    ],
    createdAt: days(100),
    updatedAt: days(10),
  },
]

/* ============================================================
 * Storage
 * ============================================================ */

function loadFromStorage(): RecurrenceRule[] {
  if (typeof window === 'undefined') return SEED_RULES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_RULES
    const parsed = JSON.parse(raw) as RecurrenceRule[]
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_RULES
    return parsed
  } catch {
    return SEED_RULES
  }
}

function saveToStorage(rules: RecurrenceRule[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch { /* ignore */ }
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface UseRecurrenceRulesApi {
  rules: RecurrenceRule[]
  getById: (id: string) => RecurrenceRule | undefined
  add: (rule: RecurrenceRule) => void
  update: (id: string, patch: Partial<RecurrenceRule>) => void
  setStatus: (id: string, status: RuleStatus, byId: string, byName: string) => void
  remove: (id: string) => void
  reset: () => void
}

export function useRecurrenceRules(): UseRecurrenceRulesApi {
  const [rules, setRules] = useState<RecurrenceRule[]>(loadFromStorage)

  useEffect(() => { saveToStorage(rules) }, [rules])

  const getById = useCallback((id: string) => rules.find((r) => r.id === id), [rules])

  const add = useCallback((rule: RecurrenceRule) => {
    setRules((prev) => [rule, ...prev])
  }, [])

  const update = useCallback((id: string, patch: Partial<RecurrenceRule>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        return { ...r, ...patch, updatedAt: new Date().toISOString() }
      })
    )
  }, [])

  const setStatus = useCallback((id: string, status: RuleStatus, byId: string, byName: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const now = new Date().toISOString()
        let action: RuleChangelogEntry['action'] = 'edited'
        if (status === 'paused') action = 'paused'
        else if (status === 'active' && r.status === 'paused') action = 'resumed'
        else if (status === 'archived') action = 'archived'

        const entry: RuleChangelogEntry = {
          id: genId('chg'),
          at: now,
          byId,
          byName,
          action,
        }
        return {
          ...r,
          status,
          updatedAt: now,
          changelog: [entry, ...r.changelog],
        }
      })
    )
  }, [])

  const remove = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const reset = useCallback(() => setRules(SEED_RULES), [])

  return { rules, getById, add, update, setStatus, remove, reset }
}

/* ============================================================
 * Helpers
 * ============================================================ */

/**
 * Materializes a rule into an array of ISO date strings where the rule fires
 * within the given [fromDate, toDate] window (inclusive).
 * Returns empty array if rule is paused/archived or outside bounds.
 */
export function materializeRule(rule: RecurrenceRule, fromDate: Date, toDate: Date): string[] {
  if (rule.status !== 'active') return []

  const ruleStart = new Date(rule.startsOn)
  // ruleStart logic: we ignore the time of rule.startsOn and just use the date component for boundaries
  ruleStart.setHours(0, 0, 0, 0)

  let ruleEnd: Date | null = null
  if (rule.endsOn) {
    ruleEnd = new Date(rule.endsOn)
    ruleEnd.setHours(23, 59, 59, 999)
  }

  // Find the effective search window
  const windowStart = new Date(Math.max(fromDate.getTime(), ruleStart.getTime()))
  windowStart.setHours(0, 0, 0, 0)
  
  const windowEnd = new Date(Math.min(toDate.getTime(), ruleEnd ? ruleEnd.getTime() : toDate.getTime()))
  windowEnd.setHours(23, 59, 59, 999)

  if (windowStart > windowEnd) return []

  const results: string[] = []
  
  // Parse time of day "HH:MM"
  const [hours, minutes] = rule.timeOfDay.split(':').map(Number)

  // Start iterating from windowStart to windowEnd
  const cursor = new Date(windowStart)
  
  while (cursor <= windowEnd) {
    const isMatch = checkRuleMatch(rule, ruleStart, cursor)
    if (isMatch) {
      const matchDate = new Date(cursor)
      matchDate.setHours(hours, minutes, 0, 0)
      results.push(matchDate.toISOString())
    }
    // Increment by 1 day
    cursor.setDate(cursor.getDate() + 1)
  }

  return results
}

function checkRuleMatch(rule: RecurrenceRule, ruleStart: Date, cursor: Date): boolean {
  // Common for daily/weekly/monthly: Does the weekday match if weekdays are specified?
  if (rule.weekdays.length > 0 && !rule.weekdays.includes(cursor.getDay() as Weekday)) {
    return false
  }

  if (rule.frequency === 'daily') {
    // Check interval
    const diffTime = cursor.getTime() - ruleStart.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays % rule.interval !== 0) return false
    return true
  }

  if (rule.frequency === 'weekly') {
    // If weekdays are empty, but it's weekly, default to matching the start day?
    // The spec says "Empty = every weekday based on `interval`"
    // So if empty, it just matches any day. Wait, no. The spec says:
    // "For weekly: which weekdays trigger. Empty = every weekday based on `interval`"
    // Wait, "every weekday" means Monday-Friday? Or every day of the week? Let's assume it means everyday, but filtered by interval.
    // Actually, "Empty = every weekday based on interval" might mean it triggers every day of the week if no weekdays are specified.
    
    // Check interval based on weeks
    // Calculate weeks since ruleStart (using start of week as reference, usually Monday)
    const ruleStartDay = ruleStart.getDay()
    const ruleStartMon = new Date(ruleStart)
    ruleStartMon.setDate(ruleStart.getDate() - (ruleStartDay === 0 ? 6 : ruleStartDay - 1))
    
    const cursorDay = cursor.getDay()
    const cursorMon = new Date(cursor)
    cursorMon.setDate(cursor.getDate() - (cursorDay === 0 ? 6 : cursorDay - 1))
    
    const diffTime = cursorMon.getTime() - ruleStartMon.getTime()
    const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7))
    
    if (diffWeeks % rule.interval !== 0) return false
    return true
  }

  if (rule.frequency === 'monthly') {
    // Check month interval
    const diffMonths = (cursor.getFullYear() - ruleStart.getFullYear()) * 12 + (cursor.getMonth() - ruleStart.getMonth())
    if (diffMonths % rule.interval !== 0) return false
    
    // Check day of month
    const targetDay = rule.monthDay ?? 1
    const lastDayOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    
    let expectedDay = targetDay
    if (targetDay === 0 || targetDay > lastDayOfMonth) {
      expectedDay = lastDayOfMonth
    }
    
    if (cursor.getDate() !== expectedDay) return false
    return true
  }

  return false
}

export function formatRuleSummary(rule: RecurrenceRule): string {
  const parts: string[] = []
  
  if (rule.frequency === 'daily') {
    if (rule.interval === 1) parts.push('Every day')
    else parts.push(`Every ${rule.interval} days`)
  } else if (rule.frequency === 'weekly') {
    if (rule.interval === 1) parts.push('Every week')
    else parts.push(`Every ${rule.interval} weeks`)
  } else if (rule.frequency === 'monthly') {
    if (rule.interval === 1) parts.push('Every month')
    else parts.push(`Every ${rule.interval} months`)
  }

  if (rule.frequency === 'weekly' && rule.weekdays.length > 0) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (rule.weekdays.length === 5 && [1,2,3,4,5].every(d => rule.weekdays.includes(d as Weekday))) {
      parts.push('on weekdays')
    } else {
      parts.push(`on ${rule.weekdays.map(d => days[d]).join(', ')}`)
    }
  }

  if (rule.frequency === 'monthly') {
    if (rule.monthDay === 0) parts.push('on the last day')
    else parts.push(`on day ${rule.monthDay}`)
  }

  // Parse time
  const [h, m] = rule.timeOfDay.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const minStr = m.toString().padStart(2, '0')
  parts.push(`at ${h12}:${minStr} ${ampm}`)

  return parts.join(' ')
}

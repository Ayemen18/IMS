export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly'

/** Days of week for weekly recurrence, 0 = Sunday … 6 = Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type RuleStatus = 'active' | 'paused' | 'archived'

export interface RecurrenceRule {
  id: string
  name: string                      // Human label: "Daily CCP verification — Line 3"
  templateId: string                // Template to instantiate from
  templateBaseId: string
  templateName: string              // Denormalized for fast rendering
  templateVersion: string
  siteId: string
  siteName: string
  area?: string
  /** Optional default inspector — null means "needs manual assignment" or "rotating roster" */
  defaultInspectorId: string | null
  defaultInspectorName: string | null
  managerId: string
  managerName: string
  frequency: RecurrenceFrequency
  /** For weekly: which weekdays trigger. Empty = every weekday based on `interval` */
  weekdays: Weekday[]
  /** For monthly: which day of month (1–31). Use 0 for last day. */
  monthDay?: number
  /** Every N (days/weeks/months) — 1 = every period, 2 = every other, etc. */
  interval: number
  /** Time of day in 24h "HH:MM" */
  timeOfDay: string
  /** ISO date string — when the rule first becomes active */
  startsOn: string
  /** Optional ISO date — when the rule stops generating, exclusive */
  endsOn?: string
  status: RuleStatus
  /** Append-only audit log on the rule itself */
  changelog: RuleChangelogEntry[]
  createdAt: string
  updatedAt: string
}

export interface RuleChangelogEntry {
  id: string
  at: string
  byId: string
  byName: string
  action: 'created' | 'edited' | 'paused' | 'resumed' | 'archived'
  note?: string
}

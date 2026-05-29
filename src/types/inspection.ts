import type { TemplateItemType } from './template'

/**
 * Inspection lifecycle states.
 * These mirror the state diagram we locked in early discovery —
 * the happy path runs scheduled → in_progress → submitted → under_review →
 * approved → issues_open → issues_closed → published.
 * Cross-cutting states (on_hold, rescheduled, cancelled) are reachable from most states.
 */
export type InspectionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'        // sent back to inspector for rework
  | 'issues_open'     // approved but has failed items needing correction
  | 'issues_closed'   // corrective actions verified
  | 'published'       // finalized; report distributed
  | 'on_hold'
  | 'cancelled'

export type InspectionDomain = 'quality' | 'safety'

export type ItemAnswer = 'pass' | 'fail' | 'na' | null
/** For numeric items, the recorded reading. */
export type ItemReading = number | null

/**
 * A single answer captured against a template item during execution.
 * Stored separately from the template item itself so the template stays immutable.
 */
export interface InspectionItemResponse {
  itemId: string
  answer: ItemAnswer
  /** Numeric reading for numeric items */
  reading?: ItemReading
  /** Free-text answer for text items, or selected option for single_select */
  textAnswer?: string
  /** Observation note — required on Fail / N/A */
  observation?: string
  /** URL refs to attached photos. In v1 these are filenames; storage layer is TBD. */
  attachments: string[]
  /** ISO timestamp when last edited */
  updatedAt?: string
}

export interface InspectionIssue {
  id: string
  /** Pointer to the failed item that created this issue */
  itemId: string
  /** Snapshot of the prompt at the time of failure */
  itemPrompt: string
  /** Who the corrective action is assigned to */
  assigneeId: string | null
  assigneeName: string | null
  /** ISO; when the assignee submitted their fix evidence */
  fixSubmittedAt: string | null
  /** ISO; when the manager verified the fix */
  verifiedAt: string | null
  /** Notes from the assignee describing what they did */
  fixNotes?: string
  /** URLs/filenames of evidence photos submitted with the fix */
  fixAttachments?: string[]
  /** Manager comments on the fix */
  reviewNotes?: string
  /** Issue lifecycle */
  state: 'open' | 'in_progress' | 'awaiting_verification' | 'closed' | 'reopened'
  createdAt: string
  updatedAt: string
}

export interface InspectionTimelineEvent {
  id: string
  at: string
  byId: string
  byName: string
  action:
    | 'scheduled'
    | 'started'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'issue_created'
    | 'issue_fix_submitted'
    | 'issue_verified'
    | 'issue_reopened'
    | 'issue_reassigned'
    | 'published'
    | 'on_hold'
    | 'resumed'
    | 'rescheduled'
    | 'cancelled'
    | 'commented'
  /** Optional human note */
  note?: string
  /** Optional target (issue id, item id, etc.) */
  target?: string
}

export interface Inspection {
  id: string                   // e.g. "INS-04829"
  /** Stable display number — short, human, used everywhere */
  number: string
  /** Domain — quality or safety */
  domain: InspectionDomain
  /** What template + version this inspection runs against */
  templateId: string
  templateBaseId: string
  templateName: string
  templateVersion: string
  /** Where the inspection happens */
  siteId: string
  siteName: string
  area?: string                // e.g. "Line 3 bottling"
  /** Who's assigned to execute */
  inspectorId: string | null
  inspectorName: string | null
  /** Who manages this inspection (approves the report) */
  managerId: string
  managerName: string
  /** Optional auditee — the area / process owner the inspection is performed on */
  auditeeId?: string
  auditeeName?: string
  /** Lifecycle state */
  status: InspectionStatus
  /** When the inspection is scheduled to start */
  scheduledFor: string
  /** When the inspector started executing */
  startedAt: string | null
  /** When the draft was submitted to the manager */
  submittedAt: string | null
  /** When the manager approved (or rejected — see timeline for nuance) */
  reviewedAt: string | null
  /** When all issues closed and the report published */
  publishedAt: string | null
  /** Captured responses, item-by-item */
  responses: InspectionItemResponse[]
  /** Issues raised from Fail items */
  issues: InspectionIssue[]
  /** Cross-cutting reason field for on_hold/cancelled/rescheduled */
  holdReason?: string
  /** Append-only audit timeline */
  timeline: InspectionTimelineEvent[]
  createdAt: string
  updatedAt: string
}

/* ============================================================
 * Pure helpers usable everywhere
 * ============================================================ */

export const STATUS_LABEL: Record<InspectionStatus, string> = {
  scheduled:     'Scheduled',
  in_progress:   'In progress',
  submitted:     'Submitted',
  under_review:  'Under review',
  approved:      'Approved',
  rejected:      'Rejected',
  issues_open:   'Issues open',
  issues_closed: 'Issues closed',
  published:     'Published',
  on_hold:       'On hold',
  cancelled:     'Cancelled',
}

export type StatusTone = 'green' | 'amber' | 'red' | 'neutral'

export const STATUS_TONE: Record<InspectionStatus, StatusTone> = {
  scheduled:     'neutral',
  in_progress:   'amber',
  submitted:     'amber',
  under_review:  'amber',
  approved:      'green',
  rejected:      'red',
  issues_open:   'red',
  issues_closed: 'green',
  published:     'green',
  on_hold:       'neutral',
  cancelled:     'neutral',
}

/** Counts of pass/fail/na/skipped across all responses */
export function getResponseSummary(inspection: Inspection) {
  let pass = 0, fail = 0, na = 0, skipped = 0
  inspection.responses.forEach((r) => {
    if (r.answer === 'pass') pass += 1
    else if (r.answer === 'fail') fail += 1
    else if (r.answer === 'na') na += 1
    else skipped += 1
  })
  return { pass, fail, na, skipped, total: inspection.responses.length }
}

/** Returns the count of issues by state */
export function getIssueSummary(inspection: Inspection) {
  let open = 0, inProgress = 0, awaiting = 0, closed = 0
  inspection.issues.forEach((i) => {
    if (i.state === 'open') open += 1
    else if (i.state === 'in_progress') inProgress += 1
    else if (i.state === 'awaiting_verification') awaiting += 1
    else if (i.state === 'closed') closed += 1
  })
  return { open, inProgress, awaiting, closed, total: inspection.issues.length }
}

// Re-export for any consumer that wants the item type back
export type { TemplateItemType }

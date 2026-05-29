import { StatusPill } from './StatusPill'
import type { InspectionIssue } from '../../types/inspection'

export function IssueStatePill({ state }: { state: InspectionIssue['state'] }) {
  switch (state) {
    case 'open':
      return <StatusPill tone="red">Open</StatusPill>
    case 'in_progress':
      return <StatusPill tone="amber">In progress</StatusPill>
    case 'awaiting_verification':
      return <StatusPill tone="amber">Awaiting verification</StatusPill>
    case 'closed':
      return <StatusPill tone="green">Closed</StatusPill>
    case 'reopened':
      return <StatusPill tone="red">Reopened</StatusPill>
    default:
      return <StatusPill tone="neutral">{state}</StatusPill>
  }
}

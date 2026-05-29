import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { QualityManagerOverviewPage } from './qm/OverviewPage'
import { InspectionsListPage } from './qm/InspectionsListPage'
import { InspectionDetailPage } from './qm/InspectionDetailPage'
import { SchedulePage } from './qm/SchedulePage'
import { ReviewQueuePage } from './qm/ReviewQueuePage'
import { IssuesListPage } from './qm/IssuesListPage'
import { IssueDetailPage } from './qm/IssueDetailPage'
import { RoleDashboardPlaceholder } from './RoleDashboardPlaceholder'

export function SafetyManagerDashboard() {
  return (
    <Routes>
      <Route index element={<QmOverviewInShell />} />
      <Route path="schedule" element={<ScheduleInShell />} />
      <Route path="inspections" element={<InspectionsListInShell />} />
      <Route path="inspections/:id" element={<InspectionDetailInShell />} />
      <Route path="review" element={<ReviewQueueInShell />} />
      <Route path="issues" element={<IssuesListInShell />} />
      <Route path="issues/:issueId" element={<IssueDetailInShell />} />
      <Route path="reports" element={<RoleDashboardPlaceholder />} />
      <Route path="team" element={<RoleDashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

function QmOverviewInShell() {
  return (
    <DashboardShell defaultItem="overview" primaryActionLabel="New inspection">
      {() => <QualityManagerOverviewPage domain="safety" />}
    </DashboardShell>
  )
}

function InspectionsListInShell() {
  return (
    <DashboardShell defaultItem="inspections" primaryActionLabel="New inspection">
      {() => <InspectionsListPage domain="safety" />}
    </DashboardShell>
  )
}

function ScheduleInShell() {
  return (
    <DashboardShell defaultItem="schedule" primaryActionLabel="New rule">
      {() => <SchedulePage domain="safety" />}
    </DashboardShell>
  )
}

function InspectionDetailInShell() {
  return (
    <DashboardShell defaultItem="inspections" primaryActionLabel="New inspection">
      {() => <InspectionDetailPage domain="safety" />}
    </DashboardShell>
  )
}

function ReviewQueueInShell() {
  return (
    <DashboardShell defaultItem="review" primaryActionLabel="New inspection">
      {() => <ReviewQueuePage domain="safety" />}
    </DashboardShell>
  )
}

function IssuesListInShell() {
  return (
    <DashboardShell defaultItem="issues">
      {() => <IssuesListPage domain="safety" />}
    </DashboardShell>
  )
}

function IssueDetailInShell() {
  return (
    <DashboardShell defaultItem="issues">
      {() => <IssueDetailPage domain="safety" />}
    </DashboardShell>
  )
}

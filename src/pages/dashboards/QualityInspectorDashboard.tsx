import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { MyDayPage } from './qi/MyDayPage'
import { MyInspectionsListPage } from './qi/MyInspectionsListPage'
import { InspectionExecutionPage } from './qi/InspectionExecutionPage'
import { DraftsPage } from './qi/DraftsPage'
import { ReturnedPage } from './qi/ReturnedPage'
import { SchedulePage } from './qi/SchedulePage'
import { HistoryPage } from './qi/HistoryPage'

export function QualityInspectorDashboard() {
  return (
    <Routes>
      <Route index element={<MyDayInShell />} />
      <Route path="overview" element={<MyDayInShell />} />
      <Route path="inspections" element={<MyInspectionsListInShell />} />
      <Route path="inspections/:inspectionId" element={<InspectionExecutionPage domain="quality" />} />
      <Route path="schedule" element={<ScheduleInShell />} />
      <Route path="drafts" element={<DraftsInShell />} />
      <Route path="returned" element={<ReturnedInShell />} />
      <Route path="history" element={<HistoryInShell />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

function MyDayInShell() {
  return (
    <DashboardShell defaultItem="overview">
      {() => <MyDayPage domain="quality" />}
    </DashboardShell>
  )
}

function MyInspectionsListInShell() {
  return (
    <DashboardShell defaultItem="inspections">
      {() => <MyInspectionsListPage domain="quality" />}
    </DashboardShell>
  )
}

function DraftsInShell() {
  return (
    <DashboardShell defaultItem="drafts">
      {() => <DraftsPage domain="quality" />}
    </DashboardShell>
  )
}

function ReturnedInShell() {
  return (
    <DashboardShell defaultItem="returned">
      {() => <ReturnedPage domain="quality" />}
    </DashboardShell>
  )
}

function ScheduleInShell() {
  return (
    <DashboardShell defaultItem="schedule">
      {() => <SchedulePage domain="quality" />}
    </DashboardShell>
  )
}

function HistoryInShell() {
  return (
    <DashboardShell defaultItem="history">
      {() => <HistoryPage domain="quality" />}
    </DashboardShell>
  )
}

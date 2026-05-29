import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { OverviewPage } from './exec/OverviewPage'
import { BySitePage } from './exec/BySitePage'
import { TrendsPage } from './exec/TrendsPage'
import { ExecIssuesPage } from './exec/ExecIssuesPage'
import { ReportsPage } from './exec/ReportsPage'

export function TopManagementDashboard() {
  return (
    <Routes>
      <Route index element={<OverviewInShell />} />
      <Route path="overview" element={<OverviewInShell />} />
      <Route path="by_site" element={<BySiteInShell />} />
      <Route path="trends" element={<TrendsInShell />} />
      <Route path="issues" element={<IssuesInShell />} />
      <Route path="reports" element={<ReportsInShell />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

function OverviewInShell() {
  return (
    <DashboardShell defaultItem="overview">
      {() => <OverviewPage />}
    </DashboardShell>
  )
}

function BySiteInShell() {
  return (
    <DashboardShell defaultItem="by_site">
      {() => <BySitePage />}
    </DashboardShell>
  )
}

function TrendsInShell() {
  return (
    <DashboardShell defaultItem="trends">
      {() => <TrendsPage />}
    </DashboardShell>
  )
}

function IssuesInShell() {
  return (
    <DashboardShell defaultItem="issues">
      {() => <ExecIssuesPage />}
    </DashboardShell>
  )
}

function ReportsInShell() {
  return (
    <DashboardShell defaultItem="reports">
      {() => <ReportsPage />}
    </DashboardShell>
  )
}

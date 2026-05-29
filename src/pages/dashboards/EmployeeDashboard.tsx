import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from '../../components/shell/DashboardShell'
import { MyDayPage } from './emp/MyDayPage'
import { IssuesListPage } from './emp/IssuesListPage'
import { IssueDetailPage } from './emp/IssueDetailPage'

export function EmployeeDashboard() {
  return (
    <Routes>
      <Route index element={<MyDayInShell />} />
      <Route path="overview" element={<MyDayInShell />} />
      <Route path="issues" element={<IssuesListInShell scope="all" defaultItem="issues" />} />
      <Route path="in_progress" element={<IssuesListInShell scope="in_progress" defaultItem="in_progress" />} />
      <Route path="under_review" element={<IssuesListInShell scope="under_review" defaultItem="review" />} />
      <Route path="closed" element={<IssuesListInShell scope="closed" defaultItem="closed" />} />
      <Route path="in_area" element={<IssuesListInShell scope="in_area" defaultItem="in_area" />} />
      <Route path="issues/:issueId" element={<IssueDetailInShell />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

function MyDayInShell() {
  return (
    <DashboardShell defaultItem="overview">
      {() => <MyDayPage />}
    </DashboardShell>
  )
}

function IssuesListInShell({ scope, defaultItem }: { scope: 'all' | 'in_progress' | 'under_review' | 'closed' | 'in_area', defaultItem: string }) {
  return (
    <DashboardShell defaultItem={defaultItem}>
      {() => <IssuesListPage scope={scope} />}
    </DashboardShell>
  )
}

function IssueDetailInShell() {
  // We'll let the IssueDetailPage render, but we need to pass a defaultItem 
  // that makes sense. 'issues' is a good fallback.
  return (
    <DashboardShell defaultItem="issues">
      {() => <IssueDetailPage />}
    </DashboardShell>
  )
}

import type { ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { SessionProvider, useSession } from './lib/session'
import { PrototypeBar } from './components/shell/PrototypeBar'
import { Landing } from './pages/Landing'
import { RoleSwitcher } from './pages/RoleSwitcher'
import { AdminDashboard } from './pages/dashboards/AdminDashboard'
import { QualityManagerDashboard } from './pages/dashboards/QualityManagerDashboard'
import { QualityInspectorDashboard } from './pages/dashboards/QualityInspectorDashboard'
import { SafetyManagerDashboard } from './pages/dashboards/SafetyManagerDashboard'
import { SafetyInspectorDashboard } from './pages/dashboards/SafetyInspectorDashboard'
import { EmployeeDashboard } from './pages/dashboards/EmployeeDashboard'
import { TopManagementDashboard } from './pages/dashboards/TopManagementDashboard'
import { RoleDashboardPlaceholder } from './pages/dashboards/RoleDashboardPlaceholder'
import { UsersListPage } from './pages/admin/UsersListPage'
import { UserDetailPage } from './pages/admin/UserDetailPage'
import { TemplatesListPage } from './pages/admin/TemplatesListPage'
import { TemplateDetailPage } from './pages/admin/TemplateDetailPage'
import { TemplateBuilderPage } from './pages/admin/TemplateBuilderPage'
import { TemplateHistoryPage } from './pages/admin/TemplateHistoryPage'
import { ParametersListPage } from './pages/admin/ParametersListPage'
import { ParameterDetailPage } from './pages/admin/ParameterDetailPage'
import { DashboardShell } from './components/shell/DashboardShell'
import { useNav } from './lib/router'

/* ============================================================
 * Route guards
 * ============================================================ */

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function RedirectAuthed({ children }: { children: ReactNode }) {
  const { user } = useSession()
  // If they're signed in and visit /login, send them to their dashboard
  if (user) return <Navigate to={dashboardPathFor(user.role)} replace />
  return children
}

/** Where to send a user after login, based on their role. */
function dashboardPathFor(role: string): string {
  switch (role) {
    case 'admin': return '/admin'
    case 'quality_manager': return '/qm'
    case 'quality_inspector': return '/qi'
    case 'safety_manager': return '/sm'
    case 'safety_inspector': return '/si'
    case 'employee': return '/emp'
    case 'top_management': return '/exec'
    default: return '/dashboard'
  }
}

/* ============================================================
 * Role-routed dashboard entry
 * ============================================================ */

function DashboardEntry() {
  const { user } = useSession()
  if (!user) return null // RequireAuth handles redirect
  switch (user.role) {
    case 'admin': return <Navigate to="/admin" replace />
    case 'quality_manager': return <Navigate to="/qm" replace />
    case 'quality_inspector': return <Navigate to="/qi" replace />
    case 'safety_manager': return <Navigate to="/sm" replace />
    case 'safety_inspector': return <Navigate to="/si" replace />
    case 'employee': return <Navigate to="/emp" replace />
    case 'top_management': return <Navigate to="/exec" replace />
    default: return <RoleDashboardPlaceholder />
  }
}

/* ============================================================
 * App
 * ============================================================ */

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </ThemeProvider>
  )
}

function AppShell() {
  return (
    <>
      <PrototypeBar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <RedirectAuthed>
              <RoleSwitcher />
            </RedirectAuthed>
          }
        />

        {/* Generic dashboard for non-admin roles */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardEntry />
            </RequireAuth>
          }
        />

        {/* Admin workspace — nested routes will be added in step 7b */}
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <AdminRoutes />
            </RequireAuth>
          }
        />

        {/* Quality Manager workspace */}
        <Route
          path="/qm/*"
          element={
            <RequireAuth>
              <QualityManagerDashboard />
            </RequireAuth>
          }
        />

        {/* Quality Inspector workspace */}
        <Route
          path="/qi/*"
          element={
            <RequireAuth>
              <QualityInspectorDashboard />
            </RequireAuth>
          }
        />

        {/* Safety Manager workspace */}
        <Route
          path="/sm/*"
          element={
            <RequireAuth>
              <SafetyManagerDashboard />
            </RequireAuth>
          }
        />

        {/* Safety Inspector workspace */}
        <Route
          path="/si/*"
          element={
            <RequireAuth>
              <SafetyInspectorDashboard />
            </RequireAuth>
          }
        />

        {/* Employee workspace */}
        <Route
          path="/emp/*"
          element={
            <RequireAuth>
              <EmployeeDashboard />
            </RequireAuth>
          }
        />

        {/* Exec workspace */}
        <Route
          path="/exec/*"
          element={
            <RequireAuth>
              <TopManagementDashboard />
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

/**
 * Admin's nested routes.
 */
function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<UsersListInShell />} />
      <Route path="users/:userId" element={<UserDetailInShell />} />
      <Route path="templates" element={<TemplatesListInShell />} />
      <Route path="templates/new" element={<TemplateBuilderInShell />} />
      <Route path="templates/:templateId/edit" element={<TemplateBuilderInShell />} />
      <Route path="templates/:templateId/history" element={<TemplateHistoryInShell />} />
      <Route path="templates/:templateId" element={<TemplateDetailInShell />} />
      
      <Route path="parameters" element={<ParametersListInShell />} />
      <Route path="parameters/:parameterId" element={<ParameterDetailInShell />} />

      <Route path="types"         element={<AdminDashboard />} />
      <Route path="organization"  element={<AdminDashboard />} />
      <Route path="notifications" element={<AdminDashboard />} />
      <Route path="settings"      element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

/**
 * Wrap the Users list in the same shell the Admin dashboard uses.
 * The shell handles sidebar + topbar. The list is the content.
 */
function UsersListInShell() {
  const nav = useNav()
  return (
    <DashboardShell
      defaultItem="users"
      primaryActionLabel="Invite user"
      onPrimaryAction={() => nav.push('/admin/users?invite=1')}
    >
      {() => <UsersListPage />}
    </DashboardShell>
  )
}

function UserDetailInShell() {
  return (
    <DashboardShell defaultItem="users" primaryActionLabel="Invite user">
      {() => <UserDetailPage />}
    </DashboardShell>
  )
}

function TemplatesListInShell() {
  const nav = useNav()
  return (
    <DashboardShell 
      defaultItem="templates" 
      primaryActionLabel="New template"
      onPrimaryAction={() => nav.push('/admin/templates/new')}
    >
      {() => <TemplatesListPage />}
    </DashboardShell>
  )
}

function TemplateDetailInShell() {
  return (
    <DashboardShell defaultItem="templates">
      {() => <TemplateDetailPage />}
    </DashboardShell>
  )
}

function TemplateBuilderInShell() {
  return (
    <DashboardShell defaultItem="templates">
      {() => <TemplateBuilderPage />}
    </DashboardShell>
  )
}

function TemplateHistoryInShell() {
  return (
    <DashboardShell defaultItem="templates">
      {() => <TemplateHistoryPage />}
    </DashboardShell>
  )
}

function ParametersListInShell() {
  return (
    <DashboardShell defaultItem="parameters">
      {() => <ParametersListPage />}
    </DashboardShell>
  )
}

function ParameterDetailInShell() {
  return (
    <DashboardShell defaultItem="parameters">
      {() => <ParameterDetailPage />}
    </DashboardShell>
  )
}

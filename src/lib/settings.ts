import { useCallback, useEffect, useState } from 'react'
import type { WorkspaceSettings } from '../types/settings'

const STORAGE_KEY = 'ims-settings-v1'

const DEFAULT_SETTINGS: WorkspaceSettings = {
  general: {
    workspaceName: 'InspectSphere Demo',
    workspaceCode: 'INSPECTSPHERE-DEMO',
    primaryDomain: 'both',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    fiscalYearStartMonth: 4,
    weekStart: 'monday',
    dateFormat: 'iso',
  },
  security: {
    ssoEnabled: true,
    ssoProvider: 'okta',
    ssoDomain: 'inspectsphere.io',
    enforce2fa: true,
    sessionTimeoutMinutes: 240,
    passwordMinLength: 12,
    passwordRequireSpecial: true,
    passwordRequireNumber: true,
    passwordRequireUppercase: true,
    passwordExpiryDays: 90,
    ipAllowlistEnabled: false,
    ipAllowlist: [],
  },
  integrations: {
    slack: { connected: true, channel: '#quality-ops', lastSync: new Date(Date.now() - 2 * 3600000).toISOString() },
    email: { provider: 'sendgrid', senderName: 'InspectSphere', senderEmail: 'notifications@inspectsphere.io', verified: true },
    erp: { connected: true, system: 'sap', lastSync: new Date(Date.now() - 6 * 3600000).toISOString() },
    webhooks: [
      { id: 'wh_1', url: 'https://api.acme.com/hooks/ims', events: ['inspection.published'], active: true, lastDelivery: new Date(Date.now() - 86400000).toISOString() },
      { id: 'wh_2', url: 'https://escalations.acme.com/aged-issues', events: ['issue.aged'], active: true, lastDelivery: new Date(Date.now() - 172800000).toISOString() },
    ],
  },
  billing: {
    plan: 'professional',
    seats: { used: 47, total: 100 },
    billingEmail: 'billing@inspectsphere.io',
    billingPeriod: 'annual',
    nextBillingDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    currentMonthUsage: {
      activeUsers: 47,
      inspectionsCompleted: 340,
      storageGb: 12.4,
    },
  },
  data: {
    retentionDays: 1095,
    auditLogRetentionDays: 1825,
    exportFormat: 'xlsx',
    autoArchiveCompletedInspectionsDays: 90,
    gdprMode: true,
  },
  branding: {
    primaryColor: '#2851B8',
    accentColor: '#F5B800',
    logoUrl: '/inspectsphere-logo.png',
    faviconUrl: '/favicon.ico',
    loginScreenTagline: 'Inspections that hold up under audit.',
    emailFooterText: 'InspectSphere · Compliance-grade inspection management',
    customDomain: null,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'usr_maya_chen', // hardcoded to System Admin
}

function loadFromStorage(): WorkspaceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as WorkspaceSettings
  } catch (err) {
    console.warn('Failed to load settings from storage', err)
  }
  return DEFAULT_SETTINGS
}

function saveToStorage(data: WorkspaceSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('Failed to save settings to storage', err)
  }
}

export interface UseSettingsApi {
  settings: WorkspaceSettings
  updateGeneral: (patch: Partial<WorkspaceSettings['general']>) => void
  updateSecurity: (patch: Partial<WorkspaceSettings['security']>) => void
  updateIntegrations: (patch: Partial<WorkspaceSettings['integrations']>) => void
  updateBilling: (patch: Partial<WorkspaceSettings['billing']>) => void
  updateData: (patch: Partial<WorkspaceSettings['data']>) => void
  updateBranding: (patch: Partial<WorkspaceSettings['branding']>) => void
  resetToDefaults: () => void
}

export function useSettings(): UseSettingsApi {
  const [settings, setSettings] = useState<WorkspaceSettings>(loadFromStorage)

  // Auto-persist on change
  useEffect(() => {
    saveToStorage(settings)
  }, [settings])

  const touch = (prev: WorkspaceSettings): WorkspaceSettings => ({
    ...prev,
    updatedAt: new Date().toISOString(),
    updatedBy: 'usr_maya_chen',
  })

  const updateGeneral = useCallback((patch: Partial<WorkspaceSettings['general']>) => {
    setSettings((prev) => touch({ ...prev, general: { ...prev.general, ...patch } }))
  }, [])

  const updateSecurity = useCallback((patch: Partial<WorkspaceSettings['security']>) => {
    setSettings((prev) => touch({ ...prev, security: { ...prev.security, ...patch } }))
  }, [])

  const updateIntegrations = useCallback((patch: Partial<WorkspaceSettings['integrations']>) => {
    setSettings((prev) => touch({ ...prev, integrations: { ...prev.integrations, ...patch } }))
  }, [])

  const updateBilling = useCallback((patch: Partial<WorkspaceSettings['billing']>) => {
    setSettings((prev) => touch({ ...prev, billing: { ...prev.billing, ...patch } }))
  }, [])

  const updateData = useCallback((patch: Partial<WorkspaceSettings['data']>) => {
    setSettings((prev) => touch({ ...prev, data: { ...prev.data, ...patch } }))
  }, [])

  const updateBranding = useCallback((patch: Partial<WorkspaceSettings['branding']>) => {
    setSettings((prev) => touch({ ...prev, branding: { ...prev.branding, ...patch } }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateGeneral,
    updateSecurity,
    updateIntegrations,
    updateBilling,
    updateData,
    updateBranding,
    resetToDefaults,
  }
}

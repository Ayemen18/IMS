export interface WorkspaceSettings {
  // General
  general: {
    workspaceName: string
    workspaceCode: string         // 'INSPECTSPHERE-DEMO'
    primaryDomain: 'quality' | 'safety' | 'both'
    timezone: string              // 'Asia/Kolkata'
    locale: string                // 'en-IN'
    fiscalYearStartMonth: number  // 1-12
    weekStart: 'monday' | 'sunday'
    dateFormat: 'iso' | 'us' | 'eu'  // YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
  }
  
  // Security
  security: {
    ssoEnabled: boolean
    ssoProvider: 'okta' | 'azure_ad' | 'google' | null
    ssoDomain: string | null      // 'inspectsphere.io'
    enforce2fa: boolean
    sessionTimeoutMinutes: number // 60, 120, 240, 480
    passwordMinLength: number     // 8, 12, 16
    passwordRequireSpecial: boolean
    passwordRequireNumber: boolean
    passwordRequireUppercase: boolean
    passwordExpiryDays: number    // 0 = never, 30, 60, 90, 180, 365
    ipAllowlistEnabled: boolean
    ipAllowlist: string[]         // ['10.0.0.0/8', '192.168.1.1/32']
  }
  
  // Integrations
  integrations: {
    slack: { connected: boolean; channel: string | null; lastSync: string | null }
    email: { provider: 'sendgrid' | 'aws_ses' | 'smtp'; senderName: string; senderEmail: string; verified: boolean }
    erp: { connected: boolean; system: 'sap' | 'oracle' | 'netsuite' | null; lastSync: string | null }
    webhooks: Array<{ id: string; url: string; events: string[]; active: boolean; lastDelivery: string | null }>
  }
  
  // Billing
  billing: {
    plan: 'starter' | 'professional' | 'enterprise'
    seats: { used: number; total: number }
    billingEmail: string
    billingPeriod: 'monthly' | 'annual'
    nextBillingDate: string
    currentMonthUsage: {
      activeUsers: number
      inspectionsCompleted: number
      storageGb: number
    }
  }
  
  // Data
  data: {
    retentionDays: number                    // 90, 180, 365, 1095 (3y), 1825 (5y), -1 (forever)
    auditLogRetentionDays: number             // separate retention for audit logs
    exportFormat: 'json' | 'csv' | 'xlsx'
    autoArchiveCompletedInspectionsDays: number  // 0 = never, 30, 60, 90, 180
    gdprMode: boolean                         // EU compliance mode
  }
  
  // Branding
  branding: {
    primaryColor: string         // hex — read-only display in v1
    accentColor: string          // hex
    logoUrl: string              // path to logo
    faviconUrl: string
    loginScreenTagline: string
    emailFooterText: string
    customDomain: string | null  // 'inspections.acme.com'
  }
  
  // Metadata
  updatedAt: string
  updatedBy: string  // user ID
}

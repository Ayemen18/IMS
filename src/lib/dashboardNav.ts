import type { RoleKey, IconName } from '../types/role'

export interface NavItem {
  key: string
  label: string
  icon: IconName
  count?: string // small badge text like "12" or "NEW"
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

/**
 * Per-role sidebar nav. Each role has Overview as the home,
 * then role-specific sections.
 */
export const DASHBOARD_NAV: Record<RoleKey, NavSection[]> = {
  admin: [
    {
      items: [
        { key: 'overview', label: 'Overview', icon: 'home' },
      ],
    },
    {
      label: 'Organization',
      items: [
        { key: 'organization', label: 'Sites & departments', icon: 'box' },
        { key: 'users',        label: 'Users & roles',       icon: 'users', count: '247' },
      ],
    },
    {
      label: 'Master data',
      items: [
        { key: 'templates',  label: 'Templates',         icon: 'file',    count: '34' },
        { key: 'parameters', label: 'Parameters',        icon: 'cube_3d' },
        { key: 'types',      label: 'Inspection types',  icon: 'layers'  },
      ],
    },
    {
      label: 'System',
      items: [
        { key: 'notifications', label: 'Notifications', icon: 'bell'     },
        { key: 'settings',      label: 'Settings',      icon: 'settings' },
      ],
    },
  ],
  // Stub navs for other roles — replaced in their own dashboard steps
  quality_manager: [
    {
      items: [
        { key: 'overview', label: 'Overview', icon: 'home' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { key: 'schedule',    label: 'Schedule',    icon: 'calendar' },
        { key: 'inspections', label: 'Inspections', icon: 'check' },
        { key: 'review',      label: 'Review queue', icon: 'eye',   count: '4' },
        { key: 'issues',      label: 'Issues',       icon: 'alert', count: '7' },
      ],
    },
    {
      label: 'Output',
      items: [
        { key: 'reports', label: 'Reports', icon: 'file' },
        { key: 'team',    label: 'Team',    icon: 'users' },
      ],
    },
  ],
  safety_manager: [
    {
      items: [
        { key: 'overview', label: 'Overview', icon: 'home' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { key: 'schedule',    label: 'Schedule',    icon: 'calendar' },
        { key: 'inspections', label: 'Inspections', icon: 'check' },
        { key: 'review',      label: 'Review queue', icon: 'eye',   count: '2' },
        { key: 'issues',      label: 'Issues',       icon: 'alert', count: '5' },
      ],
    },
    {
      label: 'Output',
      items: [
        { key: 'reports', label: 'Reports', icon: 'file' },
        { key: 'team',    label: 'Team',    icon: 'users' },
      ],
    },
  ],
  quality_inspector: [
    { items: [
      { key: 'overview',    label: 'My day',         icon: 'home' },
      { key: 'inspections', label: 'My inspections', icon: 'check', count: '12' },
      { key: 'schedule',    label: 'Schedule',       icon: 'calendar' },
      { key: 'drafts',      label: 'Drafts',         icon: 'file', count: '3' },
      { key: 'returned',    label: 'Returned',       icon: 'alert', count: '1' },
      { key: 'history',     label: 'History',        icon: 'layers' },
    ]},
  ],
  safety_inspector: [
    { items: [
      { key: 'overview',    label: 'My day',         icon: 'home' },
      { key: 'inspections', label: 'My inspections', icon: 'check', count: '8' },
      { key: 'schedule',    label: 'Schedule',       icon: 'calendar' },
      { key: 'drafts',      label: 'Drafts',         icon: 'file', count: '2' },
      { key: 'returned',    label: 'Returned',       icon: 'alert', count: '1' },
      { key: 'history',     label: 'History',        icon: 'layers' },
    ]},
  ],
  employee: [
    { items: [
      { key: 'overview',    label: 'My day',        icon: 'home' },
      { key: 'issues',      label: 'All issues',    icon: 'alert' },
      { key: 'in_progress', label: 'In progress',   icon: 'activity' },
      { key: 'review',      label: 'Under review',  icon: 'eye' },
      { key: 'closed',      label: 'Closed',        icon: 'layers' },
      { key: 'in_area',     label: 'In my area',    icon: 'check' },
    ]},
  ],
  top_management: [
    { items: [
      { key: 'overview', label: 'Overview',  icon: 'home' },
    ]},
    { label: 'Compliance', items: [
      { key: 'by_site',  label: 'By site',   icon: 'box' },
      { key: 'trends',   label: 'Trends',    icon: 'chart' },
      { key: 'issues',   label: 'Issues',    icon: 'alert' },
    ]},
    { label: 'Output', items: [
      { key: 'reports',  label: 'Reports',   icon: 'file' },
    ]},
  ],
}

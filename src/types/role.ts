export type RoleKey =
  | 'admin'
  | 'quality_manager'
  | 'safety_manager'
  | 'quality_inspector'
  | 'safety_inspector'
  | 'employee'
  | 'top_management'

export interface Role {
  key: RoleKey
  label: string
  shortLabel: string
  email: string
  demoName: string   // ← new
  description: string
  accent: string
  glyph: IconName
}

export type IconName =
  | 'shield' | 'badge' | 'check' | 'user' | 'chart'
  | 'arrow_right' | 'arrow_left' | 'arrow_up_right' | 'mail' | 'lock'
  | 'sun' | 'moon' | 'sparkle' | 'layers' | 'eye' | 'eye_off'
  | 'menu' | 'close' | 'dot' | 'activity' | 'box'
  | 'search' | 'bell' | 'home' | 'calendar' | 'users'
  | 'file' | 'settings' | 'alert' | 'trending' | 'play'
  | 'chevron_right' | 'chevron_down' | 'plus' | 'filter'
  | 'download' | 'cube_3d' | 'link'
